const addQuestBtn = document.getElementById("addQuestBtn");
const questInput = document.getElementById("questInput");
const currentQuest = document.getElementById("current-quest");
const questList = document.getElementById("questList");
const completedQuestList = document.getElementById("completedQuestList");
const notTodayQuestList = document.getElementById("notTodayQuestList")
const questCategoryElement = document.getElementById("questCategory");
const questDifficultyElement = document.getElementById("questDifficulty");
const questRecurringElement = document.getElementById("questRecurring");
const questStartTimeElement = document.getElementById("questStartTime");
const questEndTimeElement = document.getElementById("questEndTime");
const questPriority = document.getElementById("questPriority");
const questSearch = document.getElementById("questSearch");
const newQuestBtn = document.getElementById("newQuestBtn");
const questCreator = document.querySelector(".quest-creator");
const questSections = document.getElementById("questSections");
const questDueDateElement = document.getElementById("questDueDate");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const sortQuestsElement = document.getElementById("sortQuests");
const daySelectorContainer = document.getElementById("daySelectorContainer");
const repeatDayCheckboxes = document.querySelectorAll(".repeat-day");
const questUser = localStorage.getItem("currentUserEmail");
const questStreakEnabledElement = document.getElementById("questStreakEnabled");
const wizardSteps = document.querySelectorAll(".wizard-step")
const wizardBack = document.getElementById("wizardBack")
const wizardNext = document.getElementById("wizardNext")
const noTimeBox = document.getElementById("questAnytime")
const wizardCancel = document.getElementById("wizardCancel")
const reviewSummary = document.getElementById("reviewSummary")
const questAdaptiveElement = document.getElementById("questAdaptive")
const startingGap = { Easy: 2880, Medium: 1440, Hard: 720, Extreme: 360 };
const ratingMultiplier = { 1: "2", 2: "1.2", 3: "0.5" }
const questNotesElement = document.getElementById("questNotes")
const questRemindInQuietElement = document.getElementById("questRemindInQuiet")
const questMustDoElement = document.getElementById("questMustDo")
const questFirstActionElement = document.getElementById("questFirstAction")
const mustDoContainer = document.getElementById("mustDoContainer")
const mustDoError = document.getElementById("mustDoError")
const customIntervalContainer = document.getElementById("customIntervalContainer")
const questRepeatEveryElement = document.getElementById("questRepeatEvery")
const { LocalNotifications } = (typeof Capacitor !== "undefined") ? Capacitor.Plugins : {};
let currentStep = 1


/* =======================================================
   PRAYER TIMES API (Albany, NY - ISNA Method)
======================================================= */

const ALBANY_COORDS = {
  latitude: 42.6526,
  longitude: -73.7562,
  method: 99, // Custom
  fajrAngle: 15,
  ishaAngle: 15,
};

async function getPrayerTimes() {
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${ALBANY_COORDS.latitude}&longitude=${ALBANY_COORDS.longitude}&method=99&fajrAngle=${ALBANY_COORDS.fajrAngle}&ishaAngle=${ALBANY_COORDS.ishaAngle}`,
    );
    const data = await response.json();
    return data.data.timings;
  } catch (error) {
    console.error("Failed to fetch prayer times:", error);
    return null;
  }
}

function formatTimeForQuest(timeStr) {
  if (!timeStr) return "00:00";
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes}`;
}

async function updatePrayerQuests() {
  const times = await getPrayerTimes();
  if (!times) return;

  const saved = localStorage.getItem(questUser + "_savedQuests");
  if (!saved) return;

  const quests = JSON.parse(saved);
  let updated = false;

  quests.forEach((quest) => {
    if (quest.isPrayer && times[quest.prayerType]) {
      const newTime = formatTimeForQuest(times[quest.prayerType]);
      if (quest.startTime !== newTime) {
        quest.startTime = newTime;
        updated = true;
        console.log(`🕌 Updated ${quest.prayerType} to ${newTime}`);
      }
    }
  });

  if (updated) {
    localStorage.setItem(questUser + "_savedQuests", JSON.stringify(quests));
    localStorage.setItem(questUser + "_savedQuests_modifiedAt", Date.now());
    if (typeof syncPush === "function") {
      syncPush();
    }
    loadQuests();
    renderQuests();
    if (typeof updateDashboard === "function") {
      updateDashboard();
    }
  }
}

// =====================================================
// DATE HELPERS
// =====================================================

function getTodayString() {
  return getTodayDateKey();
}

function getYesterdayString() {
  return getDaysAgoString(1);
}
function getDaysAgoString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Turn "YYYY-MM-DD" into a LOCAL date (new Date("YYYY-MM-DD") is UTC, which is a day early in New York)
function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// NEW: Get today's date as a simple string (no time)
function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// NEW: Check if it's a new day since last reset
function isNewDay() {
  const lastReset = localStorage.getItem(questUser + "_lastResetDate");
  const today = getTodayDateKey();

  if (!lastReset) {
    return true;
  }

  return lastReset !== today;
}

// =====================
// Quest Data
// =====================

let quests = [];

let sections = [];

let currentSection = "Morning";

let categories = [];

let editingQuest = null;

let searchText = "";

let currentSort = "date";

// =====================
// Default Data
// =====================

const defaultSections = ["Morning", "School", "General", "Night"];
const defaultCategories = ["Faith", "School", "Fitness", "General"];

// =====================================================
// RECURRING DROPDOWN - Show/Hide Day Selector
// =====================================================

if (questRecurringElement) {
  questRecurringElement.addEventListener("change", function () {
    if (daySelectorContainer) {
      daySelectorContainer.style.display =
        this.value === "weekly" ? "block" : "none";
    }
    if (customIntervalContainer) {
      customIntervalContainer.style.display =
        this.value === "custom" ? "block" : "none";
    }
  });
}

// =====================================================
// NO TIME (ANYTIME) CHECKBOX - lock the time inputs
// =====================================================

function updateTimeInputsLock() {
  const locked = noTimeBox ? noTimeBox.checked : false;
  if (questStartTimeElement) {
    questStartTimeElement.disabled = locked;
    if (locked) questStartTimeElement.value = "";
  }
  if (questEndTimeElement) {
    questEndTimeElement.disabled = locked;
    if (locked) questEndTimeElement.value = "";
  }
}

if (noTimeBox) {
  noTimeBox.addEventListener("change", updateTimeInputsLock);
}

// =====================================================
// MUST DO - needs a first small action and a start + end time
// =====================================================

function escapeQuestText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showMustDoError(message) {
  if (!mustDoError) return;
  mustDoError.textContent = message;
  mustDoError.hidden = !message;
}

function updateMustDoUI() {
  const on = questMustDoElement ? questMustDoElement.checked : false;
  if (mustDoContainer) mustDoContainer.hidden = !on;
  if (noTimeBox) {
    // A must-do quest needs a real time window, so it can't be an Anytime quest
    if (on) noTimeBox.checked = false;
    noTimeBox.disabled = on;
    updateTimeInputsLock();
  }
  if (!on) showMustDoError("");
}

// Returns a message if a must-do quest is not complete yet, or "" if it is fine
function getMustDoProblem() {
  if (!questMustDoElement || !questMustDoElement.checked) return "";
  if (!questFirstActionElement.value.trim()) {
    return "Type the small first action (for example: open the zyBook).";
  }
  if (!questStartTimeElement.value || !questEndTimeElement.value) {
    return "A must-do quest needs a start time and an end time.";
  }
  if (questEndTimeElement.value <= questStartTimeElement.value) {
    return "The end time must be after the start time.";
  }
  return "";
}

if (questMustDoElement) {
  questMustDoElement.addEventListener("change", updateMustDoUI);
}

// =====================
// SAVE SYSTEM
// =====================
// Turns seconds into "45s", "25m" or "1h 05m" (used by the Focus Timer)
function formatFocusTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

function saveQuests() {
  const data = JSON.stringify(quests);
  localStorage.setItem(questUser + "_savedQuests", data);
  localStorage.setItem(questUser + "_savedQuests_modifiedAt", Date.now());
  syncPush();
  requestReminderReschedule();
}

function saveSections() {
  localStorage.setItem(questUser + "_questSections", JSON.stringify(sections));
  localStorage.setItem(questUser + "_questSections_modifiedAt", Date.now());
  if (typeof syncPush === "function") {
    syncPush();
  }
}

function saveCategories() {
  categories.sort((a, b) => a.localeCompare(b));
  localStorage.setItem(
    questUser + "_questCategories",
    JSON.stringify(categories),
  );
}

// =====================
// LOAD SYSTEM
// =====================

function loadQuests() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayString = `${year}-${month}-${day}`;

  const saved = localStorage.getItem(questUser + "_savedQuests");

  if (saved) {
    // 1. Parse the saved data
    // 2. Filter out the dead quests
    // 3. Save the cleaned list back to localStorage
    const parsed = JSON.parse(saved);
    const beforeCount = parsed.length;
    quests = parsed.filter((item) => {
      // Use the day it was completed. Old quests without completedOn fall back to the due date.
      const doneOn = item.completedOn || item.dueDate || "";
      return !(item.completed && item.recurring !== "weekly" && item.recurring !== "daily" && item.recurring !== "custom" && !item.adaptive && doneOn < todayString);
    });

    localStorage.setItem(questUser + "_savedQuests", JSON.stringify(quests));
    // Only bump modifiedAt (and sync) when this filter actually removed
    // something — otherwise every routine loadQuests() call would stamp a
    // new modifiedAt on unchanged data and make every other device's pull
    // think local just "won" for no reason.
    if (quests.length !== beforeCount) {
      localStorage.setItem(questUser + "_savedQuests_modifiedAt", Date.now());
      if (typeof syncPush === "function") {
        syncPush();
      }
    }
  } else {
    quests = [];
  }


}

