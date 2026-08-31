// =====================================================
// ASCEND CODEX
// Flashcards + Review + SRS
// =====================================================

// =====================================================
// STORAGE
// =====================================================

let testTime = null;

function getCurrentTime() {
  return testTime || new Date();
}
function setTestTime(date) {
  testTime = new Date(date);
}

const savedFolders = localStorage.getItem("codexFolders");

let rootFolder;

if (savedFolders) {
  try {
    rootFolder = JSON.parse(savedFolders);
  } catch (error) {
    console.error("Failed to load Codex folders:", error);

    rootFolder = {
      name: "Root",
      cards: [],
      children: [],
    };
  }
} else {
  rootFolder = {
    name: "Root",
    cards: [],
    children: [],
  };
}

// =====================================================
// STATE
// =====================================================

let currentFolder = rootFolder;

let folderHistory = [];

let currentIndex = 0;

let flipped = false;

let filteredCards = [];

let editingCard = null;

// =====================================================
// REVIEW STATE
// =====================================================

let reviewCards = [];

let stillNeedsReview = [];

let originalReviewCount = 0;

let completedReviewCount = 0;

let isRetryPhase = false;

let lastAnswerCorrect = false;

let reviewIndex = 0;

let reviewMode = "multiple-choice";

let reviewAnswered = false;

let reviewScore = 0;

let reviewMatchSelections = [];

// =====================================================
// NORMAL CODEX ELEMENTS
// =====================================================

const card = document.getElementById("flipCard");

const frontEl = document.getElementById("cardFront");

const backEl = document.getElementById("cardBack");

const cardCounter = document.getElementById("cardCounter");

const nextReviewPanel = document.getElementById("nextReviewPanel");

const nextReviewList = document.getElementById("nextReviewList");

const prevBtn = document.getElementById("prevBtn");

const nextBtn = document.getElementById("nextBtn");

const frontInput = document.getElementById("frontInput");

const backInput = document.getElementById("backInput");

const addCardBtn = document.getElementById("addCardBtn");

const editCardBtn = document.getElementById("editCardBtn");

const deleteCardBtn = document.getElementById("deleteCardBtn");

const bulkInput = document.getElementById("bulkCardInput");

const bulkAddBtn = document.getElementById("bulkAddBtn");

const folderList = document.getElementById("folderList");

const addFolderBtn = document.getElementById("addFolderBtn");

const deleteFolderBtn = document.getElementById("deleteFolderBtn");

const renameFolderBtn = document.getElementById("renameFolderBtn");

const backBtn = document.getElementById("backBtn");

const exportCodexBtn = document.getElementById("exportCodexBtn");

const importCodexBtn = document.getElementById("importCodexBtn");

const importCodexInput = document.getElementById("importCodexInput");

// =====================================================
// REVIEW ELEMENTS
// =====================================================

const reviewModeBtn = document.getElementById("reviewModeBtn");

const reviewWorkspace = document.getElementById("reviewWorkspace");

const reviewModeSelectorBtn = document.getElementById("reviewModeSelectorBtn");

const reviewModeSelectorLabel = document.getElementById(
  "reviewModeSelectorLabel",
);

const reviewModeOptions = document.querySelectorAll(".review-mode-option");

let selectedMode = "multiple-choice";

reviewModeOptions.forEach((btn) => {
  btn.addEventListener("click", function () {
    reviewModeOptions.forEach((b) => b.classList.remove("selected"));
    this.classList.add("selected");
    selectedMode = this.dataset.mode;
  });
});

const reviewProgress = document.getElementById("reviewProgress");

const reviewQuestion = document.getElementById("reviewQuestion");

const multipleChoiceReview = document.getElementById("multipleChoiceReview");

const multipleChoiceAnswers = document.getElementById("multipleChoiceAnswers");

const shortAnswerReview = document.getElementById("shortAnswerReview");

const shortAnswerInput = document.getElementById("shortAnswerInput");

const checkShortAnswerBtn = document.getElementById("checkShortAnswerBtn");

const matchReview = document.getElementById("matchReview");

const matchBoard = document.getElementById("matchBoard");

const checkMatchBtn = document.getElementById("checkMatchBtn");

const recallReview = document.getElementById("recallReview");

const revealRecallBtn = document.getElementById("revealRecallBtn");

const recallAnswer = document.getElementById("recallAnswer");

const reviewResult = document.getElementById("reviewResult");

const reviewRatingArea = document.getElementById("reviewRatingArea");

const reviewPreviousBtn = document.getElementById("reviewPreviousBtn");

