// =====================================================
// ASCEND CODEX
// Flashcards + Review + SRS
// =====================================================

// =====================================================
// STORAGE
// =====================================================

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

let reviewIndex = 0;

let reviewMode = null;

let reviewAnswered = false;

let reviewScore = 0;

let reviewMatchSelections = [];

// =====================================================
// ELEMENTS
// =====================================================

const card = document.getElementById("flipCard");

const frontEl = document.getElementById("cardFront");

const backEl = document.getElementById("cardBack");

const cardCounter = document.getElementById("cardCounter");

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

const reviewArea = document.getElementById("reviewArea");

const reviewDueCount = document.getElementById("reviewDueCount");

const reviewModeSelector = document.getElementById("reviewModeSelector");

const reviewSession = document.getElementById("reviewSession");

const changeReviewModeBtn = document.getElementById("changeReviewModeBtn");

const reviewProgress = document.getElementById("reviewProgress");

const reviewQuestion = document.getElementById("reviewQuestion");

const multipleChoiceArea = document.getElementById("multipleChoiceArea");

const multipleChoiceAnswers = document.getElementById("multipleChoiceAnswers");

const shortAnswerArea = document.getElementById("shortAnswerArea");

const shortAnswerInput = document.getElementById("shortAnswerInput");

const checkShortAnswerBtn = document.getElementById("checkShortAnswerBtn");

const matchArea = document.getElementById("matchArea");

const matchBoard = document.getElementById("matchBoard");

const checkMatchBtn = document.getElementById("checkMatchBtn");

const recallArea = document.getElementById("recallArea");

const revealRecallBtn = document.getElementById("revealRecallBtn");

const recallAnswer = document.getElementById("recallAnswer");

const reviewResult = document.getElementById("reviewResult");

