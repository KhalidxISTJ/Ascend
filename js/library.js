/* =========================================================
   ASCEND LIBRARY — WITH INLINE CHECKLIST
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     STORAGE
  ======================================================= */

  const STORAGE_KEY = "ascendLibrary";

  let library = {
    sections: [],
    pages: [],
    selectedPageId: null,
  };

  window.quill = null;
  const history = [];
  let historyIndex = -1;
  let isRestoringHistory = false;

  let savedIndex = null;
  let savedLength = 0;
  let isApplyingSize = false;

  /* =======================================================
     DOM
  ======================================================= */

  const pageList = document.getElementById("libraryPageList");
  const emptyState = document.getElementById("libraryEmptyState");
  const pageView = document.getElementById("libraryPageView");
  const pageTitle = document.getElementById("libraryPageTitle");
  const newPageBtn = document.getElementById("newLibraryPageBtn");
  const newSubpageBtn = document.getElementById("newLibrarySubpageBtn");
  const deletePageBtn = document.getElementById("deleteLibraryPageBtn");
  const undoBtn = document.getElementById("libraryUndoBtn");
  const redoBtn = document.getElementById("libraryRedoBtn");
  const searchBtn = document.getElementById("librarySearchBtn");
  const searchBar = document.getElementById("librarySearchBar");
  const searchInput = document.getElementById("librarySearchInput");
  const searchCount = document.getElementById("librarySearchCount");
  const searchClose = document.getElementById("librarySearchClose");

  /* =======================================================
     INITIALIZATION
  ======================================================= */

  function init() {
    const container = document.getElementById("editor-container");
    if (!container) {
      console.error("Ascend Library: #editor-container not found.");
      return;
    }

    console.log("Init started");

    loadLibrary();

    console.log("Library loaded:", library);

    if (library.sections.length === 0) {
      const defaultSection = {
        id: createId(),
        title: "📁 Uncategorized",
        pages: library.pages.map((p) => p.id),
      };
      library.sections.push(defaultSection);
      saveLibrary();
    }

    const Size = Quill.import("attributors/style/size");
    Size.whitelist = ["10", "12", "14", "16", "18", "24", "36", "48", "72"];
    Quill.register(Size, true);

    window.quill = new Quill(container, {
      theme: "snow",
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            [{ size: ["10", "12", "14", "16", "18", "24", "36", "48", "72"] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
            [{ align: [] }],
            ["link", "image", "code-block"],
            ["clean"],
          ],
        },
      },
      placeholder: "Start writing...",
    });

    // Set up inline checklist click handler
    setupInlineChecklist();

    setTimeout(() => {
      setupFontSizeFix();
    }, 300);

    console.log("Quill initialized");

    window.quill.on("text-change", () => {
      if (!isRestoringHistory) {
        saveCurrentPage();
      }
    });

    bindEvents();
    renderPageList();

    if (library.selectedPageId) {
      openPage(library.selectedPageId);
    } else if (library.pages.length > 0) {
      openPage(library.pages[0].id);
    } else {
      showEmptyState();
    }

    console.log("Init complete");
  }

  /* =======================================================
     INLINE CHECKLIST HANDLER
  ======================================================= */

  function setupInlineChecklist() {
    const editor = document.querySelector(".ql-editor");
    if (!editor) return;

    // Listen for clicks on the editor
    editor.addEventListener("click", function (e) {
      // Find if we clicked on a list item
      const li = e.target.closest("li");
      if (!li) return;

      // Check if it's a checklist item (has parent ul with data-checked)
      const ul = li.parentElement;
      if (!ul || ul.tagName !== "UL") return;

      // Check if this is a checklist (has data-checked attribute)
      if (!ul.hasAttribute("data-checked")) return;

      // Toggle the checklist item
      const isChecked = ul.getAttribute("data-checked") === "true";
      const newState = !isChecked;
      ul.setAttribute("data-checked", newState ? "true" : "false");

      // Also update the li class
      li.classList.toggle("ql-checked", newState);

      // Save the changes
      saveCurrentPage();

      console.log(
        `✅ Toggled checklist item to ${newState ? "checked" : "unchecked"}`,
      );
    });
  }

  /* =======================================================
     FONT SIZE FIX
  ======================================================= */

  function saveQuillSelection() {
    if (isApplyingSize) return;

    const range = window.quill.getSelection();
    if (range && range.length > 0) {
      savedIndex = range.index;
      savedLength = range.length;
      return true;
    }
    return false;
  }

  function setupFontSizeFix() {
    const toolbar = document.querySelector(".ql-toolbar");
    if (!toolbar) return;

    const sizePicker = toolbar.querySelector(".ql-size");
    if (!sizePicker) return;

    window.quill.on("selection-change", function (range, oldRange, source) {
      if (range && range.length > 0) {
        saveQuillSelection();
      }
    });

    const pickerLabel = sizePicker.querySelector(".ql-picker-label");
    if (pickerLabel) {
      pickerLabel.addEventListener("mousedown", function (e) {
        saveQuillSelection();
      });
    }

    const options = sizePicker.querySelectorAll(
      ".ql-picker-options .ql-picker-item",
    );
    options.forEach((item) => {
      item.addEventListener("mouseenter", function () {
        saveQuillSelection();
      });

      item.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const value = this.getAttribute("data-value");
        if (!value) return;

        if (savedIndex !== null && savedLength > 0) {
          try {
            isApplyingSize = true;
            window.quill.setSelection(savedIndex, savedLength);
            window.quill.format("size", value);

            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (!range.collapsed) {
                const text = range.toString();
                if (text && text.length > 0) {
                  const span = document.createElement("span");
                  span.style.fontSize = value + "px";
                  span.textContent = text;
                  range.deleteContents();
                  range.insertNode(span);
                }
              }
            }

            window.quill.update();
            saveCurrentPage();

            savedIndex = null;
            savedLength = 0;
          } catch (err) {
            console.error("Error applying size:", err);
          } finally {
            isApplyingSize = false;
          }
        }
        window.quill.focus();
      });
    });

    console.log("✅ Font size fix applied!");
  }

  /* =======================================================
     SECTIONS & PAGE LIST
  ======================================================= */
  /* =======================================================
   RENDER PAGE ITEM (with hierarchy support)
======================================================= */

  function renderPageItem(page, depth) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "library-page-item";
    button.draggable = true;

    if (page.id === library.selectedPageId) {
      button.classList.add("active");
    }

    // Indent based on depth (sub-pages get indented)
    button.style.paddingLeft = `${11 + depth * 24}px`;

    const icon = document.createElement("span");
    icon.className = "library-page-icon";
    icon.textContent = depth > 0 ? "↳" : "📄";

    const name = document.createElement("span");
    name.className = "library-page-name";
    name.textContent = page.title || "Untitled";

    button.appendChild(icon);
    button.appendChild(name);

    button.addEventListener("click", () => {
      openPage(page.id);
    });

    button.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", page.id);
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => button.classList.add("dragging"), 0);
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("dragging");
    });

    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showPageContextMenu(e.clientX, e.clientY, page, null);
    });

    pageList.appendChild(button);

    // Find and render children (sub-pages)
    const children = library.pages.filter(
      (child) => child.parentId === page.id,
    );
    for (const child of children) {
      renderPageItem(child, depth + 1);
    }
  }

  function renderPageList() {
    if (!pageList) return;
    pageList.innerHTML = "";

    if (library.pages.length === 0) {
      const empty = document.createElement("div");
      empty.className = "library-empty-pages";
      empty.textContent = "No pages yet. Create a page to get started.";
      pageList.appendChild(empty);
      return;
    }

    // Only show root pages (no parentId)
    const roots = library.pages.filter((page) => !page.parentId);

    if (roots.length === 0) {
      // If no root pages, show all pages (orphans)
      for (const page of library.pages) {
        renderPageItem(page, 0);
      }
    } else {
      for (const page of roots) {
        renderPageItem(page, 0);
      }
    }
  }

  function createSectionElement(section) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "library-section";
    sectionDiv.dataset.sectionId = section.id;

    const header = document.createElement("div");
    header.className = "library-section-header";
    header.innerHTML = `
      <span class="library-section-toggle">▼</span>
      <span class="library-section-title">${section.title}</span>
      <span class="library-section-count">(${section.pages.length})</span>
      <span class="library-section-actions">
        <button class="library-section-rename-btn" title="Rename">✏️</button>
        <button class="library-section-delete-btn" title="Delete">🗑️</button>
      </span>
    `;

    const toggle = header.querySelector(".library-section-toggle");
    const pageContainer = document.createElement("div");
    pageContainer.className = "library-section-pages";

    header.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const isCollapsed = pageContainer.classList.toggle("collapsed");
      toggle.textContent = isCollapsed ? "▶" : "▼";
    });

    const renameBtn = header.querySelector(".library-section-rename-btn");
    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newTitle = prompt("Rename section:", section.title);
      if (newTitle && newTitle.trim()) {
        section.title = newTitle.trim();
        saveLibrary();
        renderPageList();
      }
    });

    const deleteBtn = header.querySelector(".library-section-delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (section.pages.length > 0) {
        if (
          !confirm(
            `Delete section "${section.title}" and move its ${section.pages.length} pages to "Uncategorized"?`,
          )
        )
          return;
      } else {
        if (!confirm(`Delete section "${section.title}"?`)) return;
      }

      const uncategorized = library.sections.find(
        (s) => s.title === "📁 Uncategorized",
      );
      if (section.pages.length > 0 && uncategorized) {
        uncategorized.pages.push(...section.pages);
      }

      library.sections = library.sections.filter((s) => s.id !== section.id);
      saveLibrary();
      renderPageList();
    });

    section.pages.forEach((pageId) => {
      const page = library.pages.find((p) => p.id === pageId);
      if (page) {
        const pageEl = createPageItem(page, section.id);
        pageContainer.appendChild(pageEl);
      }
    });

    pageContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      pageContainer.classList.add("drag-over");
    });

    pageContainer.addEventListener("dragleave", (e) => {
      pageContainer.classList.remove("drag-over");
    });

    pageContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pageContainer.classList.remove("drag-over");

      const pageId = e.dataTransfer.getData("text/plain");
      if (pageId) {
        movePageToSection(pageId, section.id);
      }
    });

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(pageContainer);

    return sectionDiv;
  }

  function createPageItem(page, sectionId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "library-page-item";
    button.draggable = true;

    if (page.id === library.selectedPageId) {
      button.classList.add("active");
    }

    const icon = document.createElement("span");
    icon.className = "library-page-icon";
    icon.textContent = "📄";

    const name = document.createElement("span");
    name.className = "library-page-name";
    name.textContent = page.title || "Untitled";

    button.appendChild(icon);
    button.appendChild(name);

    button.addEventListener("click", () => {
      openPage(page.id);
    });

    button.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", page.id);
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => button.classList.add("dragging"), 0);
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("dragging");
    });

    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showPageContextMenu(e.clientX, e.clientY, page, sectionId);
    });

    return button;
  }

  function showPageContextMenu(x, y, page, sectionId) {
    const existing = document.querySelector(".library-context-menu");
    if (existing) existing.remove();

    const menu = document.createElement("div");
    menu.className = "library-context-menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    const options = [
      { label: "📄 Open", action: () => openPage(page.id) },
      {
        label: "✏️ Rename",
        action: () => {
          const newTitle = prompt("Rename page:", page.title);
          if (newTitle && newTitle.trim()) {
            page.title = newTitle.trim();
            saveLibrary();
            renderPageList();
            if (page.id === library.selectedPageId) {
              pageTitle.value = page.title;
            }
          }
        },
      },
      {
        label: "📋 Move to section...",
        action: () => {
          const sectionNames = library.sections
            .filter((s) => s.id !== sectionId)
            .map((s, i) => `${i + 1}. ${s.title}`);

          const choice = prompt(
            `Move "${page.title}" to which section?\n\n${sectionNames.join("\n")}\n\nEnter section number:`,
          );

          if (choice) {
            const index = parseInt(choice) - 1;
            const targetSection = library.sections.filter(
              (s) => s.id !== sectionId,
            )[index];
            if (targetSection) {
              movePageToSection(page.id, targetSection.id);
            }
          }
        },
      },
      {
        label: "🗑️ Delete",
        action: () => {
          if (confirm(`Delete "${page.title}"?`)) {
            library.sections.forEach((s) => {
              s.pages = s.pages.filter((id) => id !== page.id);
            });
            library.pages = library.pages.filter((p) => p.id !== page.id);
            if (library.selectedPageId === page.id) {
              library.selectedPageId = null;
            }
            saveLibrary();
            renderPageList();
            showEmptyState();
          }
        },
      },
    ];

    options.forEach((opt) => {
      const item = document.createElement("div");
      item.className = "library-context-menu-item";
      item.textContent = opt.label;
      item.addEventListener("click", () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    document.addEventListener("click", function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    });
  }

  function createSection(title) {
    const section = {
      id: createId(),
      title: title,
      pages: [],
    };
    library.sections.push(section);
    saveLibrary();
    renderPageList();
    return section;
  }

  function movePageToSection(pageId, targetSectionId) {
    const page = library.pages.find((p) => p.id === pageId);
    if (!page) return;

    library.sections.forEach((section) => {
      section.pages = section.pages.filter((id) => id !== pageId);
    });

    const targetSection = library.sections.find(
      (s) => s.id === targetSectionId,
    );
    if (targetSection) {
      targetSection.pages.push(pageId);
    }

    saveLibrary();
    renderPageList();
  }

  /* =======================================================
     PAGE MANAGEMENT
  ======================================================= */

  function createPage(title = "Untitled", parentId = null) {
    const page = {
      id: createId(),
      title,
      parentId, // ← This should be set to the parent page's ID
      content: JSON.stringify({ ops: [] }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    library.pages.push(page);
    library.selectedPageId = page.id;

    // Add to first section, or Uncategorized
    if (library.sections.length > 0) {
      library.sections[0].pages.push(page.id);
    }

    saveLibrary();
    renderPageList();
    openPage(page.id);
    return page;
  }

  function deleteCurrentPage() {
    const page = getSelectedPage();
    if (!page) return;

    if (!window.confirm(`Delete "${page.title}"?`)) return;

    library.sections.forEach((section) => {
      section.pages = section.pages.filter((id) => id !== page.id);
    });

    library.pages = library.pages.filter((p) => p.id !== page.id);
    library.selectedPageId = null;
    saveLibrary();
    renderPageList();

    if (library.pages.length > 0) {
      openPage(library.pages[0].id);
    } else {
      showEmptyState();
    }
  }

  /* =======================================================
     OPEN PAGE
  ======================================================= */

  function openPage(pageId) {
    const page = library.pages.find((item) => item.id === pageId);
    if (!page) return;

    library.selectedPageId = page.id;
    saveLibrary();

    if (emptyState) emptyState.classList.add("hidden");
    if (pageView) pageView.classList.remove("hidden");

    pageTitle.value = page.title || "Untitled";

    isRestoringHistory = true;
    try {
      if (
        !page.content ||
        page.content === '{"ops":[]}' ||
        page.content === '[{"insert":""}]'
      ) {
        window.quill.setContents([]);
      } else {
        const delta = JSON.parse(page.content);
        if (delta && typeof delta === "object" && "ops" in delta) {
          window.quill.setContents(delta);
        } else {
          window.quill.setContents([]);
        }
      }
    } catch {
      window.quill.setContents([]);
    }
    isRestoringHistory = false;

    clearHistory();
    saveCurrentState();
    renderPageList();
    window.quill.focus();
  }

  function showEmptyState() {
    if (emptyState) emptyState.classList.remove("hidden");
    if (pageView) pageView.classList.add("hidden");
  }

  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  function getSelectedPage() {
    return library.pages.find((page) => page.id === library.selectedPageId);
  }

  function saveCurrentPage() {
    const page = getSelectedPage();
    if (!page || !window.quill) return;

    page.title = pageTitle.value.trim() || "Untitled";
    const delta = window.quill.getContents();
    page.content = JSON.stringify(delta);
    page.updatedAt = new Date().toISOString();

    saveLibrary();
    renderPageList();
    console.log("💾 Page saved!");
  }

  /* =======================================================
     EVENTS
  ======================================================= */

  function bindEvents() {
    newPageBtn?.addEventListener("click", function (event) {
      event.preventDefault();
      createPage("Untitled", null);
    });

    newSubpageBtn?.addEventListener("click", function (event) {
      event.preventDefault();
      const page = getSelectedPage();
      if (page) createPage("Untitled", page.id);
    });

    deletePageBtn?.addEventListener("click", deleteCurrentPage);
    pageTitle?.addEventListener("input", saveCurrentPage);

    undoBtn?.addEventListener("click", undo);
    redoBtn?.addEventListener("click", redo);

    searchBtn?.addEventListener("click", toggleSearch);
    searchClose?.addEventListener("click", closeSearch);
    searchInput?.addEventListener("input", performSearch);
    searchInput?.addEventListener("keydown", handleSearchKeydown);
  }

  /* =======================================================
     HISTORY
  ======================================================= */

  function clearHistory() {
    history.length = 0;
    historyIndex = -1;
  }

  function getState() {
    if (!window.quill) return null;
    return {
      content: JSON.stringify(window.quill.getContents()),
      title: pageTitle.value,
    };
  }

  function saveCurrentState() {
    const state = getState();
    if (!state) return;
    history.push(state);
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }

  function pushHistory() {
    const state = getState();
    if (!state) return;

    const current = history[historyIndex];
    if (
      current &&
      current.content === state.content &&
      current.title === state.title
    ) {
      return;
    }

    history.splice(historyIndex + 1);
    history.push(state);
    historyIndex = history.length - 1;

    if (history.length > 100) {
      history.shift();
      historyIndex--;
    }

    updateHistoryButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreHistoryState(history[historyIndex]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreHistoryState(history[historyIndex]);
  }

  function restoreHistoryState(state) {
    if (!state || !window.quill) return;

    isRestoringHistory = true;
    try {
      const delta = JSON.parse(state.content);
      window.quill.setContents(delta);
    } catch {
      window.quill.setContents([]);
    }
    pageTitle.value = state.title;
    isRestoringHistory = false;

    saveCurrentPage();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  let searchMatches = [];
  let currentSearchIndex = -1;

  function toggleSearch() {
    if (!searchBar) return;
    searchBar.classList.toggle("hidden");
    if (!searchBar.classList.contains("hidden")) {
      searchInput?.focus();
    } else {
      clearSearch();
    }
  }

  function closeSearch() {
    searchBar?.classList.add("hidden");
    clearSearch();
  }

  function performSearch() {
    clearSearch(false);

    const query = searchInput?.value.trim();
    if (!query) {
      updateSearchCount();
      return;
    }

    if (!window.quill) return;

    const text = window.quill.getText();
    const matches = [];
    let index = text.toLowerCase().indexOf(query.toLowerCase());

    while (index !== -1) {
      matches.push(index);
      index = text.toLowerCase().indexOf(query.toLowerCase(), index + 1);
    }

    searchMatches = matches;
    currentSearchIndex = matches.length > 0 ? 0 : -1;
    focusSearchMatch();
    updateSearchCount();
  }

  function clearSearch(update = true) {
    searchMatches = [];
    currentSearchIndex = -1;
    if (update) updateSearchCount();
  }

  function focusSearchMatch() {
    if (currentSearchIndex < 0 || !searchMatches.length) return;

    const text = window.quill.getText();
    const matchIndex = searchMatches[currentSearchIndex];
    const before = text.substring(0, matchIndex);
    const lines = before.split("\n");
    const lineNumber = lines.length - 1;

    const container = document.querySelector(".ql-editor");
    if (container) {
      const lineHeight = parseInt(getComputedStyle(container).lineHeight) || 24;
      container.scrollTop = lineNumber * lineHeight;
    }
  }

  function updateSearchCount() {
    if (!searchCount) return;

    const total = searchMatches.length;
    if (!searchInput?.value.trim()) {
      searchCount.textContent = "0 results";
      return;
    }
    searchCount.textContent = `${total} ${total === 1 ? "result" : "results"}`;
  }

  function handleSearchKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!searchMatches.length) return;
      currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
      focusSearchMatch();
    }
    if (event.key === "Escape") {
      closeSearch();
    }
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  function createId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function migratePage(page) {
    const migrated = {
      id: page.id || createId(),
      title: page.title || "Untitled",
      parentId: page.parentId || null,
      content: page.content || "",
      createdAt: page.createdAt || new Date().toISOString(),
      updatedAt: page.updatedAt || new Date().toISOString(),
    };

    if (typeof page.content === "string" && !page.content.startsWith("{")) {
      migrated.content = JSON.stringify([{ insert: page.content || "" }]);
    }

    if (typeof page.content === "string" && page.content.startsWith("{")) {
      migrated.content = page.content;
    }

    return migrated;
  }

  function loadLibrary() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return;

      library.sections = Array.isArray(parsed.sections) ? parsed.sections : [];
      library.pages = Array.isArray(parsed.pages)
        ? parsed.pages.map(migratePage)
        : [];
      library.selectedPageId = parsed.selectedPageId || null;
    } catch (error) {
      console.error("Ascend Library: Failed to load library.", error);
      library = { sections: [], pages: [], selectedPageId: null };
    }
  }

  function saveLibrary() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Ascend Library: Failed to save library.", error);
    }
  }

  // Migration: Add sections to existing data
  const checkData = JSON.parse(
    localStorage.getItem("ascendLibrary") || '{"pages":[]}',
  );

  if (checkData.pages && checkData.pages.length > 0 && !checkData.sections) {
    const defaultSection = {
      id: createId(),
      title: "📁 Uncategorized",
      pages: checkData.pages.map((p) => p.id),
    };
    checkData.sections = [defaultSection];
    checkData.selectedPageId = checkData.selectedPageId || null;
    localStorage.setItem("ascendLibrary", JSON.stringify(checkData));
  }

  if (checkData.pages && checkData.pages.length === 0) {
    const defaultPage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: "Welcome",
      parentId: null,
      content: JSON.stringify({
        ops: [
          {
            insert:
              "Welcome to Ascend Library! Create sections and organize your knowledge.",
          },
        ],
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const defaultSection = {
      id: createId(),
      title: "📁 Uncategorized",
      pages: [defaultPage.id],
    };

    checkData.pages = [defaultPage];
    checkData.sections = [defaultSection];
    checkData.selectedPageId = defaultPage.id;
    localStorage.setItem("ascendLibrary", JSON.stringify(checkData));
  }

  /* =======================================================
     START
  ======================================================= */

  document.addEventListener("DOMContentLoaded", init);
})();
