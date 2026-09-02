// =====================================================
// CALENDAR — Day, Week, Month Views (No hardcoded classes)
// =====================================================

let timelineInterval = null;
let currentView = "day";
let currentWeekOffset = 0;
let currentMonthOffset = 0;

// =====================================================
// COLORS FOR EVENTS
// =====================================================

const eventColors = [
  "#1a73e8", // blue
  "#e37400", // orange
  "#e52592", // pink
  "#137333", // green
  "#9334e6", // purple
  "#d93025", // red
  "#00897b", // teal
  "#f9ab00", // yellow
];

function getEventColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return eventColors[Math.abs(hash) % eventColors.length];
}

// =====================================================
// GET EVENTS FOR A SPECIFIC DAY
// =====================================================

function getEventsForDay(date) {
  const quests = JSON.parse(localStorage.getItem("quests")) || [];
  const dateStr = date.toISOString().split("T")[0];

  // Get quests for this day
  const todaysQuests = quests.filter((q) => {
    if (q.recurring === "daily") return true;
    if (q.recurring === "weekly") {
      const dayOfWeek = date.getDay();
      const qDay = new Date(q.dueDate).getDay();
      return dayOfWeek === qDay;
    }
    if (q.dueDate === dateStr) return true;
    return false;
  });

  const questEvents = todaysQuests.map((q) => ({
    name: q.name,
    startTime: q.startTime || "12:00",
    endTime: q.endTime || null,
    type: "quest",
    color: getEventColor(q.name),
    completed: q.completed || false,
  }));

  return questEvents;
}

// =====================================================
// FORMAT HELPERS
// =====================================================

function formatTime12(time) {
  if (!time) return "—";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatWeekLabel(startDate) {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);
  const options = { month: "short", day: "numeric" };
  return `${startDate.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
}

function getCurrentTime12() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes}:${seconds} ${ampm}`;
}

// =====================================================
// RENDER DAY VIEW
// =====================================================

function renderDayView() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const events = getEventsForDay(new Date());

  events.sort((a, b) => {
    const timeA = a.startTime || "23:59";
    const timeB = b.startTime || "23:59";
    return timeA.localeCompare(timeB);
  });

  container.innerHTML = "";

  for (let hour = 0; hour < 24; hour++) {
    const hourStr = String(hour).padStart(2, "0") + ":00";
    const matchingEvents = events.filter((e) => {
      if (!e.startTime) return false;
      const eventHour = parseInt(e.startTime.split(":")[0]);
      return eventHour === hour;
    });

    const block = document.createElement("div");
    block.className = "timeline-hour";

    const label = document.createElement("div");
    label.className = "timeline-label";
    label.textContent = formatTime12(hourStr);
    block.appendChild(label);

    const content = document.createElement("div");
    content.className = "timeline-content";

    if (matchingEvents.length === 0) {
      const empty = document.createElement("span");
      empty.className = "timeline-empty";
      empty.textContent = "—";
      content.appendChild(empty);
    } else {
      matchingEvents.forEach((e) => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        if (e.completed) item.classList.add("done");
        const color = e.color || "#1a73e8";
        item.style.borderLeftColor = color;
        const timeRange = e.endTime
          ? `${formatTime12(e.startTime)} - ${formatTime12(e.endTime)}`
          : formatTime12(e.startTime);
        item.textContent = `${timeRange} ${e.name}`;
        content.appendChild(item);
      });
    }

    block.appendChild(content);
    container.appendChild(block);
  }

  document.getElementById("week-label").textContent = "Today";
  setTimeout(() => updateCurrentTimeLine(), 100);
}

// =====================================================
// RENDER WEEK VIEW
// =====================================================

