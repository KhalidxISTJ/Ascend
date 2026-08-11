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

  if (!editingSkill) {
    if (resources.length === 0) {
      const empty = document.createElement("p");

      empty.className = "inspector-description";
      empty.textContent = "No resources.";

      inspector.appendChild(empty);
    } else {
      resources.forEach((resource) => {
        const p = document.createElement("p");

        p.className = "inspector-stat";

        if (typeof resource === "string") {
          p.textContent = "• " + resource;
        } else {
          p.textContent = "• " + (resource.name || "Unnamed resource");
        }

        inspector.appendChild(p);
      });
    }
  } else {
    resources.forEach((resource, index) => {
      const nameLabel = document.createElement("h4");

      nameLabel.textContent = "Name";

      inspector.appendChild(nameLabel);

      const resourceName =
        typeof resource === "string" ? resource : resource.name || "";

      inspector.appendChild(
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
    });

    const addResourceBtn = document.createElement("button");

    addResourceBtn.textContent = "+ Add Resource";

    addResourceBtn.onclick = () => {
      if (!currentSkill.resources) {
        currentSkill.resources = [];
      }

      currentSkill.resources.push({
        name: "",
        url: "",
      });

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

  if (currentSkill.children.length === 0) {
    roadmapCanvas.innerHTML = `
      <p class="empty-tree">
        No skills yet.
      </p>
    `;
    return;
  }

  roadmapCanvas.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.classList.add("roadmap-lines");

  roadmapCanvas.appendChild(svg);

  const parentX = roadmapCanvas.clientWidth / 2;
  const parentY = 40;

  const parentNode = document.createElement("div");
  parentNode.className = "roadmap-node";

  parentNode.style.left = `${parentX}px`;
  parentNode.style.top = `${parentY}px`;

  roadmapCanvas.appendChild(parentNode);

  const parentLabel = document.createElement("div");

  parentLabel.className = "roadmap-label";
  parentLabel.textContent = currentSkill.name;

  parentLabel.style.left = `${parentX}px`;
  parentLabel.style.top = `${parentY + 35}px`;

  roadmapCanvas.appendChild(parentLabel);
  parentNode.classList.add("current-node");

  currentSkill.children.forEach((child, index) => {
    const node = document.createElement("div");

    node.className = "roadmap-node";
    const spacing = 140;
    const totalWidth = (currentSkill.children.length - 1) * spacing;

    const startX = roadmapCanvas.clientWidth / 2 - totalWidth / 2;

    const x = startX + index * spacing;
    const y = 120;

    const parentX = roadmapCanvas.clientWidth / 2;
    const parentY = 40;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", parentX);
    line.setAttribute("y1", parentY);

    line.setAttribute("x2", x);
    line.setAttribute("y2", y);

    line.setAttribute("stroke", "#444");
    line.setAttribute("stroke-width", "3");

    svg.appendChild(line);

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.onclick = () => {
      openSkill(child.id);
    };

    roadmapCanvas.appendChild(node);
    const label = document.createElement("div");

    label.className = "roadmap-label";

    label.textContent = child.name;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    label.style.left = `${x}px`;
    label.style.top = `${y + 35}px`;

    roadmapCanvas.appendChild(label);
  });
}
function addChildSkill(parentSkill) {
  const name = prompt("Skill name:");

  if (!name) return;

  parentSkill.children.push({
    id: crypto.randomUUID(),

    name,

    description: "",

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

    const data = await res.json();

    console.log("AI response:", data);

    // =========================
    // PARSE AI ROADMAP
    // =========================

    let roadmap;

    try {
      roadmap = JSON.parse(data.response);
    } catch (parseError) {
      console.error("AI did not return valid JSON:", data.response);

      aiOutput.textContent =
        "❌ The AI did not return a valid roadmap.\n\n" + data.response;

      return;
    }

    // =========================
    // VALIDATE ROADMAP
    // =========================

    if (!roadmap || typeof roadmap !== "object") {
      throw new Error("Invalid roadmap format.");
    }

    if (!roadmap.name) {
      throw new Error("Roadmap is missing a name.");
    }

    if (!Array.isArray(roadmap.children)) {
      roadmap.children = [];
    }

    console.log("Valid roadmap:", roadmap);

    // =========================
    // IMPORT INTO SKILL TREE
    // =========================

    const rootSkill = importRoadmap(roadmap);

    // =========================
    // UPDATE UI
    // =========================

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

    // =========================
    // SHOW RESULT
    // =========================

    aiOutput.textContent =
      `✅ Roadmap created: ${rootSkill.name}\n\n` +
      JSON.stringify(roadmap, null, 2);

    // Clear input
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
