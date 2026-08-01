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

function findSkillById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findSkillById(node.children, id);

    if (found) {
      return found;
    }
  }

  return null;
}
function findParent(nodes, id) {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === id)) {
      return node;
    }

    const found = findParent(node.children, id);

    if (found) return found;
  }

  return null;
}
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

  title.textContent = currentSkill.name;

  inspector.appendChild(title);
  if (currentSkill.id === "root") {
    const info = document.createElement("p");

    info.textContent = "Select a skill to view details.";

    inspector.appendChild(info);

    return;
  }
  const level = document.createElement("p");

  level.textContent = `Level: ${currentSkill.level}`;

  inspector.appendChild(level);

  const xp = document.createElement("p");

  xp.textContent = `XP: ${currentSkill.xp}`;

  inspector.appendChild(xp);
  const descriptionLabel = document.createElement("h3");

  descriptionLabel.textContent = "Description";

  inspector.appendChild(descriptionLabel);

  if (editingDescription) {
    const descriptionInput = document.createElement("textarea");

    inspector.appendChild(descriptionInput);

    const saveDescriptionBtn = document.createElement("button");

    saveDescriptionBtn.textContent = "Save";

    saveDescriptionBtn.onclick = () => {
      currentSkill.description = descriptionInput.value;

      saveSkillTree();

      editingDescription = false;

      renderInspector();
    };

    inspector.appendChild(saveDescriptionBtn);
  } else {
    const descriptionText = document.createElement("p");

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

  const renameBtn = document.createElement("button");

  renameBtn.textContent = "Rename";

  renameBtn.onclick = () => {
    renameSkill(currentSkill.id);
  };

  inspector.appendChild(renameBtn);

  const addChildBtn = document.createElement("button");

  addChildBtn.textContent = "+ Add Child";

  addChildBtn.onclick = () => {
    addChildSkill(currentSkill);
  };

  inspector.appendChild(addChildBtn);

  if (currentSkill.id !== "root") {
    const deleteBtn = document.createElement("button");

    deleteBtn.textContent = "Delete";

    deleteBtn.onclick = () => {
      deleteSkill(currentSkill.id);
    };

    inspector.appendChild(deleteBtn);
  }
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

    migrateSkills(skill.children);
  });
}

migrateSkills(skillTree);
saveSkillTree();
console.log(layoutTree(currentSkill));