const reviewNextBtn = document.getElementById("reviewNextBtn");

// =====================================================
// STORAGE HELPERS
// =====================================================

function saveFolders() {
  localStorage.setItem("codexFolders", JSON.stringify(rootFolder));
}

function getCurrentCards() {
  if (!currentFolder.cards) {
    currentFolder.cards = [];
  }

  return currentFolder.cards;
}

// =====================================================
// BREADCRUMB
// =====================================================

function updateBreadcrumb() {
  const breadcrumb = document.getElementById("folderBreadcrumb");

  if (!breadcrumb) {
    return;
  }

  const names = ["Root"];

  for (const folder of folderHistory) {
    if (folder !== rootFolder) {
      names.push(folder.name);
    }
  }

  if (currentFolder !== rootFolder) {
    names.push(currentFolder.name);
  }

  breadcrumb.textContent = "📁 " + names.join(" > ");
}

// =====================================================
// FOLDERS
// =====================================================

function renderFolders() {
  if (!folderList) {
    return;
  }

  folderList.innerHTML = "";

  const folderActions = document.querySelector(".folder-actions");

  if (folderActions) {
    folderActions.style.display = currentFolder === rootFolder ? "none" : "";
  }

  for (const folder of currentFolder.children || []) {
    const button = document.createElement("button");

    button.textContent = "📁 " + folder.name;

    button.addEventListener("click", () => {
      folderHistory.push(currentFolder);

      currentFolder = folder;

      updateReviewDueCounts();

      updateNextReviewPanel();

      currentIndex = 0;

      renderFolders();

      render();

      updateBreadcrumb();

      closeReview();
    });

    folderList.appendChild(button);
  }
}

// =====================================================
// ADD FOLDER
// =====================================================

if (addFolderBtn) {
  addFolderBtn.addEventListener("click", () => {
    const name = prompt("Folder name:");

    if (!name) {
      return;
    }

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    if (!currentFolder.children) {
      currentFolder.children = [];
    }

    currentFolder.children.push({
      name: trimmed,
      cards: [],
      children: [],
    });

    saveFolders();

    renderFolders();
  });
}

// =====================================================
// RENAME FOLDER
// =====================================================

if (renameFolderBtn) {
  renameFolderBtn.addEventListener("click", () => {
    if (currentFolder === rootFolder) {
      alert("You can't rename the Root folder.");

      return;
    }

    const name = prompt("New folder name:", currentFolder.name);

    if (!name) {
      return;
    }

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    currentFolder.name = trimmed;

    saveFolders();

    renderFolders();

    updateBreadcrumb();
  });
}

// =====================================================
// DELETE FOLDER
// =====================================================

if (deleteFolderBtn) {
  deleteFolderBtn.addEventListener("click", () => {
    if (currentFolder === rootFolder) {
      alert("You can't delete the Root folder.");

      return;
    }

    const confirmed = confirm(
      `Delete folder "${currentFolder.name}"?\n\nThis will permanently delete this folder and everything inside it.`,
    );

    if (!confirmed) {
      return;
    }

    const parent = folderHistory[folderHistory.length - 1];

    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(currentFolder);

    if (index !== -1) {
      parent.children.splice(index, 1);
    }

    currentFolder = parent;

    folderHistory.pop();

    currentIndex = 0;

    updateReviewDueCounts();

    saveFolders();

    renderFolders();

    render();

    updateBreadcrumb();

    closeReview();
  });
}

// =====================================================
// BACK
// =====================================================

if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (folderHistory.length === 0) {
      return;
    }

    currentFolder = folderHistory.pop();

    currentIndex = 0;

    updateReviewDueCounts();

    renderFolders();

    render();

    updateBreadcrumb();

    closeReview();
  });
}

// =====================================================
// FILTER
// =====================================================

function updateFilteredCards() {
  filteredCards = [...getCurrentCards()];

  if (currentIndex >= filteredCards.length) {
    currentIndex = filteredCards.length - 1;
  }

  if (currentIndex < 0) {
    currentIndex = 0;
  }
}

// =====================================================
// NORMAL FLASHCARD RENDER
// =====================================================

function render() {
  if (!frontEl || !backEl || !cardCounter) {
    return;
  }

  updateFilteredCards();

  if (filteredCards.length === 0) {
    frontEl.textContent = "No Cards";

    backEl.textContent = "Add a card.";

    cardCounter.textContent = "0 / 0";

    return;
  }

  const currentCard = filteredCards[currentIndex];

  frontEl.textContent = currentCard.front || "";

  backEl.textContent = currentCard.back || "";

  cardCounter.textContent =
    "Card " + (currentIndex + 1) + " / " + filteredCards.length;

  card?.classList.remove("flipped");

  flipped = false;
}

