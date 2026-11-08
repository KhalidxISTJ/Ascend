const { LocalNotifications } = (typeof Capacitor !== "undefined") ? Capacitor.Plugins : {};
const deckList = document.getElementById("deck-list");
const newDeckInput = document.getElementById("newDeckInput");
const deckBtn = document.getElementById("deck-Btn");
const newDeckCard = document.getElementById("new-deck-card")
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
let editMode = false
let renameMode = false

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
    const input = newDeckInput.value.trim()
    if (input === "") { return }
    const newDeck = { name: input, timerOn: false, timerSeconds: 10, cards: [] }
    decks.push(newDeck)
    saveDecks()
    renderDecks()
    newDeckInput.value = ""
})
const reviewAllBtn = document.createElement("button")
reviewAllBtn.className = "review-all-btn"
const sessionSizeKey = getPrefix() + "codexSessionSize"
function getSessionSize() {
    const saved = localStorage.getItem(sessionSizeKey)
    if (saved === "all") { return Infinity }
    return saved === null ? 20 : Number(saved)
}

const sessionSizeSelect = document.createElement("select")
sessionSizeSelect.className = "session-size"
sessionSizeSelect.setAttribute("aria-label", "Cards per review session")
    ;[["15", "15 per session"], ["20", "20 per session"], ["30", "30 per session"], ["all", "All due"]].forEach(([value, label]) => {
        const option = document.createElement("option")
        option.value = value
        option.textContent = label
        sessionSizeSelect.appendChild(option)
    })
sessionSizeSelect.value = localStorage.getItem(sessionSizeKey) || "20"
sessionSizeSelect.addEventListener("change", () => {
    localStorage.setItem(sessionSizeKey, sessionSizeSelect.value)
})

const codexActions = document.createElement("div")
codexActions.className = "codex-actions"
codexActions.appendChild(sessionSizeSelect)
codexActions.appendChild(reviewAllBtn)
const codexTop = document.getElementById("codex-top")
if (codexTop) {
    codexTop.appendChild(codexActions)
} else {
    deckList.parentNode.insertBefore(codexActions, deckList)
}
reviewAllBtn.addEventListener("click", () => {
    openReview({ name: "All decks", cards: decks.flatMap(d => d.cards) })
})

function openReview(deck) {
    deckList.style.display = "none"
    codexActions.style.display = "none"
    deckDetails.style.display = "flex"
    startReview(deck)
}

