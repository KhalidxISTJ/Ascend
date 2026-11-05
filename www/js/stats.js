// =======================
// QUESTS
// =======================

const completedQuests = quests.filter((q) => q.completed).length;

const completionRate =
  quests.length === 0 ? 0 : Math.round((completedQuests / quests.length) * 100);
const roadmapTitle = document.getElementById("roadmapTitle");
const breadcrumb = document.getElementById("breadcrumb");
const roadmapCanvas = document.getElementById("roadmapCanvas");
const addRoadmapNodeBtn = document.getElementById("addRoadmapNodeBtn");

const generateRoadmapBtn = document.getElementById("generateRoadmapBtn");
console.log(generateRoadmapBtn);
const roadmapPrompt = document.getElementById("roadmapPrompt");
const aiOutput = document.getElementById("aiOutput");

// =======================
// PLAYER
// =======================

document.getElementById("playerLevelCard").textContent = playerData.level;

document.getElementById("playerXPCard").textContent = playerData.xp;

document.getElementById("completedQuestCard").textContent = completedQuests;

document.getElementById("completionRateCard").textContent =
  completionRate + "%";

let currentSkill = null;
let navigationStack = [];
let editingSkill = false;

function renameSkill(id) {
  const skill = findSkillById(skillTree, id);

  if (!skill) return;

  const newName = prompt("New skill name:", skill.name);

  if (!newName) return;

  skill.name = newName;

  saveSkillTree();

  renderInspector();
  renderRoadmap();
}
function deleteSkill(id) {
  const skill = findSkillById(skillTree, id);

  if (!skill) return;

  // Prevent deleting the final skill
  if (skillTree.length === 1 && skillTree[0].id === id) {
    alert("You need at least one skill.");
    return;
  }

  const confirmed = confirm(`Delete ${skill.name} and all its sub-skills?`);

  if (!confirmed) return;

  const parent = findParent(skillTree, id);

  // Top-level skill
  if (!parent) {
    skillTree = skillTree.filter((node) => node.id !== id);
  }
  // Nested skill
  else {
    parent.children = parent.children.filter((child) => child.id !== id);
  }

  saveSkillTree();

  navigationStack = [
    {
      id: "root",
      name: "Character Stats",
      children: skillTree,
    },
  ];

  currentSkill = navigationStack[0];

  renderInspector();
  renderRoadmap();
}

function openSkill(id) {
  const skill = findSkillById(skillTree, id);

  if (!skill) return;

  navigationStack.push(skill);

  currentSkill = skill;

  renderInspector();
  renderRoadmap();
}
// ============================================================
// AI STREAM READER
// ============================================================

