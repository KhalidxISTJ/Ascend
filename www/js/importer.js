function importRoadmap(data) {
  function buildSkill(skill) {
    return {
      id: crypto.randomUUID(),

      name: skill.name || "New Skill",

      description: skill.description || "",

      lessonSummary: skill.lessonSummary || "",

      level: 1,

      xp: 0,

      progress: 0,

      status: "Not Started",

      difficulty: skill.difficulty || "Medium",

      estimatedHours: skill.estimatedHours || 0,

      resources: skill.resources || [],

      quests: skill.quests || [],

      notes: skill.notes || "",

      children: (skill.children || []).map(buildSkill),
    };
  }

  const rootSkill = buildSkill(data);

  skillTree.push(rootSkill);

  saveSkillTree();

  return rootSkill;
}