function loadSections() {
  const saved = localStorage.getItem(questUser + "_questSections");

  if (saved) {
    sections = JSON.parse(saved);
  } else {
    sections = [...defaultSections];
    saveSections();
  }
}

function loadCategories() {
  const saved = localStorage.getItem(questUser + "_questCategories");

  if (saved) {
    categories = JSON.parse(saved);
  } else {
    categories = [...defaultCategories];
  }

  categories.sort((a, b) => a.localeCompare(b));
  saveCategories();
}

// =====================
// QUEST DATA MIGRATION
// =====================

function migrateQuests() {
  let anyChanged = false;

  for (const quest of quests) {
    let changed = false;

    if (!quest.section) { quest.section = "General"; changed = true; }
    if (!quest.priority) { quest.priority = "Medium"; changed = true; }
    if (typeof quest.skippedToday !== "boolean") { quest.skippedToday = false; changed = true; }
    if (typeof quest.cancelledToday !== "boolean") { quest.cancelledToday = false; changed = true; }
    if (!quest.createdAt) { quest.createdAt = Date.now(); changed = true; }
    if (!quest.repeatDays) { quest.repeatDays = []; changed = true; }
    if (typeof quest.streakEnabled !== "boolean") { quest.streakEnabled = false; changed = true; }
    if (typeof quest.adaptive !== "boolean") { quest.adaptive = false; changed = true; }
    if (typeof quest.notes !== "string") { quest.notes = ""; changed = true; }
    if (typeof quest.interval !== "number") { quest.interval = 0; changed = true; }
    if (quest.nextReview === undefined) { quest.nextReview = null; changed = true; }
    if (typeof quest.noTime !== "boolean") { quest.noTime = false; changed = true; }
    if (typeof quest.remindInQuiet !== "boolean") { quest.remindInQuiet = false; changed = true; }
    if (typeof quest.repeatEveryDays !== "number") { quest.repeatEveryDays = 0; changed = true; }
    if (quest.nextDue === undefined) { quest.nextDue = null; changed = true; }
    if (quest.ongoingOn === undefined) { quest.ongoingOn = null; changed = true; }
    // Old format was a date text that expired at midnight. New format is a number (the time
    // it was set) that stays until the quest is completed, skipped, cancelled or deleted.
    if (typeof quest.ongoingOn === "string") {
      quest.ongoingOn = quest.ongoingOn === getTodayDateKey() ? Date.now() : null;
      changed = true;
    }
    if (typeof quest.mustDo !== "boolean") { quest.mustDo = false; changed = true; }
    if (typeof quest.firstAction !== "string") { quest.firstAction = ""; changed = true; }


    if (quest.completed === true) {
      if (quest.status !== "completed") { quest.status = "completed"; changed = true; }
      quest.skippedToday = false;
    } else {
      if (quest.status !== "active") { quest.status = "active"; changed = true; }
      quest.completed = false;
    }

    if (changed) anyChanged = true;
  }

  // Only one quest can be ongoing: if there are several, the newest one wins
  const ongoingList = quests.filter((q) => typeof q.ongoingOn === "number");
  if (ongoingList.length > 1) {
    const keep = ongoingList.reduce((a, b) => (b.ongoingOn > a.ongoingOn ? b : a));
    ongoingList.forEach((q) => { if (q !== keep) q.ongoingOn = null; });
    anyChanged = true;
  }

  if (anyChanged) {
    saveQuests();
  }
}

// =====================
// TIME FUNCTIONS
// =====================

function formatTime(time) {
  if (!time) {
    return "No Time";
  }

  let [hours, minutes] = time.split(":");
  hours = Number(hours);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  return `${hours}:${minutes} ${period}`;
}

// =====================
// DATE FUNCTIONS
// =====================

function formatDate(date) {
  if (!date) {
    return "No Date";
  }

  const [year, month, day] = date.split("-");
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =====================
// DUE DATE STATUS
// =====================

function getDueStatus(quest) {
  if (!quest.dueDate) {
    return {
      text: "No Due Date",
      status: "none",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = quest.dueDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);

  const difference = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (difference < 0) {
    return {
      text: "Overdue",
      status: "overdue",
    };
  }

  if (difference === 0) {
    return {
      text: "Due Today",
      status: "today",
    };
  }

  return {
    text: `Due in ${difference} days`,
    status: "upcoming",
  };
}

// =====================
// PRIORITY SYSTEM
// =====================

const priorityOrder = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

if (sortQuestsElement) {
  sortQuestsElement.addEventListener("change", () => {
    currentSort = sortQuestsElement.value;
    renderQuests();
  });
}

// =====================
// SECTION RENDER
// =====================

const manageModal = document.getElementById("manageSectionsModal");
const manageSectionList = document.getElementById("manageSectionList");
const manageCloseBtn = document.getElementById("manageClose");
const newSectionInput = document.getElementById("newSectionInput");
const addSectionBtn = document.getElementById("addSectionBtn");
const bulkSurahBtn = document.getElementById("bulkSurahBtn");

let sectionJustDragged = false;

function renderSections() {
  if (!questSections) return;

  // If the current section was renamed, deleted or moved by sync, fall back safely
  if (!sections.includes(currentSection)) {
    currentSection = sections[0] || "General";
  }

  questSections.innerHTML = "";

  for (const section of sections) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-tab";
    button.textContent = section;
    button.dataset.section = section;

    if (section === currentSection) {
      button.classList.add("active");
    }

    button.onclick = () => {
      if (sectionJustDragged) return;
      currentSection = section;
      renderSections();
      renderQuests();
    };

    enableSectionDrag(button, section);
    questSections.appendChild(button);
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "section-tab section-tool add-section";
  addButton.textContent = "+";
  addButton.title = "Add section";
  addButton.onclick = () => {
    const name = prompt("New section name:");
    if (addSection(name)) {
      renderSections();
    }
  };
  questSections.appendChild(addButton);

  const manageButton = document.createElement("button");
  manageButton.type = "button";
  manageButton.className = "section-tab section-tool";
  manageButton.textContent = "⚙";
  manageButton.title = "Manage sections";
  manageButton.onclick = openManageSections;
  questSections.appendChild(manageButton);
}

// =====================
// DRAG TO REORDER TABS
// Hold a tab for a moment, then drag it left or right.
// =====================

function enableSectionDrag(button, section) {
  let timer = null;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let pointerId = null;
  let dropTarget = null;
  let dropAfter = false;

  const clearMarks = () => {
    questSections
      .querySelectorAll(".drop-before, .drop-after")
      .forEach((el) => el.classList.remove("drop-before", "drop-after"));
  };

  const finish = (commit) => {
    clearTimeout(timer);
    timer = null;
    if (!dragging) return;

    dragging = false;
    button.classList.remove("dragging");
    button.style.transform = "";
    clearMarks();
    try {
      button.releasePointerCapture(pointerId);
    } catch (e) { }

    // Stop the click that follows the drop from switching tabs
    sectionJustDragged = true;
    setTimeout(() => {
      sectionJustDragged = false;
    }, 60);

    if (commit && dropTarget) {
      const targetName = dropTarget.dataset.section;
      const without = sections.filter((s) => s !== section);
      let to = without.indexOf(targetName);
      if (dropAfter) to += 1;
      without.splice(to, 0, section);

      if (without.join("\n") !== sections.join("\n")) {
        sections = without;
        saveSections();
        renderSections();
      }
    }
    dropTarget = null;
  };

  button.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    pointerId = e.pointerId;
    clearTimeout(timer);
    timer = setTimeout(() => {
      dragging = true;
      button.classList.add("dragging");
      try {
        button.setPointerCapture(pointerId);
      } catch (err) { }
      if (navigator.vibrate) navigator.vibrate(15);
    }, e.pointerType === "mouse" ? 200 : 400);
  });

  button.addEventListener("pointermove", (e) => {
    if (!dragging) {
      // Moved before the hold finished: the person is scrolling, not dragging
      if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
        clearTimeout(timer);
        timer = null;
      }
      return;
    }

    e.preventDefault();
    button.style.transform = `translateX(${e.clientX - startX}px)`;

    const tabs = [...questSections.querySelectorAll(".section-tab[data-section]")]
      .filter((t) => t !== button);
    clearMarks();
    dropTarget = null;
    if (tabs.length === 0) return;

    let found = tabs.find((t) => {
      const r = t.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right;
    });

    if (found) {
      const r = found.getBoundingClientRect();
      dropAfter = e.clientX > r.left + r.width / 2;
    } else if (e.clientX < tabs[0].getBoundingClientRect().left) {
      found = tabs[0];
      dropAfter = false;
    } else if (e.clientX > tabs[tabs.length - 1].getBoundingClientRect().right) {
      found = tabs[tabs.length - 1];
      dropAfter = true;
    }

    if (found) {
      dropTarget = found;
      found.classList.add(dropAfter ? "drop-after" : "drop-before");
    }
  });

  button.addEventListener("pointerup", () => finish(true));
  button.addEventListener("pointercancel", () => finish(false));

  // Once dragging has started, stop the phone from scrolling the page/tab row
  button.addEventListener(
    "touchmove",
    (e) => {
      if (dragging) e.preventDefault();
    },
    { passive: false },
  );
  button.addEventListener("contextmenu", (e) => {
    if (dragging || timer) e.preventDefault();
  });
}

