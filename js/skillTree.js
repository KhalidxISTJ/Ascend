let skillTree = [
  {
    id: "faith",
    name: "Faith",
    description: "Develop and strengthen your faith.",
    level: 1,
    xp: 0,
    children: [],
  },
  {
    id: "mind",
    name: "Mind",
    description: "Develop knowledge, thinking, and mental skills.",
    level: 1,
    xp: 0,
    children: [],
  },
  {
    id: "body",
    name: "Body",
    description: "Develop physical health, fitness, and discipline.",
    level: 1,
    xp: 0,
    children: [],
  },
  {
    id: "craft",
    name: "Craft",
    description: "Develop useful skills and create things.",
    level: 1,
    xp: 0,
    children: [],
  },
  {
    id: "social",
    name: "Social",
    description: "Develop communication and relationships.",
    level: 1,
    xp: 0,
    children: [],
  },
];

const savedSkillTree = localStorage.getItem("skillTree");

if (savedSkillTree) {
  skillTree = JSON.parse(savedSkillTree);
}

function saveSkillTree() {
  localStorage.setItem("skillTree", JSON.stringify(skillTree));
}
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

function findSkillByName(nodes, name) {
  for (const node of nodes) {
    if (node.name === name) {
      return node;
    }

    const found = findSkillByName(node.children, name);

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

    if (found) {
      return found;
    }
  }

  return null;
}

function addSkillXP(skill, amount) {
  skill.xp += amount;

  while (skill.xp >= skill.level * 100) {
    skill.xp -= skill.level * 100;
    skill.level++;
  }

  saveSkillTree();
}
