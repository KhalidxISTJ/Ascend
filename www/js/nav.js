(function () {
    let sideBar, sideBarOverlay, hamburgerNav, logoutBtn, version, updatePanel, closeUpdatePanel, updateBack, updateList;
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
    // WHAT'S NEW PANEL
    // The updates live in js/version.js (ASCEND_VERSION.updates, newest first).
    // That file is loaded the first time the panel opens, so pages don't need
    // their own <script> tag for it.
    // =====================

    function loadVersionData(callback) {
        if (typeof ASCEND_VERSION !== "undefined") {
            callback();
            return;
        }
        const script = document.createElement("script");
        script.src = "js/version.js";
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
    }

    // "2026-11-24" -> "Nov 24, 2026" (built from parts so it never shifts a day)
    function formatUpdateDate(key) {
        const parts = String(key || "").split("-").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return key || "";
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function renderUpdateList() {
        if (!updateList) return;
        updateList.textContent = "";

        const updates = (typeof ASCEND_VERSION !== "undefined" && ASCEND_VERSION.updates) || [];
        if (updates.length === 0) {
            const empty = document.createElement("p");
            empty.className = "update-summary";
            empty.textContent = "No updates to show yet.";
            updateList.appendChild(empty);
            return;
        }

        updates.forEach((update) => {
            const entry = document.createElement("section");
            entry.className = "update-entry";

            const heading = document.createElement("h2");
            heading.className = "update-version";
            heading.textContent = "Version " + update.version;
            entry.appendChild(heading);

            if (update.date) {
                const date = document.createElement("small");
                date.className = "update-date";
                date.textContent = formatUpdateDate(update.date);
                entry.appendChild(date);
            }

            if (update.summary) {
                const summary = document.createElement("p");
                summary.className = "update-summary";
                summary.textContent = update.summary;
                entry.appendChild(summary);
            }

            (update.sections || []).forEach((section) => {
                if (section.title) {
                    const title = document.createElement("h3");
                    title.className = "update-section-title";
                    title.textContent = section.title;
                    entry.appendChild(title);
                }
                const list = document.createElement("ul");
                list.className = "update-items";
                (section.items || []).forEach((text) => {
                    const item = document.createElement("li");
                    item.textContent = text;
                    list.appendChild(item);
                });
                entry.appendChild(list);
            });

            updateList.appendChild(entry);
        });
    }

    function showUpdates() {
        loadVersionData(() => {
            renderUpdateList();
            updatePanel.classList.remove("hidden");
            document.body.classList.add("update-open");
            updateList.scrollTop = 0;
        });
    }

    function hideUpdates() {
        updatePanel.classList.add("hidden");
        document.body.classList.remove("update-open");
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
        updateBack = document.getElementById("update-back");
        updateList = document.getElementById("update-list");

        version.textContent = APP_VERSION;

        hamburgerNav.addEventListener("click", openSideBar);
        sideBarOverlay.addEventListener("click", closeSideBar);
        logoutBtn.addEventListener("click", logout);
        version.addEventListener("click", showUpdates);
        closeUpdatePanel.addEventListener("click", hideUpdates);
        updateBack.addEventListener("click", hideUpdates);
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !updatePanel.classList.contains("hidden")) {
                hideUpdates();
            }
        });
    }

    document.addEventListener("navLoaded", initNavUI);
})();