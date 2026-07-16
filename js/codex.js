// =====================================================
// ASCEND CODEX V2
// Part 1 - Variables, Loading, Saving, Rendering
// =====================================================

// ---------- Storage ----------
function getCurrentCards() {
  return currentFolder.cards;
}

let testCards = [];

// ---------- State ----------

let currentIndex = 0;

let flipped = false;

let filteredCards = [];

// ---------- Elements ----------

const card = document.getElementById("flipCard");

const frontEl = document.getElementById("cardFront");

const backEl = document.getElementById("cardBack");

const cardCounter = document.getElementById("cardCounter");

const prevBtn = document.getElementById("prevBtn");

const nextBtn = document.getElementById("nextBtn");

const frontInput = document.getElementById("frontInput");

const backInput = document.getElementById("backInput");

const addCardBtn = document.getElementById("addCardBtn");

const deleteCardBtn = document.getElementById("deleteCardBtn");

const bulkInput = document.getElementById("bulkCardInput");

const bulkAddBtn = document.getElementById("bulkAddBtn");

const testModeBtn = document.getElementById("testModeBtn");

const testArea = document.getElementById("testArea");

const testQuestion = document.getElementById("testQuestion");

const testAnswers = document.getElementById("testAnswers");

const folderList = document.getElementById("folderList");

const addFolderBtn = document.getElementById("addFolderBtn");

const deleteFolderBtn = document.getElementById("deleteFolderBtn");

const renameFolderBtn = document.getElementById("renameFolderBtn");

const exportCodexBtn = document.getElementById("exportCodexBtn");

const importCodexBtn = document.getElementById("importCodexBtn");

const importCodexInput = document.getElementById("importCodexInput");

const editCardBtn = document.getElementById("editCardBtn");

let correctAnswers = 0;

let wrongAnswers = 0;

let editingCard = null;

addFolderBtn.addEventListener("click", function () {
  const name = prompt("Folder name:");

  if (!name) {
    return;
  }

  currentFolder.children.push({
    name: name,
    children: [],
    cards: [],
  });
  saveFolders();
  renderFolders();
});

if (renameFolderBtn) {
  renameFolderBtn.addEventListener("click", function () {
    if (currentFolder === rootFolder) {
      alert("You can't rename the Root folder.");
      return;
    }

    const newName = prompt("New folder name:", currentFolder.name);

    if (!newName) {
      return;
    }

    currentFolder.name = newName.trim();

    saveFolders();
    renderFolders();
    updateBreadcrumb();
  });
}

if (deleteFolderBtn) {
  deleteFolderBtn.addEventListener("click", function () {
    if (currentFolder === rootFolder) {
      alert("You can't delete the Root folder.");
      return;
    }

    if (
      !confirm(
        `Delete folder "${currentFolder.name}"?\n\nThis will permanently delete this folder and everything inside it.`,
      )
    ) {
      return;
    }

    const parentFolder = folderHistory[folderHistory.length - 1];

    const index = parentFolder.children.indexOf(currentFolder);

    if (index !== -1) {
      parentFolder.children.splice(index, 1);
    }

    currentFolder = parentFolder;

    folderHistory.pop();

    saveFolders();
    renderFolders();
    render();
    updateBreadcrumb();
  });
}

if (exportCodexBtn) {
  exportCodexBtn.addEventListener("click", function () {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Ascend Codex",
      data: rootFolder,
    };

    const data = JSON.stringify(exportData, null, 2);

    const blob = new Blob([data], {
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

if (importCodexBtn) {
  importCodexBtn.addEventListener("click", function () {
    importCodexInput.click();
  });
}

if (importCodexInput) {
  importCodexInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
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

        saveFolders();

        renderFolders();
        render();
        updateBreadcrumb();

        alert("Codex imported successfully!");
      } catch (err) {
        alert("Failed to import backup.");
        console.error(err);
      }

      importCodexInput.value = "";
    };

    reader.readAsText(file);
  });
}

if (editCardBtn) {
  editCardBtn.addEventListener("click", function () {
    updateFilteredCards();

    if (filteredCards.length === 0) {
      return;
    }

    editingCard = filteredCards[currentIndex];

    frontInput.value = editingCard.front;
    backInput.value = editingCard.back;

    addCardBtn.textContent = "Save Changes";
  });
}
// ---------- Save ----------

function saveFolders() {
  localStorage.setItem("codexFolders", JSON.stringify(rootFolder));
}

