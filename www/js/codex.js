const { LocalNotifications } = (typeof Capacitor !== "undefined") ? Capacitor.Plugins : {};
const deckList = document.getElementById("deck-list");
const newDeckInput = document.getElementById("newDeckInput");
const deckBtn = document.getElementById("deck-Btn");
const deckDetails = document.getElementById("deck-detail")
const deckKey = getPrefix() + "deckList"
const decks = JSON.parse(localStorage.getItem(deckKey)) || []


decks.forEach((deck) => {
    deck.cards.forEach((card) => {
        if (card.stability === undefined) {
            card.difficulty = null
            card.stability = null
            card.lastReviewed = null
            card.reviewCount = 0
        }
    })
})
localStorage.setItem(deckKey, JSON.stringify(decks))
let currentIndex = 0

function saveDecks() {
    localStorage.setItem(deckKey, JSON.stringify(decks))
    localStorage.setItem(deckKey + "_modifiedAt", Date.now())
    syncPush()
}

async function testNotification() {
    const result = await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({
        notifications: [
            {
                title: "Codex Test",
                body: "If you see this, notifications work!",
                id: 1,
                schedule: { at: new Date(Date.now() + 10000) }
            }
        ]
    });
}
deckBtn.addEventListener("click", () => {
    const input = newDeckInput.value
    const newDeck = { name: input, timerOn: false, timerSeconds: 10, cards: [] }
    decks.push(newDeck)
    saveDecks()
    renderDecks()
    newDeckInput.value = ""
})
function renderDecks() {
    deckList.innerHTML = ""
    decks.forEach((deck, index) => {
        const btn = document.createElement("button")
        btn.textContent = deck.name
        deckList.appendChild(btn)
        const deletebtn = document.createElement("button")
        deletebtn.textContent = "Delete"
        deckList.appendChild(deletebtn)
        deletebtn.addEventListener("click", () => {
            decks.splice(decks.indexOf(deck), 1)
            saveDecks()
            renderDecks()
        })
        btn.addEventListener("click", () => {
            currentIndex = 0
            showDeckDetails(deck)
            newDeckInput.style.display = "none"
            deckBtn.style.display = "none"


        })
    })
}
renderDecks()