async function readAIStream(response, onChunk) {
  if (!response.body) {
    throw new Error("AI server did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullResponse = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");

    // Keep incomplete event for the next chunk
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event.split("\n").find((line) => line.startsWith("data:"));

      if (!line) continue;

      const jsonText = line.slice(5).trim();

      if (!jsonText) continue;

      let data;

      try {
        data = JSON.parse(jsonText);
      } catch (error) {
        console.warn("Could not parse stream event:", jsonText);
        continue;
      }

      if (data.type === "chunk") {
        const chunk = data.content || "";

        fullResponse += chunk;

        if (onChunk) {
          onChunk(chunk, fullResponse);
        }
      }

      if (data.type === "error") {
        throw new Error(data.error || "AI generation failed.");
      }

      if (data.type === "done") {
        return fullResponse;
      }
    }
  }

  return fullResponse;
}
async function generateSkillLesson(skill) {
  if (!skill) return;

  // Don't regenerate an existing lesson
  if (skill.lesson) {
    return;
  }

  const lessonText = document.querySelector(".roadmap-lesson-text");

  if (lessonText) {
    lessonText.innerHTML = `
      <div class="lesson-loading">
        <div class="lesson-loading-title">
          🧠 Generating lesson...
        </div>

        <div class="lesson-stream-preview"></div>
      </div>
    `;
  }

  const streamPreview = lessonText?.querySelector(".lesson-stream-preview");

  try {
    const response = await fetch("http://localhost:3000/api/ai", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        prompt: `
Create a detailed mastery lesson for this Ascend skill:

Skill: ${skill.name}

Description:
${skill.description || "No description available."}

Difficulty:
${skill.difficulty || "Medium"}

Estimated Hours:
${skill.estimatedHours || 0}

The lesson should teach this skill thoroughly and support the learner's
progression from Learn through Master.

Use the skill's description and difficulty as context.
          `.trim(),

        mode: "lesson",
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // ========================================================
    // STREAM LESSON
    // ========================================================

    const rawLesson = await readAIStream(response, (chunk, fullResponse) => {
      if (!streamPreview) return;

      // Show the AI working in real time.
      // The final JSON will be replaced with the
      // formatted lesson after generation finishes.

      streamPreview.textContent = fullResponse;

      // Keep the newest content visible.
      streamPreview.scrollTop = streamPreview.scrollHeight;
    });

    // ========================================================
    // PARSE FINAL JSON
    // ========================================================

    let lesson;

    try {
      lesson = JSON.parse(rawLesson);
    } catch (error) {
      console.error("Invalid lesson JSON:", rawLesson);

      throw new Error(
        "AI finished generating, but returned invalid lesson JSON.",
      );
    }

    if (!lesson || typeof lesson !== "object") {
      throw new Error("AI returned an invalid lesson format.");
    }

    // ========================================================
    // SAVE
    // ========================================================

    skill.lesson = lesson;

    saveSkillTree();

    // ========================================================
    // RENDER FINAL LESSON
    // ========================================================

    renderRoadmap();

    console.log("Lesson generated:", lesson);
  } catch (error) {
    console.error("Lesson generation failed:", error);

    if (lessonText) {
      lessonText.innerHTML = `
        <div class="lesson-error">
          ❌ Failed to generate lesson.
          <br><br>
          ${error.message}
        </div>
      `;
    }
  }
}
function createDropdown(options, value, onChange) {
  const select = document.createElement("select");

  options.forEach((option) => {
    const opt = document.createElement("option");

    opt.value = option;
    opt.textContent = option;

    if (option === value) {
      opt.selected = true;
    }

    select.appendChild(opt);
  });

  select.onchange = () => onChange(select.value);

  return select;
}
function createNumberInput(value, onChange) {
  const input = document.createElement("input");

  input.type = "number";
  input.value = value;

  input.oninput = () => onChange(Number(input.value));

  return input;
}

function createTextArea(value, onChange) {
  const textarea = document.createElement("textarea");

  textarea.className = "description-input";

  textarea.value = value;

  textarea.oninput = () => onChange(textarea.value);

  return textarea;
}
function createTextInput(value, onChange) {
  const input = document.createElement("input");

  input.type = "text";

  input.value = value;

  input.oninput = () => onChange(input.value);

  return input;
}
function renderInspector() {
  const inspector = document.querySelector(".inspector-panel");

  inspector.innerHTML = "";

  // =========================
  // BACK
  // =========================

  if (navigationStack.length > 1) {
    const back = document.createElement("div");

    back.className = "stats-card stat-selectable";
    back.textContent = "← Back";

    back.onclick = goBack;

    inspector.appendChild(back);
  }

  // =========================
  // TITLE
  // =========================

  const title = document.createElement("h2");

  title.className = "inspector-title";
  title.textContent = currentSkill.name;

  inspector.appendChild(title);

  if (currentSkill.id === "root") {
    const info = document.createElement("p");

    info.className = "inspector-description";
    info.textContent = "Select a skill to view details.";

    inspector.appendChild(info);

    return;
  }

  // =========================
  // LEVEL + XP
  // =========================

  const level = document.createElement("p");

  level.className = "inspector-stat";
  level.textContent = `Level: ${currentSkill.level}`;

  inspector.appendChild(level);

  const xpContainer = document.createElement("div");

  xpContainer.className = "xp-container";

  const xpBar = document.createElement("div");

  xpBar.className = "xp-bar";

  const xpFill = document.createElement("div");

  xpFill.className = "xp-fill";

  const requiredXP = currentSkill.level * 100;

  const xpPercent = Math.min((currentSkill.xp / requiredXP) * 100, 100);

  xpFill.style.width = `${xpPercent}%`;

  xpBar.appendChild(xpFill);

  const xpText = document.createElement("p");

  xpText.className = "xp-text";
  xpText.textContent = `${currentSkill.xp} / ${requiredXP} XP`;

  xpContainer.appendChild(xpBar);
  xpContainer.appendChild(xpText);

  inspector.appendChild(xpContainer);

  // =========================
  // OVERVIEW
  // =========================

  const overviewLabel = document.createElement("h3");

  overviewLabel.className = "inspector-heading";
  overviewLabel.textContent = "Overview";

  inspector.appendChild(overviewLabel);

  if (editingSkill) {
    inspector.appendChild(
      createTextArea(currentSkill.description || "", (value) => {
        currentSkill.description = value;
      }),
    );
  } else {
    const overview = document.createElement("p");

    overview.className = "inspector-description";
    overview.textContent = currentSkill.description || "No overview yet.";

    inspector.appendChild(overview);
  }

  // =========================
  // MASTERY
  // =========================

  const masteryLabel = document.createElement("h3");

  masteryLabel.className = "inspector-heading";
  masteryLabel.textContent = "Mastery";

  inspector.appendChild(masteryLabel);

  const stages = [
    ["learn", "Learn"],
    ["understand", "Understand"],
    ["apply", "Apply"],
    ["explain", "Explain"],
    ["practice", "Practice"],
    ["master", "Master"],
  ];

  stages.forEach(([key, label], index) => {
    const row = document.createElement("label");

    row.className = "skill-progression-row";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = currentSkill.progression?.[key] || false;

    // Lock stages until the previous stage is complete.
    if (index > 0) {
      const previousKey = stages[index - 1][0];

      checkbox.disabled = !currentSkill.progression?.[previousKey];
    }

    checkbox.onchange = () => {
      setSkillProgression(currentSkill, key, checkbox.checked);

      renderInspector();
    };

    const text = document.createElement("span");

    text.textContent = label;

    row.appendChild(checkbox);
    row.appendChild(text);

    inspector.appendChild(row);
  });

  // =========================
  // SKILL DETAILS
  // =========================

  const detailsLabel = document.createElement("h3");

  detailsLabel.className = "inspector-heading";
  detailsLabel.textContent = "Skill Details";

  inspector.appendChild(detailsLabel);

  // Difficulty

  const difficultyLabel = document.createElement("h4");

  difficultyLabel.textContent = "Difficulty";

  inspector.appendChild(difficultyLabel);

  if (editingSkill) {
    inspector.appendChild(
      createDropdown(
        ["Easy", "Medium", "Hard", "Extreme"],
        currentSkill.difficulty || "Medium",
        (value) => {
          currentSkill.difficulty = value;
        },
      ),
    );
  } else {
    const difficulty = document.createElement("p");

    difficulty.className = "inspector-stat";
    difficulty.textContent = currentSkill.difficulty || "Not set";

    inspector.appendChild(difficulty);
  }

  // Estimated Hours

  const estimatedHoursLabel = document.createElement("h4");

  estimatedHoursLabel.textContent = "Estimated Hours";

  inspector.appendChild(estimatedHoursLabel);

  if (editingSkill) {
    inspector.appendChild(
      createNumberInput(currentSkill.estimatedHours || 0, (value) => {
        currentSkill.estimatedHours = value;
      }),
    );
  } else {
    const estimatedHours = document.createElement("p");

    estimatedHours.className = "inspector-stat";
    estimatedHours.textContent = currentSkill.estimatedHours || "Not set";

    inspector.appendChild(estimatedHours);
  }

  // =========================
  // RESOURCES
  // =========================

  const resourcesLabel = document.createElement("h3");

  resourcesLabel.className = "inspector-heading";
  resourcesLabel.textContent = "Resources";

  inspector.appendChild(resourcesLabel);

  const resources = currentSkill.resources || [];

  // =========================
  // VIEW MODE
  // =========================

  if (!editingSkill) {
    if (resources.length === 0) {
      const empty = document.createElement("p");

      empty.className = "inspector-empty";
      empty.textContent = "No resources added yet.";

      inspector.appendChild(empty);
    } else {
      resources.forEach((resource) => {
        const resourceCard = document.createElement("div");

        resourceCard.className = "inspector-resource";

        const resourceName =
          typeof resource === "string"
            ? resource
            : resource.name || "Unnamed resource";

        const resourceUrl =
          typeof resource === "string" ? "" : resource.url || "";

        // Resource name
        const name = document.createElement("div");

        name.className = "inspector-resource-name";
        name.textContent = resourceName;

        resourceCard.appendChild(name);

        // URL / type
        if (resourceUrl) {
          const link = document.createElement("a");

          link.className = "inspector-resource-link";
          link.href = resourceUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = resourceUrl;

          resourceCard.appendChild(link);
        }

        inspector.appendChild(resourceCard);
      });
    }
  }

  // =========================
  // EDIT MODE
  // =========================
  else {
    if (resources.length === 0) {
      const empty = document.createElement("p");

      empty.className = "inspector-empty";
      empty.textContent = "No resources added yet.";

      inspector.appendChild(empty);
    }

    resources.forEach((resource, index) => {
      const resourceContainer = document.createElement("div");

      resourceContainer.className = "inspector-resource-editor";

      // -------------------------
      // NAME
      // -------------------------

      const nameLabel = document.createElement("h4");

      nameLabel.textContent = "Resource Name";

      resourceContainer.appendChild(nameLabel);

      const resourceName =
        typeof resource === "string" ? resource : resource.name || "";

      resourceContainer.appendChild(
        createTextInput(resourceName, (value) => {
          if (typeof currentSkill.resources[index] === "string") {
            currentSkill.resources[index] = {
              name: value,
              url: "",
            };
          } else {
            currentSkill.resources[index].name = value;
          }
        }),
      );

      // -------------------------
      // URL
      // -------------------------

      const urlLabel = document.createElement("h4");

      urlLabel.textContent = "URL";

      resourceContainer.appendChild(urlLabel);

      const resourceUrl =
        typeof resource === "string" ? "" : resource.url || "";

      resourceContainer.appendChild(
        createTextInput(resourceUrl, (value) => {
          if (typeof currentSkill.resources[index] === "string") {
            currentSkill.resources[index] = {
              name: currentSkill.resources[index],
              url: value,
            };
          } else {
            currentSkill.resources[index].url = value;
          }
        }),
      );

      // -------------------------
      // REMOVE
      // -------------------------

      const removeBtn = document.createElement("button");

      removeBtn.textContent = "Remove";

      removeBtn.className = "resource-remove-btn";

      removeBtn.onclick = () => {
        currentSkill.resources.splice(index, 1);

        saveSkillTree();

        renderInspector();
      };

      resourceContainer.appendChild(removeBtn);

      inspector.appendChild(resourceContainer);
    });

    // =========================
    // ADD RESOURCE
    // =========================

    const addResourceBtn = document.createElement("button");

    addResourceBtn.textContent = "+ Add Resource";

    addResourceBtn.className = "add-resource-btn";

    addResourceBtn.onclick = () => {
      if (!currentSkill.resources) {
        currentSkill.resources = [];
      }

      currentSkill.resources.push({
        name: "",
        url: "",
      });

      saveSkillTree();

      renderInspector();
    };

    inspector.appendChild(addResourceBtn);
  }
  // =========================
  // ACTIONS
  // =========================

  const buttonGroup = document.createElement("div");

  buttonGroup.className = "inspector-actions";

  inspector.appendChild(buttonGroup);

  const editBtn = document.createElement("button");

  editBtn.textContent = editingSkill ? "Done" : "Edit";

  editBtn.onclick = () => {
    editingSkill = !editingSkill;

    if (!editingSkill) {
      saveSkillTree();
    }

    renderInspector();
  };

  buttonGroup.appendChild(editBtn);

  const addChildBtn = document.createElement("button");

  addChildBtn.textContent = "+ Add Child";

  addChildBtn.onclick = () => {
    addChildSkill(currentSkill);
  };

  buttonGroup.appendChild(addChildBtn);

  const deleteBtn = document.createElement("button");

  deleteBtn.textContent = "Delete";

  deleteBtn.onclick = () => {
    deleteSkill(currentSkill.id);
  };

  buttonGroup.appendChild(deleteBtn);
}

function goBack() {
  navigationStack.pop();

  currentSkill = navigationStack[navigationStack.length - 1];

  renderInspector();
  renderRoadmap();
}
navigationStack = [
  {
    id: "root",
    name: "Character Stats",
    level: 1,
    xp: 0,
    description: "Your overall character progression.",
    children: skillTree,
  },
];

currentSkill = navigationStack[0];
console.log(layoutTree(currentSkill));

renderInspector();
renderRoadmap();

function layoutTree(root) {
  const layout = [];

  function traverse(node, depth = 0) {
    layout.push({
      id: node.id,
      name: node.name,
      depth,
    });

    node.children.forEach((child) => {
      traverse(child, depth + 1);
    });
  }

  traverse(root);

  return layout;
}

function renderRoadmap() {
  if (!currentSkill) return;

  roadmapCanvas.innerHTML = "";

  // ==========================================
  // ROOT PAGE
  // ==========================================

  if (currentSkill.id === "root") {
    renderRootRoadmap();
    return;
  }

  // ==========================================
  // SKILL PAGE
  // ==========================================

  const content = document.createElement("div");

  content.className = "roadmap-content";

  roadmapCanvas.appendChild(content);

  // ==========================================
  // LESSON
  // ==========================================

  const lessonSection = document.createElement("section");

  lessonSection.className = "roadmap-lesson";

  content.appendChild(lessonSection);

  const lessonHeading = document.createElement("h2");

  lessonHeading.className = "roadmap-section-title";
  lessonHeading.textContent = "Lesson";

  lessonSection.appendChild(lessonHeading);

  const lessonText = document.createElement("div");

  lessonText.className = "roadmap-lesson-text";

  lessonSection.appendChild(lessonText);

  // ==========================================
  // NO LESSON YET
  // ==========================================

  if (!currentSkill.lesson) {
    lessonText.innerHTML = `
    <div class="lesson-empty">
      <p>
        No lesson has been generated for this skill yet.
      </p>

      <button
        type="button"
        class="generate-lesson-btn"
        id="generateLessonBtn"
      >
        🧠 Generate Lesson
      </button>
    </div>
  `;

    const generateLessonBtn = lessonText.querySelector("#generateLessonBtn");

    generateLessonBtn.onclick = () => {
      generateSkillLesson(currentSkill);
    };
  }

  // ==========================================
  // LESSON EXISTS
  // ==========================================
  else {
    const lesson = currentSkill.lesson;

    // -------------------------
    // OVERVIEW
    // -------------------------

    if (lesson.overview) {
      const overview = document.createElement("div");

      overview.className = "lesson-overview";

      overview.textContent = lesson.overview;

      lessonText.appendChild(overview);
    }

    // -------------------------
    // CONTENT
    // -------------------------

    if (lesson.content) {
      const contentBlock = document.createElement("div");

      contentBlock.className = "lesson-content";

      contentBlock.textContent = lesson.content;

      lessonText.appendChild(contentBlock);
    }

    // -------------------------
    // KEY CONCEPTS
    // -------------------------

    if (Array.isArray(lesson.keyConcepts) && lesson.keyConcepts.length > 0) {
      const heading = document.createElement("h3");

      heading.textContent = "Key Concepts";

      lessonText.appendChild(heading);

      const list = document.createElement("ul");

      lesson.keyConcepts.forEach((concept) => {
        if (!concept || !concept.trim()) return;

        const item = document.createElement("li");

        item.textContent = concept;

        list.appendChild(item);
      });

      lessonText.appendChild(list);
    }

    // -------------------------
    // EXAMPLES
    // -------------------------

    if (Array.isArray(lesson.examples) && lesson.examples.length > 0) {
      const heading = document.createElement("h3");

      heading.textContent = "Examples";

      lessonText.appendChild(heading);

      lesson.examples.forEach((example) => {
        if (!example) return;

        const exampleCard = document.createElement("div");

        exampleCard.className = "lesson-example";

        if (example.title) {
          const title = document.createElement("h4");

          title.textContent = example.title;

          exampleCard.appendChild(title);
        }

        if (example.explanation) {
          const explanation = document.createElement("p");

          explanation.textContent = example.explanation;

          exampleCard.appendChild(explanation);
        }

        if (example.code) {
          const code = document.createElement("pre");

          const codeElement = document.createElement("code");

          codeElement.textContent = example.code;

          code.appendChild(codeElement);

          exampleCard.appendChild(code);
        }

        lessonText.appendChild(exampleCard);
      });
    }

    // -------------------------
    // COMMON MISTAKES
    // -------------------------

    if (
      Array.isArray(lesson.commonMistakes) &&
      lesson.commonMistakes.length > 0
    ) {
      const heading = document.createElement("h3");

      heading.textContent = "Common Mistakes";

      lessonText.appendChild(heading);

      const list = document.createElement("ul");

      lesson.commonMistakes.forEach((mistake) => {
        if (!mistake || !mistake.trim()) {
          return;
        }

        const item = document.createElement("li");

        item.textContent = mistake;

        list.appendChild(item);
      });

      lessonText.appendChild(list);
    }

    // -------------------------
    // MASTERY CRITERIA
    // -------------------------

    if (
      Array.isArray(lesson.masteryCriteria) &&
      lesson.masteryCriteria.length > 0
    ) {
      const heading = document.createElement("h3");

      heading.textContent = "Mastery Criteria";

      lessonText.appendChild(heading);

      const list = document.createElement("ul");

      lesson.masteryCriteria.forEach((criteria) => {
        if (!criteria || !criteria.trim()) {
          return;
        }

        const item = document.createElement("li");

        item.textContent = criteria;

        list.appendChild(item);
      });

      lessonText.appendChild(list);
    }
  }

  // ==========================================
  // ROADMAP
  // ==========================================

  const roadmapSection = document.createElement("section");

  roadmapSection.className = "roadmap-navigation";

  content.appendChild(roadmapSection);

  // Divider

  const roadmapDivider = document.createElement("div");

  roadmapDivider.className = "roadmap-divider";

  roadmapSection.appendChild(roadmapDivider);

  // Heading

  const roadmapHeading = document.createElement("h2");

  roadmapHeading.className = "roadmap-section-title";
  roadmapHeading.textContent = "Roadmap";

  roadmapSection.appendChild(roadmapHeading);

  // ==========================================
  // TREE WRAPPER
  // ==========================================

  const treeWrapper = document.createElement("div");

  treeWrapper.className = "roadmap-tree-wrapper";

  roadmapSection.appendChild(treeWrapper);

  // ==========================================
  // LEAF NODE
  // ==========================================

  if (!currentSkill.children || currentSkill.children.length === 0) {
    const leafMessage = document.createElement("div");

    leafMessage.className = "roadmap-leaf-message";

    leafMessage.innerHTML = `
      <strong>End of this roadmap branch</strong>
      <span>
        This is currently the deepest skill in this branch.
        Use the lesson above to study this skill.
      </span>
    `;

    treeWrapper.appendChild(leafMessage);

    return;
  }

  // ==========================================
  // TREE
  // ==========================================

  const treeCanvas = document.createElement("div");

  treeCanvas.className = "roadmap-tree";

  treeWrapper.appendChild(treeCanvas);

  // ==========================================
  // SVG CONNECTION LINES
  // ==========================================

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.classList.add("roadmap-lines");

  treeCanvas.appendChild(svg);

  // ==========================================
  // CURRENT SKILL NODE
  // ==========================================

  const currentNode = document.createElement("button");

  currentNode.type = "button";

  currentNode.className = "roadmap-node current-node";

  currentNode.textContent = currentSkill.name;

  treeCanvas.appendChild(currentNode);

  // ==========================================
  // CHILDREN
  // ==========================================

  const childrenContainer = document.createElement("div");

  childrenContainer.className = "roadmap-children";

  treeCanvas.appendChild(childrenContainer);

  currentSkill.children.forEach((child) => {
    const node = document.createElement("button");

    node.type = "button";

    node.className = "roadmap-node child-node";

    node.textContent = child.name;

    node.onclick = () => {
      openSkill(child.id);
    };

    childrenContainer.appendChild(node);
  });

  // ==========================================
  // DRAW CONNECTION LINES
  // ==========================================

  requestAnimationFrame(() => {
    const currentRect = currentNode.getBoundingClientRect();

    const treeRect = treeCanvas.getBoundingClientRect();

    const startX = currentRect.left + currentRect.width / 2 - treeRect.left;

    const startY = currentRect.bottom - treeRect.top;

    const childNodes = childrenContainer.querySelectorAll(".child-node");

    childNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();

      const endX = rect.left + rect.width / 2 - treeRect.left;

      const endY = rect.top - treeRect.top;

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );

      line.setAttribute("x1", startX);

      line.setAttribute("y1", startY);

      line.setAttribute("x2", endX);

      line.setAttribute("y2", endY);

      line.setAttribute("stroke", "currentColor");

      line.setAttribute("stroke-width", "2");

      line.setAttribute("opacity", "0.35");

      svg.appendChild(line);
    });

    svg.setAttribute("width", treeCanvas.scrollWidth);

    svg.setAttribute("height", treeCanvas.scrollHeight);
  });
}
function renderRootRoadmap() {
  // ==========================================
  // ROOT ROADMAP
  // ==========================================

  roadmapCanvas.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.classList.add("roadmap-lines");

  roadmapCanvas.appendChild(svg);

  // ==========================================
  // ROOT NODE
  // ==========================================

  const parentX = roadmapCanvas.clientWidth / 2;

  const parentY = 70;

  const parentNode = document.createElement("div");

  parentNode.className = "roadmap-node current-node";

  parentNode.style.left = `${parentX}px`;

  parentNode.style.top = `${parentY}px`;

  roadmapCanvas.appendChild(parentNode);

  const parentLabel = document.createElement("div");

  parentLabel.className = "roadmap-label";

  parentLabel.textContent = currentSkill.name;

  parentLabel.style.left = `${parentX}px`;

  parentLabel.style.top = `${parentY + 45}px`;

  roadmapCanvas.appendChild(parentLabel);

  // ==========================================
  // ROOT CHILDREN
  // ==========================================

  if (!currentSkill.children || currentSkill.children.length === 0) {
    const empty = document.createElement("p");

    empty.className = "empty-tree";

    empty.textContent = "No skills yet.";

    roadmapCanvas.appendChild(empty);

    return;
  }

  const spacing = 170;

  const totalWidth = (currentSkill.children.length - 1) * spacing;

  const startX = roadmapCanvas.clientWidth / 2 - totalWidth / 2;

  const childY = 190;

  currentSkill.children.forEach((child, index) => {
    const x = startX + index * spacing;

    // ======================================
    // NODE
    // ======================================

    const node = document.createElement("div");

    node.className = "roadmap-node";

    node.style.left = `${x}px`;

    node.style.top = `${childY}px`;

    node.onclick = () => {
      openSkill(child.id);
    };

    roadmapCanvas.appendChild(node);

    // ======================================
    // LABEL
    // ======================================

    const label = document.createElement("div");

    label.className = "roadmap-label";

    label.textContent = child.name;

    label.style.left = `${x}px`;

    label.style.top = `${childY + 40}px`;

    roadmapCanvas.appendChild(label);

    // ======================================
    // CONNECTION
    // ======================================

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", parentX);

    line.setAttribute("y1", parentY);

    line.setAttribute("x2", x);

    line.setAttribute("y2", childY);

    line.setAttribute("stroke", "currentColor");

    line.setAttribute("stroke-width", "2");

    line.setAttribute("opacity", "0.35");

    svg.appendChild(line);
  });

  svg.setAttribute("width", roadmapCanvas.scrollWidth);

  svg.setAttribute("height", roadmapCanvas.scrollHeight);
}
function addChildSkill(parentSkill) {
  const name = prompt("Skill name:");

  if (!name) return;

  parentSkill.children.push({
    id: crypto.randomUUID(),

    name,

    description: "",

    lessonSummary: "",

    level: 1,

    xp: 0,

    progress: 0,

    status: "Not Started",

    difficulty: "Medium",

    estimatedHours: 0,

    resources: [],

    quests: [],

    notes: "",

    children: [],
  });

  saveSkillTree();

  renderInspector();
  renderRoadmap();
}

