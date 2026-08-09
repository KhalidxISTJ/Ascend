function getAIContext() {
  const level = playerData?.level ?? null;
  const currentXP = playerData?.xp ?? null;

  const xpRequired = level !== null ? getXPRequired(level) : null;

  const xpRemaining =
    currentXP !== null && xpRequired !== null ? xpRequired - currentXP : null;

  return {
    page: document.body.dataset.page || "unknown",

    player: {
      level,
      currentXP,
      xpRequired,
      xpRemaining,

      completedQuests:
        document.getElementById("completedQuestCard")?.textContent || null,

      completionRate:
        document.getElementById("completionRateCard")?.textContent || null,
    },

    selectedSkill: window.selectedSkill || null,
  };
}