// =====================
// MANAGE SECTIONS
// Quests are never deleted here. A deleted section's quests move to "General"
// (or to the first other section if General itself is deleted).
// =====================

function addSection(rawName) {
  const name = (rawName || "").trim();
  if (!name) return false;
  if (sections.some((s) => s.toLowerCase() === name.toLowerCase())) {
    alert(`A section named "${name}" already exists.`);
    return false;
  }
  sections.push(name);
  saveSections();
  return true;
}

function moveSection(name, direction) {
  const i = sections.indexOf(name);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= sections.length) return;
  [sections[i], sections[j]] = [sections[j], sections[i]];
  saveSections();
  renderSections();
  renderManageList();
}

function renameSection(oldName) {
  const input = prompt("Rename section:", oldName);
  if (input === null) return;
  const name = input.trim();
  if (!name || name === oldName) return;
  if (sections.some((s) => s !== oldName && s.toLowerCase() === name.toLowerCase())) {
    alert(`A section named "${name}" already exists.`);
    return;
  }

  sections = sections.map((s) => (s === oldName ? name : s));
  quests.forEach((q) => {
    if (q.section === oldName) q.section = name;
  });
  if (currentSection === oldName) currentSection = name;

  saveQuests();
  saveSections();
  renderSections();
  renderQuests();
  renderManageList();
}

function deleteSection(name) {
  if (sections.length <= 1) {
    alert("You need at least one section.");
    return;
  }

  const target = name !== "General" ? "General" : sections.find((s) => s !== "General");
  const count = quests.filter((q) => q.section === name).length;
  const message = count > 0
    ? `Delete section "${name}"? Its ${count} quest(s) will be moved to "${target}". No quests are deleted.`
    : `Delete section "${name}"? It has no quests.`;
  if (!confirm(message)) return;

  quests.forEach((q) => {
    if (q.section === name) q.section = target;
  });
  sections = sections.filter((s) => s !== name);
  if (!sections.includes(target)) sections.push(target);
  if (currentSection === name) currentSection = target;

  saveQuests();
  saveSections();
  renderSections();
  renderQuests();
  renderManageList();
}

function renderManageList() {
  if (!manageSectionList) return;
  manageSectionList.innerHTML = "";

  sections.forEach((section, index) => {
    const li = document.createElement("li");
    li.className = "manage-row";

    const label = document.createElement("span");
    label.className = "manage-name";
    label.textContent = section;

    const count = document.createElement("span");
    count.className = "manage-count";
    count.textContent = quests.filter((q) => q.section === section).length;
    count.title = "Quests in this section";

    const makeBtn = (text, title, handler, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "manage-btn";
      b.textContent = text;
      b.title = title;
      b.disabled = !!disabled;
      b.onclick = handler;
      return b;
    };

    li.appendChild(label);
    li.appendChild(count);
    li.appendChild(makeBtn("▲", "Move up", () => moveSection(section, -1), index === 0));
    li.appendChild(makeBtn("▼", "Move down", () => moveSection(section, 1), index === sections.length - 1));
    li.appendChild(makeBtn("Rename", "Rename section", () => renameSection(section)));
    const del = makeBtn("Delete", "Delete section", () => deleteSection(section));
    del.classList.add("manage-delete");
    li.appendChild(del);

    manageSectionList.appendChild(li);
  });
}

function openManageSections() {
  if (!manageModal) return;
  renderManageList();
  manageModal.hidden = false;
}

function closeManageSections() {
  if (manageModal) manageModal.hidden = true;
}

if (manageCloseBtn) manageCloseBtn.onclick = closeManageSections;

if (manageModal) {
  manageModal.addEventListener("click", (e) => {
    if (e.target === manageModal) closeManageSections();
  });
}

function submitNewSection() {
  if (!newSectionInput) return;
  if (addSection(newSectionInput.value)) {
    newSectionInput.value = "";
    renderSections();
    renderManageList();
  }
}

if (addSectionBtn) addSectionBtn.onclick = submitNewSection;

if (newSectionInput) {
  newSectionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitNewSection();
  });
}

// =====================
// BULK ADD: JUZ AMMA SURAH REVIEW QUESTS
// One adaptive quest per surah. The first few are ready now,
// the rest unlock a few per day so they don't all arrive at once.
// =====================

const SURAH_REVIEW_LIST = [
  [75, "Al-Qiyamah"], [76, "Al-Insan"], [77, "Al-Mursalat"],
  [78, "An-Naba"], [79, "An-Nazi'at"], [80, "Abasa"], [81, "At-Takwir"],
  [82, "Al-Infitar"], [83, "Al-Mutaffifin"], [84, "Al-Inshiqaq"], [85, "Al-Buruj"],
  [86, "At-Tariq"], [87, "Al-A'la"], [88, "Al-Ghashiyah"], [89, "Al-Fajr"],
  [90, "Al-Balad"], [91, "Ash-Shams"], [92, "Al-Layl"], [93, "Ad-Duha"],
  [94, "Ash-Sharh"], [95, "At-Tin"], [96, "Al-Alaq"], [97, "Al-Qadr"],
  [98, "Al-Bayyinah"], [99, "Az-Zalzalah"], [100, "Al-Adiyat"], [101, "Al-Qari'ah"],
  [102, "At-Takathur"], [103, "Al-Asr"], [104, "Al-Humazah"], [105, "Al-Fil"],
  [106, "Quraysh"], [107, "Al-Ma'un"], [108, "Al-Kawthar"], [109, "Al-Kafirun"],
  [110, "An-Nasr"], [111, "Al-Masad"], [112, "Al-Ikhlas"], [113, "Al-Falaq"],
  [114, "An-Nas"],
];

function normalizeQuestName(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function addSurahReviewQuests() {
  const perDay = 3;
  const existing = quests.map((q) => normalizeQuestName(q.name));

  // Skip surahs that already have a quest (matches the name with or without "Al-", "An-" etc.)
  const toAdd = SURAH_REVIEW_LIST.filter(([num, name]) => {
    const full = normalizeQuestName(name);
    const core = normalizeQuestName(name.replace(/^(al|an|ad|ar|as|ash|at|az|adh)-/i, ""));
    return !existing.some((n) => n.includes(full) || (core.length >= 5 && n.includes(core)));
  });

  if (toAdd.length === 0) {
    alert("All the Surah review quests already exist.");
    return;
  }

  const ok = confirm(
    `Add ${toAdd.length} adaptive Surah review quests?\n\n` +
    `The first ${perDay} are ready now. ${perDay} more unlock each day after that.`,
  );
  if (!ok) return;

  let quranSection = sections.find((s) => s.toLowerCase().includes("quran"));
  if (!quranSection) {
    quranSection = "Quran";
    sections.push(quranSection);
    saveSections();
  }

  const colors = ["#1a73e8", "#e37400", "#e52592", "#137333", "#9334e6", "#d93025", "#00897b", "#f9ab00"];
  const now = Date.now();

  toAdd.forEach(([num, name], i) => {
    const batch = Math.floor(i / perDay);
    const waiting = batch > 0;

    quests.push({
      name: `Review Surah ${num}: ${name}`,
      type: "Faith",
      difficulty: "Easy",
      recurring: "none",
      repeatDays: [],
      startTime: "",
      endTime: "",
      dueDate: "",
      priority: "Medium",
      section: quranSection,
      completed: waiting,
      status: waiting ? "completed" : "active",
      skippedToday: false,
      cancelledToday: false,
      createdAt: now + i, // every quest needs its own unique createdAt
      history: {},
      isPrayer: false,
      prayerType: null,
      color: colors[Math.floor(Math.random() * colors.length)],
      streakEnabled: false,
      adaptive: true,
      notes: "",
      interval: startingGap.Easy,
      nextReview: waiting ? now + batch * 24 * 60 * 60 * 1000 : null,
      noTime: false,
      remindInQuiet: false,
      repeatEveryDays: 0,
      nextDue: null,
    });
  });

  saveQuests();
  scheduleQuestNotification();

  currentSection = quranSection;
  renderSections();
  renderQuests();
  closeManageSections();
}

if (bulkSurahBtn) bulkSurahBtn.onclick = addSurahReviewQuests;

function renderCategories() {
  if (!questCategoryElement) return;

  questCategoryElement.innerHTML = "";

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    questCategoryElement.appendChild(option);
  }
}

if (addCategoryBtn) {
  addCategoryBtn.onclick = () => {
    const name = prompt("New category name:");
    if (!name) return;
    if (categories.includes(name)) {
      alert("Category already exists.");
      return;
    }
    categories.push(name);
    saveCategories();
    renderCategories();
    questCategoryElement.value = name;
  };
}

// =====================
// SEARCH FILTER
// =====================

function questMatchesSearch(quest) {
  if (!searchText) {
    return true;
  }

  const text = `
    ${quest.name}
    ${quest.type}
    ${quest.priority}
    ${quest.difficulty}
    ${quest.recurring}
    ${quest.section}
  `.toLowerCase();

  return text.includes(searchText);
}

// =====================
// MAIN RENDER
// =====================

