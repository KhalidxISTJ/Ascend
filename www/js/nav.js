(function () {
    let sideBar, sideBarOverlay, hamburgerNav, logoutBtn, version, updatePanel, closeUpdatePanel;
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

    async function logout(event) {
        await supabaseClient.auth.signOut();
        localStorage.removeItem("username");
        localStorage.removeItem("currentUserEmail");
        localStorage.removeItem("currentUserId");
        window.location.href = "splash.html";
    }

    // =====================
    // NAV / SIDEBAR UI — depends on nav.html being injected by nav.js first
    // =====================
    // Backup export/import and the notification settings now live on settings.html.

    function initNavUI() {
        sideBar = document.getElementById("sidebar");
        sideBarOverlay = document.getElementById("sidebar-overlay");
        hamburgerNav = document.getElementById("hamburger-nav");
        logoutBtn = document.getElementById("logout-btn");
        version = document.getElementById("version");
        updatePanel = document.getElementById("update-panel");
        closeUpdatePanel = document.getElementById("close-update-panel");

        version.textContent = APP_VERSION;

        hamburgerNav.addEventListener("click", openSideBar);
        sideBarOverlay.addEventListener("click", closeSideBar);
        logoutBtn.addEventListener("click", logout);
        version.addEventListener("click", () => { updatePanel.classList.toggle("hidden"); });
        closeUpdatePanel.addEventListener("click", () => { updatePanel.classList.add("hidden"); });
    }

    document.addEventListener("navLoaded", initNavUI);
})();