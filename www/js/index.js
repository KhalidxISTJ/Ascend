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
let anytimeSkipped = [];
// Which list cards are expanded (show all) instead of the first 3
const expanded = { overdue: false, upcoming: false, anytime: false };
const PREVIEW_COUNT = 3;
const justSignedIn = window.location.hash.includes('access_token');
const timeTill = document.getElementById("time-till")
// Focus Timer: quest picker (these live up here because updateDashboard runs before the timer code below)
const focusSelect = document.getElementById("focusQuestSelect");
const focusTotalEl = document.getElementById("focusQuestTotal");
let focusListSignature = "";
let focusReady = false; // becomes true once the timer code below has run

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
const detailsCurrentQuest = document.getElementById("detailsCurrentQuest");
const currentQuestDetails = document.getElementById("currentQuestDetails");
const cards = document.querySelectorAll(".stat-card")
const xpCard = document.getElementById("xp")
const timeLeftInDay = document.getElementById("time-left-in-day")

// Adds the clickable "+N more" / "Show less" line under a list card
function addMoreToggle(element, total, key) {
  if (total <= PREVIEW_COUNT) return;
  const toggle = document.createElement("button");
  toggle.className = "more-toggle";
  toggle.textContent = expanded[key] ? "Show less" : `+${total - PREVIEW_COUNT} more`;
  toggle.onclick = () => {
    expanded[key] = !expanded[key];
    updateDashboard();
  };
  element.appendChild(toggle);
}

function renderQuestList(element, quests, key) {
  element.innerHTML = "";
  if (quests.length === 0) {
    element.innerHTML = "<em>None</em>";
    return;
  }

  const visible = expanded[key] ? quests : quests.slice(0, PREVIEW_COUNT);
  visible.forEach((q) => {
    const row = document.createElement("div");
    row.className = "dashboard-quest";
    row.textContent = q.name;
    element.appendChild(row);
  });
  addMoreToggle(element, quests.length, key);
}

function renderAnytimeList(element, list) {
  element.innerHTML = "";
  if (list.length === 0) {
    element.innerHTML = "<em>None</em>";
    return;
  }

  const visible = expanded.anytime ? list : list.slice(0, PREVIEW_COUNT);
  visible.forEach((quest, index) => {
    const row = document.createElement("div");
    row.className = "anytime-row";

    const name = document.createElement("div");
    name.className = "anytime-name";
    name.textContent = quest.name;

    // Only the first anytime quest (the "current" one) gets buttons.
    // The rest are just names, like the Overdue and Upcoming lists.
    if (index > 0) {
      name.classList.add("anytime-name-plain");
      row.appendChild(name);
      element.appendChild(row);
      return;
    }

    const notesBox = document.createElement("div");
    notesBox.className = "anytime-notes-box";
    notesBox.hidden = true;
    notesBox.textContent = quest.notes ? quest.notes : "No notes for this quest.";

    const doneBtn = document.createElement("button");
    doneBtn.className = "anytime-complete";
    doneBtn.textContent = "Complete";
    doneBtn.onclick = () => {
      completeQuest(quest);
      updateDashboard();
    };

    const skipBtn = document.createElement("button");
    skipBtn.className = "anytime-skip";
    skipBtn.textContent = "Skip";
    skipBtn.onclick = () => {
      anytimeSkipped = anytimeSkipped.filter((id) => id !== quest.createdAt);
      anytimeSkipped.push(quest.createdAt);
      updateDashboard();
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "anytime-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      cancelQuest(quest);
      updateDashboard();
    };

    const notesBtn = document.createElement("button");
    notesBtn.className = "anytime-notes";
    notesBtn.textContent = "Notes";
    notesBtn.onclick = () => {
      notesBox.hidden = !notesBox.hidden;
      notesBtn.textContent = notesBox.hidden ? "Notes" : "Hide";
    };

    const actions = document.createElement("div");
    actions.className = "anytime-actions";
    actions.append(doneBtn, skipBtn, cancelBtn, notesBtn);

    row.append(name, actions, notesBox);
    element.appendChild(row);
  });
  addMoreToggle(element, list.length, "anytime");
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
    currentQuestElement.innerHTML = "";
    const header = document.createElement("div");
    header.className = "current-quest-header";
    const nameEl = document.createElement("strong");
    nameEl.textContent = mission.name;
    header.appendChild(nameEl);
    if (streak > 0) {
      const badge = document.createElement("span");
      badge.className = "quest-streak-badge";
      badge.textContent = `🔥x${streak}`;
      header.appendChild(badge);
    }
    currentQuestElement.append(header, `${mission.priority} Priority`);
    completeCurrentQuest.hidden = false;
    skipCurrentQuest.hidden = false;
    cancelCurrentQuest.hidden = false;
    detailsCurrentQuest.hidden = false;
    currentQuestDetails.textContent = mission.notes ? mission.notes : "No notes for this quest.";
  } else {
    currentQuestElement.textContent = "None";
    completeCurrentQuest.hidden = true;
    skipCurrentQuest.hidden = true;
    cancelCurrentQuest.hidden = true;
    detailsCurrentQuest.hidden = true;
    currentQuestDetails.hidden = true;
  }

  const overdueQuests = todayQuests.filter((quest) => {
    return quest.status === "active" && !quest.cancelledToday && getQuestTimeState(quest) === "overdue";
  });

  // Use the live quest objects (not the storage copy) so Complete/Cancel really save
  const anytimeQuests = getTodaysQuests().filter((quest) => {
    return quest.status === "active" && !quest.cancelledToday && quest.noTime;
  });
  anytimeQuests.sort((a, b) => anytimeSkipped.indexOf(a.createdAt) - anytimeSkipped.indexOf(b.createdAt));

  renderQuestList(overdueQuestsElement, overdueQuests, "overdue");
  renderAnytimeList(anytimeQuestsElement, anytimeQuests);

  const upcoming = getUpcomingQuests();

  renderQuestList(upcomingQuestsElement, upcoming, "upcoming");

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

  refreshFocusQuestList();
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

