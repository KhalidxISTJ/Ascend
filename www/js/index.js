/* Variables */
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
const anytimeQuestsElement = document.getElementById("anytimeQuests")
let user = localStorage.getItem("currentUserEmail");
let ascendLibrary, savedQuests, codexData, savedQuestSections, questCategories, skillTree, savedPlayerData, lastResetDate
let skippedToday = [];
const justSignedIn = window.location.hash.includes('access_token');
const timeTill = document.getElementById("time-till")

function refreshUserScopedData() {
  user = localStorage.getItem("currentUserEmail");
  if (!user && !justSignedIn) {
    window.location.href = "splash.html";
    return false;
  }
  ascendLibrary = localStorage.getItem(user + "_ascendLibrary");
  savedQuests = localStorage.getItem(user + "_savedQuests");
  codexData = localStorage.getItem(user + "_codexData");
  savedQuestSections = localStorage.getItem(user + "_questSections");
  questCategories = localStorage.getItem(user + "_questCategories");
  skillTree = localStorage.getItem(user + "_skillTree");
  savedPlayerData = localStorage.getItem(user + "_playerData");
  lastResetDate = localStorage.getItem(user + "_lastResetDate");
  skippedToday = JSON.parse(localStorage.getItem(user + "_skippedToday")) || [];
  return true;
}

refreshUserScopedData();


const cancelCurrentQuest = document.getElementById("cancelCurrentQuest");
const cards = document.querySelectorAll(".stat-card")
const xpCard = document.getElementById("xp")
const timeLeftInDay = document.getElementById("time-left-in-day")

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
function skipQuest(quest) {
  if (!quest || quest.status === "completed") {
    return;
  }

  currentQuestSkipCount++;

  updateDashboard();

  window.dispatchEvent(new CustomEvent("questStateChanged"));
}
function updateDashboard() {
  const todayQuests = (JSON.parse(localStorage.getItem(user + "_savedQuests")) || []).filter((quest) => { return isQuestScheduledToday(quest); });
  const mission = getCurrentMission();

  // =====================
  // Current Mission
  // =====================

  if (mission) {
    const streak = (mission.recurring === "daily" || mission.recurring === "weekly") && mission.streakEnabled ? getCurrentStreak(mission) : 0
    currentQuestElement.innerHTML = `
          <div class="current-quest-header">
            <strong>${mission.name}</strong>
            ${streak > 0 ? `<span class="quest-streak-badge">🔥x${streak}</span>` : ""}
          </div>
          ${mission.priority} Priority
        `;
    completeCurrentQuest.hidden = false;
    skipCurrentQuest.hidden = false;
    cancelCurrentQuest.hidden = false;
  } else {
    currentQuestElement.textContent = "None";
    completeCurrentQuest.hidden = true;
    skipCurrentQuest.hidden = true;
    cancelCurrentQuest.hidden = true;
  }

  const overdueQuests = todayQuests.filter((quest) => {
    return quest.status === "active" && !quest.cancelledToday && getQuestTimeState(quest) === "overdue";
  });

  const anytimeQuests = todayQuests.filter((quest) => {
    return quest.status === "active" && !quest.cancelledToday && quest.noTime;
  });

  renderQuestList(overdueQuestsElement, overdueQuests);
  renderQuestList(anytimeQuestsElement, anytimeQuests);

  const upcoming = getUpcomingQuests();

  renderQuestList(
    upcomingQuestsElement,
    upcoming.length > 0 ? upcoming.slice(0, 5) : [],
  );

  // =====================
  // Quest Stats
  // =====================

  const active = todayQuests.filter((q) => !q.completed).length;

  const completed = todayQuests.filter((q) => q.completed).length;

  const completion =
    todayQuests.length === 0 ? 0 : Math.round((completed / todayQuests.length) * 100);

  activeQuestCount.textContent = `Active Quests: ${active}`;
  completedQuestCount.textContent = `Completed Quests: ${completed}`;
  completionRate.textContent = `Completion Rate: ${completion}%`;

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

cancelCurrentQuest.onclick = function () {
  const mission = getCurrentMission();
  if (!mission) return;
  cancelQuest(mission);
  currentQuestSkipCount = 0;
  updateDashboard();
};

updateDashboard();

window.addEventListener("questStateChanged", () => {
  updateDashboard();
});

// Re-read the signed-in user's actual data once Supabase's pull genuinely
// finishes, and redraw. Covers the case where this page's very first paint
// above ran before sign-in had resolved (see refreshUserScopedData above).
// whenSyncReady is shared in supabase-config.js — it also just runs
// immediately if window.syncReady is already true, so this is safe even
// though updateDashboard() already ran once above.
whenSyncReady(() => {
  if (refreshUserScopedData()) {
    updateDashboard();
  }
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

/* Calculates how much time is left before the day ends*/

function updateTimeLeft() {
  const date = new Date()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const minutesPassed = hours * 60 + minutes
  const minutesLeft = 1440 - minutesPassed
  const hoursLeft = Math.floor(minutesLeft / 60)
  const minsLeft = minutesLeft % 60
  const secondsLeft = 60 - seconds
  const secsLeft = secondsLeft % 60
  timeLeftInDay.textContent = `${hoursLeft}h : ${minsLeft}m : ${secsLeft}`
}


setInterval(updateTimeLeft, 1000)

/* Calculates how much time is till a quest starts */

function updateTimeTill() {
  const upcomingQuests = getUpcomingQuests()
  const upcomingQuest = upcomingQuests[0]
  if (!upcomingQuest) {
    timeTill.textContent = ""
    return
  }
  const upcomingQuestStart = upcomingQuest.startTime
  const startTime = upcomingQuestStart.split(":")
  const [hours, minutes] = startTime.map(Number)
  const today = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  const diff = target - today
  const totalSeconds = Math.floor(diff / 1000)
  const hoursLeft = Math.floor(totalSeconds / 3600)
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60)
  const secondsLeft = totalSeconds % 60
  timeTill.textContent = `${hoursLeft}h: ${minutesLeft}m : ${secondsLeft} `
}

setInterval(updateTimeTill, 1000)