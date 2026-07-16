const activeQuestCount = document.getElementById("activeQuestCount");

const completedQuestCount = document.getElementById("completedQuestCount");

const codexCardCount = document.getElementById("codexCardCount");

const completionRate = document.getElementById("completionRate");

function updateDashboard() {
  const quests = JSON.parse(localStorage.getItem("quests")) || [];

  const cards = JSON.parse(localStorage.getItem("codexCards")) || [];

  const active = quests.filter(function (quest) {
    return !quest.completed;
  }).length;

  const completed = quests.filter(function (quest) {
    return quest.completed;
  }).length;

  const completion =
    quests.length === 0 ? 0 : Math.round((completed / quests.length) * 100);

  activeQuestCount.textContent = "Active Quests: " + active;

  completedQuestCount.textContent = "Completed Quests: " + completed;

  completionRate.textContent = "Completion Rate: " + completion + "%";

  codexCardCount.textContent = "Codex Cards: " + cards.length;
}

updateDashboard();