// =====================================================
// FLIP CARD
// =====================================================

if (card) {
  card.addEventListener("click", () => {
    if (filteredCards.length === 0) {
      return;
    }

    flipped = !flipped;

    card.classList.toggle("flipped");
  });
}

// =====================================================
// NEXT / PREVIOUS
// =====================================================

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentIndex < filteredCards.length - 1) {
      currentIndex++;

      render();
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;

      render();
    }
  });
}

// =====================================================
// ADD / EDIT CARD
// =====================================================

if (addCardBtn) {
  addCardBtn.addEventListener("click", () => {
    const front = frontInput.value.trim();

    const back = backInput.value.trim();

    if (!front || !back) {
      alert("Please fill in both fields.");

      return;
    }

    if (editingCard) {
      editingCard.front = front;

      editingCard.back = back;

      editingCard = null;

      addCardBtn.textContent = "Add Card";
    } else {
      getCurrentCards().push({
        front,
        back,
      });
    }

    saveFolders();

    frontInput.value = "";

    backInput.value = "";

    render();
  });
}

// =====================================================
// EDIT CARD
// =====================================================

if (editCardBtn) {
  editCardBtn.addEventListener("click", () => {
    updateFilteredCards();

    if (filteredCards.length === 0) {
      return;
    }

    editingCard = filteredCards[currentIndex];

    frontInput.value = editingCard.front || "";

    backInput.value = editingCard.back || "";

    addCardBtn.textContent = "Save Changes";
  });
}

// =====================================================
// DELETE CARD
// =====================================================

if (deleteCardBtn) {
  deleteCardBtn.addEventListener("click", () => {
    updateFilteredCards();

    if (filteredCards.length === 0) {
      return;
    }

    const cardToDelete = filteredCards[currentIndex];

    const cards = getCurrentCards();

    const index = cards.indexOf(cardToDelete);

    if (index !== -1) {
      cards.splice(index, 1);
    }

    currentIndex = Math.max(0, currentIndex - 1);

    saveFolders();

    render();
  });
}

// =====================================================
// BULK ADD
// =====================================================

if (bulkAddBtn) {
  bulkAddBtn.addEventListener("click", () => {
    const lines = bulkInput.value.split("\n");

    let added = 0;

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const separator = line.indexOf("|");

      if (separator === -1) {
        continue;
      }

      const front = line.slice(0, separator).trim();

      const back = line.slice(separator + 1).trim();

      if (!front || !back) {
        continue;
      }

      getCurrentCards().push({
        front,
        back,
      });

      added++;
    }

    saveFolders();

    bulkInput.value = "";

    render();

    console.log(`Added ${added} cards.`);
  });
}

// =====================================================
// SRS
// =====================================================

function createSRSData() {
  return {
    due: new Date().toISOString(),
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    lapses: 0,
  };
}