function renderQuests() {
  if (!questList || !completedQuestList || !notTodayQuestList) {
    return;
  }


  questList.innerHTML = "";
  completedQuestList.innerHTML = "";
  notTodayQuestList.innerHTML = "";

  const sorted = sortQuests([...quests]);

  // Ongoing quests go to the top of the list (stable: the rest keep their order)
  sorted.sort((a, b) => Number(isQuestOngoing(b)) - Number(isQuestOngoing(a)));

  for (const quest of sorted) {
    if (quest.section !== currentSection) {
      continue;
    }

    if (!questMatchesSearch(quest)) {
      continue;
    }

    if (!isQuestScheduledToday(quest)) {
      const li = createQuestElement(quest);
      notTodayQuestList.appendChild(li);
      continue;
    }

    if (quest.adaptive && quest.completed) {
      const li = createQuestElement(quest);
      notTodayQuestList.appendChild(li);
      continue;
    }

    const li = createQuestElement(quest);
    if (quest.completed) {
      completedQuestList.appendChild(li);
    } else {
      questList.appendChild(li);
    }
  }
}

// =====================
// CREATE QUEST CARD
// =====================

function formatTimeLeft(nextReview) {
  const msLeft = nextReview - Date.now();
  if (!(msLeft > 0)) {
    return "Ready now";
  }
  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function createQuestElement(quest) {
  const { completed, cancelledToday } = quest
  const li = document.createElement("li");
  li.className = "quest-card";

  if (completed) {
    li.classList.add("completed");
  }
  if (cancelledToday) {
    li.classList.add("cancelled-today");
  }

  /* Destructuring list */
  const { name, isPrayer, prayerType, priority, startTime, endTime, dueDate, recurring, repeatDays, difficulty, section, type, streakEnabled } = quest
  const title = document.createElement("div");
  title.className = "quest-title";

  const priorityIcons = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
  };

  let nameDisplay = name;
  if (isPrayer && prayerType === "Fajr") {
    nameDisplay = `🌙 ${name}`;
  }

  title.innerHTML = ""

  const titleText = document.createElement("span")
  titleText.textContent =
    `${completed ? "✔️ " : ""}` +
    `${priorityIcons[priority] || "🟡"} ` +
    nameDisplay
  title.appendChild(titleText)

  if ((recurring === "daily" || recurring === "weekly") && streakEnabled) {
    const streakBadge = document.createElement("span")
    streakBadge.className = "quest-streak-badge"
    streakBadge.textContent = `🔥x${getCurrentStreak(quest)}`
    title.appendChild(streakBadge)
  }

  // TIME
  const time = document.createElement("div");
  time.className = "quest-time";

  const hasStartTime = startTime && startTime !== "";
  const hasEndTime = endTime && endTime !== "";
  const hasDueDate = dueDate && dueDate !== "";

  let info = "";

  if (hasStartTime || hasEndTime) {
    if (isPrayer && prayerType === "Fajr") {
      info += `🕌 Fajr: ${formatTime(startTime)} (auto-updated)`;
    } else {
      if (hasStartTime && hasEndTime) {
        info += `🕓 ${formatTime(startTime)} - ${formatTime(endTime)}`;
      } else if (hasStartTime) {
        info += `🕓 ${formatTime(startTime)}`;
      } else if (hasEndTime) {
        info += `🕓 Ends at ${formatTime(endTime)}`;
      }
    }
  }

  if (hasDueDate) {
    if (info) {
      info += "<br>";
    }
    info += `📅 ${formatDate(dueDate)}`;
  }

  if (quest.adaptive) {
    if (info) {
      info += "<br>";
    }
    info += `⏳ <span class="countdown" data-next-review="${quest.nextReview}">${formatTimeLeft(quest.nextReview)}</span>`;
  }

  if (isQuestOngoing(quest)) {
    if (info) info += "<br>";
    info += "🟢 Ongoing";
  }

  if (quest.mustDo) {
    if (info) info += "<br>";
    info += "⚠️ Must do" + (quest.firstAction ? ": " + escapeQuestText(quest.firstAction) : "");
  }

  // Show repeat days if weekly
  if (
    recurring === "weekly" &&
    repeatDays &&
    repeatDays.length > 0
  ) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = repeatDays.map((d) => dayNames[d]).join(", ");
    if (info) info += "<br>";
    info += `🔄 ${days}`;
  }

  if (recurring === "custom") {
    if (info) info += "<br>";
    info += `🔄 Every ${quest.repeatEveryDays || 1} days`;
    if (quest.nextDue && quest.nextDue > getTodayDateKey()) {
      info += ` (next: ${formatDate(quest.nextDue)})`;
    }
  }

  if (!info) {
    info = quest.noTime ? "⚪ Anytime" : "No Time";
  } else if (quest.noTime) {
    info = "⚪ Anytime<br>" + info;
  }

  // Focus Timer: total time spent focusing on this quest
  if (quest.focusSeconds > 0) {
    info += `<br>⏱ ${formatFocusTime(quest.focusSeconds)} focused`;
  }

  time.innerHTML = info;

  // DETAILS
  const details = document.createElement("div");
  details.className = "quest-details hidden";

  const due = getDueStatus(quest);

  details.innerHTML = `
    Priority: ${priority}
    <br>
    Type: ${type}
    <br>
    Difficulty: ${difficulty}
    <br>
    Recurring: ${recurring}
    <br>
    Section: ${section}
    <br>
    Due: ${dueDate ? formatDate(dueDate) : "None"}
    <br>
    Status: ${due.text}
    <br>
    ${quest.noTime ? "⚪ Anytime" : `🕓 ${formatTime(startTime)} - ${formatTime(endTime)}`}
  `;
  if ((recurring === "daily" || recurring === "weekly") && streakEnabled) {
    details.appendChild(createStreakGrid(quest))
  }
  if (quest.notes) {
    const notesBox = document.createElement("div");
    notesBox.className = "quest-notes";

    const notesTitle = document.createElement("div");
    notesTitle.className = "quest-notes-title";
    notesTitle.textContent = "Notes";

    const notesText = document.createElement("div");
    notesText.className = "quest-notes-text";
    notesText.textContent = quest.notes;

    notesBox.appendChild(notesTitle);
    notesBox.appendChild(notesText);
    details.appendChild(notesBox);
  }
  // BUTTON AREA
  const buttons = document.createElement("div");
  buttons.className = "quest-buttons";

  const toggle = document.createElement("button");
  toggle.textContent = "▼";
  const toggleDetails = () => {
    details.classList.toggle("hidden");
    toggle.textContent = details.classList.contains("hidden") ? "▼" : "▲";
  }
  li.onclick = toggleDetails;

  toggle.onclick = (e) => {
    e.stopPropagation();
    toggleDetails();
  };

  const edit = document.createElement("button");
  edit.textContent = "Edit";
  edit.onclick = (e) => {
    e.stopPropagation();
    startEditingQuest(quest);
  };

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.onclick = (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${quest.name}"? This can't be undone.`)) return;
    quests = quests.filter((q) => q !== quest);
    saveQuests();
    renderQuests();
  };

  buttons.appendChild(edit);
  buttons.appendChild(del);

  if (!completed) {
    const complete = document.createElement("button");
    complete.textContent = "Complete";
    complete.onclick = (e) => {
      e.stopPropagation();
      completeQuest(quest);
    };
    buttons.appendChild(complete);
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.className = "cancel-btn";
    cancel.onclick = (e) => {
      e.stopPropagation();
      cancelQuest(quest);
    };
    buttons.appendChild(cancel);
  }

  buttons.appendChild(toggle);

  li.appendChild(time);
  li.appendChild(title);
  if ((recurring === "daily" || recurring === "weekly") && streakEnabled) {
    li.appendChild(createStreakGrid(quest))
  }
  li.appendChild(buttons);
  li.appendChild(details);


  return li;
}
function createStreakGrid(quest) {
  const container = document.createElement("div")
  container.className = "quest-streak"

  for (let i = 6; i >= 0; i--) {
    const dateKey = getDaysAgoString(i)
    const completed = quest.history && quest.history[dateKey] === true
    const dot = document.createElement("span")
    dot.className = completed ? "streak-dot completed" : "streak-dot"
    container.appendChild(dot)
  }

  return container
}
function getCurrentStreak(quest) {
  if (!quest.history) return 0
  let streak = 0
  let i = quest.history[getDaysAgoString(0)] === true ? 0 : 1
  while (quest.history[getDaysAgoString(i)] === true) {
    streak++
    i++
  }
  return streak
}

// =====================
// CREATE QUEST OBJECT
// =====================

