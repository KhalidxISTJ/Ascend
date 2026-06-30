// =======================
// QUESTS
// =======================

const completedQuests = quests.filter(q => q.completed).length;

const activeQuests = quests.filter(q => !q.completed).length;

const completionRate = quests.length === 0 ? 0 : Math.round((completedQuests / quests.length) * 100);

const codexCards = JSON.parse(localStorage.getItem("codexCards")) || [];
// =======================
// PLAYER
// =======================

document.getElementById("playerLevelCard").textContent = playerData.level;

document.getElementById("playerXPCard").textContent = playerData.xp;

document.getElementById("codexCardTotal").textContent = codexCards.length;

document.getElementById("completedQuestCard").textContent = completedQuests;

document.getElementById("completionRateCard").textContent = completionRate + "%";