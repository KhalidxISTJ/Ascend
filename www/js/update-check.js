(function () {
    const CURRENT_VERSION = "v1.1.4";
    const RELEASES_API = "https://api.github.com/repos/KhalidxISTJ/Ascend/releases/latest";

    let pendingDownloadUrl = null;

    async function checkForUpdate() {
        try {
            const response = await fetch(RELEASES_API);
            const data = await response.json();

            if (data.tag_name !== CURRENT_VERSION) {
                const apkAsset = data.assets.find(asset => asset.name.endsWith(".apk"));
                if (apkAsset) {
                    pendingDownloadUrl = apkAsset.browser_download_url;
                    tryShowButton();
                }
            }
        } catch (err) {
            console.log("Update check failed:", err);
        }
    }

    function tryShowButton() {
        const sidebar = document.getElementById("sidebar");
        if (!sidebar || !pendingDownloadUrl) {
            return;
        }

        const btn = document.createElement("button");
        btn.textContent = "Update Available";
        btn.id = "update-available-btn";
        sidebar.appendChild(btn);

        btn.addEventListener("click", async () => {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                await window.Capacitor.Plugins.Browser.open({ url: pendingDownloadUrl });
            } else {
                window.open(pendingDownloadUrl, "_blank");
            }
        });
    }

    document.addEventListener("navLoaded", tryShowButton);
    checkForUpdate();
})();