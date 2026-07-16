// =====================
// Elements
// =====================
const addQuestBtn = document.getElementById("addQuestBtn");
const questInput = document.getElementById("questInput");
const questList = document.getElementById("questList");
const completedQuestList = document.getElementById("completedQuestList");
const questTypeElement = document.getElementById("questType");
const questDifficultyElement = document.getElementById("questDifficulty");
const questRecurringElement = document.getElementById("questRecurring");
const questStartTimeElement = document.getElementById("questStartTime");
const questEndTimeElement = document.getElementById("questEndTime");
const questPriority = document.getElementById("questPriority");
const questSearch = document.getElementById("questSearch");
const newQuestBtn = document.getElementById("newQuestBtn");
const questCreator = document.querySelector(".quest-creator");
const questSections = document.getElementById("questSections");

// =====================
// Quest Data
// =====================

let quests = [];
let sections = [];

let currentSection = "Morning";
let editingQuest = null;
let searchText = "";

function renderSections() {
  questSections.innerHTML = "";

  for (const section of sections) {
    const button = document.createElement("button");

    button.className = "section-tab";
    button.textContent = section;

    if (section === currentSection) {
      button.classList.add("active");
    }

    button.onclick = function () {
      currentSection = section;

      renderSections();
      renderQuests();
    };

    questSections.appendChild(button);
  }

  const addButton = document.createElement("button");

  addButton.className = "section-tab add-section";
  addButton.textContent = "+";

  addButton.onclick = function () {
    const name = prompt("New section name:");

    if (!name) return;

    sections.push(name);

    saveSections();
    renderSections();
  };

  questSections.appendChild(addButton);
}
function saveQuests() {
  localStorage.setItem("quests", JSON.stringify(quests));
}
function saveSections() {
  localStorage.setItem("questSections", JSON.stringify(sections));
}

function loadSections() {
  const savedSections = localStorage.getItem("questSections");

  if (savedSections) {
    sections = JSON.parse(savedSections);
  } else {
    sections = ["Morning", "School", "General", "Night"];

    saveSections();
  }
}

function loadQuests() {
  const savedQuests = localStorage.getItem("quests");

  if (savedQuests) {
    quests = JSON.parse(savedQuests);
  }
}
loadQuests();
loadSections();
renderSections();
if (questSearch) {
  questSearch.addEventListener("input", function () {
    searchText = questSearch.value.toLowerCase();

    renderQuests();
  });
}

for (const quest of quests) {
  if (!quest.section) {
    quest.section = "General";
  }
}

saveQuests();

if (newQuestBtn && questCreator) {
  newQuestBtn.onclick = function () {
    questCreator.hidden = !questCreator.hidden;

    newQuestBtn.textContent = questCreator.hidden ? "+ New Quest" : "✕ Close";
  };
}

