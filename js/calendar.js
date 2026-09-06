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
  const dayOfWeek = date.getDay();

  const todaysQuests = quests.filter((q) => {
    // Skip completed quests if you want
    // if (q.completed) return false;

    if (q.recurring === "daily") return true;

    if (q.recurring === "weekly") {
      if (q.repeatDays && q.repeatDays.length > 0) {
        return q.repeatDays.includes(dayOfWeek);
      }
      if (q.dueDate) {
        const qDay = new Date(q.dueDate).getDay();
        return dayOfWeek === qDay;
      }
      return true;
    }

    if (q.dueDate === dateStr) return true;

    return false;
  });

  const questEvents = todaysQuests.map((q) => ({
    name: q.name,
    startTime: q.startTime || "12:00",
    endTime: q.endTime || null,
    type: "quest",
    color: q.color || "#1a73e8", // Use stored color
    completed: q.completed || false,
    id: q.createdAt, // For editing later
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
// RENDER DAY VIEW - Continuous Timeline (Google Style)
// =====================================================

function renderDayView() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const events = getEventsForDay(new Date());

  // Sort by start time
  events.sort((a, b) => {
    const timeA = a.startTime || "23:59";
    const timeB = b.startTime || "23:59";
    return timeA.localeCompare(timeB);
  });

  // Get container width for positioning
  const containerWidth = container.clientWidth || 800;
  const labelWidth = 80; // Wider for 10-min labels
  const contentWidth = containerWidth - labelWidth;

  // Build the entire day as one continuous strip
  const totalMinutes = 24 * 60;
  const pixelsPerMinute = 2.5;

  // Calculate total height
  const totalHeight = totalMinutes * pixelsPerMinute;

  // Create wrapper for the entire timeline
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = `${totalHeight}px`;
  wrapper.style.background = "white";
  wrapper.style.overflow = "visible";

  // Draw time labels and grid lines
  for (let hour = 0; hour < 24; hour++) {
    const yPos = hour * 60 * pixelsPerMinute;

    // ─── HOUR LABEL (4:00 AM) ───
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.left = "0";
    label.style.top = `${yPos - 8}px`;
    label.style.width = `${labelWidth - 8}px`;
    label.style.textAlign = "right";
    label.style.fontSize = "0.75rem";
    label.style.color = "#202124";
    label.style.paddingRight = "8px";
    label.style.fontWeight = "600";
    label.style.fontFamily = "Inter, sans-serif";
    label.style.pointerEvents = "none";

    const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    label.textContent = `${hourDisplay}:00 ${ampm}`;
    wrapper.appendChild(label);

    // ─── 10-MINUTE LABELS (4:10, 4:20, 4:30, 4:40, 4:50) ───
    [10, 20, 30, 40, 50].forEach((min) => {
      const minY = yPos + min * pixelsPerMinute;

      const minLabel = document.createElement("div");
      minLabel.style.position = "absolute";
      minLabel.style.left = "0";
      minLabel.style.top = `${minY - 6}px`;
      minLabel.style.width = `${labelWidth - 8}px`;
      minLabel.style.textAlign = "right";
      minLabel.style.fontSize = "0.55rem";
      minLabel.style.color = "#9ca3af";
      minLabel.style.paddingRight = "8px";
      minLabel.style.fontWeight = "400";
      minLabel.style.fontFamily = "Inter, sans-serif";
      minLabel.style.pointerEvents = "none";
      minLabel.textContent = `${hourDisplay}:${String(min).padStart(2, "0")}`;
      wrapper.appendChild(minLabel);
    });

    // ─── HOUR GRID LINE ───
    const gridLine = document.createElement("div");
    gridLine.style.position = "absolute";
    gridLine.style.left = `${labelWidth}px`;
    gridLine.style.right = "0";
    gridLine.style.top = `${yPos}px`;
    gridLine.style.height = "1.5px";
    gridLine.style.background = "#cbd5e1";
    gridLine.style.zIndex = "0";
    wrapper.appendChild(gridLine);

    // ─── 10-MINUTE GRID LINES ───
    [10, 20, 30, 40, 50].forEach((min) => {
      const minY = yPos + min * pixelsPerMinute;
      const minLine = document.createElement("div");
      minLine.style.position = "absolute";
      minLine.style.left = `${labelWidth}px`;
      minLine.style.right = "0";
      minLine.style.top = `${minY}px`;
      minLine.style.height = "1px";
      minLine.style.background = "#e2e8f0";
      minLine.style.zIndex = "0";
      wrapper.appendChild(minLine);
    });
  }

  // ─── DRAW EVENTS ───
  events.forEach((e) => {
    if (!e.startTime) return;

    const startHour = parseInt(e.startTime.split(":")[0]);
    const startMin = parseInt(e.startTime.split(":")[1]) || 0;
    const startTotalMin = startHour * 60 + startMin;

    let endTotalMin;
    if (e.endTime) {
      const endHour = parseInt(e.endTime.split(":")[0]);
      const endMin = parseInt(e.endTime.split(":")[1]) || 0;
      endTotalMin = endHour * 60 + endMin;
    } else {
      endTotalMin = startTotalMin + 30;
    }

    const topPx = startTotalMin * pixelsPerMinute;
    const heightPx = (endTotalMin - startTotalMin) * pixelsPerMinute;
    const finalHeight = Math.max(heightPx, 20);

    const color = e.color || "#1a73e8";

    const eventEl = document.createElement("div");
    eventEl.className = "timeline-event-continuous";

    eventEl.style.position = "absolute";
    eventEl.style.left = `${labelWidth + 4}px`;
    eventEl.style.right = "4px";
    eventEl.style.top = `${topPx}px`;
    eventEl.style.height = `${finalHeight}px`;
    eventEl.style.background = `${color}20`;
    eventEl.style.borderLeft = `4px solid ${color}`;
    eventEl.style.borderRadius = "4px";
    eventEl.style.zIndex = "1";
    eventEl.style.overflow = "hidden";
    eventEl.style.padding = "4px 8px";
    eventEl.style.cursor = "pointer";
    eventEl.style.transition = "all 0.15s";
    eventEl.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
    eventEl.style.display = "flex";
    eventEl.style.flexDirection = "column";
    eventEl.style.justifyContent = "center";

    if (e.completed) {
      eventEl.style.opacity = "0.4";
      eventEl.style.textDecoration = "line-through";
    }

    const startTimeStr = formatTime12(e.startTime);
    const endTimeStr = e.endTime ? formatTime12(e.endTime) : "";
    const timeRange = endTimeStr
      ? `${startTimeStr} – ${endTimeStr}`
      : startTimeStr;

    const isTall = finalHeight > 25;

    eventEl.innerHTML = `
      <div class="event-title" style="font-weight: 500; font-size: 0.7rem; color: ${color}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${!isTall ? "display: none;" : ""}">
        ${e.name || "(No title)"}
      </div>
      <div class="event-time" style="font-size: 0.6rem; opacity: 0.7; color: #5f6368; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${!isTall ? "display: none;" : ""}">
        ${timeRange}
      </div>
    `;

    eventEl.addEventListener("click", (ev) => {
      ev.stopPropagation();
      alert(`📌 ${e.name || "(No title)"}\n🕓 ${timeRange}`);
    });

    eventEl.addEventListener("mouseenter", () => {
      eventEl.style.zIndex = "5";
      eventEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      eventEl.style.transform = "scale(1.02)";
    });

    eventEl.addEventListener("mouseleave", () => {
      eventEl.style.zIndex = "1";
      eventEl.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
      eventEl.style.transform = "scale(1)";
    });

    wrapper.appendChild(eventEl);
  });

  // ─── CURRENT TIME LINE ───
  const now = new Date();
  const nowTotalMin = now.getHours() * 60 + now.getMinutes();
  const nowY = nowTotalMin * pixelsPerMinute;

  const currentLine = document.createElement("div");
  currentLine.style.position = "absolute";
  currentLine.style.left = "0";
  currentLine.style.right = "0";
  currentLine.style.top = `${nowY}px`;
  currentLine.style.height = "2px";
  currentLine.style.background = "#ea4335";
  currentLine.style.zIndex = "20";
  currentLine.style.pointerEvents = "none";

  const currentDot = document.createElement("div");
  currentDot.style.position = "absolute";
  currentDot.style.left = `${labelWidth - 8}px`;
  currentDot.style.top = `${nowY - 5}px`;
  currentDot.style.width = "10px";
  currentDot.style.height = "10px";
  currentDot.style.background = "#ea4335";
  currentDot.style.borderRadius = "50%";
  currentDot.style.zIndex = "21";
  currentDot.style.border = "2px solid white";
  currentDot.style.pointerEvents = "none";

  wrapper.appendChild(currentLine);
  wrapper.appendChild(currentDot);

  // Tooltip for current time
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.right = "20px";
  tooltip.style.top = `${nowY - 16}px`;
  tooltip.style.background = "#1a1a2e";
  tooltip.style.color = "#e2e8f0";
  tooltip.style.padding = "2px 10px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "0.7rem";
  tooltip.style.fontWeight = "500";
  tooltip.style.whiteSpace = "nowrap";
  tooltip.style.border = "1px solid rgba(255,255,255,0.1)";
  tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  tooltip.style.zIndex = "22";
  tooltip.textContent = getCurrentTime12();
  wrapper.appendChild(tooltip);

  // Clear container and add wrapper
  container.innerHTML = "";
  container.style.position = "relative";
  container.style.overflowY = "auto";
  container.style.overflowX = "hidden";
  container.style.height = "600px";
  container.style.border = "1px solid #dadce0";
  container.style.borderRadius = "8px";
  container.style.background = "white";

  container.appendChild(wrapper);

  document.getElementById("week-label").textContent = "Today";
}

// =====================================================
// UPDATE CURRENT TIME (for continuous timeline)
// =====================================================

function updateCurrentTimeLine() {
  if (currentView !== "day") return;

  const container = document.getElementById("timeline");
  if (!container) return;

  // Find existing current time elements
  const oldLines = container.querySelectorAll(
    ".timeline-current-line, .timeline-current-dot, .timeline-tooltip",
  );
  oldLines.forEach((el) => el.remove());

  // Rebuild current time by re-rendering the view
  // For efficiency, we just update the tooltip text
  const tooltip = container.querySelector(".timeline-tooltip");
  if (tooltip) {
    tooltip.textContent = getCurrentTime12();
  }
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
