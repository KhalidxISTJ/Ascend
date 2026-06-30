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
const questTimeElement = document.getElementById("questTime");

// =====================
// Quest Data
// =====================

let quests = [];

let editingQuest = null;

function saveQuests() {

    localStorage.setItem(
        "quests",
        JSON.stringify(quests)
    );

}

function loadQuests() {

    const savedQuests =
        localStorage.getItem("quests");

    if (savedQuests) {

        quests = JSON.parse(savedQuests);

    }

}

loadQuests();

// =====================
// RENDER SYSTEM (IMPORTANT)
// =====================
function renderQuests() {

    if (!questList || !completedQuestList) {
        return;
    }

    questList.innerHTML = "";
    completedQuestList.innerHTML = "";

    for (const quest of quests) {
        createQuestElement(quest);
    }
}

renderQuests();
// =====================
// Create Quest UI
// =====================
function createQuestElement(quest) {

    const li = document.createElement("li");

    if (quest.completed) {

        li.style.opacity = "0.7";
        li.style.textDecoration = "line-through";

    }

    const icon = quest.completed ? "✔️ " : "";

    li.textContent = icon + `[${quest.type}] ${quest.name} (${quest.difficulty}) [${quest.recurring}] ${quest.questTime}`;

    // DELETE
    const del = document.createElement("button");
    del.textContent = "Delete";

    del.onclick = () => {
        quests = quests.filter(q => q !== quest);
        saveQuests();
        renderQuests();
    };

    // COMPLETE
    const done = document.createElement("button");
    done.textContent = "Complete";
    const edit = document.createElement("button"); edit.textContent = "Edit";
    edit.onclick = () => {

    editingQuest = quest;

    questInput.value = quest.name;
    questTypeElement.value = quest.type;
    questDifficultyElement.value = quest.difficulty;
    questRecurringElement.value = quest.recurring;
    questTimeElement.value = quest.questTime || "";

    addQuestBtn.textContent = "Save Quest";
    };
    

    done.onclick = () => {

        if (quest.completed) return;

        quest.completed = true;

        if (quest.difficulty === "Easy") {

            addXP(10);

        }
        else if (quest.difficulty === "Medium") {

            addXP(25);

        }
        else {

            addXP(50);

        }
        saveQuests();
        renderQuests();
    };

    li.appendChild(del);
    li.appendChild(edit);
    if (!quest.completed) {

        li.appendChild(done);

    }

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
            questTime: questTimeElement.value,
            completed: false
        };
       if (editingQuest) {

    editingQuest.name = quest.name;
    editingQuest.type = quest.type;
    editingQuest.difficulty = quest.difficulty;
    editingQuest.recurring = quest.recurring;
    editingQuest.questTime = quest.questTime;

    editingQuest = null;

    addQuestBtn.textContent = "Add Quest";

    } else {

    quests.push(quest);

    }

    saveQuests();

    questInput.value = "";
    questTimeElement.value = "";

    renderQuests(); 
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