function ensureSRS(card, mode = "multipleChoice") {
  const modeMap = {
    "multiple-choice": "multipleChoice",
    "short-answer": "shortAnswer",
    match: "match",
    recall: "recall",
  };

  mode = modeMap[mode] || mode;
  // New SRS structure
  if (!card.srs || !card.srs.multipleChoice) {
    const oldSRS = card.srs;

    card.srs = {
      multipleChoice: oldSRS || createSRSData(),
      shortAnswer: createSRSData(),
      match: createSRSData(),
      recall: createSRSData(),
    };
  }

  // Make sure every mode exists.
  if (!card.srs[mode]) {
    card.srs[mode] = createSRSData();
  }

  return card.srs[mode];
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function resetCurrentFolderSRS() {
  for (const card of getCurrentCards()) {
    card.srs = {
      multipleChoice: createSRSData(),
      shortAnswer: createSRSData(),
      match: createSRSData(),
      recall: createSRSData(),
    };
  }

  saveFolders();

  updateReviewDueCounts();
  updateNextReviewPanel();

  console.log(
    `Reset SRS for ${getCurrentCards().length} cards in "${currentFolder.name}".`,
  );
}
function formatTimeUntil(date) {
  const diff = new Date(date).getTime() - getCurrentTime().getTime();

  if (diff <= 0) {
    return "Due now";
  }

  const minutes = Math.ceil(diff / (1000 * 60));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.ceil(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.ceil(hours / 24);

  return `${days}d`;
}
// =====================================================
// SCHEDULE CARD
// =====================================================

function scheduleCard(card, rating, mode = "multipleChoice") {
  const srsMode =
    {
      "multiple-choice": "multipleChoice",
      "short-answer": "shortAnswer",
      match: "match",
      recall: "recall",
    }[mode] || mode;

  const srs = ensureSRS(card, srsMode);

  console.log("SRS before scheduling:", card.srs);

  const now = getCurrentTime();

  if (rating === "again") {
    srs.lapses++;

    srs.repetitions = 0;

    srs.interval = 0;

    srs.due = addMinutes(now, 10).toISOString();
  } else if (rating === "hard") {
    srs.interval = 1;

    srs.repetitions++;

    srs.due = addDays(now, 1).toISOString();
  } else if (rating === "good") {
    srs.interval = 3;

    srs.repetitions++;

    srs.due = addDays(now, 3).toISOString();
  } else if (rating === "easy") {
    srs.interval = 7;

    srs.repetitions++;

    srs.due = addDays(now, 7).toISOString();
  }
  console.log("SRS after scheduling:", card.srs);
  console.log("SRS scheduled:", {
    mode,
    rating,
    due: srs.due,
  });
  saveFolders();
}

function isCardDue(card, mode = "multipleChoice") {
  const srs = ensureSRS(card, mode);
  return new Date(srs.due) <= getCurrentTime();
}

function getDueCards(mode = "multipleChoice") {
  const srsModeMap = {
    "multiple-choice": "multipleChoice",
    "short-answer": "shortAnswer",
    match: "match",
    recall: "recall",
  };

  const srsMode = srsModeMap[mode] || mode;

  return getCurrentCards().filter((card) => isCardDue(card, srsMode));
}
function getUpcomingReviews() {
  const srsModeMap = {
    "multiple-choice": "multipleChoice",
    "short-answer": "shortAnswer",
    match: "match",
    recall: "recall",
  };

  const srsMode = srsModeMap[reviewMode] || reviewMode;

  return getCurrentCards()
    .filter((card) => {
      const srs = card.srs?.[srsMode];

      return srs && new Date(srs.due) > getCurrentTime();
    })
    .sort(
      (a, b) => new Date(a.srs[srsMode].due) - new Date(b.srs[srsMode].due),
    );
}
function getReviewDueCounts() {
  return {
    multipleChoice: getDueCards("multipleChoice").length,
    shortAnswer: getDueCards("shortAnswer").length,
    match: getDueCards("match").length,
    recall: getDueCards("recall").length,
  };
}
function updateReviewDueCounts() {
  const counts = getReviewDueCounts();

  document.querySelectorAll(".review-mode-due").forEach((element) => {
    const mode = element.dataset.dueMode;

    const count = counts[mode];

    element.textContent = `${count} due`;
  });
}
function getAllDueCards(folder = rootFolder) {
  let cards = [];

  for (const card of folder.cards || []) {
    if (isCardDue(card)) {
      cards.push(card);
    }
  }

  for (const child of folder.children || []) {
    cards = cards.concat(getAllDueCards(child));
  }

  return cards;
}

// =====================================================
// REVIEW WORKSPACE
// =====================================================

function openReview() {
  if (!reviewWorkspace) {
    console.error("Review workspace not found.");

    return;
  }

  reviewModeBtn.textContent = "✕ Cancel";

  // Hide normal flashcards.
  document.querySelector(".card-counter-container")?.classList.add("hidden");

  document.querySelector(".card-container")?.classList.add("hidden");

  // Show Review.
  reviewWorkspace.classList.remove("hidden");

  // Reset the mode BEFORE pulling due cards, so the cards we
  // fetch actually match the mode the UI is about to show.
  reviewCards = getDueCards(reviewMode);
  originalReviewCount = reviewCards.length;
  stillNeedsReview = [];
  isRetryPhase = false;
  lastAnswerCorrect = false;

  if (reviewCards.length === 0) {
    alert("No cards are due for review.");
    return;
  }

  reviewIndex = 0;

  reviewScore = 0;

  reviewAnswered = false;

  updateReviewDueCounts();

  updateReviewModeLabel();

  renderReview();
}
function updateNextReviewPanel() {
  if (!nextReviewPanel || !nextReviewList) {
    return;
  }

  if (currentFolder === rootFolder) {
    nextReviewPanel.classList.add("hidden");
    return;
  }

  nextReviewPanel.classList.remove("hidden");

  const upcomingReviews = getUpcomingReviews();

  nextReviewList.innerHTML = "";

  if (upcomingReviews.length === 0) {
    nextReviewList.textContent = "No upcoming reviews.";
    return;
  }

  for (const card of upcomingReviews.slice(0, 10)) {
    const item = document.createElement("div");

    item.className = "next-review-item";

    const srsModeMap = {
      "multiple-choice": "multipleChoice",
      "short-answer": "shortAnswer",
      match: "match",
      recall: "recall",
    };

    const srsMode = srsModeMap[reviewMode] || reviewMode;

    const time = formatTimeUntil(card.srs[srsMode].due);

    item.innerHTML = `
      <span>${card.front}</span>
      <strong>${time}</strong>
    `;

    nextReviewList.appendChild(item);
  }
}
// =====================================================
// CLOSE REVIEW
// =====================================================

function closeReview() {
  if (!reviewWorkspace) {
    return;
  }

  reviewModeBtn.textContent = "📚 Review";
  reviewWorkspace.classList.add("hidden");

  // Restore normal flashcards.
  document.querySelector(".card-counter-container")?.classList.remove("hidden");

  document.querySelector(".card-container")?.classList.remove("hidden");

  reviewCards = [];

  reviewIndex = 0;

  reviewScore = 0;

  reviewAnswered = false;
}

// =====================================================
// REVIEW COUNT
// =====================================================

// =====================================================
// REVIEW MODE LABEL
// =====================================================

function updateReviewModeLabel() {
  const modes = {
    "multiple-choice": "🎯 Multiple Choice",

    "short-answer": "✍️ Short Answer",

    match: "🔗 Match",

    recall: "🧠 Recall",
  };

  const label = modes[reviewMode] || modes["multiple-choice"];

  if (reviewModeSelectorLabel) {
    reviewModeSelectorLabel.textContent = label;
  }

  if (reviewModeSelectorBtn) {
    reviewModeSelectorBtn.setAttribute("aria-label", `Review mode: ${label}`);
  }
}

// =====================================================
// CHANGE REVIEW MODE
// =====================================================

reviewModeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const mode = option.dataset.mode;

    if (!mode) {
      return;
    }

    reviewMode = mode;

    reviewIndex = 0;

    reviewScore = 0;

    reviewAnswered = false;

    updateReviewModeLabel();

    renderReview();
  });
});