function createQuestObject() {
  // Get selected repeat days
  const selectedDays = [];
  document.querySelectorAll(".repeat-day:checked").forEach((cb) => {
    selectedDays.push(parseInt(cb.value));
  });

  const isEditing = editingQuest !== null;

  // Generate a random color or use existing
  const defaultColors = [
    "#1a73e8",
    "#e37400",
    "#e52592",
    "#137333",
    "#9334e6",
    "#d93025",
    "#00897b",
    "#f9ab00",
  ];
  const randomColor =
    defaultColors[Math.floor(Math.random() * defaultColors.length)];

  return {
    name: questInput.value.trim(),
    type: questCategoryElement.value,
    difficulty: questDifficultyElement.value,
    recurring: questRecurringElement.value,
    repeatDays: selectedDays,
    startTime: noTimeBox && noTimeBox.checked ? "" : questStartTimeElement.value,
    endTime: noTimeBox && noTimeBox.checked ? "" : questEndTimeElement.value,
    dueDate: questDueDateElement.value,
    priority: questPriority.value,
    section: currentSection,
    completed: isEditing ? editingQuest.completed : false,
    status: isEditing ? editingQuest.status : "active",
    skippedToday: isEditing ? editingQuest.skippedToday : false,
    cancelledToday: isEditing ? editingQuest.cancelledToday : false,
    createdAt: isEditing ? editingQuest.createdAt : Date.now(),
    history: isEditing ? editingQuest.history : {},
    isPrayer: isEditing ? editingQuest.isPrayer : false,
    prayerType: isEditing ? editingQuest.prayerType : null,
    color: isEditing ? editingQuest.color : randomColor,
    streakEnabled: questStreakEnabledElement ? questStreakEnabledElement.checked : false,
    adaptive: questAdaptiveElement ? questAdaptiveElement.checked : false,
    notes: questNotesElement ? questNotesElement.value.trim() : "",
    interval: isEditing ? editingQuest.interval : 0,
    nextReview: isEditing ? editingQuest.nextReview : null,
    noTime: noTimeBox ? noTimeBox.checked : false,
    remindInQuiet: questRemindInQuietElement
      ? questRemindInQuietElement.checked
      : (isEditing ? !!editingQuest.remindInQuiet : false),
    repeatEveryDays: questRepeatEveryElement
      ? Math.max(1, Math.floor(Number(questRepeatEveryElement.value)) || 1)
      : (isEditing ? (editingQuest.repeatEveryDays || 0) : 0),
    nextDue: isEditing ? (editingQuest.nextDue || null) : null,
    ongoingOn: isEditing ? (editingQuest.ongoingOn || null) : null,
    mustDo: questMustDoElement ? questMustDoElement.checked : false,
    firstAction: questMustDoElement && questMustDoElement.checked && questFirstActionElement
      ? questFirstActionElement.value.trim()
      : "",
  };
}

// =====================
// RESET FORM
// =====================

function resetQuestForm() {
  questInput.value = "";
  questNotesElement.value = "";
  questStartTimeElement.value = "";
  questEndTimeElement.value = "";
  questDueDateElement.value = "";
  noTimeBox.checked = false;
  updateTimeInputsLock();

  // Clear repeat day checkboxes
  document
    .querySelectorAll(".repeat-day")
    .forEach((cb) => (cb.checked = false));

  if (daySelectorContainer) {
    daySelectorContainer.style.display = "none";
  }
  if (questCategoryElement)
    questCategoryElement.value = questCategoryElement.options[0].value;
  if (questDifficultyElement)
    questDifficultyElement.value = questDifficultyElement.options[0].value;
  if (questRecurringElement)
    questRecurringElement.value = questRecurringElement.options[0].value;
  if (questPriority) questPriority.value = "Medium";
  editingQuest = null;
  if (addQuestBtn) {
    addQuestBtn.textContent = "Finish";
  }
  if (questStreakEnabledElement) questStreakEnabledElement.checked = false;
  if (questAdaptiveElement) questAdaptiveElement.checked = false;
  if (questRemindInQuietElement) questRemindInQuietElement.checked = false;
  if (questMustDoElement) questMustDoElement.checked = false;
  if (questFirstActionElement) questFirstActionElement.value = "";
  updateMustDoUI();
  if (questRepeatEveryElement) questRepeatEveryElement.value = 3;
  if (customIntervalContainer) customIntervalContainer.style.display = "none";
}

// =====================
// START EDIT
// =====================

function startEditingQuest(quest) {
  editingQuest = quest;

  questInput.value = quest.name;
  questNotesElement.value = quest.notes || "";
  questCategoryElement.value = quest.type;
  questDifficultyElement.value = quest.difficulty;
  questRecurringElement.value = quest.recurring;
  noTimeBox.checked = quest.noTime || false;

  // Load repeat days if they exist
  document.querySelectorAll(".repeat-day").forEach((cb) => {
    cb.checked = quest.repeatDays
      ? quest.repeatDays.includes(parseInt(cb.value))
      : false;
  });

  // Show day selector if weekly
  if (daySelectorContainer) {
    daySelectorContainer.style.display =
      quest.recurring === "weekly" ? "block" : "none";
  }

  questStartTimeElement.value = quest.startTime || "";
  questEndTimeElement.value = quest.endTime || "";
  updateTimeInputsLock();
  questDueDateElement.value = quest.dueDate || "";
  questPriority.value = quest.priority;
  currentSection = quest.section;

  addQuestBtn.textContent = "Save Quest";
  if (questCreator) {
    questCreator.hidden = false;
  }
  if (questStreakEnabledElement) questStreakEnabledElement.checked = !!quest.streakEnabled;
  if (questAdaptiveElement) questAdaptiveElement.checked = !!quest.adaptive;
  if (questRemindInQuietElement) questRemindInQuietElement.checked = !!quest.remindInQuiet;
  if (questMustDoElement) questMustDoElement.checked = !!quest.mustDo;
  if (questFirstActionElement) questFirstActionElement.value = quest.firstAction || "";
  updateMustDoUI();
  if (questRepeatEveryElement) questRepeatEveryElement.value = quest.repeatEveryDays || 3;
  if (customIntervalContainer) {
    customIntervalContainer.style.display = quest.recurring === "custom" ? "block" : "none";
  }
}

// =====================
// SAVE QUEST
// =====================

if (addQuestBtn) {
  addQuestBtn.onclick = () => {
    if (!questInput.value.trim()) {
      return;
    }

    const mustDoProblem = getMustDoProblem();
    if (mustDoProblem) {
      showMustDoError(mustDoProblem);
      currentStep = 3;
      showStep(currentStep);
      return;
    }

    const newQuest = createQuestObject();

    if (editingQuest) {
      // Preserve completed and status when editing
      newQuest.completed = editingQuest.completed;
      newQuest.status = editingQuest.status;
      newQuest.history = editingQuest.history || {};
      newQuest.skippedToday = editingQuest.skippedToday || false;

      // Now merge everything
      Object.assign(editingQuest, newQuest);
    } else {
      if (newQuest.adaptive) {
        newQuest.interval = startingGap[newQuest.difficulty];
      }
      quests.push(newQuest);
    }

    saveQuests();
    resetQuestForm();
    renderQuests();
    closeWizard();
  };
}

// =====================
// COMPLETE QUEST
// =====================

function completeQuest(quest) {
  if (!quest || quest.status === "completed") return;

  if (quest.adaptive) {
    const answer = prompt("How was it? 1 = Easy, 2 = Okay, 3 = Struggled");
    if (!ratingMultiplier[answer]) return;
    if (ratingMultiplier[answer]) {
      quest.interval = Math.max(1, quest.interval * ratingMultiplier[answer]);
    }
    quest.nextReview = Date.now() + quest.interval * 60 * 1000;
  }


  quest.status = "completed";
  quest.completed = true;
  quest.completedOn = getTodayString();
  quest.ongoingOn = null;

  if (quest.recurring === "custom") {
    // "Every X days" counts from the day it was completed
    const gap = Math.max(1, Number(quest.repeatEveryDays) || 1);
    const next = new Date();
    next.setDate(next.getDate() + gap);
    quest.nextDue = getDateString(next);
  }

  if (quest.recurring === "daily" || quest.recurring === "weekly") {
    const today = getTodayString();
    if (!quest.history) quest.history = {};
    quest.history[today] = true;
  }

  giveQuestXP(quest);
  saveQuests();
  scheduleQuestNotification();
  renderQuests();

  if (typeof updateDashboard === "function") {
    updateDashboard();
  }
}

function restoreQuest(quest) {
  if (!quest || quest.status !== "skipped") {
    return;
  }

  quest.status = "active";
  quest.completed = false;

  saveQuests();
  renderQuests();

  if (typeof updateDashboard === "function") {
    updateDashboard();
  }
}

function skipQuest(quest) {
  if (!quest || quest.status === "completed") {
    return;
  }

  quest.status = "active";
  quest.completed = false;
  quest.skippedToday = true;
  quest.skippedAt = Date.now();
  quest.ongoingOn = null;

  // Reminders: remember this skip for today only, then re-plan them
  const reminderSkips = readReminderMap("_reminderSkips");
  reminderSkips[quest.createdAt] = getTodayDateKey();
  writeReminderMap("_reminderSkips", reminderSkips);
  rescheduleQuestReminders();

  if (typeof renderQuests === "function") {
    renderQuests();
  }

  if (typeof updateDashboard === "function") {
    updateDashboard();
  }

  window.dispatchEvent(new CustomEvent("questStateChanged"));
}

function cancelQuest(quest) {
  if (!quest || quest.completed) return;

  quest.cancelledToday = true;
  quest.ongoingOn = null;
  saveQuests();
  renderQuests();

  if (typeof updateDashboard === "function") {
    updateDashboard();
  }
}

// =====================
// ONGOING ("I'm doing this right now")
// Only ONE quest can be ongoing at a time. It stays ongoing (even past midnight) until
// the quest is completed, skipped, cancelled or deleted, or he taps the button again.
// While it is ongoing it sends no reminders. ongoingOn holds the time it was set.
// =====================

function isQuestOngoing(quest) {
  return !!quest && typeof quest.ongoingOn === "number" && !quest.completed;
}

// Makes this quest the ongoing one and clears any other
function setQuestOngoing(quest) {
  if (!quest) return;
  for (const other of quests) {
    if (other !== quest) other.ongoingOn = null;
  }
  quest.ongoingOn = Date.now();
}

function toggleQuestOngoing(quest) {
  if (!quest || quest.completed) return;
  if (isQuestOngoing(quest)) {
    quest.ongoingOn = null;
  } else {
    setQuestOngoing(quest);
  }
  saveQuests(); // also re-plans the reminders (an ongoing quest gets none today)
  renderQuests();
  window.dispatchEvent(new CustomEvent("questStateChanged"));
}