detailsCurrentQuest.onclick = function () {
  currentQuestDetails.hidden = !currentQuestDetails.hidden;
  detailsCurrentQuest.textContent = currentQuestDetails.hidden ? "Notes" : "Hide";
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
    // If sync was already ready, the timer code below hasn't run yet; it restores itself at the end
    if (focusReady) restoreFocusSession();
  }
});

// =====================
// TIMER (linked to a quest)
// =====================
// The timer counts against real clock time (endAt), so it stays correct when the
// app is in the background or you switch pages. The running session is kept in
// localStorage on this device only, and the focused seconds are added to the quest.

let timer;
let timeLeft = Number(timerMinutes.value) * 60;
let running = false;
let endAt = 0;           // when the countdown reaches 0 (ms), only while running
let segStart = 0;        // when the current running stretch started (ms)
let segLeft = 0;         // seconds that were left when this stretch started
let focusQuestId = null; // quest this running stretch counts for
let focusRestored = false;
const FOCUS_NOTIFICATION_ID = 90001; // 1 and 2 are Codex/adaptive, 100000+ are quest reminders
updateTimerButtons();

function updateTimerDisplay() {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

updateTimerDisplay();
updateTimerButtons();

// ---------- quest picker ----------

function selectedFocusQuestId() {
  return focusSelect && focusSelect.value ? Number(focusSelect.value) : null;
}

function findFocusQuest(id) {
  return id ? quests.find((q) => q.createdAt === id) : null;
}

// Fills the dropdown with today's active quests. Only rebuilds when the list changed,
// so the dropdown doesn't close on your finger while you are choosing.
function refreshFocusQuestList() {
  if (!focusSelect || !focusReady) return;
  const items = getTodaysQuests()
    .filter((quest) => quest.status === "active" && !quest.cancelledToday)
    .map((quest) => ({ id: String(quest.createdAt), name: quest.name }));

  // Keep the chosen quest in the list even if it was just completed
  const keepId = focusQuestId ? String(focusQuestId) : focusSelect.value;
  if (keepId && !items.some((item) => item.id === keepId)) {
    const kept = findFocusQuest(Number(keepId));
    if (kept) items.push({ id: keepId, name: kept.name });
  }

  const signature = JSON.stringify(items);
  if (signature === focusListSignature) return;
  focusListSignature = signature;

  const chosen = focusSelect.value;
  focusSelect.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "— No quest —";
  focusSelect.appendChild(none);
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    focusSelect.appendChild(option);
  });
  focusSelect.value = items.some((item) => item.id === chosen) ? chosen : "";
  updateFocusTotal();
}

