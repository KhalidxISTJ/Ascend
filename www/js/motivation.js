const DEFAULT_FEELINGS = ["Low motivation", "Need to focus/distracted", "Overwhelmed"];
const customFeelings = JSON.parse(localStorage.getItem("customFeelings")) || []
const feelingPicker = document.getElementById("feelingPicker")
const feelingDetail = document.getElementById("feelingDetail")
const feelingText = document.getElementById("feelingText")
const feelingForm = document.getElementById("feelingForm")
const feelings = [...DEFAULT_FEELINGS, ...customFeelings]
const feelingContent = JSON.parse(localStorage.getItem("feelingContent")) || {}


feelings.forEach(feeling => {
    const newBtn = document.createElement("button")
    newBtn.textContent = feeling
    feelingPicker.appendChild(newBtn)
    newBtn.addEventListener("click", () => {
        const items = feelingContent[feeling]
        console.log(items)
        if (items === undefined) {
            feelingForm.innerHTML = ""
            feelingText.textContent = "Nothing Added Yet."
            const newFeelInput = document.createElement("input")
            const addBtn = document.createElement("button")
            newFeelInput.id = "newFeelInput"
            newFeelInput.type = "text"
            newFeelInput.placeholder = "Add a content..."
            addBtn.textContent = "Add"
            feelingForm.appendChild(newFeelInput)
            feelingForm.appendChild(addBtn)
            addBtn.addEventListener("click", () => {
                const input = newFeelInput.value
                feelingContent[feeling] = []
                feelingContent[feeling].push(input)
                localStorage.setItem("feelingContent", JSON.stringify(feelingContent))
                feelingText.textContent = input
                newFeelInput.value = ""
            })
        } else {
            feelingForm.innerHTML = ""
            feelingText.textContent = ""
            items.forEach(item => {
                feelingText.textContent += item
            })
            const newFeelInput = document.createElement("input")
            const addBtn = document.createElement("button")
            newFeelInput.id = "newFeelInput"
            newFeelInput.type = "text"
            newFeelInput.placeholder = "Add a content..."
            addBtn.textContent = "Add"
            feelingForm.appendChild(newFeelInput)
            feelingForm.appendChild(addBtn)
            addBtn.addEventListener("click", () => {
                const input = newFeelInput.value
                feelingContent[feeling].push(input)
                localStorage.setItem("feelingContent", JSON.stringify(feelingContent))
                feelingText.textContent += input
                newFeelInput.value = ""
            })
        }
    })
})