function reviveDueQuests() {
  let changed = false;
  for (const quest of quests) {
    if (quest.adaptive && quest.completed && quest.nextReview <= Date.now()) {
      quest.completed = false;
      quest.status = "active";
      changed = true;
    }
  }
  if (changed) {
    saveQuests();
    renderQuests();
  }
}
// =====================
// XP REWARD SYSTEM
// =====================

function giveQuestXP(quest) {
  const rewards = {
    Easy: 10,
    Medium: 25,
    Hard: 50,
    Extreme: 100,
  };

  const reward = rewards[quest.difficulty] || 10;

  if (typeof addXP === "function") {
    addXP(reward);
  }

  const skill =
    typeof findSkillByName === "function"
      ? findSkillByName(skillTree, quest.type)
      : null;

  if (skill && typeof addSkillXP === "function") {
    addSkillXP(skill, reward);
  }
}

// =====================
// NEW QUEST BUTTON
// =====================

if (newQuestBtn && questCreator) {
  newQuestBtn.onclick = () => {
    questCreator.hidden = false;
    newQuestBtn.hidden = true;
  };
}

// =====================
// SEARCH
// =====================

if (questSearch) {
  questSearch.addEventListener("input", () => {
    searchText = questSearch.value.toLowerCase();
    renderQuests();
  });
}

// =====================================================
// DAILY RESET - Fix for recurring quests
// =====================================================

function runDailyReset() {
  const today = getTodayDateKey();
  const lastReset = localStorage.getItem(questUser + "_lastResetDate");

  // If already reset today, skip
  if (lastReset === today) {
    console.log("✅ Already reset today");
    return;
  }

  console.log("🔄 Running daily reset...");

  // Load fresh quests
  const saved = localStorage.getItem(questUser + "_savedQuests");
  if (!saved) {
    localStorage.setItem(questUser + "_lastResetDate", today);
    return;
  }

  const savedList = JSON.parse(saved);
  let changed = false;

  savedList.forEach((quest) => {
    const completedToday = quest.history && quest.history[today] === true;
    // === DAILY QUESTS ===
    if (quest.recurring === "daily" && !quest.adaptive) {
      // If it was completed yesterday, uncomplete it for today
      if (quest.completed === true && !completedToday) {
        quest.completed = false;
        quest.status = "active";
        changed = true;
        console.log(`🔄 Reset daily quest: ${quest.name}`);
      }
    }

    // === WEEKLY QUESTS ===
    if (quest.recurring === "weekly" && !quest.adaptive) {
      // Check if a week has passed since last reset
      const lastResetDate = parseDateKey(lastReset || today);
      const todayDate = parseDateKey(today);
      const daysDiff = Math.floor(
        (todayDate - lastResetDate) / (1000 * 60 * 60 * 24),
      );

      // Reset if 7+ days have passed or if it's a new week (Monday)
      if (daysDiff >= 7 || todayDate.getDay() === 1) {
        if (quest.completed === true && !completedToday) {
          quest.completed = false;
          quest.status = "active";
          changed = true;
          console.log(`🔄 Reset weekly quest: ${quest.name}`);
        }
      }

      // ALSO check if today is NOT in repeatDays, reset if completed
      if (quest.repeatDays && quest.repeatDays.length > 0 && !completedToday) {
        const dayOfWeek = todayDate.getDay();
        if (!quest.repeatDays.includes(dayOfWeek) && quest.completed === true) {
          // It's not a day this quest runs on, but it's completed - reset it
          quest.completed = false;
          quest.status = "active";
          changed = true;
          console.log(
            `🔄 Reset quest (not on today's schedule): ${quest.name}`,
          );
        }
      }
    }

    // === CUSTOM "EVERY X DAYS" QUESTS ===
    if (quest.recurring === "custom" && !quest.adaptive) {
      if (quest.completed === true && quest.nextDue && quest.nextDue <= today) {
        quest.completed = false;
        quest.status = "active";
        changed = true;
        console.log(`🔄 Custom quest due again: ${quest.name}`);
      }
    }

    // === CANCELLED TODAY RESET (applies to every quest) ===
    if (quest.cancelledToday === true) {
      quest.cancelledToday = false;
      changed = true;
      console.log(`🔄 Reset cancelledToday: ${quest.name}`);
    }
  });

  if (changed) {
    localStorage.setItem(questUser + "_savedQuests", JSON.stringify(savedList));
    localStorage.setItem(questUser + "_savedQuests_modifiedAt", Date.now());
    console.log("✅ Quests reset for new day");
  }

  // Save today as the last reset date
  localStorage.setItem(questUser + "_lastResetDate", today);
  localStorage.setItem(questUser + "_lastResetDate_modifiedAt", Date.now());
  if (typeof syncPush === "function") {
    syncPush();
  }

  // Reload quests in memory
  loadQuests();
  renderQuests();

  // Update dashboard if it exists
  if (typeof updateDashboard === "function") {
    updateDashboard();
  }
}

// =====================
// QUEST ORDER SYSTEM
// =====================

function updateQuestOrder() {
  const active = quests.filter((q) => !q.completed);
  let changed = false;
  active.forEach((quest, index) => {
    if (quest.order !== index + 1) {
      quest.order = index + 1;
      changed = true;
    }
  });
  if (changed) {
    saveQuests();
  }
}

// =====================
// MOVE QUEST
// =====================

function moveQuest(quest, direction) {
  const sectionQuests = quests.filter((q) => q.section === quest.section);
  const index = sectionQuests.indexOf(quest);
  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= sectionQuests.length) {
    return;
  }

  const other = sectionQuests[newIndex];
  const temp = quest.order;
  quest.order = other.order;
  other.order = temp;

  saveQuests();
  renderQuests();
}

// =====================
// IMPROVED SORT OVERRIDE
// =====================

function sortQuests(list) {
  const difficultyOrder = { Extreme: 4, Hard: 3, Medium: 2, Easy: 1 };

  // Dates and times combined into one number for the Due Date sort
  const dueValue = (q) =>
    new Date((q.dueDate || "9999-12-31") + "T" + (q.startTime || "23:59")).getTime();

  const byPriority = (a, b) =>
    (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);

  if (currentSort === "date") {
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      if (dueValue(a) !== dueValue(b)) {
        return dueValue(a) - dueValue(b);
      }
      return byPriority(a, b);
    });
  }

  if (currentSort === "priority") {
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      return byPriority(a, b);
    });
  }

  if (currentSort === "category") {
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      const byType = String(a.type || "").localeCompare(String(b.type || ""));
      if (byType !== 0) return byType;
      return byPriority(a, b);
    });
  }

  if (currentSort === "difficulty") {
    // Hardest first
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      const diff = (difficultyOrder[b.difficulty] || 0) - (difficultyOrder[a.difficulty] || 0);
      if (diff !== 0) return diff;
      return byPriority(a, b);
    });
  }

  if (currentSort === "name") {
    return list.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  if (currentSort === "created") {
    // Newest first
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  if (currentSort === "adaptive") {
    // Adaptive quests first, soonest next review at the top. Ready now = top.
    return list.sort((a, b) => {
      if (a.adaptive !== b.adaptive) {
        return a.adaptive ? -1 : 1;
      }
      if (a.adaptive && b.adaptive) {
        const reviewA = a.nextReview || 0;
        const reviewB = b.nextReview || 0;
        if (reviewA !== reviewB) return reviewA - reviewB;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Default sort
  return list.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    if (a.section !== b.section) {
      return sections.indexOf(a.section) - sections.indexOf(b.section);
    }

    if (a.order && b.order && a.order !== b.order) {
      return a.order - b.order;
    }

    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

function sortMissionQuests(list) {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    if ((priorityOrder[b.priority] || 0) !== (priorityOrder[a.priority] || 0)) {
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    }

    return (a.order || 999) - (b.order || 999);
  });
}

// =====================
// QUEST SYSTEM — PART 5
// DASHBOARD INTEGRATION
// =====================

// =====================
// GET ACTIVE QUESTS
// =====================

function getActiveQuests() {
  return quests.filter((quest) => !quest.completed);
}

// =====================
// TODAY'S QUESTS
// =====================

function getTodaysQuests() {
  return quests.filter((quest) => isQuestScheduledToday(quest));
}

function isQuestScheduledToday(quest) {
  if (quest.recurring === "daily") {
    return true;
  }
  if (quest.recurring === "custom") {
    const todayKey = getTodayDateKey();
    // Completed today: still show it in today's completed list
    if (quest.completed && quest.completedOn === todayKey) return true;
    return !quest.nextDue || quest.nextDue <= todayKey;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  if (quest.recurring === "weekly") {
    // Check if today is in repeatDays
    if (quest.repeatDays && quest.repeatDays.length > 0) {
      return quest.repeatDays.includes(dayOfWeek);
    }
    // Fallback: use dueDate
    if (quest.dueDate) {
      const qDay = parseDateKey(quest.dueDate).getDay();
      return dayOfWeek === qDay;
    }
    return true;
  }

  if (quest.dueDate) {
    const [year, month, day] = quest.dueDate.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();

  }
  return true;
}

function getCurrentQuest(offset = 0) {
  const todayQuests = getTodaysQuests();

  // The Ongoing quest is always the current quest (first in line)
  const ongoing = quests.find((quest) => isQuestOngoing(quest) && !quest.cancelledToday) || null;

  if (todayQuests.length === 0) {
    return ongoing;
  }

  function getStartMinutes(quest) {
    if (!quest.startTime) return 0;
    const [hours, minutes] = quest.startTime.split(":").map(Number);
    return hours * 60 + minutes;
  }

  const eligible = todayQuests.filter((quest) => {
    if (quest.completed) return false;
    if (quest.cancelledToday) return false;
    if (quest.noTime) return false;
    const timeState = getQuestTimeState(quest);
    return timeState === "active" || timeState === "overdue";
  });


  if (ongoing) {
    const at = eligible.indexOf(ongoing);
    if (at !== -1) eligible.splice(at, 1);
  }

  if (eligible.length === 0 && !ongoing) {
    return null;
  }

  eligible.sort((a, b) => {
    const timeDifference = getStartMinutes(a) - getStartMinutes(b);
    if (timeDifference !== 0) return timeDifference;

    const priorityDifference =
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDifference !== 0) return priorityDifference;

    return (a.order || 0) - (b.order || 0);
  });

  const ordered = ongoing ? [ongoing, ...eligible] : eligible;
  return ordered[offset % ordered.length] || null;
}

function getBacklogQuests() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return quests.filter((quest) => {
    if (quest.completed) return false;
    if (!quest.dueDate) return false;

    const [year, month, day] = quest.dueDate.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    return due < today;
  });
}

function getUpcomingQuests() {
  const todayQuests = getTodaysQuests();
  const upcoming = todayQuests.filter((quest) => {
    if (quest.completed) return false;
    return getQuestTimeState(quest) === "upcoming";
  });

  upcoming.sort((a, b) => {
    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) return timeA.localeCompare(timeB);

    const priorityDifference =
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDifference !== 0) return priorityDifference;

    return (a.order || 0) - (b.order || 0);
  });

  return upcoming;
}

// =====================
// CURRENT MISSION
// =====================

function getCurrentMission() {
  return getCurrentQuest();
}

// =====================
// TODAY PROGRESS
// =====================

function getTodayProgress() {
  const today = getTodaysQuests();
  const completed = today.filter((q) => q.completed).length;

  return {
    total: today.length,
    completed,
    percentage:
      today.length === 0 ? 0 : Math.round((completed / today.length) * 100),
  };
}

function getHighestPriorityToday() {
  const today = getTodaysQuests();
  if (today.length === 0) return null;

  return [...today].sort((a, b) => {
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  })[0];
}

// =====================
// QUEST MAKING SYSTEM
// =====================

function showStep(stepNumber) {
  wizardSteps.forEach((step) => {
    step.hidden = Number(step.dataset.step) != stepNumber
  })
  if (stepNumber === 5) {
    updateReviewSummary()
  }
}

function closeWizard() {
  questCreator.hidden = true;
  newQuestBtn.hidden = false
  currentStep = 1
  showStep(currentStep)
}
showStep(currentStep)

if (wizardBack && wizardNext && wizardCancel) {
  wizardBack.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep = currentStep - 1
      showStep(currentStep)
    }
  })
  wizardNext.addEventListener("click", () => {
    if (currentStep === 3) {
      const problem = getMustDoProblem();
      if (problem) {
        showMustDoError(problem);
        return;
      }
      showMustDoError("");
    }
    if (currentStep < 5) {
      currentStep = currentStep + 1
      showStep(currentStep)
    }
  })

  wizardCancel.addEventListener("click", () => {
    resetQuestForm()
    closeWizard()
  })
}

