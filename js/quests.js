// =====================
// QUEST SYSTEM — PART 1
// FOUNDATION
// =====================

// =====================
// Elements
// =====================

const addQuestBtn = document.getElementById("addQuestBtn");
const questInput = document.getElementById("questInput");
const currentQuest = document.getElementById("current-quest");
const questList = document.getElementById("questList");
const completedQuestList = document.getElementById("completedQuestList");

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

// Day selector elements
const daySelectorContainer = document.getElementById("daySelectorContainer");
const repeatDayCheckboxes = document.querySelectorAll(".repeat-day");

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

  const saved = localStorage.getItem("quests");
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
    localStorage.setItem("quests", JSON.stringify(quests));
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
  return new Date().toISOString().split("T")[0];
}

function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getDateString(date) {
  return date.toISOString().split("T")[0];
}

// NEW: Get today's date as a simple string (no time)
function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// NEW: Check if it's a new day since last reset
function isNewDay() {
  const lastReset = localStorage.getItem("lastResetDate");
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

console.log("sortQuests called");
console.log(currentSort);

// =====================================================
// RECURRING DROPDOWN - Show/Hide Day Selector
// =====================================================

if (questRecurringElement) {
  questRecurringElement.addEventListener("change", function () {
    if (daySelectorContainer) {
      daySelectorContainer.style.display =
        this.value === "weekly" ? "block" : "none";
    }
  });
}

// =====================
// SAVE SYSTEM
// =====================
function saveQuests() {
  const data = JSON.stringify(quests);
  localStorage.setItem("quests", data);
}

function saveSections() {
  localStorage.setItem("questSections", JSON.stringify(sections));
}

function saveCategories() {
  categories.sort((a, b) => a.localeCompare(b));
  localStorage.setItem("questCategories", JSON.stringify(categories));
}

// =====================
// LOAD SYSTEM
// =====================

function loadQuests() {
  const saved = localStorage.getItem("quests");

  if (saved) {
    quests = JSON.parse(saved);
  } else {
    quests = [];
  }

  console.table(
    quests.map((q) => ({
      name: q.name,
      dueDate: q.dueDate,
      startTime: q.startTime,
      priority: q.priority,
      completed: q.completed,
      repeatDays: q.repeatDays || [],
    })),
  );
}

function loadSections() {
  const saved = localStorage.getItem("questSections");

  if (saved) {
    sections = JSON.parse(saved);
  } else {
    sections = [...defaultSections];
    saveSections();
  }
}

function loadCategories() {
  const saved = localStorage.getItem("questCategories");

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
  let changed = false;

  for (const quest of quests) {
    if (!quest.section) {
      quest.section = "General";
      changed = true;
    }

    if (!quest.priority) {
      quest.priority = "Medium";
      changed = true;
    }

    if (typeof quest.skippedToday !== "boolean") {
      quest.skippedToday = false;
      changed = true;
    }

    if (!quest.createdAt) {
      quest.createdAt = Date.now();
      changed = true;
    }

    // Add repeatDays if missing
    if (!quest.repeatDays) {
      quest.repeatDays = [];
      changed = true;
    }

    if (quest.completed === true) {
      if (quest.status !== "completed") {
        quest.status = "completed";
        changed = true;
      }
      quest.skippedToday = false;
    } else {
      if (quest.status !== "active") {
        quest.status = "active";
        changed = true;
      }
      quest.completed = false;
    }

    if (changed) {
      saveQuests();
    }
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
// QUEST SYSTEM — PART 2
// RENDERING
// =====================

// =====================
// SECTION RENDER
// =====================

function renderSections() {
  if (!questSections) return;

  questSections.innerHTML = "";

  for (const section of sections) {
    const button = document.createElement("button");
    button.className = "section-tab";
    button.textContent = section;

    if (section === currentSection) {
      button.classList.add("active");
    }

    button.onclick = () => {
      currentSection = section;
      renderSections();
      renderQuests();
    };

    const defaultSections = ["Morning", "School", "General", "Night"];
    if (!defaultSections.includes(section)) {
      const deleteBtn = document.createElement("span");
      deleteBtn.className = "section-delete-btn";
      deleteBtn.textContent = "✕";
      deleteBtn.title = "Delete section";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (
          !confirm(
            `Delete section "${section}"? All quests in this section will be moved to "General".`,
          )
        )
          return;

        quests.forEach((q) => {
          if (q.section === section) q.section = "General";
        });
        saveQuests();

        sections = sections.filter((s) => s !== section);
        saveSections();
        renderSections();
        renderQuests();
      };
      button.appendChild(deleteBtn);
    }

    questSections.appendChild(button);
  }

  const addButton = document.createElement("button");
  addButton.className = "section-tab add-section";
  addButton.textContent = "+";
  addButton.onclick = () => {
    const name = prompt("New section name:");
    if (!name) return;
    sections.push(name);
    saveSections();
    renderSections();
  };

  questSections.appendChild(addButton);
}

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
  if (!questList || !completedQuestList) {
    return;
  }

  questList.innerHTML = "";
  completedQuestList.innerHTML = "";

  const sorted = sortQuests([...quests]);

  for (const quest of sorted) {
    if (quest.section !== currentSection) {
      continue;
    }

    if (!questMatchesSearch(quest)) {
      continue;
    }

    createQuestElement(quest);
  }
}

// =====================
// CREATE QUEST CARD
// =====================

function createQuestElement(quest) {
  const li = document.createElement("li");
  li.className = "quest-card";

  if (quest.completed) {
    li.classList.add("completed");
  }

  const title = document.createElement("div");
  title.className = "quest-title";

  const priorityIcons = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
  };

  let nameDisplay = quest.name;
  if (quest.isPrayer && quest.prayerType === "Fajr") {
    nameDisplay = `🌙 ${quest.name}`;
  }

  title.textContent =
    `${quest.completed ? "✔️ " : ""}` +
    `${priorityIcons[quest.priority] || "🟡"} ` +
    nameDisplay;

  // TIME
  const time = document.createElement("div");
  time.className = "quest-time";

  const hasStartTime = quest.startTime && quest.startTime !== "";
  const hasEndTime = quest.endTime && quest.endTime !== "";
  const hasDueDate = quest.dueDate && quest.dueDate !== "";

  let info = "";

  if (hasStartTime || hasEndTime) {
    if (quest.isPrayer && quest.prayerType === "Fajr") {
      info += `🕌 Fajr: ${formatTime(quest.startTime)} (auto-updated)`;
    } else {
      if (hasStartTime && hasEndTime) {
        info += `🕓 ${formatTime(quest.startTime)} - ${formatTime(quest.endTime)}`;
      } else if (hasStartTime) {
        info += `🕓 ${formatTime(quest.startTime)}`;
      } else if (hasEndTime) {
        info += `🕓 Ends at ${formatTime(quest.endTime)}`;
      }
    }
  }

  if (hasDueDate) {
    if (info) {
      info += "<br>";
    }
    info += `📅 ${formatDate(quest.dueDate)}`;
  }

  // Show repeat days if weekly
  if (
    quest.recurring === "weekly" &&
    quest.repeatDays &&
    quest.repeatDays.length > 0
  ) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = quest.repeatDays.map((d) => dayNames[d]).join(", ");
    if (info) info += "<br>";
    info += `🔄 ${days}`;
  }

  if (!info) {
    info = "No Time";
  }

  time.innerHTML = info;

  // DETAILS
  const details = document.createElement("div");
  details.className = "quest-details hidden";

  const due = getDueStatus(quest);

  details.innerHTML = `
    Priority: ${quest.priority}
    <br>
    Type: ${quest.type}
    <br>
    Difficulty: ${quest.difficulty}
    <br>
    Recurring: ${quest.recurring}
    <br>
    Section: ${quest.section}
    <br>
    Due: ${quest.dueDate ? formatDate(quest.dueDate) : "None"}
    <br>
    Status: ${due.text}
    <br>
    🕓 ${formatTime(quest.startTime)} - ${formatTime(quest.endTime)}
  `;

  // BUTTON AREA
  const buttons = document.createElement("div");
  buttons.className = "quest-buttons";

  const toggle = document.createElement("button");
  toggle.textContent = "▼";
  toggle.onclick = () => {
    details.classList.toggle("hidden");
    toggle.textContent = details.classList.contains("hidden") ? "▼" : "▲";
  };

  const edit = document.createElement("button");
  edit.textContent = "Edit";
  edit.onclick = () => {
    startEditingQuest(quest);
  };

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.onclick = () => {
    quests = quests.filter((q) => q !== quest);
    saveQuests();
    renderQuests();
  };

  buttons.appendChild(edit);
  buttons.appendChild(del);

  if (!quest.completed) {
    const complete = document.createElement("button");
    complete.textContent = "Complete";
    complete.onclick = () => {
      completeQuest(quest);
    };
    buttons.appendChild(complete);
  }

  buttons.appendChild(toggle);

  li.appendChild(time);
  li.appendChild(title);
  li.appendChild(buttons);
  li.appendChild(details);

  if (quest.completed) {
    completedQuestList.appendChild(li);
  } else {
    questList.appendChild(li);
  }
}