addRoadmapNodeBtn.onclick = function () {
  if (!currentSkill) {
    alert("Select a stat first.");
    return;
  }

  addChildSkill(currentSkill);
};
function migrateSkills(nodes) {
  nodes.forEach((skill) => {
    if (!skill.description) {
      skill.description = "";
    }

    if (!skill.lessonSummary) {
      skill.lessonSummary = "";
    }

    if (!skill.level) {
      skill.level = 1;
    }

    if (skill.xp === undefined) {
      skill.xp = 0;
    }

    if (!skill.children) {
      skill.children = [];
    }
    if (skill.completed === undefined) {
      skill.completed = false;
    }

    if (skill.unlocked === undefined) {
      skill.unlocked = true;
    }

    if (!skill.icon) {
      skill.icon = "";
    }

    if (skill.completed === undefined) {
      skill.completed = false;
    }

    if (skill.unlocked === undefined) {
      skill.unlocked = true;
    }

    if (!skill.icon) {
      skill.icon = "";
    }

    if (skill.prerequisite === undefined) {
      skill.prerequisite = null;
    }
    if (!skill.resources) {
      skill.resources = [];
    }
    if (skill.progress === undefined) {
      skill.progress = 0;
    }

    if (!skill.status) {
      skill.status = "Not Started";
    }

    if (!skill.difficulty) {
      skill.difficulty = "Medium";
    }

    if (skill.estimatedHours === undefined) {
      skill.estimatedHours = 0;
    }

    if (!skill.notes) {
      skill.notes = "";
    }

    if (!skill.quests) {
      skill.quests = [];
    }

    migrateSkills(skill.children);
  });
}

