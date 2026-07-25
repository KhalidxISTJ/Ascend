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
// Keeps old quests working
// =====================

function migrateQuests() {
  for (const quest of quests) {
    if (!quest.section) {
      quest.section = "General";
    }

    if (!quest.priority) {
      quest.priority = "Medium";
    }

    if (!quest.completed) {
      quest.completed = false;
    }

    if (!quest.createdAt) {
      quest.createdAt = Date.now();
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

  title.textContent =
    `${quest.completed ? "✔️ " : ""}` +
    `${priorityIcons[quest.priority] || "🟡"} ` +
    quest.name;

  // TIME

  const time = document.createElement("div");

  time.className = "quest-time";

  const hasTime = quest.startTime || quest.endTime;
  const hasDueDate = quest.dueDate;

  let info = "";

  if (hasTime) {
    info += `🕓 ${formatTime(quest.startTime)} - ${formatTime(quest.endTime)}`;
  }

  if (hasDueDate) {
    if (info) {
      info += "<br>";
    }

    info += `📅 ${formatDate(quest.dueDate)}`;
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


  Priority:
  ${quest.priority}

  <br>


  Type:
  ${quest.type}


  <br>


  Difficulty:
  ${quest.difficulty}


  <br>


  Recurring:
  ${quest.recurring}


  <br>


  Section:
  ${quest.section}


  <br>


  Due:
  ${quest.dueDate ? formatDate(quest.dueDate) : "None"}


  <br>


  Status:
  ${due.text}


  <br>


  🕓
  ${formatTime(quest.startTime)}

  -

  ${formatTime(quest.endTime)}

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
  return {
    name: questInput.value.trim(),

    type: questCategoryElement.value,

    difficulty: questDifficultyElement.value,

    recurring: questRecurringElement.value,

    startTime: questStartTimeElement.value,

    endTime: questEndTimeElement.value,

    dueDate: questDueDateElement.value,

    priority: questPriority.value,

    section: currentSection,

    completed: false,

    createdAt: Date.now(),
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
    console.log("INPUT VALUE:", questInput.value);
    const newQuest = createQuestObject();

    if (editingQuest) {
      Object.assign(editingQuest, newQuest);
    } else {
      quests.push(newQuest);
    }

    console.log("ADDING QUEST:", quests);

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
// DELETE QUEST
// =====================

function deleteQuest(quest) {
  quests = quests.filter((q) => q !== quest);

  saveQuests();

  renderQuests();
}

// =====================
// COMPLETE QUEST
// =====================

function completeQuest(quest) {
  if (quest.completed) {
    return;
  }

  quest.completed = true;

  giveQuestXP(quest);

  saveQuests();

  renderQuests();
}

// =====================
// XP REWARD SYSTEM
// =====================

function giveQuestXP(quest) {
  if (typeof addXP !== "function") {
    return;
  }

  const rewards = {
    Easy: 10,

    Medium: 25,

    Hard: 50,

    Extreme: 100,
  };

  addXP(rewards[quest.difficulty] || 10);
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

function getTodayString() {
  return new Date().toDateString();
}

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
}

// =====================
// DAILY RESET RUNNER
// =====================

function runDailyReset() {
  if (!isNewDay()) {
    return;
  }

  console.log("Daily reset triggered");

  resetRecurringQuests();

  if (playerData) {
    playerData.lastResetDate = getTodayString();

    savePlayer();
  }

  saveQuests();
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
      // Completed last
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }

      const dateA = new Date(
        (a.dueDate || "9999-12-31") + "T" + (a.startTime || "23:59"),
      );

      const dateB = new Date(
        (b.dueDate || "9999-12-31") + "T" + (b.startTime || "23:59"),
      );

      console.log(a.name, dateA, "|", b.name, dateB);

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
    // Completed last
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    // Section
    if (a.section !== b.section) {
      return sections.indexOf(a.section) - sections.indexOf(b.section);
    }

    // Manual order
    if (a.order && b.order && a.order !== b.order) {
      return a.order - b.order;
    }

    // Time
    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    // Priority
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

function sortMissionQuests(list) {
  return [...list].sort((a, b) => {
    // Completed last
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    // Earliest start time first
    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    // Higher priority first
    if ((priorityOrder[b.priority] || 0) !== (priorityOrder[a.priority] || 0)) {
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    }

    // Manual order
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

  return quests.filter((quest) => {
    if (quest.completed) {
      return false;
    }

    // Daily recurring quests are always today's quests
    if (quest.recurring === "daily") {
      return true;
    }

    // Weekly recurring quests are today's quests after reset
    if (quest.recurring === "weekly") {
      return true;
    }

    // One-time quests with no due date belong in the backlog
    if (!quest.dueDate) {
      return false;
    }

    const [year, month, day] = quest.dueDate.split("-").map(Number);

    const due = new Date(year, month - 1, day);

    due.setHours(0, 0, 0, 0);

    due.setHours(0, 0, 0, 0);

    return due.getTime() === today.getTime();
  });
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
    due.setHours(0, 0, 0, 0);

    return due < today;
  });
}

function getUpcomingQuests() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return quests.filter((quest) => {
    if (quest.completed || !quest.dueDate) {
      return false;
    }

    const [year, month, day] = quest.dueDate.split("-").map(Number);

    const due = new Date(year, month - 1, day);

    due.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due > today;
  });
}
// =====================
// CURRENT MISSION
// =====================

function getCurrentMission() {
  const todays = getTodaysQuests();

  if (todays.length > 0) {
    return sortQuests([...todays])[0];
  }

  const upcoming = getUpcomingQuests();

  if (upcoming.length > 0) {
    return sortQuests([...upcoming])[0];
  }

  const backlog = getBacklogQuests();

  if (backlog.length > 0) {
    return sortQuests([...backlog])[0];
  }

  return null;
}

// =====================
// QUEST STATS
// =====================

function getQuestStats() {
  const total = quests.length;

  const completed = quests.filter((q) => q.completed).length;

  const active = total - completed;

  const completionRate =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,

    completed,

    active,

    completionRate,
  };
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

// =====================
// DASHBOARD REFRESH HOOK
// =====================

function updateDashboard() {
  const mission = getCurrentMission();

  console.log("MISSION:", mission);
  const todays = getTodaysQuests();

  const stats = getQuestStats();
}

// Run once after loading

updateDashboard();
// =====================
// QUEST SYSTEM — PART 6
// FINAL CLEANUP
// =====================

// =====================
// AI READY DATA HELPERS
// =====================

// Gives AI/system clean quest data

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

      completed: quest.completed,

      dueDate: quest.dueDate,

      startTime: quest.startTime,

      endTime: quest.endTime,
    };
  });
}

// Get quests by category

function getQuestsByType(type) {
  return quests.filter((quest) => quest.type === type);
}

// Get quests by section

function getQuestsBySection(section) {
  return quests.filter((quest) => quest.section === section);
}

// =====================
// QUEST EXPORT SYSTEM
// =====================

function exportQuestData() {
  return JSON.stringify(
    {
      quests,
      sections,
    },
    null,
    2,
  );
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

// =====================
// SAFE INITIALIZATION
// =====================

function initializeQuestSystem() {
  loadQuests();

  loadSections();

  loadCategories();

  migrateQuests();

  runDailyReset();

  updateQuestOrder();

  renderSections();

  renderCategories();

  renderQuests();

  updateDashboard();
}

initializeQuestSystem();
console.log("Syllabus JS loaded");

const syllabus = JSON.parse(localStorage.getItem("syllabus")) || [];

console.log("Syllabus data:", syllabus);
console.log("Number of items:", syllabus.length);
