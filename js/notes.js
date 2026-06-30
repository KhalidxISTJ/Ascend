let notes = [];

const savedNotes = localStorage.getItem("notes");

if (savedNotes) {
    notes = JSON.parse(savedNotes);
}

const noteTitle = document.getElementById("noteTitle");

const noteContent = document.getElementById("noteContent");

const saveNoteBtn = document.getElementById("saveNoteBtn");

const notesContainer = document.getElementById("notesContainer");

saveNoteBtn.onclick = function () {

    const newNote = {
        title: noteTitle.value,
        content: noteContent.value
    };

    notes.push(newNote);

    localStorage.setItem(
        "notes",
        JSON.stringify(notes)
    );
    renderNotes();

    noteTitle.value = "";
    noteContent.value = "";

    console.log(notes);
};


function renderNotes() {

    notesContainer.innerHTML = "";

    for (const note of notes) {

        const noteDiv = document.createElement("div");
        noteDiv.className = "note-card";

        const title = document.createElement("h4");
        title.className = "note-title";
        title.textContent = note.title;

        const preview = document.createElement("p");
        preview.className = "note-preview";
        if (note.content.length > 100) {

            preview.textContent =
            note.content.substring(0, 100) + "...";

            } else {

            preview.textContent =
            note.content;

            }

            noteDiv.appendChild(title);
            noteDiv.appendChild(preview);

            const deleteBtn = document.createElement("button");

            deleteBtn.textContent = "Delete";

            deleteBtn.onclick = function () {

            notes = notes.filter(n => n !== note);

            localStorage.setItem(
             "notes",
             JSON.stringify(notes)
            );

            renderNotes();

};

noteDiv.appendChild(deleteBtn);

            noteDiv.onclick = function () {

            noteTitle.value =
            note.title;

            noteContent.value =
                note.content;

            };

            notesContainer.appendChild(
                noteDiv
            );
    }
   
} 

renderNotes();