function renderFolders() {
  folderList.innerHTML = "";

  for (const folder of currentFolder.children) {
    const button = document.createElement("button");

    button.textContent = "📁 " + folder.name;

    button.addEventListener("click", function () {
      folderHistory.push(currentFolder);

      currentFolder = folder;

      renderFolders();
      render();
      updateBreadcrumb();
    });

    folderList.appendChild(button);
  }
}

// ---------- Filter ----------

function updateFilteredCards() {
  filteredCards = [...getCurrentCards()];

  if (currentIndex >= filteredCards.length) {
    currentIndex = filteredCards.length - 1;
  }

  if (currentIndex < 0) {
    currentIndex = 0;
  }
}

// ---------- Render ----------

function render() {
  if (!frontEl || !backEl || !cardCounter) {
    return; // exit if elements don't exist
  }

  updateFilteredCards();

  if (filteredCards.length === 0) {
    frontEl.textContent = "No Cards";

    backEl.textContent = "Add a card.";

    cardCounter.textContent = "0 / 0";

    return;
  }

  const currentCard = filteredCards[currentIndex];

  frontEl.textContent = "[" + currentCard.section + "] " + currentCard.front;

  backEl.textContent = currentCard.back;

  cardCounter.textContent =
    "Card " + (currentIndex + 1) + " / " + filteredCards.length;

  card.classList.remove("flipped");

  flipped = false;
}
// =====================================================
// ASCEND CODEX V2
// Part 2 - Navigation, Flashcards, Card Management,
// Test Mode, Initialization
// =====================================================

// ---------- Navigation ----------

function nextCard() {
  if (filteredCards.length === 0) {
    return;
  }

  if (currentIndex < filteredCards.length - 1) {
    currentIndex++;

    render();
  }
}

function previousCard() {
  if (filteredCards.length === 0) {
    return;
  }

  if (currentIndex > 0) {
    currentIndex--;

    render();
  }
}

// ---------- Flip Card ----------

if (card) {
  card.addEventListener("click", function () {
    if (filteredCards.length === 0) {
      return;
    }

    flipped = !flipped;

    card.classList.toggle("flipped");
  });
}

// ---------- Add Card ----------

if (addCardBtn) {
  addCardBtn.addEventListener("click", function () {
    const front = frontInput.value.trim();
    const back = backInput.value.trim();

    if (editingCard) {
      editingCard.front = front;
      editingCard.back = back;

      editingCard = null;

      addCardBtn.textContent = "Add Card";

      saveFolders();
      render();

      frontInput.value = "";
      backInput.value = "";

      return;
    }
    if (front === "" || back === "") {
      alert("Please fill in both fields.");

      return;
    }

    const newCard = {
      front: front,
      back: back,
    };

    getCurrentCards().push(newCard);

    saveFolders();

    frontInput.value = "";

    backInput.value = "";

    render();
  });
}

// ---------- Delete Card ----------

if (deleteCardBtn) {
  deleteCardBtn.addEventListener("click", function () {
    updateFilteredCards();

    if (filteredCards.length === 0) {
      return;
    }

    const currentCard = filteredCards[currentIndex];

    const currentCards = getCurrentCards();

    const index = currentCards.indexOf(currentCard);

    if (index !== -1) {
      currentCards.splice(index, 1);
      currentIndex = Math.max(0, currentIndex - 1);
    }

    saveFolders();

    render();
  });
}

// ---------- Bulk Import ----------

if (bulkAddBtn) {
  bulkAddBtn.addEventListener("click", function () {
    const lines = bulkInput.value.split("\n");

    for (const line of lines) {
      if (line.trim() === "") {
        continue;
      }

      const parts = line.split("|");

      if (parts.length < 2) {
        continue;
      }

      getCurrentCards().push({
        front: parts[0].trim(),
        back: parts[1].trim(),
      });
    }

    saveFolders();

    bulkInput.value = "";

    render();
  });
}

// ---------- Buttons ----------

if (nextBtn) {
  nextBtn.addEventListener("click", nextCard);
}

if (prevBtn) {
  prevBtn.addEventListener("click", previousCard);
}
// ---------- Test Mode ----------

if (testModeBtn) {
  testModeBtn.addEventListener("click", function () {
    updateFilteredCards();

    if (filteredCards.length === 0) {
      return;
    }

    testArea.classList.remove("hidden");

    testCards = [...filteredCards];

    testCards.sort(function () {
      return Math.random() - 0.5;
    });

    currentIndex = 0;
    correctAnswers = 0;
    wrongAnswers = 0;

    startTest();
  });
}