const reviewRatingArea = document.getElementById("reviewRatingArea");

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

  for (const folder of currentFolder.children || []) {
    const button = document.createElement("button");

    button.textContent = "📁 " + folder.name;

    button.addEventListener("click", () => {
      folderHistory.push(currentFolder);

      currentFolder = folder;

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
// RENDER FLASHCARD
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

  card.classList.remove("flipped");

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
// SPACED REPETITION
// =====================================================

function ensureSRS(card) {
  if (!card.srs) {
    card.srs = {
      due: new Date().toISOString(),

      interval: 0,

      ease: 2.5,

      repetitions: 0,

      lapses: 0,
    };
  }

  return card.srs;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// =====================================================
// SCHEDULE CARD
// =====================================================

function scheduleCard(card, rating) {
  const srs = ensureSRS(card);

  const now = new Date();

  if (rating === "again") {
    srs.lapses++;

    srs.repetitions = 0;

    srs.interval = 0;

    srs.due = addMinutes(now, 10).toISOString();
  } else if (rating === "hard") {
    srs.interval =
      srs.interval <= 0 ? 1 : Math.max(1, Math.round(srs.interval * 1.2));

    srs.ease = Math.max(1.3, srs.ease - 0.15);

    srs.repetitions++;

    srs.due = addDays(now, srs.interval).toISOString();
  } else if (rating === "good") {
    if (srs.interval <= 0) {
      srs.interval = 1;
    } else if (srs.interval === 1) {
      srs.interval = 3;
    } else {
      srs.interval = Math.max(
        srs.interval + 1,
        Math.round(srs.interval * srs.ease),
      );
    }

    srs.repetitions++;

    srs.due = addDays(now, srs.interval).toISOString();
  } else if (rating === "easy") {
    srs.interval =
      srs.interval <= 0
        ? 4
        : Math.max(srs.interval + 1, Math.round(srs.interval * srs.ease * 1.3));

    srs.ease = Math.min(3.0, srs.ease + 0.15);

    srs.repetitions++;

    srs.due = addDays(now, srs.interval).toISOString();
  }

  saveFolders();
}

function isCardDue(card) {
  const srs = ensureSRS(card);

  return new Date(srs.due) <= new Date();
}

function getDueCards() {
  return getCurrentCards().filter((card) => isCardDue(card));
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
// REVIEW
// =====================================================

function openReview() {
  if (!reviewArea) {
    return;
  }

  reviewArea.classList.remove("hidden");

  document.getElementById("flashcardWorkspace")?.classList.add("hidden");

  reviewCards = getDueCards();

  reviewIndex = 0;

  reviewScore = 0;

  reviewMode = null;

  reviewAnswered = false;

  updateReviewDueCount();

  showReviewSelector();
}

function closeReview() {
  if (!reviewArea) {
    return;
  }

  reviewArea.classList.add("hidden");

  document.getElementById("flashcardWorkspace")?.classList.remove("hidden");

  reviewCards = [];

  reviewIndex = 0;

  reviewMode = null;
}

function updateReviewDueCount() {
  if (!reviewDueCount) {
    return;
  }

  reviewDueCount.textContent =
    reviewCards.length === 1 ? "1 card due" : `${reviewCards.length} cards due`;
}

// =====================================================
// REVIEW MODE SELECTOR
// =====================================================

function showReviewSelector() {
  reviewModeSelector.classList.remove("hidden");

  reviewSession.classList.add("hidden");
}

function startReviewMode(mode) {
  if (reviewCards.length === 0) {
    showNoCardsMessage();

    return;
  }

  reviewMode = mode;

  reviewIndex = 0;

  reviewScore = 0;

  reviewModeSelector.classList.add("hidden");

  reviewSession.classList.remove("hidden");

  renderReviewQuestion();
}

function showNoCardsMessage() {
  reviewModeSelector.classList.add("hidden");

  reviewSession.classList.remove("hidden");

  reviewProgress.textContent = "Complete";

  reviewQuestion.textContent = "🎉 You're caught up!";

  hideAllReviewModes();

  reviewResult.classList.remove("hidden");

  reviewResult.textContent = "There are no cards due in this folder right now.";
}

// =====================================================
// REVIEW QUESTION
// =====================================================

function renderReviewQuestion() {
  const currentCard = reviewCards[reviewIndex];

  if (!currentCard) {
    finishReview();

    return;
  }

  reviewAnswered = false;

  reviewProgress.textContent = `${reviewIndex + 1} / ${reviewCards.length}`;

  reviewQuestion.textContent = currentCard.front;

  reviewResult.classList.add("hidden");

  reviewRatingArea.classList.add("hidden");

  hideAllReviewModes();

  if (reviewMode === "multiple-choice") {
    renderMultipleChoice();
  } else if (reviewMode === "short-answer") {
    renderShortAnswer();
  } else if (reviewMode === "match") {
    renderMatch();
  } else if (reviewMode === "recall") {
    renderRecall();
  }
}

function hideAllReviewModes() {
  multipleChoiceArea.classList.add("hidden");

  shortAnswerArea.classList.add("hidden");

  matchArea.classList.add("hidden");

  recallArea.classList.add("hidden");
}

// =====================================================
// MULTIPLE CHOICE
// =====================================================

function renderMultipleChoice() {
  multipleChoiceArea.classList.remove("hidden");

  multipleChoiceAnswers.innerHTML = "";

  const currentCard = reviewCards[reviewIndex];

  const answers = [currentCard.back];

  const otherCards = reviewCards.filter((card) => card !== currentCard);

  const shuffled = [...otherCards].sort(() => Math.random() - 0.5);

  for (const card of shuffled.slice(0, 3)) {
    if (!answers.includes(card.back)) {
      answers.push(card.back);
    }
  }

  answers.sort(() => Math.random() - 0.5);

  for (const answer of answers) {
    const button = document.createElement("button");

    button.className = "multiple-choice-btn";

    button.textContent = answer;

    button.addEventListener("click", () => {
      if (reviewAnswered) {
        return;
      }

      reviewAnswered = true;

      const correct = answer === currentCard.back;

      if (correct) {
        reviewScore++;
      }

      showReviewResult(
        correct ? "correct" : "incorrect",
        correct ? "Correct!" : `Incorrect. The answer is: ${currentCard.back}`,
      );

      scheduleCard(currentCard, correct ? "good" : "again");

      disableChoiceButtons();

      showNextReviewButton();
    });

    multipleChoiceAnswers.appendChild(button);
  }
}

function disableChoiceButtons() {
  const buttons = multipleChoiceAnswers.querySelectorAll("button");

  buttons.forEach((button) => {
    button.disabled = true;

    if (button.textContent === reviewCards[reviewIndex].back) {
      button.classList.add("correct");
    }
  });
}

// =====================================================
// SHORT ANSWER
// =====================================================

function renderShortAnswer() {
  shortAnswerArea.classList.remove("hidden");

  shortAnswerInput.value = "";

  shortAnswerInput.focus();
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

    scheduleCard(currentCard, correct ? "good" : "again");

    checkShortAnswerBtn.disabled = true;

    showNextReviewButton();
  });
}

// =====================================================
// RECALL
// =====================================================

function renderRecall() {
  recallArea.classList.remove("hidden");

  recallAnswer.classList.add("hidden");

  revealRecallBtn.classList.remove("hidden");

  reviewResult.classList.add("hidden");
}

if (revealRecallBtn) {
  revealRecallBtn.addEventListener("click", () => {
    const currentCard = reviewCards[reviewIndex];

    recallAnswer.textContent = currentCard.back;

    recallAnswer.classList.remove("hidden");

    revealRecallBtn.classList.add("hidden");

    reviewResult.classList.remove("hidden");

    reviewResult.textContent = "Rate your recall below.";

    reviewRatingArea.classList.remove("hidden");
  });
}

// =====================================================
// MATCH
// =====================================================

function renderMatch() {
  matchArea.classList.remove("hidden");

  matchBoard.innerHTML = "";

  const start = reviewIndex;

  const cards = reviewCards.slice(start, start + 4);

  const questions = cards.map((card, index) => ({
    id: `q-${index}`,
    text: card.front,
  }));

  const answers = cards.map((card, index) => ({
    id: `a-${index}`,
    text: card.back,
  }));

  answers.sort(() => Math.random() - 0.5);

  const questionColumn = document.createElement("div");

  questionColumn.className = "match-column";

  const answerColumn = document.createElement("div");

  answerColumn.className = "match-column";

  questions.forEach((question) => {
    const button = document.createElement("button");

    button.className = "match-item";

    button.dataset.id = question.id;

    button.textContent = question.text;

    button.addEventListener("click", () => selectMatchItem(button, "question"));

    questionColumn.appendChild(button);
  });

  answers.forEach((answer) => {
    const button = document.createElement("button");

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

    const correct =
      question.id.replace("q-", "") === answer.id.replace("a-", "");

    reviewMatchSelections.forEach((item) => {
      item.button.classList.remove("selected");

      item.button.classList.add(correct ? "correct" : "incorrect");
    });

    if (correct) {
      reviewScore++;
    }

    reviewAnswered = true;

    showReviewResult(
      correct ? "correct" : "incorrect",
      correct ? "Correct match!" : "That pair doesn't match.",
    );

    if (reviewCards[reviewIndex]) {
      scheduleCard(reviewCards[reviewIndex], correct ? "good" : "again");
    }

    showNextReviewButton();
  });
}

// =====================================================
// REVIEW RESULT
// =====================================================

function showReviewResult(type, message) {
  reviewResult.classList.remove("hidden");

  reviewResult.className = `review-result ${type}`;

  reviewResult.textContent = message;
}

function showNextReviewButton() {
  reviewRatingArea.classList.add("hidden");

  const existing = document.getElementById("nextReviewBtn");

  if (existing) {
    existing.remove();
  }

  const button = document.createElement("button");

  button.id = "nextReviewBtn";

  button.className = "review-primary-btn";

  button.textContent =
    reviewIndex < reviewCards.length - 1 ? "Next Card →" : "Finish Review";

  button.addEventListener("click", () => {
    reviewIndex++;

    if (reviewIndex >= reviewCards.length) {
      finishReview();
    } else {
      renderReviewQuestion();
    }
  });

  reviewSession.appendChild(button);
}

// =====================================================
// FINISH REVIEW
// =====================================================

function finishReview() {
  hideAllReviewModes();

  reviewResult.classList.remove("hidden");

  reviewResult.className = "review-result complete";

  reviewResult.textContent = `🎉 Review complete!\n\nScore: ${reviewScore} / ${reviewCards.length}`;

  reviewProgress.textContent = "Complete";

  reviewRatingArea.classList.add("hidden");

  const existing = document.getElementById("nextReviewBtn");

  if (existing) {
    existing.remove();
  }

  updateReviewDueCount();
}

// =====================================================
// CHANGE MODE
// =====================================================

if (changeReviewModeBtn) {
  changeReviewModeBtn.addEventListener("click", () => {
    const nextButton = document.getElementById("nextReviewBtn");

    if (nextButton) {
      nextButton.remove();
    }

    showReviewSelector();
  });
}

// =====================================================
// MODE BUTTONS
// =====================================================

document.querySelectorAll(".review-mode-card").forEach((button) => {
  button.addEventListener("click", () => {
    startReviewMode(button.dataset.reviewMode);
  });
});

// =====================================================
// REVIEW BUTTON
// =====================================================

if (reviewModeBtn) {
  reviewModeBtn.addEventListener("click", openReview);
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

    scheduleCard(currentCard, button.dataset.rating);

    reviewIndex++;

    if (reviewIndex >= reviewCards.length) {
      finishReview();
    } else {
      renderReviewQuestion();
    }
  });
});

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

        if (
          !confirm("Importing will replace your current Codex.\n\nContinue?")
        ) {
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

console.log("📚 Ascend Codex loaded");