function renderDecks() {
    deckList.innerHTML = ""
    let totalDue = 0
    decks.forEach((deck, index) => {
        const deckCard = document.createElement("div")
        deckCard.className = "deck-card"
        const dueCount = deck.cards.filter(card => card.nextReview <= Date.now()).length
        totalDue += dueCount

        // ---------- Top row: name + count on the left, badge on the right ----------
        const top = document.createElement("div")
        top.className = "deck-card-top"
        const titleBox = document.createElement("div")
        const h2 = document.createElement("h2")
        h2.textContent = deck.name
        const p = document.createElement("p")
        p.textContent = `${deck.cards.length} ${deck.cards.length === 1 ? "card" : "cards"}`
        titleBox.appendChild(h2)
        titleBox.appendChild(p)
        const dueBadge = document.createElement("span")
        dueBadge.className = "due-badge"
        dueBadge.textContent = dueCount === 0 ? "Caught up" : `${dueCount} due`
        if (dueCount === 0) { dueBadge.classList.add("caught-up") }
        top.appendChild(titleBox)
        top.appendChild(dueBadge)
        deckCard.appendChild(top)

        // ---------- Progress bar ----------
        const wellKnownCount = deck.cards.filter(card => card.stability !== null && card.stability >= 7).length
        const wellKnownPercent = deck.cards.length === 0 ? 0 : Math.round(wellKnownCount / deck.cards.length * 100)
        const futureReviews = deck.cards.filter(card => card.nextReview > Date.now()).map(card => card.nextReview)
        let progressText = `${wellKnownPercent}% well known`
        if (deck.cards.length === 0) {
            progressText = "No cards yet"
        } else if (dueCount === 0 && futureReviews.length > 0) {
            const days = (Math.min(...futureReviews) - Date.now()) / (1000 * 60 * 60 * 24)
            progressText = `Next review in ${formatInterval(days)}`
        }
        const progress = document.createElement("div")
        progress.className = "deck-progress"
        const bar = document.createElement("div")
        bar.className = "progress-bar"
        const fill = document.createElement("div")
        fill.className = "progress-fill"
        fill.style.width = `${wellKnownPercent}%`
        bar.appendChild(fill)
        const progressLabel = document.createElement("p")
        progressLabel.textContent = progressText
        progress.appendChild(bar)
        progress.appendChild(progressLabel)
        deckCard.appendChild(progress)

        // ---------- Buttons ----------
        const reviewBtn = document.createElement("button")
        reviewBtn.className = "review-btn"
        if (dueCount === 0) {
            reviewBtn.textContent = "Nothing due"
            reviewBtn.disabled = true
        } else {
            reviewBtn.textContent = "Review"
        }
        const openBtn = document.createElement("button")
        openBtn.textContent = "Open"
        const deletebtn = document.createElement("button")
        deletebtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/></svg>`
        deletebtn.setAttribute("aria-label", "Delete deck")
        deletebtn.className = "delete-btn"
        const deckactions = document.createElement("div")
        deckactions.className = "deck-actions"
        deckactions.appendChild(reviewBtn)
        deckactions.appendChild(openBtn)
        deckactions.appendChild(deletebtn)
        deckCard.appendChild(deckactions)
        deletebtn.addEventListener("click", () => {
            decks.splice(decks.indexOf(deck), 1)
            saveDecks()
            renderDecks()
        })
        openBtn.addEventListener("click", () => {
            currentIndex = 0
            showDeckDetails(deck)
        })
        reviewBtn.addEventListener("click", () => {
            currentIndex = 0
            openReview(deck)
        })
        deckList.appendChild(deckCard)
    })

    deckList.appendChild(newDeckCard)
    reviewAllBtn.textContent = totalDue === 0 ? "Nothing due" : `Review all due (${totalDue})`
    reviewAllBtn.disabled = totalDue === 0
}
renderDecks()

// When newer deck data arrives from the cloud (another device, or the first pull
// finishing after this page loaded), reload the decks so we never save stale data.
document.addEventListener("dataPulled", (e) => {
    if (!e.detail.changed.includes("codexDecks")) { return }
    const fresh = JSON.parse(localStorage.getItem(deckKey)) || []
    fresh.forEach((deck) => {
        deck.cards.forEach((card) => {
            if (card.stability === undefined) {
                card.difficulty = null
                card.stability = null
                card.lastReviewed = null
                card.reviewCount = 0
            }
        })
    })
    decks.length = 0
    decks.push(...fresh)
    showDeckList()
})

function showDeckList() {
    editMode = false
    renameMode = false
    stopReviewKeys()
    renderDecks()
    deckList.style.display = "grid"
    codexActions.style.display = ""
    deckDetails.style.display = "none"
}

function showDeckDetails(deck) {
    stopReviewKeys()
    deckList.style.display = "none"
    codexActions.style.display = "none"
    deckDetails.style.display = "flex"
    deckDetails.innerHTML = ""

    // ---------- Header ----------
    const deckHeader = document.createElement("div")
    deckHeader.className = "deck-header"
    const backBtn = document.createElement("button")
    backBtn.textContent = "Back"
    backBtn.className = "back-btn"
    backBtn.addEventListener("click", showDeckList)
    deckHeader.appendChild(backBtn)
    if (renameMode) {
        const nameInput = document.createElement("input")
        nameInput.value = deck.name
        nameInput.setAttribute("aria-label", "Deck name")
        const saveName = () => {
            const newName = nameInput.value.trim()
            if (newName === "") { return }
            deck.name = newName
            saveDecks()
            renameMode = false
            showDeckDetails(deck)
        }
        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { saveName() }
            if (e.key === "Escape") { renameMode = false; showDeckDetails(deck) }
        })
        const saveNameBtn = document.createElement("button")
        saveNameBtn.textContent = "Save"
        saveNameBtn.className = "primary-btn"
        saveNameBtn.addEventListener("click", saveName)
        const cancelNameBtn = document.createElement("button")
        cancelNameBtn.textContent = "Cancel"
        cancelNameBtn.className = "ghost-btn"
        cancelNameBtn.addEventListener("click", () => {
            renameMode = false
            showDeckDetails(deck)
        })
        deckHeader.appendChild(nameInput)
        deckHeader.appendChild(saveNameBtn)
        deckHeader.appendChild(cancelNameBtn)
    } else {
        const deckName = document.createElement("h2")
        deckName.textContent = deck.name
        const renameBtn = document.createElement("button")
        renameBtn.textContent = "Rename"
        renameBtn.className = "link-btn"
        renameBtn.addEventListener("click", () => {
            renameMode = true
            showDeckDetails(deck)
        })
        const headerReviewBtn = document.createElement("button")
        headerReviewBtn.textContent = "Review"
        headerReviewBtn.className = "review-btn"
        headerReviewBtn.addEventListener("click", () => { startReview(deck) })
        deckHeader.appendChild(deckName)
        deckHeader.appendChild(renameBtn)
        deckHeader.appendChild(headerReviewBtn)
    }
    deckDetails.appendChild(deckHeader)

    // ---------- Card browser ----------
    if (deck.cards.length === 0) {
        const emptyMsg = document.createElement("p")
        emptyMsg.className = "empty-msg"
        emptyMsg.textContent = "No cards yet. Add one below."
        deckDetails.appendChild(emptyMsg)
    } else {
        const browser = document.createElement("div")
        browser.className = "card-browser"

        const prevBtn = document.createElement("button")
        prevBtn.textContent = "<"
        prevBtn.className = "nav-btn"
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) { currentIndex-- }
            editMode = false
            showDeckDetails(deck)
        })

        const cardDisplay = document.createElement("p")
        cardDisplay.className = "flashcard"
        cardDisplay.innerHTML = deck.cards[currentIndex].cardFront
        cardDisplay.addEventListener("click", () => {
            if (cardDisplay.innerHTML === deck.cards[currentIndex].cardFront) {
                cardDisplay.innerHTML = deck.cards[currentIndex].cardBack
            } else {
                cardDisplay.innerHTML = deck.cards[currentIndex].cardFront
            }
        })

        const nextBtn = document.createElement("button")
        nextBtn.textContent = ">"
        nextBtn.className = "nav-btn"
        nextBtn.addEventListener("click", () => {
            if (currentIndex < deck.cards.length - 1) { currentIndex++ }
            editMode = false
            showDeckDetails(deck)
        })

        browser.appendChild(prevBtn)
        browser.appendChild(cardDisplay)
        browser.appendChild(nextBtn)
        deckDetails.appendChild(browser)

        const cardMeta = document.createElement("div")
        cardMeta.className = "card-meta"
        const counter = document.createElement("span")
        counter.textContent = `Card ${currentIndex + 1} of ${deck.cards.length}`
        const infoBtn = document.createElement("button")
        infoBtn.textContent = "Card info"
        infoBtn.className = "link-btn"
        infoBtn.addEventListener("click", () => {
            const c = deck.cards[currentIndex]
            if (c.stability === null) {
                alert("Never reviewed yet")
            } else {
                const nextReviewDate = new Date(c.nextReview).toLocaleString()
                alert(`Reviewed ${c.reviewCount} times\nStability: ${c.stability.toFixed(2)} days\nDifficulty: ${c.difficulty.toFixed(1)}\nNext review: ${nextReviewDate}`)
            }
        })
        const deleteCurrent = document.createElement("button")
        deleteCurrent.textContent = "Delete card"
        deleteCurrent.className = "danger-btn"
        deleteCurrent.addEventListener("click", () => {
            deck.cards.splice(currentIndex, 1)
            if (currentIndex >= deck.cards.length && currentIndex > 0) { currentIndex-- }
            saveDecks()
            showDeckDetails(deck)
        })
        const editBtn = document.createElement("button")
        editBtn.textContent = "Edit card"
        editBtn.className = "link-btn"
        editBtn.addEventListener("click", () => {
            editMode = true
            showDeckDetails(deck)
        })
        const cardLinks = document.createElement("span")
        cardLinks.className = "card-links"
        cardLinks.appendChild(infoBtn)
        cardLinks.appendChild(editBtn)
        cardMeta.appendChild(counter)
        cardMeta.appendChild(cardLinks)
        cardMeta.appendChild(deleteCurrent)
        deckDetails.appendChild(cardMeta)

        if (editMode) {
            const current = deck.cards[currentIndex]
            const editPanel = document.createElement("div")
            editPanel.className = "add-card"
            const editTitle = document.createElement("h3")
            editTitle.textContent = "Edit card"
            const editFront = document.createElement("textarea")
            editFront.rows = 2
            editFront.value = current.cardFront
            editFront.setAttribute("aria-label", "Front")
            const editBack = document.createElement("textarea")
            editBack.rows = 2
            editBack.value = current.cardBack
            editBack.setAttribute("aria-label", "Back")
            const editActions = document.createElement("div")
            editActions.className = "edit-actions"
            const saveEdit = document.createElement("button")
            saveEdit.textContent = "Save changes"
            saveEdit.className = "primary-btn"
            saveEdit.addEventListener("click", () => {
                current.cardFront = editFront.value
                current.cardBack = editBack.value
                saveDecks()
                editMode = false
                showDeckDetails(deck)
            })
            const cancelEdit = document.createElement("button")
            cancelEdit.textContent = "Cancel"
            cancelEdit.className = "ghost-btn"
            cancelEdit.addEventListener("click", () => {
                editMode = false
                showDeckDetails(deck)
            })
            editActions.appendChild(saveEdit)
            editActions.appendChild(cancelEdit)
            editPanel.appendChild(editTitle)
            editPanel.appendChild(editFront)
            editPanel.appendChild(editBack)
            editPanel.appendChild(editActions)
            deckDetails.appendChild(editPanel)
        }
    }

    // ---------- Add a card ----------
    const addSection = document.createElement("div")
    addSection.className = "add-card"
    const addTitle = document.createElement("h3")
    addTitle.textContent = "Add a card"
    const cardFront = document.createElement("input")
    cardFront.placeholder = "Front"
    const cardBack = document.createElement("input")
    cardBack.placeholder = "Back"
    const addCard = document.createElement("button")
    addCard.textContent = "Add card"
    addCard.className = "primary-btn"
    addCard.addEventListener("click", () => {
        const newCard = {
            cardFront: cardFront.value,
            cardBack: cardBack.value,
            difficulty: null,
            stability: null,
            lastReviewed: null,
            reviewCount: 0,
            nextReview: Date.now()
        }
        deck.cards.push(newCard)
        saveDecks()
        scheduleReviewNotification()
        showDeckDetails(deck)
    })
    addSection.appendChild(addTitle)
    addSection.appendChild(cardFront)
    addSection.appendChild(cardBack)
    addSection.appendChild(addCard)
    deckDetails.appendChild(addSection)

    // ---------- More tools (bulk) ----------
    const moreTools = document.createElement("details")
    moreTools.className = "more-tools"
    const summary = document.createElement("summary")
    summary.textContent = "More tools"
    moreTools.appendChild(summary)

    const bulkAddLabel = document.createElement("h3")
    bulkAddLabel.textContent = "Bulk add"
    const bulkInput = document.createElement("textarea")
    bulkInput.rows = 6
    bulkInput.placeholder = "front|back, one per line"
    const bulkAddBtn = document.createElement("button")
    bulkAddBtn.textContent = "Bulk add"
    bulkAddBtn.className = "primary-btn"
    bulkAddBtn.addEventListener("click", () => {
        const lines = bulkInput.value.split("\n").filter(line => line.includes("|"))
        lines.forEach((line) => {
            const parts = line.split("|")
            deck.cards.push({
                cardFront: parts[0],
                cardBack: parts[1],
                difficulty: null,
                stability: null,
                lastReviewed: null,
                reviewCount: 0,
                nextReview: Date.now()
            })
        })
        saveDecks()
        scheduleReviewNotification()
        showDeckDetails(deck)
    })

    const bulkEditLabel = document.createElement("h3")
    bulkEditLabel.textContent = "Bulk edit"
    const bulkEditInput = document.createElement("textarea")
    bulkEditInput.rows = 10
    bulkEditInput.value = deck.cards.map(card => `${card.cardFront}|${card.cardBack}`).join("\n")
    const bulkEditBtn = document.createElement("button")
    bulkEditBtn.textContent = "Save bulk edit"
    bulkEditBtn.className = "primary-btn"
    bulkEditBtn.addEventListener("click", () => {
        const lines = bulkEditInput.value.split("\n").filter(line => line.includes("|"))
        const oldCards = deck.cards
        deck.cards = lines.map((line) => {
            const parts = line.split("|")
            const existing = oldCards.find(c => c.cardFront === parts[0])
            if (existing) {
                return { ...existing, cardBack: parts[1] }
            }
            return {
                cardFront: parts[0],
                cardBack: parts[1],
                difficulty: null,
                stability: null,
                lastReviewed: null,
                reviewCount: 0,
                nextReview: Date.now()
            }
        })
        saveDecks()
        scheduleReviewNotification()
        showDeckDetails(deck)
    })

    moreTools.appendChild(bulkAddLabel)
    moreTools.appendChild(bulkInput)
    moreTools.appendChild(bulkAddBtn)
    moreTools.appendChild(bulkEditLabel)
    moreTools.appendChild(bulkEditInput)
    moreTools.appendChild(bulkEditBtn)
    deckDetails.appendChild(moreTools)
}

function formatInterval(days) {
    const minutes = days * 24 * 60
    if (minutes < 60) { return `${Math.max(1, Math.round(minutes))} min` }
    if (minutes < 60 * 24) { return `${Math.round(minutes / 60)} hr` }
    const d = Math.round(days)
    return `${d} day${d === 1 ? "" : "s"}`
}
function previewStability(card, grade) {
    if (card.stability === null) {
        const startStability = { 1: 0.05, 2: 0.5, 3: 2, 4: 5 }
        return startStability[grade]
    }
    const days = (Date.now() - card.lastReviewed) / (1000 * 60 * 60 * 24)
    const retrievability = calculateRetrievability(card.stability, days)
    if (grade === 1) {
        return calculateNewStabilityOnLapse(card.stability, card.difficulty, retrievability)
    }
    return calculateNewStabilityOnSuccess(card.stability, card.difficulty, retrievability, grade)
}
let reviewKeyHandler = null
function stopReviewKeys() {
    if (reviewKeyHandler) {
        document.removeEventListener("keydown", reviewKeyHandler)
        reviewKeyHandler = null
    }
}

function startReview(deck, session = { total: null, done: 0 }) {
    stopReviewKeys()
    deckDetails.innerHTML = ""
    const backBtn = document.createElement("button")
    backBtn.textContent = "Back"
    backBtn.className = "back-btn"
    backBtn.addEventListener("click", showDeckList)
    const reviewTop = document.createElement("div")
    reviewTop.className = "review-top"
    reviewTop.appendChild(backBtn)
    deckDetails.appendChild(reviewTop)

    const dueCards = deck.cards.filter(card => card.nextReview <= Date.now())
    if (session.total === null && dueCards.length > 0) {
        session.total = Math.min(dueCards.length, getSessionSize())
    }
    if (dueCards.length === 0 || session.done >= session.total) {
        const done = document.createElement("p")
        done.className = "review-done"
        done.textContent = session.done > 0
            ? `All done. You reviewed ${session.done} ${session.done === 1 ? "card" : "cards"}.`
            : "No cards due right now"
        deckDetails.appendChild(done)
        if (dueCards.length > 0) {
            const more = document.createElement("p")
            more.className = "review-info"
            more.textContent = `${dueCards.length} more ${dueCards.length === 1 ? "card is" : "cards are"} due.`
            deckDetails.appendChild(more)
            const moreBtn = document.createElement("button")
            moreBtn.textContent = "Review more"
            moreBtn.className = "review-all-btn"
            moreBtn.addEventListener("click", () => { startReview(deck) })
            deckDetails.appendChild(moreBtn)
        }
        return
    }

    const card = dueCards[Math.floor(Math.random() * dueCards.length)]

    // ---------- Counter + progress ----------
    const progress = document.createElement("div")
    progress.className = "review-progress"
    const count = document.createElement("p")
    count.className = "review-count"
    const totalDueNote = dueCards.length > session.total - session.done ? ` (${dueCards.length} due)` : ""
    count.textContent = `Card ${session.done + 1} of ${session.total}${totalDueNote}`
    const bar = document.createElement("div")
    bar.className = "progress-bar"
    const fill = document.createElement("div")
    fill.className = "progress-fill"
    fill.style.width = `${Math.round(session.done / session.total * 100)}%`
    bar.appendChild(fill)
    progress.appendChild(count)
    progress.appendChild(bar)
    deckDetails.appendChild(progress)

    // ---------- Flip card ----------
    const review = document.createElement("p")
    review.className = "flashcard"
    review.innerHTML = card.cardFront
    function flip() {
        review.innerHTML = review.innerHTML === card.cardFront ? card.cardBack : card.cardFront
    }
    review.addEventListener("click", flip)
    deckDetails.appendChild(review)

    const flipHint = document.createElement("p")
    flipHint.className = "review-info"
    flipHint.textContent = "Tap the card to flip it"
    deckDetails.appendChild(flipHint)

    function gradeCard(grade) {
        const startDifficulty = { 1: 8, 2: 6, 3: 5, 4: 3 }
        const now = Date.now()
        const newStability = previewStability(card, grade)
        const newDifficulty = card.stability === null
            ? startDifficulty[grade]
            : calculateNewDifficulty(card.difficulty, grade)

        card.difficulty = newDifficulty
        card.stability = newStability
        card.lastReviewed = now
        card.reviewCount = (card.reviewCount || 0) + 1
        card.nextReview = now + (newStability * 24 * 60 * 60 * 1000)

        saveDecks()
        scheduleReviewNotification()
        session.done++
        startReview(deck, session)
    }

    // ---------- Grade buttons ----------
    const gradeButtons = document.createElement("div")
    gradeButtons.className = "grade-buttons"
    const grades = [
        { label: "Again", grade: 1, cls: "grade-again" },
        { label: "Hard", grade: 2, cls: "grade-hard" },
        { label: "Good", grade: 3, cls: "grade-good" },
        { label: "Easy", grade: 4, cls: "grade-easy" }
    ]
    grades.forEach((g) => {
        const btn = document.createElement("button")
        btn.className = `grade-btn ${g.cls}`
        const name = document.createElement("span")
        name.textContent = g.label
        const hint = document.createElement("span")
        hint.textContent = formatInterval(previewStability(card, g.grade))
        btn.appendChild(name)
        btn.appendChild(hint)
        btn.addEventListener("click", () => { gradeCard(g.grade) })
        gradeButtons.appendChild(btn)
    })
    deckDetails.appendChild(gradeButtons)

    const info = document.createElement("p")
    info.className = "review-info"
    info.textContent = card.stability === null
        ? "Never reviewed yet"
        : `Reviewed ${card.reviewCount} ${card.reviewCount === 1 ? "time" : "times"}. Difficulty ${card.difficulty.toFixed(1)}. Memory lasts about ${formatInterval(card.stability)}.`
    deckDetails.appendChild(info)

    // ---------- Keyboard: Space flips, 1-4 grades ----------
    reviewKeyHandler = (e) => {
        const tag = e.target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA") { return }
        if (e.key === " " || e.key === "Enter") {
            if (tag === "BUTTON") { return }
            e.preventDefault()
            flip()
        } else if (["1", "2", "3", "4"].includes(e.key)) {
            gradeCard(Number(e.key))
        }
    }
    document.addEventListener("keydown", reviewKeyHandler)
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