function setFocusQuest(id) {
  focusQuestId = id || null;
  if (focusSelect) {
    if (!id) {
      focusSelect.value = "";
    } else {
      const text = String(id);
      if (![...focusSelect.options].some((option) => option.value === text)) {
        const quest = findFocusQuest(id);
        if (quest) {
          const option = document.createElement("option");
          option.value = text;
          option.textContent = quest.name;
          focusSelect.appendChild(option);
        }
      }
      focusSelect.value = text;
      if (focusSelect.value !== text) focusQuestId = null; // quest no longer exists
    }
  }
  updateFocusTotal();
}

function updateFocusTotal() {
  if (!focusTotalEl) return;
  const id = selectedFocusQuestId();
  const quest = findFocusQuest(id);
  if (!quest) {
    focusTotalEl.textContent = "";
    return;
  }
  // Include the stretch that is running right now
  const live = running && focusQuestId === id
    ? Math.min(segLeft, Math.max(0, Math.floor((Date.now() - segStart) / 1000)))
    : 0;
  const today = ((quest.focusByDay || {})[getTodayDateKey()] || 0) + live;
  const total = (quest.focusSeconds || 0) + live;
  focusTotalEl.textContent = `⏱ Today ${formatFocusTime(today)} · Total ${formatFocusTime(total)}`;
}

// ---------- saving focus time to the quest ----------

function addFocusSeconds(questId, seconds) {
  seconds = Math.floor(seconds);
  if (!questId || seconds <= 0) return;
  const quest = findFocusQuest(questId);
  if (!quest) return;
  const today = getTodayDateKey();
  quest.focusSeconds = (quest.focusSeconds || 0) + seconds;
  if (!quest.focusByDay) quest.focusByDay = {};
  quest.focusByDay[today] = (quest.focusByDay[today] || 0) + seconds;
  saveQuests();
}

// Ends the current running stretch: saves the seconds focused so far, returns them.
// `now` is capped at endAt so a late wake-up never counts more than was planned.
function closeSegment(now) {
  const elapsed = Math.min(segLeft, Math.max(0, Math.floor((Math.min(now, endAt) - segStart) / 1000)));
  addFocusSeconds(focusQuestId, elapsed);
  return elapsed;
}

// ---------- notification when the session ends (works with the app closed) ----------

function getFocusNotifier() {
  return typeof LocalNotifications !== "undefined" && LocalNotifications && LocalNotifications.schedule
    ? LocalNotifications
    : null;
}

async function scheduleFocusNotification() {
  const notifier = getFocusNotifier();
  if (!notifier) return;
  try {
    await notifier.cancel({ notifications: [{ id: FOCUS_NOTIFICATION_ID }] });
    const quest = findFocusQuest(focusQuestId);
    await notifier.schedule({
      notifications: [{
        id: FOCUS_NOTIFICATION_ID,
        title: "⏱ Focus session done",
        body: quest ? `Nice work on "${quest.name}".` : "Time's up!",
        schedule: { at: new Date(endAt), allowWhileIdle: true },
      }],
    });
  } catch (error) {
    console.log("Focus notification failed:", error);
  }
}

async function cancelFocusNotification() {
  const notifier = getFocusNotifier();
  if (!notifier) return;
  try {
    await notifier.cancel({ notifications: [{ id: FOCUS_NOTIFICATION_ID }] });
  } catch (error) {
    console.log("Focus notification cancel failed:", error);
  }
}

// ---------- remembering the session across pages / app restarts ----------

function focusStorageKey() {
  return localStorage.getItem("currentUserEmail") + "_focusSession";
}