function showDeckDetails(deck) {
    deckList.style.display = "none"
    deckDetails.style.display = "flex"
    const backBtn = document.createElement("button")
    backBtn.innerHTML = "Back"
    deckDetails.innerHTML = ""
    const deckName = document.createElement("p")
    deckName.innerHTML = deck.name
    deckDetails.appendChild(backBtn)
    deckDetails.appendChild(deckName)
    backBtn.addEventListener("click", () => {
        deckList.style.display = "flex"
        deckDetails.style.display = "none"
        newDeckInput.style.display = "inline"
        deckBtn.style.display = "inLine"
    })

    if (deck.cards.length === 0) {
        const emptyMsg = document.createElement("p")
        emptyMsg.textContent = "No cards yet — add one below"
        deckDetails.appendChild(emptyMsg)
    } else {
        const prevBtn = document.createElement("button")
        prevBtn.textContent = "<"
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) { currentIndex-- }
            showDeckDetails(deck)
        })
        deckDetails.appendChild(prevBtn)
        const cardDisplay = document.createElement("p")
        cardDisplay.className = "flashcard"
        cardDisplay.innerHTML = deck.cards[currentIndex].cardFront
        deckDetails.appendChild(cardDisplay)
        const infoBtn = document.createElement("button")
        infoBtn.innerHTML = "ⓘ"
        deckDetails.appendChild(infoBtn)
        infoBtn.addEventListener("click", () => {
            const c = deck.cards[currentIndex]
            if (c.stability === null) {
                alert("Never reviewed yet")
            } else {
                const nextReviewDate = new Date(c.nextReview).toLocaleString()
                alert(`Reviewed ${c.reviewCount} times\nStability: ${c.stability.toFixed(2)} days\nDifficulty: ${c.difficulty.toFixed(1)}\nNext review: ${nextReviewDate}`)
            }
        })
        cardDisplay.addEventListener("click", () => {
            if (cardDisplay.innerHTML === deck.cards[currentIndex].cardFront) {
                cardDisplay.innerHTML = deck.cards[currentIndex].cardBack
            } else {
                cardDisplay.innerHTML = deck.cards[currentIndex].cardFront
            }
        })
        const nextBtn = document.createElement("button")
        nextBtn.textContent = ">"
        deckDetails.appendChild(nextBtn)
        nextBtn.addEventListener("click", () => {
            if (currentIndex < deck.cards.length - 1) { currentIndex++ }

            showDeckDetails(deck)
        })
        const review = document.createElement("button")
        review.textContent = "Review"
        deckDetails.appendChild(review)
        review.addEventListener("click", () => {
            startReview(deck)
        })
    }
    const cardFrontName = document.createElement("p")
    cardFrontName.innerHTML = "Front"
    const cardBackName = document.createElement("p")
    cardBackName.innerHTML = "Back"
    const cardFront = document.createElement("input")
    const cardBack = document.createElement("input")
    const addCard = document.createElement("button")
    addCard.innerHTML = "Add"
    deckDetails.appendChild(cardFrontName)
    deckDetails.appendChild(cardFront)
    deckDetails.appendChild(cardBackName)
    deckDetails.appendChild(cardBack)
    deckDetails.appendChild(addCard)
    addCard.addEventListener("click", () => {
        const cardFrontInput = cardFront.value
        const cardBackInput = cardBack.value
        const newCard = {
            cardFront: cardFrontInput,
            cardBack: cardBackInput,
            difficulty: null,
            stability: null,
            lastReviewed: null,
            reviewCount: 0,
            nextReview: Date.now()
        }
        deck.cards.push(newCard)
        saveDecks()
        scheduleReviewNotification()
        cardFront.value = ""
        cardBack.value = ""
        showDeckDetails(deck)
    })
    const bulkInput = document.createElement("textarea")
    bulkInput.rows = 6
    bulkInput.placeholder = "front|back, one per line"
    deckDetails.appendChild(bulkInput)

    const bulkAddBtn = document.createElement("button")
    bulkAddBtn.innerHTML = "Bulk Add"
    bulkAddBtn.addEventListener("click", () => {

        const lines = bulkInput.value.split("\n")
        console.log(lines)

        lines.forEach((line) => {
            const parts = line.split("|")
            const newCard = {
                cardFront: parts[0],
                cardBack: parts[1],
                difficulty: null,
                stability: null,
                lastReviewed: null,
                reviewCount: 0,
                nextReview: Date.now()
            }
            deck.cards.push(newCard)
        })

        saveDecks()
        scheduleReviewNotification()
        bulkInput.value = ""
        showDeckDetails(deck)

    })
    deckDetails.appendChild(bulkAddBtn)
    const bulkEditInput = document.createElement("textarea")
    bulkEditInput.rows = 10
    bulkEditInput.value = deck.cards.map(card => `${card.cardFront}|${card.cardBack}`).join("\n")
    deckDetails.appendChild(bulkEditInput)

    const bulkEditBtn = document.createElement("button")
    bulkEditBtn.innerHTML = "Save Bulk Edit"
    bulkEditBtn.addEventListener("click", () => {
        const lines = bulkEditInput.value.split("\n")
        const newCards = []
        lines.forEach((line) => {
            const parts = line.split("|")
            const newCard = {
                cardFront: parts[0],
                cardBack: parts[1],
                difficulty: null,
                stability: null,
                lastReviewed: null,
                reviewCount: 0,
                nextReview: Date.now()
            }
            newCards.push(newCard)
        })
        deck.cards = newCards
        saveDecks()
        scheduleReviewNotification()
        showDeckDetails(deck)
    })
    deckDetails.appendChild(bulkEditBtn)
    const deleteCurrent = document.createElement("button")
    deleteCurrent.textContent = "Delete Card"
    deckDetails.appendChild(deleteCurrent)
    deleteCurrent.addEventListener("click", () => {
        deck.cards.splice(currentIndex, 1)
        if (currentIndex >= deck.cards.length && currentIndex > 0) { currentIndex-- }
        saveDecks()
        showDeckDetails(deck)
    })
}
function startReview(deck) {
    const dueCards = deck.cards.filter(card => card.nextReview <= Date.now())
    console.log(dueCards)
    if (dueCards.length === 0) {
        deckDetails.innerHTML = ""
        deckDetails.textContent = "No cards due right now"
        return
    }
    deckDetails.innerHTML = ""
    const review = document.createElement("p")
    review.className = "flashcard"
    const card = dueCards[Math.floor(Math.random() * dueCards.length)]
    review.innerHTML = card.cardFront
    const gradeButtons = document.createElement("div")
    deckDetails.appendChild(review)
    review.addEventListener("click", () => {
        if (review.innerHTML === card.cardFront) {
            review.innerHTML = card.cardBack
        } else {
            review.innerHTML = card.cardFront
        }
    })
    const againBtn = document.createElement("button")
    function gradeCard(grade) {
        const now = Date.now()
        let newStability
        let newDifficulty

        if (card.stability === null) {
            const startingValues = {
                1: { difficulty: 8, stability: 0.05 },
                2: { difficulty: 6, stability: 0.5 },
                3: { difficulty: 5, stability: 2 },
                4: { difficulty: 3, stability: 5 }
            }
            newDifficulty = startingValues[grade].difficulty
            newStability = startingValues[grade].stability
        } else {
            const daysSinceLastReview = (now - card.lastReviewed) / (1000 * 60 * 60 * 24)
            const retrievability = calculateRetrievability(card.stability, daysSinceLastReview)
            newDifficulty = calculateNewDifficulty(card.difficulty, grade)
            if (grade === 1) {
                newStability = calculateNewStabilityOnLapse(card.stability, card.difficulty, retrievability)
            } else {
                newStability = calculateNewStabilityOnSuccess(card.stability, card.difficulty, retrievability, grade)
            }
        }

        card.difficulty = newDifficulty
        card.stability = newStability
        card.lastReviewed = now
        card.reviewCount = (card.reviewCount || 0) + 1
        card.nextReview = now + (newStability * 24 * 60 * 60 * 1000)

        saveDecks()
        scheduleReviewNotification()
        startReview(deck)
    }
    againBtn.innerHTML = "Again"
    const hardBtn = document.createElement("button")
    hardBtn.innerHTML = "hard"
    const goodBtn = document.createElement("button")
    goodBtn.innerHTML = "Good"
    const easyBtn = document.createElement("button")
    easyBtn.innerHTML = "Easy"
    againBtn.addEventListener("click", () => { gradeCard(1) })
    hardBtn.addEventListener("click", () => { gradeCard(2) })
    goodBtn.addEventListener("click", () => { gradeCard(3) })
    easyBtn.addEventListener("click", () => { gradeCard(4) })
    const debugInfo = document.createElement("p")
    debugInfo.innerHTML = card.stability === null
        ? "Never reviewed yet"
        : `Stability: ${card.stability.toFixed(2)} days, Difficulty: ${card.difficulty.toFixed(1)}`
    deckDetails.appendChild(debugInfo)
    gradeButtons.appendChild(againBtn)
    gradeButtons.appendChild(hardBtn)
    gradeButtons.appendChild(goodBtn)
    gradeButtons.appendChild(easyBtn)
    deckDetails.appendChild(gradeButtons)
}
window.testNotification = testNotification;
function getEarliestReview() {
    let earliest = null
    decks.forEach((deck) => {
        deck.cards.forEach((card) => {
            if (card.nextReview > Date.now() && (earliest === null || card.nextReview < earliest)) {
                earliest = card.nextReview
            }
        })
    })
    return earliest
}
function calculateRetrievability(stability, daysSinceLastReview) {
    return Math.pow(1 + 0.2345 * daysSinceLastReview / stability, -0.5)
}
function calculateNewStabilityOnSuccess(stability, difficulty, retrievability, grade) {
    const difficultyPenalty = 11 - difficulty
    const stabilitySaturation = Math.pow(stability, -0.1192)
    const retrievabilityBonus = Math.exp(1.01925 * (1 - retrievability)) - 1

    let hardPenalty = 1
    if (grade === 2) { hardPenalty = 0.2315 }

    let easyBonus = 1
    if (grade === 4) { easyBonus = 2.9898 }

    const multiplier = 1 + difficultyPenalty * stabilitySaturation * retrievabilityBonus * hardPenalty * easyBonus * Math.exp(1.54575)

    return stability * multiplier
}
function calculateNewStabilityOnLapse(stability, difficulty, retrievability) {
    const difficultyFactor = Math.pow(difficulty, -0.11)
    const stabilityFactor = Math.pow(stability + 1, 0.29605)
    const retrievabilityFactor = Math.exp(2.2698 * (1 - retrievability))
    const lapseStability = difficultyFactor * stabilityFactor * retrievabilityFactor * 1.9395
    return Math.min(lapseStability, stability)
}
function calculateNewDifficulty(difficulty, grade) {
    const delta = -1.4604 * (grade - 3)
    let newDifficulty = difficulty + delta * (10 - difficulty) / 9
    newDifficulty = Math.min(10, Math.max(1, newDifficulty))
    return newDifficulty
}
async function scheduleReviewNotification() {
    const earliest = getEarliestReview()
    if (!LocalNotifications || !LocalNotifications.cancel) {
        return
    }
    if (earliest === null) {
        return
    }
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
    await LocalNotifications.schedule({
        notifications: [
            {
                title: "Codex",
                body: "Cards are due for review!",
                id: 1,
                schedule: { at: new Date(earliest) }
            }
        ]
    });
}