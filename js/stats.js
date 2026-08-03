console.log("🚀 ASCEND SERVER BUILD 9999");
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
let editingDescription = false;

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
function renderInspector() {
  const inspector = document.querySelector(".inspector-panel");

  inspector.innerHTML = "";

  if (navigationStack.length > 1) {
    const back = document.createElement("div");

    back.className = "stats-card stat-selectable";
    back.textContent = "← Back";

    back.onclick = goBack;

    inspector.appendChild(back);
  }

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

  xpFill.style.width = `${(currentSkill.xp / requiredXP) * 100}%`;

  xpBar.appendChild(xpFill);

  const xpText = document.createElement("p");

  xpText.className = "xp-text";

  xpText.textContent = `${currentSkill.xp} / ${requiredXP} XP`;

  xpContainer.appendChild(xpBar);
  xpContainer.appendChild(xpText);

  inspector.appendChild(xpContainer);

  const descriptionLabel = document.createElement("h3");

  descriptionLabel.className = "inspector-heading";
  descriptionLabel.textContent = "Description";

  inspector.appendChild(descriptionLabel);

  if (editingDescription) {
    const descriptionInput = document.createElement("textarea");

    descriptionInput.className = "description-input";
    descriptionInput.value = currentSkill.description || "";

    inspector.appendChild(descriptionInput);

    const saveDescriptionBtn = document.createElement("button");

    saveDescriptionBtn.textContent = "Save Description";

    saveDescriptionBtn.onclick = () => {
      currentSkill.description = descriptionInput.value;

      saveSkillTree();

      editingDescription = false;

      renderInspector();
    };

    inspector.appendChild(saveDescriptionBtn);
  } else {
    const descriptionText = document.createElement("p");

    descriptionText.className = "inspector-description";
    descriptionText.textContent = currentSkill.description || "No description.";

    inspector.appendChild(descriptionText);

    const editDescriptionBtn = document.createElement("button");

    editDescriptionBtn.textContent = "Edit Description";

    editDescriptionBtn.onclick = () => {
      editingDescription = true;

      renderInspector();
    };

    inspector.appendChild(editDescriptionBtn);
  }

  const buttonGroup = document.createElement("div");

  buttonGroup.className = "inspector-actions";

  inspector.appendChild(buttonGroup);

  const renameBtn = document.createElement("button");

  renameBtn.textContent = "Rename";

  renameBtn.onclick = () => {
    renameSkill(currentSkill.id);
  };

  buttonGroup.appendChild(renameBtn);

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

    completed: false,
    unlocked: true,
    icon: "",
    prerequisite: null,
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
  aiOutput.textContent = "🧠 Thinking...";
  generateRoadmapBtn.disabled = true;
  const res = await fetch("http://localhost:3000/generate-roadmap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  console.log("Response received");

  const data = await res.json();
  generateRoadmapBtn.disabled = false;
  aiOutput.textContent = data.response;

  console.log(data);
};
