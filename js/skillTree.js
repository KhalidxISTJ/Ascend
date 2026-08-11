let skillTree = [
  {
    id: "faith",
    name: "Faith",
    description: "Develop and strengthen your faith.",
    level: 1,
    xp: 0,
    progression: {
      learn: false,
      understand: false,
      apply: false,
      explain: false,
      practice: false,
      master: false,
    },
    children: [],
  },
  {
    id: "mind",
    name: "Mind",
    description: "Develop knowledge, thinking, and mental skills.",
    level: 1,
    xp: 0,
    progression: {
      learn: false,
      understand: false,
      apply: false,
      explain: false,
      practice: false,
      master: false,
    },
    children: [],
  },
  {
    id: "body",
    name: "Body",
    description: "Develop physical health, fitness, and discipline.",
    level: 1,
    xp: 0,
    progression: {
      learn: false,
      understand: false,
      apply: false,
      explain: false,
      practice: false,
      master: false,
    },
    children: [],
  },
  {
    id: "craft",
    name: "Craft",
    description: "Develop useful skills and create things.",
    level: 1,
    xp: 0,
    progression: {
      learn: false,
      understand: false,
      apply: false,
      explain: false,
      practice: false,
      master: false,
    },
    children: [],
  },
  {
    id: "social",
    name: "Social",
    description: "Develop communication and relationships.",
    level: 1,
    xp: 0,
    progression: {
      learn: false,
      understand: false,
      apply: false,
      explain: false,
      practice: false,
      master: false,
    },
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

function initializeSkillProgression(nodes) {
  nodes.forEach((skill) => {
    if (!skill.progression) {
      skill.progression = {
        learn: false,
        understand: false,
        apply: false,
        explain: false,
        practice: false,
        master: false,
      };
    }

    if (!skill.children) {
      skill.children = [];
    }

    initializeSkillProgression(skill.children);
  });
}

initializeSkillProgression(skillTree);
saveSkillTree();

function setSkillProgression(skill, stage, completed) {
  if (!skill || !skill.progression) {
    return;
  }

  const stages = [
    "learn",
    "understand",
    "apply",
    "explain",
    "practice",
    "master",
  ];

  const stageIndex = stages.indexOf(stage);

  if (stageIndex === -1) {
    return;
  }

  // Completing a stage requires the previous stage
  // to already be completed.
  if (completed && stageIndex > 0) {
    const previousStage = stages[stageIndex - 1];

    if (!skill.progression[previousStage]) {
      return;
    }
  }

  skill.progression[stage] = completed;

  // If a stage is unchecked, reset everything after it.
  if (!completed) {
    for (let i = stageIndex + 1; i < stages.length; i++) {
      skill.progression[stages[i]] = false;
    }
  }

  saveSkillTree();
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