function renderWeekView() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const now = new Date();
  const today = now.getDay();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - today + currentWeekOffset * 7);

  const startHour = 0;
  const endHour = 23;

  let html = '<div class="week-grid">';

  html += '<div class="time-label"></div>';
  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + d);
    const isToday = date.toDateString() === now.toDateString();
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
    html += `
      <div class="day-header ${isToday ? "today" : ""}">
        ${dayName}
        <span class="day-num">${date.getDate()}</span>
      </div>
    `;
  }

  for (let hour = startHour; hour <= endHour; hour++) {
    const timeStr = formatTime12(`${String(hour).padStart(2, "0")}:00`);
    html += `<div class="time-label">${timeStr}</div>`;

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      const events = getEventsForDay(date);

      const hourEvents = events.filter((e) => {
        if (!e.startTime) return false;
        const eventHour = parseInt(e.startTime.split(":")[0]);
        return eventHour === hour;
      });

      html += '<div class="cell">';
      hourEvents.forEach((e) => {
        const color = e.color || "#1a73e8";
        const timeRange = e.endTime
          ? `${formatTime12(e.startTime)} - ${formatTime12(e.endTime)}`
          : formatTime12(e.startTime);
        html += `
          <div class="event-item" style="border-left-color: ${color};">
            ${timeRange} ${e.name}
          </div>
        `;
      });
      html += "</div>";
    }
  }

  html += "</div>";
  container.innerHTML = html;
  document.getElementById("week-label").textContent =
    formatWeekLabel(weekStart);
}

// =====================================================
// RENDER MONTH VIEW
// =====================================================