// =====================================================
// RENDER REVIEW
// =====================================================

function renderReview() {
  // Clear previous dynamically
  // created next button.

  hideReviewModes();

  if (reviewCards.length === 0) {
    showReviewComplete();

    return;
  }

  const currentCard = reviewCards[reviewIndex];

  if (!currentCard) {
    showReviewComplete();

    return;
  }

  reviewAnswered = false;

  if (reviewProgress) {
    if (isRetryPhase) {
      reviewProgress.textContent = `Still Needs Review • ${reviewIndex + 1} / ${reviewCards.length}`;
    } else {
      reviewProgress.textContent = `${reviewIndex + 1} / ${originalReviewCount}`;
    }
  }

  if (reviewQuestion) {
    reviewQuestion.textContent = currentCard.front || "";
  }

  if (reviewResult) {
    reviewResult.className = "review-result hidden";

    reviewResult.textContent = "";
  }

  if (reviewRatingArea) {
    reviewRatingArea.classList.add("hidden");
  }

  if (reviewMode === "multiple-choice") {
    renderMultipleChoice();
  } else if (reviewMode === "short-answer") {
    renderShortAnswer();
  } else if (reviewMode === "match") {
    renderMatch();
  } else if (reviewMode === "recall") {
    renderRecall();
  }
  updateReviewNavigation();
}

function updateReviewNavigation() {
  if (reviewPreviousBtn) {
    reviewPreviousBtn.disabled = reviewIndex === 0;
  }

  if (reviewNextBtn) {
    reviewNextBtn.disabled = !reviewAnswered;

    reviewNextBtn.textContent =
      reviewIndex === reviewCards.length - 1 ? "Finish →" : "Next →";
  }
}
if (reviewPreviousBtn) {
  reviewPreviousBtn.addEventListener("click", () => {
    if (reviewIndex <= 0) {
      return;
    }

    reviewIndex--;

    reviewAnswered = false;

    renderReview();
  });
}
if (reviewNextBtn) {
  reviewNextBtn.addEventListener("click", () => {
    if (!reviewAnswered) {
      return;
    }

    if (reviewIndex < reviewCards.length - 1) {
      reviewIndex++;

      reviewAnswered = false;

      renderReview();
    } else {
      finishReview();
    }
  });
}
// =====================================================
// HIDE REVIEW MODES
// =====================================================

