(function () {
    let sideBar, sideBarOverlay, hamburgerNav, exportBtn, logoutBtn, importBtn, importFile, version, updatePanel, closeUpdatePanel;
    // On index.html, index.js already declares `user` with `let` (a real global,
    // not scoped to this function). On pages without index.js, nothing has
    // declared it yet. This avoids a conflict either way.
    if (typeof user === "undefined") {
        user = localStorage.getItem("currentUserEmail");
    }

    const navigation = document.getElementById("nav-placeholder")

    fetch("nav.html")
        .then(response => response.text())
        .then(text => {
            navigation.innerHTML = text;
            const page = document.body.dataset.page;
            const links = document.querySelectorAll(".nav-link")
            let href;
            if (page === "home") {
                href = "index.html"
            } else {
                href = page + ".html"
            }
            links.forEach(link => {
                const linkHref = link.getAttribute("href")
                link.classList.toggle("active", linkHref === href)
            })
            document.dispatchEvent(new Event("navLoaded"));
        })

    function openSideBar() {
        sideBar.classList.add("open");
        sideBarOverlay.classList.add("open");
    }

    function closeSideBar() {
        sideBar.classList.remove("open");
        sideBarOverlay.classList.remove("open");
    }

    function exportUserData() {
        const exportData = {
            username: user,
            exportedAt: new Date().toISOString(),
            app: "Ascend",
            data: {
                ascendLibrary: localStorage.getItem(user + "_ascendLibrary"),
                savedQuests: localStorage.getItem(user + "_savedQuests"),
                codexData: localStorage.getItem(user + "_codexData"),
                savedQuestSections: localStorage.getItem(user + "_questSections"),
                questCategories: localStorage.getItem(user + "_questCategories"),
                skillTree: localStorage.getItem(user + "_skillTree"),
                savedPlayerData: localStorage.getItem(user + "_playerData"),
                lastResetDate: localStorage.getItem(user + "_lastResetDate"),
            },
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ascend-${user}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function logout(event) {
        await supabaseClient.auth.signOut();
        localStorage.removeItem("username");
        localStorage.removeItem("currentUserEmail");
        localStorage.removeItem("currentUserId");
        window.location.href = "splash.html";
    }

    function importbtn(event) {
        importFile.click();
    }

    async function handleImport(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = async function () {
            try {
                const backup = JSON.parse(reader.result);

                if (backup.app !== "Ascend") {
                    alert("❌ Invalid file. This isn't an Ascend backup.");
                    return;
                }

                if (!backup.data) {
                    alert("❌ No data found in the backup.");
                    return;
                }

                const confirmed = confirm(
                    "⚠️ Importing will REPLACE all your current data with the backup.\n\nAnything you've added since the backup will be lost.\n\nContinue?",
                );

                if (!confirmed) {
                    return;
                }

                const now = Date.now();
                Object.keys(backup.data).forEach((key) => {
                    const value = backup.data[key];
                    if (value !== null && value !== undefined) {
                        localStorage.setItem(user + "_" + key, value);
                        localStorage.setItem(user + "_" + key + "_modifiedAt", now);
                    }
                });

                const userId = localStorage.getItem("currentUserId");
                if (userId && typeof pushToSupabase === "function") {
                    await pushToSupabase(userId);
                }

                alert("✅ Import complete! Reloading...");
                window.location.reload();
            } catch (error) {
                console.error("Import error:", error);
                alert("❌ Failed to import. The file might be corrupted.");
            } finally {
                importFile.value = "";
            }
        };

        reader.readAsText(file);
    }

    // =====================
    // NAV / SIDEBAR UI — depends on nav.html being injected by nav.js first
    // =====================

    function initNavUI() {
        sideBar = document.getElementById("sidebar");
        sideBarOverlay = document.getElementById("sidebar-overlay");
        hamburgerNav = document.getElementById("hamburger-nav");
        exportBtn = document.getElementById("export-btn");
        logoutBtn = document.getElementById("logout-btn");
        importBtn = document.getElementById("import-btn");
        importFile = document.getElementById("import-file");
        version = document.getElementById("version");
        updatePanel = document.getElementById("update-panel");
        closeUpdatePanel = document.getElementById("close-update-panel");

        version.textContent = APP_VERSION;

        hamburgerNav.addEventListener("click", openSideBar);
        sideBarOverlay.addEventListener("click", closeSideBar);
        exportBtn.addEventListener("click", exportUserData);
        logoutBtn.addEventListener("click", logout);
        importBtn.addEventListener("click", importbtn);
        importFile.addEventListener("change", handleImport);
        version.addEventListener("click", () => { updatePanel.classList.toggle("hidden"); });
        closeUpdatePanel.addEventListener("click", () => { updatePanel.classList.add("hidden"); });
    }

    document.addEventListener("navLoaded", initNavUI);
})();