function renderMonthView() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + currentMonthOffset;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let html = '<div class="month-grid">';

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach((name) => {
    html += `<div class="month-day-header">${name}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    html += `<div class="month-cell other-month"></div>`;
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    const isToday = dateStr === todayStr;

    const events = getEventsForDay(date);

    html += `<div class="month-cell ${isToday ? "today" : ""}">`;
    html += `<div class="day-number">${day}</div>`;

    if (events.length > 0) {
      html += `<div class="event-dots">`;
      const maxDots = 3;
      const shownEvents = events.slice(0, maxDots);
      shownEvents.forEach((e) => {
        const color = e.color || "#1a73e8";
        html += `<span class="event-dot" style="background: ${color};"></span>`;
      });
      if (events.length > maxDots) {
        html += `<span class="event-count">+${events.length - maxDots}</span>`;
      }
      html += `</div>`;
    }

    html += "</div>";
  }

  // Fill remaining cells
  const totalCells = startDayOfWeek + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    html += `<div class="month-cell other-month"></div>`;
  }

  html += "</div>";
  container.innerHTML = html;

  const monthName = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  document.getElementById("week-label").textContent = monthName;
}

// =====================================================
// CURRENT TIME LINE (for Day view)
// =====================================================

function updateCurrentTimeLine() {
  if (currentView !== "day") return;

  const container = document.getElementById("timeline");
  if (!container) return;

  const oldLines = container.querySelectorAll(
    ".timeline-current-line, .timeline-current-dot",
  );
  oldLines.forEach((el) => el.remove());

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const totalMinutes = hours * 60 + minutes + seconds / 60;

  const hourBlocks = container.querySelectorAll(".timeline-hour");
  if (hourBlocks.length === 0) return;

  let targetIndex = -1;
  hourBlocks.forEach((block, index) => {
    const label = block.querySelector(".timeline-label");
    if (!label) return;
    const timeStr = label.textContent.trim();
    const [h, m] = timeStr
      .replace(/(AM|PM)/, "")
      .trim()
      .split(":");
    let hour = parseInt(h);
    if (label.textContent.includes("PM") && hour !== 12) hour += 12;
    if (label.textContent.includes("AM") && hour === 12) hour = 0;
    const blockMinutes = hour * 60 + (parseInt(m) || 0);
    if (blockMinutes <= totalMinutes) {
      targetIndex = index;
    }
  });

  if (targetIndex === -1 || targetIndex >= hourBlocks.length - 1) return;

  const currentBlock = hourBlocks[targetIndex];
  const nextBlock = hourBlocks[targetIndex + 1];

  const containerRect = container.getBoundingClientRect();
  const currentRect = currentBlock.getBoundingClientRect();
  const nextRect = nextBlock.getBoundingClientRect();

  const blockTop = currentRect.top - containerRect.top + container.scrollTop;
  const blockBottom = nextRect.top - containerRect.top + container.scrollTop;
  const blockHeight = blockBottom - blockTop;

  const label = currentBlock.querySelector(".timeline-label");
  const timeStr = label.textContent.trim();
  const [h, m] = timeStr
    .replace(/(AM|PM)/, "")
    .trim()
    .split(":");
  let hour = parseInt(h);
  if (label.textContent.includes("PM") && hour !== 12) hour += 12;
  if (label.textContent.includes("AM") && hour === 12) hour = 0;
  const blockMinutes = hour * 60 + (parseInt(m) || 0);
  const minutesIntoBlock = totalMinutes - blockMinutes;
  const progress = Math.min(Math.max(minutesIntoBlock / 60, 0), 1);

  const linePosition = blockTop + progress * blockHeight;

  const line = document.createElement("div");
  line.className = "timeline-current-line";
  line.style.top = linePosition + "px";

  const tooltip = document.createElement("div");
  tooltip.className = "timeline-tooltip";
  tooltip.textContent = getCurrentTime12();
  line.appendChild(tooltip);

  const dot = document.createElement("div");
  dot.className = "timeline-current-dot";
  dot.style.top = linePosition - 4 + "px";

  container.style.position = "relative";
  container.appendChild(line);
  container.appendChild(dot);
}

// =====================================================
// SWITCH VIEW
// =====================================================

function switchView(view) {
  currentView = view;

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  const weekNav = document.querySelector(".week-nav");
  if (weekNav) {
    weekNav.style.display = view === "day" ? "flex" : "flex";
  }

  if (view === "day") {
    renderDayView();
    setTimeout(() => updateCurrentTimeLine(), 100);
    if (timelineInterval) {
      clearInterval(timelineInterval);
      timelineInterval = null;
    }
    startTimelineUpdates();
  } else if (view === "week") {
    renderWeekView();
    if (timelineInterval) {
      clearInterval(timelineInterval);
      timelineInterval = null;
    }
  } else if (view === "month") {
    renderMonthView();
    if (timelineInterval) {
      clearInterval(timelineInterval);
      timelineInterval = null;
    }
  }
}

// =====================================================
// AUTO-UPDATE
// =====================================================

function startTimelineUpdates() {
  if (timelineInterval) {
    clearInterval(timelineInterval);
  }

  timelineInterval = setInterval(() => {
    if (!document.hidden && currentView === "day") {
      const tooltip = document.querySelector(".timeline-tooltip");
      if (tooltip) {
        tooltip.textContent = getCurrentTime12();
      }
      const now = new Date();
      if (now.getSeconds() % 10 === 0) {
        updateCurrentTimeLine();
      }
    }
  }, 1000);
}

// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.dataset.view);
    });
  });

  document.getElementById("prev-week")?.addEventListener("click", () => {
    if (currentView === "day") {
      // Move to previous day
      const date = new Date();
      date.setDate(date.getDate() - 1);
      // For simplicity, just switch to week view
      switchView("week");
      currentWeekOffset = -1;
      renderWeekView();
    } else if (currentView === "week") {
      currentWeekOffset--;
      renderWeekView();
    } else if (currentView === "month") {
      currentMonthOffset--;
      renderMonthView();
    }
  });

  document.getElementById("next-week")?.addEventListener("click", () => {
    if (currentView === "day") {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      switchView("week");
      currentWeekOffset = 1;
      renderWeekView();
    } else if (currentView === "week") {
      currentWeekOffset++;
      renderWeekView();
    } else if (currentView === "month") {
      currentMonthOffset++;
      renderMonthView();
    }
  });
}

// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  switchView("day");
  setupNavigation();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (currentView === "day") updateCurrentTimeLine();
    }, 200);
  });
});