function hideReviewModes() {
  multipleChoiceReview?.classList.add("hidden");

  shortAnswerReview?.classList.add("hidden");

  matchReview?.classList.add("hidden");

  recallReview?.classList.add("hidden");
}

// =====================================================
// MULTIPLE CHOICE
// =====================================================

function renderMultipleChoice() {
  if (!multipleChoiceReview || !multipleChoiceAnswers) {
    return;
  }

  multipleChoiceReview.classList.remove("hidden");

  multipleChoiceAnswers.innerHTML = "";

  const currentCard = reviewCards[reviewIndex];

  if (!currentCard) {
    return;
  }

  const answers = [currentCard.back];

  const otherCards = reviewCards.filter((item) => item !== currentCard);

  const shuffled = [...otherCards].sort(() => Math.random() - 0.5);

  for (const otherCard of shuffled.slice(0, 3)) {
    if (!answers.includes(otherCard.back)) {
      answers.push(otherCard.back);
    }
  }

  answers.sort(() => Math.random() - 0.5);

  for (const answer of answers) {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "multiple-choice-btn";

    button.textContent = answer;

    button.addEventListener("click", () => {
      if (reviewAnswered) {
        return;
      }

      reviewAnswered = false;

      const correct = answer === currentCard.back;

      lastAnswerCorrect = correct;

      if (correct) {
        reviewScore++;
      }

      markMultipleChoiceButtons(currentCard, answer);

      reviewRatingArea?.classList.remove("hidden");

      updateReviewNavigation();
    });

    multipleChoiceAnswers.appendChild(button);
  }
}

function markMultipleChoiceButtons(currentCard, selectedAnswer) {
  const buttons = multipleChoiceAnswers?.querySelectorAll("button");

  buttons?.forEach((button) => {
    button.disabled = true;

    // Always show the correct answer in green
    if (button.textContent === currentCard.back) {
      button.classList.add("correct");
    }

    // If the user selected the wrong answer,
    // show their selection in red.
    if (
      button.textContent === selectedAnswer &&
      selectedAnswer !== currentCard.back
    ) {
      button.classList.add("incorrect");
    }
  });
}

// =====================================================
// SHORT ANSWER
// =====================================================

function renderShortAnswer() {
  if (!shortAnswerReview) {
    return;
  }

  shortAnswerReview.classList.remove("hidden");

  if (shortAnswerInput) {
    shortAnswerInput.value = "";

    shortAnswerInput.disabled = false;
  }

  if (checkShortAnswerBtn) {
    checkShortAnswerBtn.disabled = false;
  }
}

function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

if (checkShortAnswerBtn) {
  checkShortAnswerBtn.addEventListener("click", () => {
    if (reviewAnswered) {
      return;
    }

    const currentCard = reviewCards[reviewIndex];

    if (!currentCard) {
      return;
    }

    const userAnswer = normalizeAnswer(shortAnswerInput.value);

    const correctAnswer = normalizeAnswer(currentCard.back);

    if (!userAnswer) {
      return;
    }

    reviewAnswered = true;

    const correct = userAnswer === correctAnswer;

    if (correct) {
      reviewScore++;
    }

    showReviewResult(
      correct ? "correct" : "incorrect",

      correct
        ? "Correct!"
        : `Not an exact match.\n\nExpected answer:\n${currentCard.back}`,
    );

    scheduleCard(currentCard, correct ? "good" : "again", "multipleChoice");

    shortAnswerInput.disabled = true;

    checkShortAnswerBtn.disabled = true;

    updateReviewNavigation();
  });
}

// =====================================================
// RECALL
// =====================================================

function renderRecall() {
  if (!recallReview) {
    return;
  }

  recallReview.classList.remove("hidden");

  recallAnswer?.classList.add("hidden");

  revealRecallBtn?.classList.remove("hidden");
}

if (revealRecallBtn) {
  revealRecallBtn.addEventListener("click", () => {
    const currentCard = reviewCards[reviewIndex];

    if (!currentCard) {
      return;
    }

    recallAnswer.textContent = currentCard.back;

    recallAnswer.classList.remove("hidden");

    revealRecallBtn.classList.add("hidden");

    reviewAnswered = true;

    showReviewResult("correct", "Answer revealed. Rate how well you knew it.");

    reviewRatingArea?.classList.remove("hidden");
  });
}

