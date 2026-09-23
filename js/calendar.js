/* variables */
const calendar = document.getElementById("calendar-wrapper")
const time = document.getElementById("time-column")
const events = document.getElementById("event-column")
const user = localStorage.getItem("username")

let quests = []

function buildTimeLabels() {
    for (let i = 0; i < 24; i++) {
        let displayHour = i % 12;
        if (displayHour === 0) displayHour = 12;
        const period = i < 12 ? "AM" : "PM";
        const label = displayHour + " " + period
        const labelDiv = document.createElement("div")
        labelDiv.className = "time-label"
        labelDiv.textContent = label;
        time.appendChild(labelDiv)
    }
};

function loadQuests() {
    const saved = localStorage.getItem(user + "_savedQuests")
    if (saved) { quests = JSON.parse(saved) }
}

function getTodaysQuests() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;
    return quests.filter((quest) => {
        if (quest.recurring === "daily")
            return true;
        if (quest.recurring === "weekly" && quest.repeatDays.includes(dayOfWeek))
            return true
        return false;
    })
}

function timeToMinutes(time) {
    const parts = time.split(":")
    const hours = Number(parts[0])
    const minutes = Number(parts[1])
    return hours * 60 + minutes
}

function renderEvents() {
    const todaysQuest = getTodaysQuests()

    for (const quest of todaysQuest) {
        const top = timeToMinutes(quest.startTime)
        const endMinutes = timeToMinutes(quest.endTime)
        const height = Math.max(endMinutes - top, 20)
        const eventDiv = document.createElement("div")
        eventDiv.className = "event-block"
        eventDiv.style.top = top + "px"
        eventDiv.style.height = height + "px"
        eventDiv.textContent = quest.name
        events.appendChild(eventDiv)
    }
}

function questsOverlap(quest1, quest2) {
    const quest1start = timeToMinutes(quest1.startTime)
    const quest1End = timeToMinutes(quest1.endTime)
    const quest2Start = timeToMinutes(quest2.startTime)
    const quest2End = timeToMinutes(quest2.endTime)
    return (quest1End > quest2Start && quest2End > quest1start)
}

/* Call all functions */

function init() {
    buildTimeLabels()
    loadQuests();
    renderEvents();
}
init();