// =====================================================
// ASCEND CODEX V2
// Part 1 - Variables, Loading, Saving, Rendering
// =====================================================

// ---------- Storage ----------
let cards = [];

let testCards = [];

const savedCards = localStorage.getItem("codexCards");
console.log("filterSelect:", document.getElementById("filterSelect"));
console.log("sectionSelect:", document.getElementById("sectionSelect"));

if (savedCards) {

    cards = JSON.parse(savedCards);

} else {

    cards = [

        {
            front: "What is Flexbox?",
            back: "A CSS layout system used for alignment and spacing.",
            section: "Programming"
        },

        {
            front: "What is Recursion?",
            back: "A function that calls itself.",
            section: "Programming"
        }

    ];

    saveCards();

}

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

const sectionSelect = document.getElementById("sectionSelect");

const filterSelect = document.getElementById("filterSelect");

const addCardBtn = document.getElementById("addCardBtn");

const deleteCardBtn = document.getElementById("deleteCardBtn");

const bulkInput = document.getElementById("bulkCardInput");

const bulkAddBtn = document.getElementById("bulkAddBtn");

const testModeBtn = document.getElementById("testModeBtn");

const testArea = document.getElementById("testArea");

const testQuestion = document.getElementById("testQuestion");

const testAnswers = document.getElementById("testAnswers");

let correctAnswers = 0;

let wrongAnswers = 0;

// ---------- Save ----------

function saveCards() {

    localStorage.setItem(

        "codexCards",

        JSON.stringify(cards)

    );

}

// ---------- Filter ----------

function updateFilteredCards() {

    // If filterSelect doesn't exist, show all cards
    if (!filterSelect) {
        filteredCards = [...cards];
        return;
    }

    if (filterSelect.value === "All") {

        filteredCards = [...cards];

    } else {

        filteredCards = cards.filter(function(card){

            return card.section === filterSelect.value;

        });

    }

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

    frontEl.textContent =
        "[" + currentCard.section + "] " +
        currentCard.front;

    backEl.textContent =
        currentCard.back;

    cardCounter.textContent =
        "Card " +
        (currentIndex + 1) +
        " / " +
        filteredCards.length;

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
    if (card) {
    card.addEventListener("click", function() {
        // ...
    });
    }



    card.addEventListener("click", function () {

        if (filteredCards.length === 0) {
            return;
        }

        flipped = !flipped;

        card.classList.toggle("flipped");

    });

}

// ---------- Add Card ----------

if (addCardBtn){
    
    addCardBtn.addEventListener("click", function () {

    const front = frontInput.value.trim();

    const back = backInput.value.trim();

    if (front === "" || back === "") {

        alert("Please fill in both fields.");

        return;

    }

    const newCard = {

        front: front,

        back: back,

        section: sectionSelect.value

    };

    cards.push(newCard);

    saveCards();

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

    cards = cards.filter(function(card){

        return card !== currentCard;

    });

    saveCards();

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

        cards.push({

            front: parts[0].trim(),

            back: parts[1].trim(),

            section: sectionSelect.value

        });

    }

    saveCards();

    bulkInput.value = "";

    render();

});
}


// ---------- Filter ----------

if (filterSelect) {

    filterSelect.addEventListener("change", function(){

    currentIndex = 0;

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

    while (answers.length < 4) {
        const randomIndex = Math.floor(Math.random() * testCards.length);
        const randomCard = testCards[randomIndex];
        if (randomCard !== currentCard && !answers.includes(randomCard.back)
        ) {
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
            addXP(1);
            button.dataset.correct = "true";
        } else {
            removeXP(1);
            button.dataset.correct = "false";
        }

        button.addEventListener("click", function () {
            if (answer === currentCard.back) {

                correctAnswers++;
                button.style.backgroundColor = "green";
                button.style.color = "white";

            } 
            else {

                wrongAnswers++;
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

    const accuracy = totalQuestions === 0
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
// ---------- Initialize ----------

render();

    
