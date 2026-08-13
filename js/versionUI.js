document.addEventListener("DOMContentLoaded", () => {
  const versionElement = document.getElementById("ascendVersion");

  if (!versionElement) return;

  versionElement.textContent = `v${ASCEND_VERSION.version} ${ASCEND_VERSION.stage}`;

  versionElement.style.cursor = "pointer";

  versionElement.addEventListener("click", () => {
    showUpdateHistory();
  });
});

function showUpdateHistory() {
  const existing = document.getElementById("updateModal");

  if (existing) {
    existing.remove();
    return;
  }

  const modal = document.createElement("div");

  modal.id = "updateModal";
  modal.className = "update-modal";

  const content = document.createElement("div");

  content.className = "update-modal-content";

  const header = document.createElement("div");

  header.className = "update-modal-header";

  const title = document.createElement("h2");

  title.textContent = "What's New";

  const closeButton = document.createElement("button");

  closeButton.textContent = "×";
  closeButton.className = "update-close";

  closeButton.onclick = () => {
    modal.remove();
  };

  header.appendChild(title);
  header.appendChild(closeButton);

  content.appendChild(header);

  ASCEND_VERSION.updates.forEach((update) => {
    const updateSection = document.createElement("section");

    updateSection.className = "update-entry";

    const version = document.createElement("h3");

    version.textContent = update.version;

    const date = document.createElement("small");

    date.textContent = update.date;

    const updateTitle = document.createElement("h4");

    updateTitle.textContent = update.title;

    const list = document.createElement("ul");

    update.changes.forEach((change) => {
      const item = document.createElement("li");

      item.textContent = change;

      list.appendChild(item);
    });

    updateSection.appendChild(version);
    updateSection.appendChild(date);
    updateSection.appendChild(updateTitle);
    updateSection.appendChild(list);

    content.appendChild(updateSection);
  });

  modal.appendChild(content);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}
