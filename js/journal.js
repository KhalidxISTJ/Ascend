// ==========================
// Elements
// ==========================

const titleInput = document.getElementById("journalTitle");

const contentInput = document.getElementById("journalContent");

const saveJournalBtn = document.getElementById("saveJournalBtn");

const journalEntries = document.getElementById("journalEntries");

// ==========================
// Data
// ==========================

let journal = [];

let editingEntry = null;

// ==========================
// Save / Load
// ==========================

function saveJournal() {
  localStorage.setItem("journalEntries", JSON.stringify(journal));
}

function loadJournal() {
  const savedJournal = localStorage.getItem("journalEntries");

  if (savedJournal) {
    journal = JSON.parse(savedJournal);
  }
}

loadJournal();

// ==========================
// Render
// ==========================

function renderJournal() {
  if (!journalEntries) return;

  journalEntries.innerHTML = "";

  if (journal.length === 0) {
    journalEntries.innerHTML =
      "<p class='empty-text'>No journal entries yet.</p>";

    return;
  }

  for (const entry of journal) {
    const card = document.createElement("div");

    card.className = "journal-card";

    card.innerHTML = `
            <h4>${entry.title}</h4>
            <small>${entry.date}</small>
            <p>${entry.content}</p>
        `;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";

    editBtn.onclick = function () {
      editingEntry = entry;

      titleInput.value = entry.title;

      contentInput.value = entry.content;

      saveJournalBtn.textContent = "Save Changes";
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    deleteBtn.onclick = function () {
      journal = journal.filter((j) => j !== entry);

      saveJournal();

      renderJournal();
    };

    card.appendChild(editBtn);
    card.appendChild(deleteBtn);

    journalEntries.appendChild(card);
  }
}

renderJournal();

// ==========================
// Save Entry
// ==========================

if (saveJournalBtn) {
  saveJournalBtn.onclick = function () {
    if (titleInput.value.trim() === "" || contentInput.value.trim() === "") {
      return;
    }

    if (editingEntry) {
      editingEntry.title = titleInput.value;

      editingEntry.content = contentInput.value;

      editingEntry.date = new Date().toLocaleDateString();

      editingEntry = null;

      saveJournalBtn.textContent = "Save Entry";
    } else {
      journal.unshift({
        title: titleInput.value,

        content: contentInput.value,

        date: new Date().toLocaleDateString(),
      });
    }

    saveJournal();

    titleInput.value = "";

    contentInput.value = "";

    renderJournal();
  };
}