migrateSkills(skillTree);
saveSkillTree();
console.log(layoutTree(currentSkill));

const testImportBtn = document.getElementById("testImportBtn");

if (testImportBtn) {
  testImportBtn.onclick = () => {
    importRoadmap({
      name: "Programming",
      description: "Learn to build software.",
      children: [
        {
          name: "HTML",
          children: [],
        },
        {
          name: "CSS",
          children: [],
        },
        {
          name: "JavaScript",
          children: [
            {
              name: "Variables",
              children: [],
            },
            {
              name: "Functions",
              children: [],
            },
            {
              name: "Objects",
              children: [],
            },
          ],
        },
      ],
    });

    renderRoadmap();
  };
}
const importBtn = document.getElementById("importRoadmapBtn");
const roadmapFile = document.getElementById("roadmapFile");

importBtn.onclick = () => {
  roadmapFile.click();
};

roadmapFile.onchange = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);

      importRoadmap(json);

      renderRoadmap();

      alert("Roadmap imported!");
    } catch (err) {
      alert("Invalid roadmap JSON.");
      console.error(err);

      generateRoadmapBtn.disabled = false;

      aiOutput.textContent = "❌ " + err.message;
    }
  };

  reader.readAsText(file);
};

// =======================
// AI
// =======================

generateRoadmapBtn.onclick = async () => {
  const prompt = roadmapPrompt.value.trim();

  if (!prompt) {
    alert("Please enter a topic.");
    return;
  }

  console.log("Sending request...");

  aiOutput.textContent = "🧠 Generating roadmap...";

  generateRoadmapBtn.disabled = true;

  try {
    const res = await fetch("http://localhost:3000/api/ai", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        prompt,
        mode: "roadmap",
      }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    // ========================================================
    // STREAM ROADMAP
    // ========================================================

    const roadmap = await readAIStream(res, (chunk, fullResponse) => {
      // Show live generation
      aiOutput.textContent = "🧠 Building roadmap...\n\n" + fullResponse;

      // Keep newest content visible
      aiOutput.scrollTop = aiOutput.scrollHeight;
    });

    // ========================================================
    // PARSE ROADMAP
    // ========================================================

    let roadmapData;

    try {
      roadmapData = JSON.parse(roadmap);
    } catch (parseError) {
      console.error("AI did not return valid JSON:", roadmap);

      aiOutput.textContent =
        "❌ The AI did not return a valid roadmap.\n\n" + roadmap;

      return;
    }

    // ========================================================
    // VALIDATE ROADMAP
    // ========================================================

    if (!roadmapData || typeof roadmapData !== "object") {
      throw new Error("Invalid roadmap format.");
    }

    if (!roadmapData.name) {
      throw new Error("Roadmap is missing a name.");
    }

    if (!Array.isArray(roadmapData.children)) {
      roadmapData.children = [];
    }

    console.log("Valid roadmap:", roadmapData);

    // ========================================================
    // IMPORT
    // ========================================================

    const rootSkill = importRoadmap(roadmapData);

    // ========================================================
    // UPDATE UI
    // ========================================================

    navigationStack = [
      {
        id: "root",

        name: "Character Stats",

        level: 1,

        xp: 0,

        description: "Your overall character progression.",

        children: skillTree,
      },
    ];

    currentSkill = navigationStack[0];

    renderInspector();
    renderRoadmap();

    // ========================================================
    // RESULT
    // ========================================================

    aiOutput.textContent =
      `✅ Roadmap created: ${rootSkill.name}\n\n` +
      JSON.stringify(roadmapData, null, 2);

    roadmapPrompt.value = "";

    console.log("Roadmap successfully imported:", rootSkill);
  } catch (error) {
    console.error("Roadmap generation failed:", error);

    aiOutput.textContent = "❌ Failed to generate roadmap.\n\n" + error.message;
  } finally {
    generateRoadmapBtn.disabled = false;
  }
};

createAIDrawer();
