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
    },

    quests: {
      all: typeof getQuestData === "function" ? getQuestData() : [],

      today: typeof getTodaysQuests === "function" ? getTodaysQuests() : [],

      backlog: typeof getBacklogQuests === "function" ? getBacklogQuests() : [],

      upcoming:
        typeof getUpcomingQuests === "function" ? getUpcomingQuests() : [],

      currentMission:
        typeof getCurrentMission === "function" ? getCurrentMission() : null,

      stats: typeof getQuestStats === "function" ? getQuestStats() : null,

      todayProgress:
        typeof getTodayProgress === "function" ? getTodayProgress() : null,
    },

    selectedSkill: window.selectedSkill || null,
  };
}
