const activeQuestCount = document.getElementById("activeQuestCount");
const completedQuestCount = document.getElementById("completedQuestCount");
const completionRate = document.getElementById("completionRate");
const completeCurrentQuest = document.getElementById("completeCurrentQuest");
const currentQuestElement = document.getElementById("current-quest");
const timerDisplay = document.getElementById("timerDisplay");
const timerMinutes = document.getElementById("timerMinutes");
const startTimer = document.getElementById("startTimer");
const pauseTimer = document.getElementById("pauseTimer");
const resetTimer = document.getElementById("resetTimer");
const timerStatus = document.getElementById("timerStatus");
const skipCurrentQuest = document.getElementById("skipCurrentQuest");
const overdueQuestsElement = document.getElementById("overdueQuests");
const upcomingQuestsElement = document.getElementById("upcomingQuests");
document.getElementById("version").textContent = APP_VERSION;

function renderQuestList(element, quests) {
  if (quests.length === 0) {
    element.innerHTML = "<em>None</em>";
    return;
  }

  element.innerHTML = quests
    .map(
      (q) => `
        <div class="dashboard-quest">
            ${q.name}
        </div>
    `,
    )
    .join("");
}

function getCurrentMission() {
  let todays = getTodaysQuests().filter(
    (q) => !skippedToday.includes(q.createdAt),
  );
  if (todays.length === 0) {
    skippedToday = [];
    localStorage.setItem("skippedToday", JSON.stringify(skippedToday));

    todays = getTodaysQuests();
  }

  console.log("Sorted Today:", sortQuests([...todays]));
  console.log("Upcoming:", getUpcomingQuests());
  console.log("Backlog:", getBacklogQuests());

  if (todays.length > 0) {
    return sortMissionQuests(todays)[0];
  }

  const upcoming = getUpcomingQuests();

  if (upcoming.length > 0) {
    return sortMissionQuests(upcoming)[0];
  }

  const backlog = getBacklogQuests();

  if (backlog.length > 0) {
    return sortMissionQuests(backlog)[0];
  }

  return null;
}
let skippedToday = JSON.parse(localStorage.getItem("skippedToday")) || [];
function skipQuest(quest) {
  if (!skippedToday.includes(quest.createdAt)) {
    skippedToday.push(quest.createdAt);
  }

  localStorage.setItem("skippedToday", JSON.stringify(skippedToday));
}
function updateDashboard() {
  const quests = JSON.parse(localStorage.getItem("quests")) || [];
  const mission = getCurrentMission();

  // =====================
  // Current Mission
  // =====================

  if (mission) {
    currentQuestElement.innerHTML = `
      <strong>${mission.name}</strong><br>
      ${mission.priority} Priority
    `;

    completeCurrentQuest.hidden = false;
    skipCurrentQuest.hidden = false;
  } else {
    currentQuestElement.textContent = "No active quest.";
    completeCurrentQuest.hidden = true;
    skipCurrentQuest.hidden = true;
  }

  renderQuestList(overdueQuestsElement, getBacklogQuests());

  renderQuestList(upcomingQuestsElement, getUpcomingQuests());

  // =====================
  // Quest Stats
  // =====================

  const active = quests.filter((q) => !q.completed).length;

  const completed = quests.filter((q) => q.completed).length;

  const completion =
    quests.length === 0 ? 0 : Math.round((completed / quests.length) * 100);

  activeQuestCount.textContent = `Active Quests: ${active}`;
  completedQuestCount.textContent = `Completed Quests: ${completed}`;
  completionRate.textContent = `Completion Rate: ${completion}%`;

  // =====================
  // Codex
  // =====================
}

completeCurrentQuest.onclick = function () {
  const mission = getCurrentMission();

  if (!mission) {
    return;
  }

  completeQuest(mission);

  updateDashboard();
};

skipCurrentQuest.onclick = function () {
  const mission = getCurrentMission();

  if (!mission) return;

  skipQuest(mission);

  updateDashboard();
};
updateDashboard();

// =====================
// TIMER
// =====================

let timer;
let timeLeft = Number(timerMinutes.value) * 60;
let running = false;
updateTimerButtons();

function updateTimerDisplay() {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

updateTimerDisplay();
updateTimerButtons();

startTimer.onclick = function () {
  if (running) return;

  running = true;
  updateTimerButtons();
  setTimerStatus("running");

  timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer);
      running = false;
      updateTimerButtons();
      alert("Time's up!");
      return;
    }

    timeLeft--;
    updateTimerDisplay();
  }, 1000);
};

pauseTimer.onclick = function () {
  clearInterval(timer);
  running = false;
  updateTimerButtons();
  setTimerStatus("paused");
};

resetTimer.onclick = function () {
  clearInterval(timer);
  running = false;

  timeLeft = Number(timerMinutes.value) * 0;
  timerMinutes.value = 0;

  updateTimerDisplay();
  updateTimerButtons();
  setTimerStatus("ready");
};

timerMinutes.onchange = function () {
  if (!running) {
    timeLeft = Number(timerMinutes.value) * 60;
    updateTimerDisplay();
  }
};

function setTimerStatus(state) {
  timerStatus.className = "timer-status";

  switch (state) {
    case "running":
      timerStatus.classList.add("running");
      timerStatus.textContent = "🟢 Running";
      break;

    case "paused":
      timerStatus.classList.add("paused");
      timerStatus.textContent = "🟡 Paused";
      break;

    case "finished":
      timerStatus.classList.add("finished");
      timerStatus.textContent = "🔵 Complete";
      break;

    default:
      timerStatus.textContent = "⚪ Ready";
  }
}
function updateTimerButtons() {
  pauseTimer.disabled = !running;

  if (running) {
    startTimer.disabled = true;
    startTimer.textContent = "Running...";
  } else {
    startTimer.disabled = false;

    if (timeLeft > 0) {
      startTimer.textContent = "Resume";
    } else {
      startTimer.textContent = "Start";
    }
  }
}
