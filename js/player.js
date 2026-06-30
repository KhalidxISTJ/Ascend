const levelElement = document.getElementById("level");

const xpNumberSpan = document.getElementById("xp-number");

const xpFill = document.getElementById("xp-fill");

const profileImage = document.getElementById("profile-img");

const profileImageInput = document.getElementById("profile-picture");

if (profileImage && profileImageInput) {

    profileImage.addEventListener("click", function () {

        profileImageInput.click();

    });

    if (profileImageInput) {

    profileImageInput.addEventListener("change", function () {

        const file = profileImageInput.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            playerData.profileImage = event.target.result;

            savePlayer();

            profileImage.src = playerData.profileImage;

        };

        reader.readAsDataURL(file);

    });

}

}

let playerData = {
    name: "",
    level: 0,
    xp: 0,
    profileImage: "",
    lastResetDate: ""
};

function savePlayer() {

    localStorage.setItem(
        "playerData",
        JSON.stringify(playerData)
    );

}

function loadPlayer() {

    const savedPlayer = localStorage.getItem("playerData");

    if (savedPlayer) {

        playerData = JSON.parse(savedPlayer);

    }

}

loadPlayer();



function updateUI() {
    
    

    if (levelElement)
        levelElement.textContent = "Level: " + playerData.level;

    if (xpNumberSpan)
        xpNumberSpan.textContent = playerData.xp;

    if (xpFill)
        xpFill.style.width = playerData.xp + "%";
    
}

function addXP(amount) {

    playerData.xp += amount;

    while (playerData.xp >= 100) {

        playerData.level++;
        playerData.xp -= 100;

    }

    savePlayer();

    updateUI();

}

function removeXP(amount) {

    playerData.xp -= amount;

    if (playerData.xp < 0) {

        playerData.xp = 0;

    }

    savePlayer();

    updateUI();
}

loadPlayer();
updateUI();

if (profileImage && playerData.profileImage) {

    profileImage.src = playerData.profileImage;

}
// TEST
// addXP(10);

// ======================
// PLAYER NAME
// ======================

const nameInput = document.getElementById("name");

const displayName = document.getElementById("display-name");

const profileForm = document.getElementById("profile-form");

if (displayName) {
    displayName.textContent = "Name: " + playerData.name;
}

if (profileForm && nameInput) {

    profileForm.addEventListener("submit", function (event) {

        event.preventDefault();
        
        console.log("Profile form submitted");

        const newName = nameInput.value.trim();

        if (newName !== "") {

            playerData.name = newName;

            savePlayer();

            if (displayName) {

        displayName.textContent = "Name: " + playerData.name;

    }

        }

    });

}