function startTest() {
  const currentCard = testCards[currentIndex];

  const answers = [];

  answers.push(currentCard.back);

  const answerCount = Math.min(4, testCards.length);
  while (answers.length < answerCount) {
    const randomIndex = Math.floor(Math.random() * testCards.length);
    const randomCard = testCards[randomIndex];
    if (randomCard !== currentCard && !answers.includes(randomCard.back)) {
      answers.push(randomCard.back);
    }
  }

  answers.sort(function () {
    return Math.random() - 0.5;
  });

  testQuestion.textContent = currentCard.front;
  testAnswers.innerHTML = "";

  for (const answer of answers) {
    const button = document.createElement("button");

    button.textContent = answer;
    if (answer === currentCard.back) {
      button.dataset.correct = "true";
    } else {
      button.dataset.correct = "false";
    }
    button.addEventListener("click", function () {
      if (answer === currentCard.back) {
        correctAnswers++;
        addXP(1);

        button.style.backgroundColor = "green";
        button.style.color = "white";
      } else {
        wrongAnswers++;
        removeXP(1);

        button.style.backgroundColor = "red";
        button.style.color = "white";
      }

      const allButtons = testAnswers.querySelectorAll("button");

      for (const btn of allButtons) {
        btn.disabled = true;

        if (btn.dataset.correct === "true") {
          btn.style.backgroundColor = "green";
          btn.style.color = "white";
        }
      }

      setTimeout(function () {
        currentIndex++;

        if (currentIndex >= testCards.length) {
          showResults();
        } else {
          startTest();
        }
      }, 1000);
    });

    testAnswers.appendChild(button);
  }
}

function showResults() {
  const totalQuestions = correctAnswers + wrongAnswers;

  const accuracy =
    totalQuestions === 0
      ? 0
      : Math.round((correctAnswers / totalQuestions) * 100);

  const xpEarned = correctAnswers;
  const xpLost = wrongAnswers;
  const netXP = xpEarned - xpLost;

  testQuestion.innerHTML = `
        <h2>🏆 Test Complete!</h2>

        <p><strong>Questions:</strong> ${totalQuestions}</p>

        <p>✅ Correct: ${correctAnswers}</p>

        <p>❌ Wrong: ${wrongAnswers}</p>

        <p>🎯 Accuracy: ${accuracy}%</p>

        <hr>

        <p>🟢 XP Earned: +${xpEarned}</p>

        <p>🔴 XP Lost: -${xpLost}</p>

        <p><strong>⭐ Net XP: ${netXP >= 0 ? "+" : ""}${netXP}</strong></p>

    ${
      accuracy === 100
        ? "<h3>🔥 Perfect Score!</h3>"
        : accuracy >= 90
          ? "<h3>Excellent!</h3>"
          : accuracy >= 75
            ? "<h3>Good Job!</h3>"
            : "<h3>Keep Practicing!</h3>"
    }
        `;

  testAnswers.innerHTML = "";

  const restartButton = document.createElement("button");

  restartButton.textContent = "Restart Test";

  restartButton.addEventListener("click", function () {
    testCards = [...filteredCards];

    testCards.sort(function () {
      return Math.random() - 0.5;
    });

    currentIndex = 0;
    correctAnswers = 0;
    wrongAnswers = 0;

    startTest();
  });

  testAnswers.appendChild(restartButton);
}

document.getElementById("backBtn").addEventListener("click", function () {
  if (folderHistory.length === 0) {
    return;
  }

  currentFolder = folderHistory.pop();

  renderFolders();
  render();
  updateBreadcrumb();
});

const savedFolders = localStorage.getItem("codexFolders");
let rootFolder;

if (savedFolders) {
  rootFolder = JSON.parse(savedFolders);
} else {
  rootFolder = {
    name: "Root",
    cards: [],
    children: [
      {
        name: "School",
        cards: [],
        children: [],
      },
      {
        name: "Coding",
        cards: [],
        children: [],
      },
      {
        name: "Quran",
        cards: [],
        children: [],
      },
    ],
  };

  saveFolders();
}

let currentFolder = rootFolder;
console.log(currentFolder);
let folderHistory = [];

function updateBreadcrumb() {
  const breadcrumb = document.getElementById("folderBreadcrumb");

  if (!breadcrumb) return;

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
// ---------- Initialize ----------

render();
renderFolders();
updateBreadcrumb();