function updateReviewSummary() {
  reviewSummary.innerHTML = `Name: ${questInput.value}
  <br>Category: ${questCategoryElement.value} Difficulty: ${questDifficultyElement.value} Priority: ${questPriority.value}
  <br>${noTimeBox && noTimeBox.checked ? "Anytime (no set time)" : `Start Time: ${formatTime(questStartTimeElement.value)} End Time: ${formatTime(questEndTimeElement.value)}`}  Due Date: ${formatDate(questDueDateElement.value)} 
  <br>Recurring: ${questRecurringElement.value === "custom" ? "every " + (questRepeatEveryElement ? questRepeatEveryElement.value : "?") + " days" : questRecurringElement.value} Streak: ${questStreakEnabledElement.checked ? "yes" : "No"}${questMustDoElement && questMustDoElement.checked ? "<br>⚠️ Must do. First action: " + escapeQuestText(questFirstActionElement.value.trim()) : ""}`
}


// =====================
// AI READY DATA HELPERS
// =====================

function getQuestData() {
  return quests.map((quest) => {
    return {
      id: quest.createdAt,
      name: quest.name,
      type: quest.type,
      difficulty: quest.difficulty,
      priority: quest.priority,
      section: quest.section,
      recurring: quest.recurring,
      repeatDays: quest.repeatDays || [],
      completed: quest.completed,
      dueDate: quest.dueDate,
      startTime: quest.startTime,
      endTime: quest.endTime,
    };
  });
}

function getQuestsByType(type) {
  return quests.filter((quest) => quest.type === type);
}

function getQuestsBySection(section) {
  return quests.filter((quest) => quest.section === section);
}

// =====================
// QUEST EXPORT SYSTEM
// =====================

function exportQuestData() {
  return JSON.stringify({ quests, sections }, null, 2);
}

// =====================
// DEBUG TOOLS
// =====================

function questDebug() {
  console.log("QUEST DATA");
  console.table(quests);
  console.log("SECTIONS");
  console.log(sections);
  console.log("STATS");
  console.log(getQuestStats());
}

// =====================================================
// 
// =====================================================

function getEarliestQuestReview() {
  let earliest = null
  quests.forEach((quest) => {
    if (quest.adaptive && quest.nextReview > Date.now() && (earliest === null || quest.nextReview < earliest)) {
      earliest = quest.nextReview
    }
  })
  return earliest
}

async function scheduleQuestNotification() {
  const earliest = getEarliestQuestReview()
  if (!LocalNotifications || !LocalNotifications.cancel) {
    return
  }
  if (earliest === null) {
    return
  }


  await LocalNotifications.cancel({ notifications: [{ id: 2 }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Quest",
        body: "An adaptive quest is ready!",
        id: 2,
        schedule: { at: new Date(earliest) }
      }
    ]
  });
}

// =====================================================
// QUEST REMINDERS
// Start reminder, re-sends if not done, action buttons, snooze, quiet hours
// IDs: 1 = Codex, 2 = adaptive quest ready, 90001 = Focus Timer,
//      90100-90199 = Anytime summaries, 100000+ = quest reminders
// =====================================================

const REMINDER_ID_BASE = 100000;
const SUMMARY_ID_BASE = 90100; // Anytime summaries: base + dayOffset * 10 + which one (0, 1, 2)
const DEFAULT_ANYTIME_TIMES = ["12:00", "17:00", "21:00"];
const REMINDER_ACTION_TYPE = "QUEST_ACTIONS";
const REMINDER_DAYS_AHEAD = 1; // today + tomorrow
const REMINDER_SLOT_TEXT = {
  0: "Time to start this quest.",
  1: "Still not done. Want to start it now?",
  2: "Last reminder: this quest is still not done.",
  3: "Snooze is over. Time to start.",
};

const defaultNotifSettings = {
  enabled: true,
  resendEnabled: true,
  resendFirstMinutes: 15,
  resendSecondMinutes: 30,
  snoozeMinutes: 10,
  quietEnabled: true,
  quietStart: "23:00",
  quietEnd: "07:00",
  anytimeEnabled: true,
  anytimeTimes: ["12:00", "17:00", "21:00"],
};

let reminderListenerAdded = false;
let reminderBusy = false;
let reminderQueued = false;
let reminderTimer = null;

function getNotifSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(questUser + "_notifSettings"));
    return { ...defaultNotifSettings, ...(saved || {}) };
  } catch (e) {
    return { ...defaultNotifSettings };
  }
}

function readReminderMap(suffix) {
  try {
    return JSON.parse(localStorage.getItem(questUser + suffix)) || {};
  } catch (e) {
    return {};
  }
}

