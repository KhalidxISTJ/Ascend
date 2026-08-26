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
let currentQuestSkipCount = 0;
function getCurrentMission() {
  return getCurrentQuest(currentQuestSkipCount);
}

function getQuestTimeState(quest) {
  if (!quest) {
    return "unknown";
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  function getTimeMinutes(time) {
    if (!time) {
      return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  const startMinutes = getTimeMinutes(quest.startTime);
  const endMinutes = getTimeMinutes(quest.endTime);

  // No time information
  if (startMinutes === null) {
    return "active";
  }

  // Quest hasn't started yet
  if (currentMinutes < startMinutes) {
    return "upcoming";
  }

  // Quest has an end time and that time has passed
  if (endMinutes !== null && currentMinutes >= endMinutes) {
    return "overdue";
  }

  // Currently inside the scheduled window
  return "active";
}
let skippedToday = JSON.parse(localStorage.getItem("skippedToday")) || [];
function skipQuest(quest) {
  if (!quest || quest.status === "completed") {
    return;
  }

  currentQuestSkipCount++;

  updateDashboard();

  window.dispatchEvent(new CustomEvent("questStateChanged"));
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

  const overdueQuests = quests.filter((quest) => {
    return quest.status === "active" && getQuestTimeState(quest) === "overdue";
  });

  renderQuestList(overdueQuestsElement, overdueQuests);

  const upcoming = getUpcomingQuests();

  renderQuestList(
    upcomingQuestsElement,
    upcoming.length > 0 ? [upcoming[0]] : [],
  );

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

  // Completing a quest returns us to the real Current Quest.
  currentQuestSkipCount = 0;

  updateDashboard();
};

skipCurrentQuest.onclick = function () {
  const mission = getCurrentMission();

  if (!mission) return;

  skipQuest(mission);

  updateDashboard();
};
updateDashboard();

window.addEventListener("questStateChanged", () => {
  updateDashboard();
});

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
