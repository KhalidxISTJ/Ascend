const levelElement = document.getElementById("level");

const xpNumberSpan = document.getElementById("xp-number");

const xpFill = document.getElementById("xp-fill");

const profileImage = document.getElementById("profile-img");

const profileImageInput = document.getElementById("profile-picture");

const APP_VERSION = "v1.0.0 Alpha";

const versionElement = document.getElementById("version");

if (versionElement) {
  versionElement.textContent = APP_VERSION;
}

// ======================
// PROFILE IMAGE
// ======================

if (profileImage && profileImageInput) {
  profileImage.addEventListener("click", function () {
    profileImageInput.click();
  });

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

// ======================
// PLAYER DATA
// ======================

let playerData = {
  name: "",
  level: 1,
  xp: 0,
  profileImage: "",
  lastResetDate: "",
};

// ======================
// SAVE / LOAD
// ======================

function savePlayer() {
  localStorage.setItem("playerData", JSON.stringify(playerData));
}

function loadPlayer() {
  const savedPlayer = localStorage.getItem("playerData");

  if (savedPlayer) {
    playerData = JSON.parse(savedPlayer);

    // Safety for older player data
    if (typeof playerData.level !== "number") {
      playerData.level = 1;
    }

    if (typeof playerData.xp !== "number") {
      playerData.xp = 0;
    }
  }
}

loadPlayer();

// ======================
// XP SYSTEM
// ======================

function getXPRequired(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

// ======================
// UPDATE UI
// ======================

function updateUI() {
  if (levelElement) {
    levelElement.textContent = "Level: " + playerData.level;
  }

  if (xpNumberSpan) {
    const xpRequired = getXPRequired(playerData.level);

    xpNumberSpan.textContent = `${playerData.xp} / ${xpRequired} XP`;
  }

  if (xpFill) {
    const xpRequired = getXPRequired(playerData.level);

    const percentage = (playerData.xp / xpRequired) * 100;

    xpFill.style.width = percentage + "%";
  }
}

// ======================
// ADD XP
// ======================

function addXP(amount) {
  if (amount <= 0) {
    return;
  }

  playerData.xp += amount;

  let xpRequired = getXPRequired(playerData.level);

  while (playerData.xp >= xpRequired) {
    playerData.xp -= xpRequired;

    playerData.level++;

    xpRequired = getXPRequired(playerData.level);
  }

  savePlayer();

  updateUI();
}

// ======================
// REMOVE XP
// ======================

function removeXP(amount) {
  if (amount <= 0) {
    return;
  }

  playerData.xp -= amount;

  while (playerData.xp < 0 && playerData.level > 1) {
    playerData.level--;

    const previousLevelXP = getXPRequired(playerData.level);

    playerData.xp += previousLevelXP;
  }

  // Prevent negative XP at Level 1
  if (playerData.level <= 1 && playerData.xp < 0) {
    playerData.level = 1;
    playerData.xp = 0;
  }

  savePlayer();

  updateUI();
}

// ======================
// RESET PROGRESSION
// ======================

function resetProgression() {
  playerData.level = 1;
  playerData.xp = 0;

  savePlayer();

  updateUI();
}

// ======================
// INITIAL UI
// ======================

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
