const quests = [
    { name: "Read Java", xp: 10 },
    { name: "Gym", xp: 25 },
    { name: "Homework", xp: 30 },
    { name: "Practice Arabic", xp: 5 }
]

const big = quests.filter((quest) => {
    return quest.xp >= 20
})