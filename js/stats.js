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

  sidebar.innerHTML = "";

  if (navigationStack.length > 1) {
    const back = document.createElement("div");
    back.className = "stats-card stat-selectable";
    back.textContent = "← Back";

    back.onclick = goBack;

    sidebar.appendChild(back);
  }

  currentSkill.children.forEach((child) => {
    const card = document.createElement("div");

    card.className = "stats-card stat-selectable";

    card.innerHTML = `
  <h3>${child.name}</h3>

  <button class="rename-btn">
    ✏️
  </button>

  <button class="delete-btn">
    🗑
  </button>
`;

    card.onclick = (e) => {
      if (e.target.tagName === "BUTTON") return;

      openSkill(child.id);
    };

    card.querySelector(".rename-btn").onclick = () => {
      renameSkill(child.id);
    };

    card.querySelector(".delete-btn").onclick = () => {
      deleteSkill(child.id);
    };

    inspector.appendChild(card);
  });
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
    children: skillTree,
    name: "Character Stats",
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

  currentSkill.children.forEach((child, index) => {
    const node = document.createElement("div");

    node.className = "roadmap-node";
    const x = 120 + index * 120;
    const y = 120;

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

addRoadmapNodeBtn.onclick = function () {
  if (!currentSkill) {
    alert("Select a stat first.");
    return;
  }

  const name = prompt("Skill name:");

  if (!name) return;

  currentSkill.children.push({
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