// =====================
// QUEST SYSTEM — PART 3
// ADD / EDIT / DELETE
// =====================

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
    startTime: questStartTimeElement.value,
    endTime: questEndTimeElement.value,
    dueDate: questDueDateElement.value,
    priority: questPriority.value,
    section: currentSection,
    completed: isEditing ? editingQuest.completed : false,
    status: isEditing ? editingQuest.status : "active",
    skippedToday: isEditing ? editingQuest.skippedToday : false,
    createdAt: isEditing ? editingQuest.createdAt : Date.now(),
    history: isEditing ? editingQuest.history : {},
    isPrayer: isEditing ? editingQuest.isPrayer : false,
    prayerType: isEditing ? editingQuest.prayerType : null,
    // Color - preserve if editing, otherwise random
    color: isEditing ? editingQuest.color : randomColor,
  };
}
// =====================
// RESET FORM
// =====================

function resetQuestForm() {
  questInput.value = "";
  questStartTimeElement.value = "";
  questEndTimeElement.value = "";
  questDueDateElement.value = "";

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
    addQuestBtn.textContent = "Add Quest";
  }
}

// =====================
// START EDIT
// =====================

function startEditingQuest(quest) {
  editingQuest = quest;

  questInput.value = quest.name;
  questCategoryElement.value = quest.type;
  questDifficultyElement.value = quest.difficulty;
  questRecurringElement.value = quest.recurring;

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
  questDueDateElement.value = quest.dueDate || "";
  questPriority.value = quest.priority;
  currentSection = quest.section;

  addQuestBtn.textContent = "Save Quest";
  if (questCreator) {
    questCreator.hidden = false;
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
      quests.push(newQuest);
    }

    saveQuests();
    resetQuestForm();
    renderQuests();

    if (questCreator) {
      questCreator.hidden = true;
    }

    if (newQuestBtn) {
      newQuestBtn.textContent = "+ New Quest";
    }
  };
}

