// =====================================================
// PWA — Install Prompt
// =====================================================

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67+ from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log("📱 App can be installed!");

  // Show a custom install button (optional)
  showInstallButton();
});

function showInstallButton() {
  // Check if button already exists
  if (document.getElementById("installBtn")) return;

  const btn = document.createElement("button");
  btn.id = "installBtn";
  btn.textContent = "📱 Install App";
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    z-index: 999;
    transition: all 0.25s;
  `;
  btn.onmouseover = () => {
    btn.style.transform = "scale(1.05)";
  };
  btn.onmouseout = () => {
    btn.style.transform = "scale(1)";
  };
  btn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log(
        `User ${result.outcome === "accepted" ? "installed" : "dismissed"} the app`,
      );
      deferredPrompt = null;
      btn.remove();
    }
  };
  document.body.appendChild(btn);
}

// Hide install button once app is installed
window.addEventListener("appinstalled", () => {
  console.log("✅ App installed!");
  const btn = document.getElementById("installBtn");
  if (btn) btn.remove();
});
