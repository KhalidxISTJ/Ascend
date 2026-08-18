// =====================================================
// ASCEND LIBRARY
// Pages + Blocks + Storage
// =====================================================

const LIBRARY_STORAGE_KEY = "ascendLibrary";

// =====================================================
// DATA
// =====================================================

let library = {
  pages: [],
};

// =====================================================
// STORAGE
// =====================================================

function saveLibrary() {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
}

function loadLibrary() {
  const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);

  if (!savedLibrary) {
    return;
  }

  try {
    library = JSON.parse(savedLibrary);
  } catch (error) {
    console.error("Failed to load Ascend Library:", error);

    library = {
      pages: [],
    };
  }
}

// =====================================================
// PAGE CREATION
// =====================================================

function createLibraryPage({
  title = "Untitled",
  parentId = null,
  icon = "📄",
} = {}) {
  const page = {
    id: crypto.randomUUID(),
    title,
    icon,
    parentId,
    blocks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  library.pages.push(page);

  saveLibrary();

  return page;
}

// =====================================================
// PAGE LOOKUP
// =====================================================

function getLibraryPage(pageId) {
  return library.pages.find((page) => page.id === pageId);
}

function getLibraryChildren(parentId = null) {
  return library.pages.filter((page) => page.parentId === parentId);
}

// =====================================================
// BLOCK CREATION
// =====================================================

function createLibraryBlock(page, type = "text", content = "") {
  const block = {
    id: crypto.randomUUID(),
    type,
    content,
  };

  page.blocks.push(block);

  page.updatedAt = new Date().toISOString();

  saveLibrary();

  return block;
}

// =====================================================
// INITIALIZE
// =====================================================

loadLibrary();

console.log("📚 Ascend Library loaded");
