let skillTree = [
  {
    id: "faith",
    name: "Faith",
    children: [],
  },
  {
    id: "mind",
    name: "Mind",
    children: [],
  },
  {
    id: "body",
    name: "Body",
    children: [],
  },
  {
    id: "craft",
    name: "Craft",
    children: [],
  },
  {
    id: "social",
    name: "Social",
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