function formatTime(time) {
  if (!time) return "No Time";

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
// RENDER SYSTEM (IMPORTANT)
// =====================
function renderQuests() {
  if (!questList || !completedQuestList) {
    return;
  }

  questList.innerHTML = "";
  completedQuestList.innerHTML = "";

  const priorityOrder = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  quests.sort(function (a, b) {
    // First sort by section
    if (a.section !== b.section) {
      return sections.indexOf(a.section) - sections.indexOf(b.section);
    }

    // Then by start time
    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";

    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    // Finally by priority
    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
  });

  for (const quest of quests) {
    const searchableText = `
    ${quest.name}
    ${quest.type}
    ${quest.priority}
    ${quest.difficulty}
    ${quest.recurring}
    ${quest.questTime}
    `.toLowerCase();

    if (searchText !== "" && !searchableText.includes(searchText)) {
      continue;
    }

    if (quest.section !== currentSection) {
      continue;
    }

    createQuestElement(quest);
  }
}

renderQuests();
// =====================
// Create Quest UI
// =====================
function createQuestElement(quest) {
  const li = document.createElement("li");
  li.className = "quest-card";

  const title = document.createElement("div");
  title.className = "quest-title";

  const time = document.createElement("div");
  time.className = "quest-time";

  time.textContent = `🕓 ${formatTime(quest.startTime)} - ${formatTime(quest.endTime)}`;

  const order = document.createElement("div");
  order.className = "quest-order";
  order.textContent = formatTime(quest.startTime);

  const buttons = document.createElement("div");
  buttons.className = "quest-buttons";

  const details = document.createElement("div");
  details.className = "quest-details hidden";

  const toggle = document.createElement("button");
  toggle.textContent = "▼";

  console.log(quest.startTime, formatTime(quest.startTime));

  details.innerHTML = `
  Priority: ${quest.priority}<br>
  Type: ${quest.type}<br>
  Difficulty: ${quest.difficulty}<br>
  Recurring: ${quest.recurring}<br>
  🕓 ${formatTime(quest.startTime)} - ${formatTime(quest.endTime)}
  `;
  console.log(details.innerHTML);

  if (quest.completed) {
    li.style.opacity = "0.7";
    li.style.textDecoration = "line-through";
  }

  const completeIcon = quest.completed ? "✔️ " : "";

  const priorityIcons = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
  };

  title.textContent =
    completeIcon + (priorityIcons[quest.priority] || "🟡") + " " + quest.name;
  // DELETE
  const del = document.createElement("button");
  del.textContent = "Delete";

  del.onclick = () => {
    quests = quests.filter((q) => q !== quest);
    saveQuests();
    renderQuests();
  };

  // COMPLETE
  const done = document.createElement("button");
  done.textContent = "Complete";
  const edit = document.createElement("button");
  edit.textContent = "Edit";
  edit.onclick = () => {
    editingQuest = quest;

    questInput.value = quest.name;
    questTypeElement.value = quest.type;
    questDifficultyElement.value = quest.difficulty;
    questRecurringElement.value = quest.recurring;
    questStartTimeElement.value = quest.startTime || "";
    questEndTimeElement.value = quest.endTime || "";

    addQuestBtn.textContent = "Save Quest";
  };

  done.onclick = () => {
    if (quest.completed) return;

    quest.completed = true;

    if (quest.difficulty === "Easy") {
      addXP(10);
    } else if (quest.difficulty === "Medium") {
      addXP(25);
    } else {
      addXP(50);
    }
    saveQuests();
    renderQuests();
  };

  toggle.onclick = function () {
    details.classList.toggle("hidden");

    toggle.textContent = details.classList.contains("hidden") ? "▼" : "▲";
  };

  buttons.appendChild(del);
  buttons.appendChild(edit);

  if (!quest.completed) {
    buttons.appendChild(done);
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
// ADD QUEST
// =====================
if (addQuestBtn) {
  addQuestBtn.onclick = () => {
    if (!questInput.value) return;

    const quest = {
      name: questInput.value,
      type: questTypeElement.value,
      difficulty: questDifficultyElement.value,
      recurring: questRecurringElement.value,
      startTime: questStartTimeElement.value,
      endTime: questEndTimeElement.value,
      completed: false,
      priority: questPriority.value,
      order: 1,
      section: currentSection,
    };

    if (editingQuest) {
      editingQuest.name = quest.name;
      editingQuest.type = quest.type;
      editingQuest.difficulty = quest.difficulty;
      editingQuest.recurring = quest.recurring;
      editingQuest.questTime = quest.questTime;
      editingQuest.priority = quest.priority;
      questPriority.value = quest.priority;

      editingQuest = null;

      addQuestBtn.textContent = "Add Quest";
    } else {
      quests.push(quest);
      console.log(quests);
    }

    saveQuests();

    questInput.value = "";
    questStartTimeElement.value = "";
    questEndTimeElement.value = "";

    renderQuests();
    questCreator.hidden = true;
    newQuestBtn.textContent = "+ New Quest";
  };
}

// =====================
// TIME (TEST MODE)
// =====================
// NORMAL:
let today = new Date().toDateString();

// TEST MODE (UNCOMMENT TO SIMULATE NEXT DAY):
// let today = "Mon Jun 22 2026";

// =====================
// DAILY RESET
// =====================
console.log("Today:", today);
console.log("Last Reset:", playerData.lastResetDate);

if (today !== playerData.lastResetDate) {
  console.log("DAILY RESET TRIGGERED");

  for (const quest of quests) {
    if (quest.recurring === "daily") {
      quest.completed = false;
    }
  }

  playerData.lastResetDate = today;

  saveQuests();
  savePlayer();
}