function saveFocusSession() {
  if (!localStorage.getItem("currentUserEmail")) return;
  try {
    localStorage.setItem(focusStorageKey(), JSON.stringify({
      running, endAt, segStart, segLeft, timeLeft,
      minutes: timerMinutes.value,
      questId: running ? focusQuestId : selectedFocusQuestId(),
    }));
  } catch (error) {
    console.log("Could not save focus session:", error);
  }
}

function restoreFocusSession() {
  if (running || focusRestored || !localStorage.getItem("currentUserEmail")) return;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(focusStorageKey()));
  } catch (error) {
    saved = null;
  }
  if (!saved) return;
  focusRestored = true;

  setFocusQuest(saved.questId);
  if (saved.minutes !== undefined) timerMinutes.value = saved.minutes;

  if (saved.running) {
    focusQuestId = saved.questId || null;
    segStart = saved.segStart;
    segLeft = saved.segLeft;
    endAt = saved.endAt;
    if (Date.now() >= endAt) {
      // The session ended while you were away (the notification already told you)
      finishTimer(true);
      return;
    }
    running = true;
    timeLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    timer = setInterval(tick, 500);
    setTimerStatus("running");
  } else {
    timeLeft = saved.timeLeft || 0;
    setTimerStatus(timeLeft > 0 ? "paused" : "ready");
  }
  updateTimerDisplay();
  updateTimerButtons();
}

// ---------- the countdown ----------

function tick() {
  const now = Date.now();
  if (now >= endAt) {
    finishTimer(false);
    return;
  }
  const left = Math.max(0, Math.ceil((endAt - now) / 1000));
  if (left !== timeLeft) {
    timeLeft = left;
    updateTimerDisplay();
    updateFocusTotal();
  }
}

function finishTimer(quiet) {
  clearInterval(timer);
  closeSegment(endAt);
  running = false;
  timeLeft = 0;
  updateFocusTotal();
  updateTimerDisplay();
  updateTimerButtons();
  setTimerStatus("finished");
  saveFocusSession();
  // In the app the scheduled notification already announces it; in a browser use an alert
  if (!quiet && !getFocusNotifier()) alert("Time's up!");
}

startTimer.onclick = function () {
  if (running) return;
  if (timeLeft <= 0) {
    timerMinutes.focus();
    return;
  }

  const now = Date.now();
  focusQuestId = selectedFocusQuestId();
  running = true;
  segStart = now;
  segLeft = timeLeft;
  endAt = now + timeLeft * 1000;
  timer = setInterval(tick, 500);

  updateTimerButtons();
  setTimerStatus("running");
  scheduleFocusNotification();
  saveFocusSession();
};

pauseTimer.onclick = function () {
  if (!running) return;
  clearInterval(timer);
  const elapsed = closeSegment(Date.now());
  running = false;
  timeLeft = Math.max(0, segLeft - elapsed);
  updateFocusTotal();
  updateTimerDisplay();
  updateTimerButtons();
  setTimerStatus("paused");
  cancelFocusNotification();
  saveFocusSession();
};

resetTimer.onclick = function () {
  if (running) {
    clearInterval(timer);
    closeSegment(Date.now());
  }
  running = false;

  timeLeft = 0;
  timerMinutes.value = 0;

  updateFocusTotal();
  updateTimerDisplay();
  updateTimerButtons();
  setTimerStatus("ready");
  cancelFocusNotification();
  saveFocusSession();
};

timerMinutes.onchange = function () {
  if (!running) {
    timeLeft = Number(timerMinutes.value) * 60;
    updateTimerDisplay();
    updateTimerButtons();
    setTimerStatus("ready");
    saveFocusSession();
  }
};

// Switching quest mid-session: time so far goes to the old quest, the rest to the new one
if (focusSelect) {
  focusSelect.onchange = function () {
    if (running) {
      const now = Date.now();
      closeSegment(now);
      segStart = now;
      segLeft = Math.max(0, Math.ceil((endAt - now) / 1000));
      focusQuestId = selectedFocusQuestId();
      scheduleFocusNotification();
    }
    updateFocusTotal();
    saveFocusSession();
  };
}

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

// Pick up a session that was running before this page loaded
focusReady = true;
refreshFocusQuestList();
restoreFocusSession();

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
  if (!upcomingQuest || !upcomingQuest.startTime) {
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