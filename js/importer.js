function importRoadmap(data) {
  function buildSkill(skill) {
    return {
      id: crypto.randomUUID(),
      name: skill.name || "New Skill",
      description: skill.description || "",
      level: 1,
      xp: 0,
      children: (skill.children || []).map(buildSkill),
    };
  }

  const rootSkill = buildSkill(data);

  skillTree.push(rootSkill);

  saveSkillTree();

  return rootSkill;
}