// =====================================================
// MATCH
// =====================================================

function renderMatch() {
  if (!matchReview || !matchBoard) {
    return;
  }

  matchReview.classList.remove("hidden");

  matchBoard.innerHTML = "";

  const cards = reviewCards.slice(reviewIndex, reviewIndex + 4);

  if (cards.length < 2) {
    matchBoard.textContent = "Not enough cards to create a matching set.";

    return;
  }

  const questions = cards.map((item, index) => ({
    id: `q-${index}`,
    text: item.front,
  }));

  const answers = cards.map((item, index) => ({
    id: `a-${index}`,
    text: item.back,
  }));

  answers.sort(() => Math.random() - 0.5);

  const questionColumn = document.createElement("div");

  questionColumn.className = "match-column";

  const answerColumn = document.createElement("div");

  answerColumn.className = "match-column";

  questions.forEach((question) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "match-item";

    button.dataset.id = question.id;

    button.textContent = question.text;

    button.addEventListener("click", () => selectMatchItem(button, "question"));

    questionColumn.appendChild(button);
  });

  answers.forEach((answer) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "match-item";

    button.dataset.id = answer.id;

    button.textContent = answer.text;

    button.addEventListener("click", () => selectMatchItem(button, "answer"));

    answerColumn.appendChild(button);
  });

  matchBoard.appendChild(questionColumn);

  matchBoard.appendChild(answerColumn);

  reviewMatchSelections = [];
}

function selectMatchItem(button, type) {
  const existing = reviewMatchSelections.find((item) => item.type === type);

  if (existing) {
    existing.button.classList.remove("selected");
  }

  reviewMatchSelections = reviewMatchSelections.filter(
    (item) => item.type !== type,
  );

  button.classList.add("selected");

  reviewMatchSelections.push({
    type,
    id: button.dataset.id,
    button,
  });
}

if (checkMatchBtn) {
  checkMatchBtn.addEventListener("click", () => {
    if (reviewMatchSelections.length !== 2) {
      return;
    }

    const question = reviewMatchSelections.find(
      (item) => item.type === "question",
    );

    const answer = reviewMatchSelections.find((item) => item.type === "answer");

    if (!question || !answer) {
      return;
    }

    const questionIndex = question.id.replace("q-", "");

    const answerIndex = answer.id.replace("a-", "");

    const correct = questionIndex === answerIndex;

    if (correct) {
      reviewMatchSelections.forEach((item) => {
        item.button.classList.remove("selected");
        item.button.classList.add("correct");
      });

      reviewMatchSelections = [];
    } else {
      reviewMatchSelections.forEach((item) => {
        item.button.classList.remove("selected");
        item.button.classList.add("incorrect");
      });

      setTimeout(() => {
        reviewMatchSelections.forEach((item) => {
          item.button.classList.remove("incorrect");
        });

        reviewMatchSelections = [];
      }, 700);
    }

    if (correct) {
      reviewScore++;
    }

    if (correct) {
      reviewAnswered = false;

      showReviewResult("correct", "Correct match!");

      updateReviewNavigation();
    } else {
      reviewAnswered = false;

      showReviewResult("incorrect", "That pair doesn't match. Try again.");

      updateReviewNavigation();
    }

    const currentCard = reviewCards[reviewIndex];

    if (currentCard) {
      scheduleCard(currentCard, correct ? "good" : "again", "match");
    }

    showNextReviewButton();
  });
}

// =====================================================
// REVIEW RESULT
// =====================================================

function showReviewResult(type, message) {
  if (!reviewResult) {
    return;
  }

  reviewResult.className = `review-result ${type}`;

  reviewResult.classList.remove("hidden");

  reviewResult.textContent = message;
}

// =====================================================
// FINISH REVIEW
// =====================================================

function finishReview() {
  hideReviewModes();

  if (reviewProgress) {
    reviewProgress.textContent = "Complete";
  }

  if (reviewQuestion) {
    reviewQuestion.textContent = "🎉 Review complete!";
  }

  if (reviewResult) {
    reviewResult.className = "review-result complete";

    reviewResult.classList.remove("hidden");

    reviewResult.textContent = `Score: ${reviewScore} / ${reviewCards.length}`;
  }

  if (reviewRatingArea) {
    reviewRatingArea.classList.add("hidden");
  }

  updateReviewDueCounts();

  stillNeedsReview = [];
  isRetryPhase = false;
  lastAnswerCorrect = false;
}

// =====================================================
// SRS RATING BUTTONS
// =====================================================