function writeReminderMap(suffix, map) {
  localStorage.setItem(questUser + suffix, JSON.stringify(map));
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function isInQuietHours(date, settings) {
  if (!settings.quietEnabled) return false;
  const mins = date.getHours() * 60 + date.getMinutes();
  const start = timeToMinutes(settings.quietStart);
  const end = timeToMinutes(settings.quietEnd);
  if (start === end) return false;
  if (start < end) return mins >= start && mins < end;
  return mins >= start || mins < end; // wraps past midnight
}

// Each quest gets its own block of notification IDs: 4 slots per day
// slot 0 = start, 1 = first re-send, 2 = second re-send, 3 = snooze
function getReminderId(quest, dayOffset, slot) {
  const seed = Math.abs(Number(quest.createdAt) || 0) % 50000;
  return REMINDER_ID_BASE + seed * 40 + dayOffset * 4 + slot;
}

function questRunsOnDate(quest, date, dayOffset) {
  if (quest.recurring === "daily") return true;

  if (quest.recurring === "custom") {
    return !quest.nextDue || quest.nextDue <= getDateString(date);
  }

  if (quest.recurring === "weekly") {
    if (quest.repeatDays && quest.repeatDays.length > 0) {
      return quest.repeatDays.includes(date.getDay());
    }
    if (quest.dueDate) {
      return parseDateKey(quest.dueDate).getDay() === date.getDay();
    }
    return true;
  }

  // One-time quest: on its due date, or today if it has no due date
  if (quest.dueDate) return quest.dueDate === getDateString(date);
  return dayOffset === 0;
}

function buildQuestReminders(now, settings) {
  const todayKey = getTodayDateKey();
  const skips = readReminderMap("_reminderSkips");
  const snoozes = readReminderMap("_reminderSnoozes");

  // Forget old skips and finished snoozes
  Object.keys(skips).forEach((id) => {
    if (skips[id] !== todayKey) delete skips[id];
  });
  Object.keys(snoozes).forEach((id) => {
    if (snoozes[id] <= now.getTime()) delete snoozes[id];
  });
  writeReminderMap("_reminderSkips", skips);
  writeReminderMap("_reminderSnoozes", snoozes);

  const list = [];

  for (const quest of quests) {
    if (quest.adaptive || quest.isPrayer || quest.noTime || !quest.startTime) continue;

    if (isQuestOngoing(quest)) continue; // ongoing: he is doing it right now, no reminders

    for (let dayOffset = 0; dayOffset <= REMINDER_DAYS_AHEAD; dayOffset++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      if (!questRunsOnDate(quest, date, dayOffset)) continue;

      if (dayOffset === 0) {
        if (quest.completed || quest.cancelledToday) continue;
        if (skips[quest.createdAt] === todayKey) continue;
      } else {
        // Tomorrow: daily/weekly quests reset overnight, one-time quests don't
        const repeats = quest.recurring === "daily" || quest.recurring === "weekly" || quest.recurring === "custom";
        if (!repeats && quest.completed) continue;
      }

      const makeNotification = (slot, at) => ({
        id: getReminderId(quest, dayOffset, slot),
        title: quest.name,
        body: REMINDER_SLOT_TEXT[slot],
        schedule: { at, allowWhileIdle: true },
        actionTypeId: REMINDER_ACTION_TYPE,
        extra: { questId: quest.createdAt },
      });

      // Snoozed today: only the snooze reminder, nothing else
      if (dayOffset === 0 && snoozes[quest.createdAt]) {
        // A snooze is something you asked for, so quiet hours don't block it
        list.push(makeNotification(3, new Date(snoozes[quest.createdAt])));
        continue;
      }

      const [hh, mm] = quest.startTime.split(":").map(Number);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0);
      const slots = [{ slot: 0, at: start }];

      if (settings.resendEnabled) {
        const first = new Date(start.getTime() + settings.resendFirstMinutes * 60000);
        const second = new Date(first.getTime() + settings.resendSecondMinutes * 60000);
        slots.push({ slot: 1, at: first }, { slot: 2, at: second });
      }

      for (const s of slots) {
        // Quiet hours: the start reminder always fires on time.
        // Re-sends are muted during quiet hours, unless the quest is marked
        // "remind me even during quiet hours".
        if (s.slot !== 0 && !quest.remindInQuiet && isInQuietHours(s.at, settings)) continue;
        if (s.at.getTime() <= now.getTime() + 5000) continue;
        list.push(makeNotification(s.slot, s.at));
      }
    }
  }

  return list;
}

// =====================================================
// ANYTIME SUMMARY
// A reminder with the Anytime quests that are still open. It is only planned when
// there is at least one (Android cannot check at the moment the notification is
// due, so this is re-planned every time a quest changes or the app opens).
// =====================================================

function isSummaryId(id) {
  return Number(id) >= SUMMARY_ID_BASE && Number(id) < SUMMARY_ID_BASE + 100;
}

function getAnytimeTimes(settings) {
  const times = settings.anytimeTimes;
  const valid =
    Array.isArray(times) &&
    times.length === 3 &&
    times.every((t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t));
  return valid ? times : DEFAULT_ANYTIME_TIMES;
}

function openAnytimeQuestsOn(date, dayOffset) {
  return quests.filter((quest) => {
    if (!quest.noTime || quest.adaptive || quest.isPrayer) return false;
    if (!questRunsOnDate(quest, date, dayOffset)) return false;
    if (dayOffset === 0) return !quest.completed && !quest.cancelledToday;
    // Tomorrow: repeating quests reset overnight, one-time quests don't
    const repeats = quest.recurring === "daily" || quest.recurring === "weekly" || quest.recurring === "custom";
    return repeats || !quest.completed;
  });
}

function buildAnytimeSummaries(now, settings) {
  const list = [];
  if (!settings.anytimeEnabled) return list;

  const times = getAnytimeTimes(settings);

  for (let dayOffset = 0; dayOffset <= REMINDER_DAYS_AHEAD; dayOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const open = openAnytimeQuestsOn(date, dayOffset);
    if (open.length === 0) continue;

    const names = open.slice(0, 3).map((q) => q.name).join(", ");
    const more = open.length > 3 ? ` +${open.length - 3} more` : "";
    const title = `⚪ ${open.length} Anytime quest${open.length === 1 ? "" : "s"} open`;

    times.forEach((time, index) => {
      const [hh, mm] = time.split(":").map(Number);
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0);
      if (at.getTime() <= now.getTime() + 5000) return;
      if (isInQuietHours(at, settings)) return;
      list.push({
        id: SUMMARY_ID_BASE + dayOffset * 10 + index,
        title,
        body: names + more,
        schedule: { at, allowWhileIdle: true },
      });
    });
  }

  return list;
}

function requestReminderReschedule() {
  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(rescheduleQuestReminders, 1000);
}

async function rescheduleQuestReminders() {
  if (!LocalNotifications || !LocalNotifications.schedule) return;
  if (reminderBusy) {
    reminderQueued = true;
    return;
  }
  reminderBusy = true;

  try {
    const settings = getNotifSettings();

    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      const asked = await LocalNotifications.requestPermissions();
      if (asked.display !== "granted") return;
    }

    // Clear all quest reminders and Anytime summaries (leaves Codex id 1, adaptive id 2 and the Focus Timer alone)
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications
      .filter((n) => n.id >= REMINDER_ID_BASE || isSummaryId(n.id))
      .map((n) => ({ id: n.id }));
    if (ours.length > 0) {
      await LocalNotifications.cancel({ notifications: ours });
    }

    if (!settings.enabled) return;

    const now = new Date();
    const notifications = [
      ...buildQuestReminders(now, settings),
      ...buildAnytimeSummaries(now, settings),
    ];
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (err) {
    console.error("Reminder scheduling failed:", err);
  } finally {
    reminderBusy = false;
    if (reminderQueued) {
      reminderQueued = false;
      requestReminderReschedule();
    }
  }
}

function snoozeQuestReminder(quest) {
  const settings = getNotifSettings();
  const snoozes = readReminderMap("_reminderSnoozes");
  snoozes[quest.createdAt] = Date.now() + settings.snoozeMinutes * 60000;
  writeReminderMap("_reminderSnoozes", snoozes);
  rescheduleQuestReminders();
}

function handleReminderAction(event) {
  const extra = event.notification && event.notification.extra;
  if (!extra || extra.questId === undefined) return;

  const quest = quests.find((q) => String(q.createdAt) === String(extra.questId));
  if (!quest) return;

  if (event.actionId === "complete") {
    completeQuest(quest);
  } else if (event.actionId === "snooze") {
    snoozeQuestReminder(quest);
  } else if (event.actionId === "skip") {
    skipQuest(quest);
  }
}

async function setupQuestReminders() {
  if (reminderListenerAdded) return;
  if (!LocalNotifications || !LocalNotifications.addListener) return;
  reminderListenerAdded = true;

  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: REMINDER_ACTION_TYPE,
          actions: [
            { id: "complete", title: "Complete" },
            { id: "snooze", title: "Snooze 10 min" },
            { id: "skip", title: "Skip" },
          ],
        },
      ],
    });
    LocalNotifications.addListener("localNotificationActionPerformed", handleReminderAction);
  } catch (err) {
    console.error("Reminder action setup failed:", err);
  }
}

// =====================================================
// INITIALIZATION
// =====================================================

function initializeQuestSystem() {
  console.log("🔧 Initializing quest system...");

  // PHASE 1 — instant local-first display, no writes, no pushes
  loadSections();
  loadCategories();
  loadQuests();
  renderSections();
  renderCategories();
  renderQuests();


  // PHASE 2 — reconcile with the cloud BEFORE doing anything that
  // could resave/push. Waiting for the pull first means this device
  // never pushes a stale pre-sync copy that could resurrect a
  // deletion made on another device.
  function runPhase2() {
    migrateQuests();
    reviveDueQuests();
    runDailyReset();
    loadQuests();
    updatePrayerQuests();
    updateQuestOrder();
    renderSections();
    renderCategories();
    renderQuests();
    setupQuestReminders();
    requestReminderReschedule();
    console.log("✅ Quest system fully reconciled. quests.length =", quests.length);
  }

  whenSyncReady(runPhase2);

  // Check for new day every minute
  setInterval(() => {
    reviveDueQuests();
    if (isNewDay()) {
      console.log("🔄 New day detected! Running reset...");
      runDailyReset();
      loadQuests();
      renderQuests();
    }
  }, 60000);

  // Update countdowns every second
  setInterval(() => {
    document.querySelectorAll(".countdown").forEach((el) => {
      el.textContent = formatTimeLeft(Number(el.dataset.nextReview));
    });
  }, 1000);
}

document.addEventListener("dataPulled", (e) => {
  const changed = (e.detail && e.detail.changed) || [];
  const sectionsChanged =
    changed.includes("sections") || changed.includes("questSections");
  if (!changed.includes("quests") && !sectionsChanged) return;
  if (sectionsChanged) {
    loadSections();
    renderSections();
  }
  loadQuests();
  renderQuests();
  requestReminderReschedule();
});

initializeQuestSystem();