// =====================
// COMPLETE QUEST
// =====================

function completeQuest(quest) {
  if (!quest || quest.status === "completed") return;

  quest.status = "completed";
  quest.completed = true;

  if (quest.recurring === "daily" || quest.recurring === "weekly") {
    const today = getTodayString();
    if (!quest.history) quest.history = {};
    quest.history[today] = true;
  }

  giveQuestXP(quest);
  saveQuests();
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

  if (typeof renderQuests === "function") {
    renderQuests();
  }

  if (typeof updateDashboard === "function") {
    updateDashboard();
  }

  window.dispatchEvent(new CustomEvent("questStateChanged"));
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
    questCreator.hidden = !questCreator.hidden;
    newQuestBtn.textContent = questCreator.hidden ? "+ New Quest" : "✕ Close";
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

// =====================
// QUEST SYSTEM — PART 4
// DAILY RESET + ORDERING
// =====================

// =====================
// DATE HELPERS
// =====================

function isNewDay() {
  if (!playerData || !playerData.lastResetDate) {
    return true;
  }
  return playerData.lastResetDate !== getTodayString();
}

// =====================
// RECURRING RESET
// =====================

function resetRecurringQuests() {
  for (const quest of quests) {
    if (quest.recurring === "daily") {
      quest.completed = false;
    }

    if (quest.recurring === "weekly") {
      const lastReset = new Date(playerData.lastResetDate);
      const today = new Date();
      const difference = Math.floor(
        (today - lastReset) / (1000 * 60 * 60 * 24),
      );
      if (difference >= 7) {
        quest.completed = false;
      }
    }
  }

  quests = quests.filter((quest) => {
    if (quest.recurring === "none" && quest.completed) {
      return false;
    }
    return true;
  });
  runDailyReset();
}

// =====================================================
// DAILY RESET - Fix for recurring quests
// =====================================================

function runDailyReset() {
  const today = getTodayDateKey();
  const lastReset = localStorage.getItem("lastResetDate");

  // If already reset today, skip
  if (lastReset === today) {
    console.log("✅ Already reset today");
    return;
  }

  console.log("🔄 Running daily reset...");

  // Load fresh quests
  const saved = localStorage.getItem("quests");
  if (!saved) {
    localStorage.setItem("lastResetDate", today);
    return;
  }

  let quests = JSON.parse(saved);
  let changed = false;

  quests.forEach((quest, index) => {
    // === DAILY QUESTS ===
    if (quest.recurring === "daily") {
      // If it was completed yesterday, uncomplete it for today
      if (quest.completed === true) {
        quest.completed = false;
        quest.status = "active";
        changed = true;
        console.log(`🔄 Reset daily quest: ${quest.name}`);
      }
    }

    // === WEEKLY QUESTS ===
    if (quest.recurring === "weekly") {
      // Check if a week has passed since last reset
      const lastResetDate = new Date(lastReset || today);
      const todayDate = new Date(today);
      const daysDiff = Math.floor(
        (todayDate - lastResetDate) / (1000 * 60 * 60 * 24),
      );

      // Reset if 7+ days have passed or if it's a new week (Monday)
      if (daysDiff >= 7 || todayDate.getDay() === 1) {
        if (quest.completed === true) {
          quest.completed = false;
          quest.status = "active";
          changed = true;
          console.log(`🔄 Reset weekly quest: ${quest.name}`);
        }
      }

      // ALSO check if today is NOT in repeatDays, reset if completed
      if (quest.repeatDays && quest.repeatDays.length > 0) {
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
  });

  if (changed) {
    localStorage.setItem("quests", JSON.stringify(quests));
    console.log("✅ Quests reset for new day");
  }

  // Save today as the last reset date
  localStorage.setItem("lastResetDate", today);

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
  active.forEach((quest, index) => {
    quest.order = index + 1;
  });
  saveQuests();
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
  if (currentSort === "date") {
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }

      const dateA = new Date(
        (a.dueDate || "9999-12-31") + "T" + (a.startTime || "23:59"),
      );
      const dateB = new Date(
        (b.dueDate || "9999-12-31") + "T" + (b.startTime || "23:59"),
      );

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    });
  }

  if (currentSort === "priority") {
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    });
  }
  if (currentSort === "name") {
    return list.sort((a, b) => {
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  return quests.filter((quest) => {
    if (quest.recurring === "none" && quest.completed) {
      return false;
    }

    if (quest.recurring === "daily") {
      return true;
    }

    if (quest.recurring === "weekly") {
      // Check if today is in repeatDays
      if (quest.repeatDays && quest.repeatDays.length > 0) {
        return quest.repeatDays.includes(dayOfWeek);
      }
      // Fallback: use dueDate
      if (quest.dueDate) {
        const qDay = new Date(quest.dueDate).getDay();
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
  });
}

function getCurrentQuest(offset = 0) {
  const todayQuests = getTodaysQuests();

  if (todayQuests.length === 0) {
    return null;
  }

  function getStartMinutes(quest) {
    if (!quest.startTime) return 0;
    const [hours, minutes] = quest.startTime.split(":").map(Number);
    return hours * 60 + minutes;
  }

  const eligible = todayQuests.filter((quest) => {
    if (quest.completed) return false;
    const timeState = getQuestTimeState(quest);
    return timeState === "active" || timeState === "overdue";
  });

  if (eligible.length === 0) {
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

  return eligible[offset % eligible.length] || null;
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
// QUEST SYSTEM — PART 6
// FINAL CLEANUP
// =====================

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
// INITIALIZATION
// =====================================================

function initializeQuestSystem() {
  // First load quests
  loadQuests();
  loadSections();
  loadCategories();
  migrateQuests();

  // Run daily reset check
  runDailyReset();

  // Update prayer times
  updatePrayerQuests();

  // Update order
  updateQuestOrder();

  // Render everything
  renderSections();
  renderCategories();
  renderQuests();

  // Check for new day every 60 seconds
  setInterval(() => {
    if (isNewDay()) {
      console.log("🔄 New day detected! Running reset...");
      runDailyReset();
    }
  }, 60000); // Check every minute
}

// Start the system
initializeQuestSystem();