document.querySelectorAll(".review-rating-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const currentCard = reviewCards[reviewIndex];

    if (!currentCard) {
      return;
    }

    scheduleCard(currentCard, button.dataset.rating, reviewMode);

    const srsModeMap = {
      "multiple-choice": "multipleChoice",
      "short-answer": "shortAnswer",
      match: "match",
      recall: "recall",
    };

    const srsMode = srsModeMap[reviewMode] || reviewMode;
    const srs = ensureSRS(currentCard, srsMode);

    if (reviewResult) {
      reviewResult.textContent = `Next review: ${formatTimeUntil(srs.due)}`;
      reviewResult.className = "review-result";
      reviewResult.classList.remove("hidden");
    }

    reviewAnswered = true;

    updateReviewDueCounts();

    if (!lastAnswerCorrect) {
      stillNeedsReview.push(currentCard);
    }

    reviewIndex++;

    if (reviewIndex >= reviewCards.length) {
      if (stillNeedsReview.length > 0) {
        isRetryPhase = true;
        reviewCards = [...stillNeedsReview];

        stillNeedsReview = [];

        reviewIndex = 0;

        renderReview();
      } else {
        finishReview();
      }
    } else {
      renderReview();
    }
  });
});

// =====================================================
// REVIEW BUTTON
// =====================================================

if (reviewModeBtn) {
  reviewModeBtn.addEventListener("click", () => {
    // If review is active, close it
    if (!reviewWorkspace.classList.contains("hidden")) {
      closeReview();
      reviewModeBtn.textContent = "📚 Review";
      return;
    }

    // Otherwise show overlay
    const overlay = document.getElementById("reviewOverlay");
    if (overlay) {
      overlay.classList.remove("overlay-hidden");
    }
  });
}

const cancelBtn = document.getElementById("cancelReviewBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    const overlay = document.getElementById("reviewOverlay");
    if (overlay) {
      overlay.classList.add("overlay-hidden");
    }
  });
}

const startBtn = document.getElementById("startReviewBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const overlay = document.getElementById("reviewOverlay");
    if (overlay) {
      overlay.classList.add("overlay-hidden");
    }

    // Get selected mode
    const selected = document.querySelector(".review-mode-option.selected");
    const mode = selected ? selected.dataset.mode : "multiple-choice";
    reviewMode = mode;

    // Get random toggle
    const randomToggle = document
      .getElementById("randomOrderToggle")
      .querySelector("input");
    const isRandom = randomToggle ? randomToggle.checked : false;

    // If random is on, shuffle cards
    if (isRandom) {
      const cards = getCurrentCards();
      cards.sort(() => Math.random() - 0.5);
      console.log(
        "Shuffled cards:",
        cards.map((c) => c.front),
      );
    }

    openReview();
  });
}

// =====================================================
// EXPORT
// =====================================================

if (exportCodexBtn) {
  exportCodexBtn.addEventListener("click", () => {
    const exportData = {
      version: 1,

      exportedAt: new Date().toISOString(),

      app: "Ascend Codex",

      data: rootFolder,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    const today = new Date().toISOString().slice(0, 10);

    a.download = `ascend-codex-v1-${today}.json`;

    a.click();

    URL.revokeObjectURL(url);
  });
}

// =====================================================
// IMPORT
// =====================================================

if (importCodexBtn) {
  importCodexBtn.addEventListener("click", () => {
    importCodexInput.click();
  });
}

if (importCodexInput) {
  importCodexInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);

        if (backup.app !== "Ascend Codex") {
          alert("Invalid Codex backup.");

          return;
        }

        if (backup.version !== 1) {
          alert("Unsupported backup version.");

          return;
        }

        const confirmed = confirm(
          "Importing will replace your current Codex.\n\nContinue?",
        );

        if (!confirmed) {
          return;
        }

        rootFolder = backup.data;

        currentFolder = rootFolder;

        folderHistory = [];

        currentIndex = 0;

        saveFolders();

        renderFolders();

        render();

        updateBreadcrumb();

        closeReview();

        alert("Codex imported successfully!");
      } catch (error) {
        console.error(error);

        alert("Failed to import backup.");
      }

      importCodexInput.value = "";
    };

    reader.readAsText(file);
  });
}

// =====================================================
// INITIALIZE
// =====================================================

renderFolders();

render();

updateBreadcrumb();

updateReviewModeLabel();

updateReviewDueCounts();

updateNextReviewPanel();

console.log("📚 Ascend Codex loaded");
