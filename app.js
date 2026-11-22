// NoteHub - Client-Side Note Management Application

const STORAGE_KEY = 'notehub_notes_data';
const THEME_KEY = 'notehub_theme';

// Default initial notes to provide an attractive first experience
const initialNotes = [
  {
    id: 'demo-1',
    title: '🚀 Welcome to NoteHub!',
    content: 'NoteHub is your simple, distraction-free digital notebook.\n\nKey features:\n• Create, edit, and categorize notes\n• Search notes in real time\n• Pin important notes to the top\n• Toggle between Dark and Light mode\n• Export your notes anytime!',
    category: 'Ideas',
    color: '#3b82f6',
    pinned: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'demo-2',
    title: 'Quarterly Project Goals',
    content: '1. Ship the new landing page UI\n2. Optimize website load time < 1.2s\n3. Conduct user feedback surveys\n4. Review product roadmap with the team',
    category: 'Work',
    color: '#8b5cf6',
    pinned: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 'demo-3',
    title: 'Weekend Grocery & Errands',
    content: '• Almond milk & Greek yogurt\n• Sourdough bread\n• Fresh spinach & avocados\n• Pick up parcel from postal locker\n• Replace water filter',
    category: 'Personal',
    color: '#10b981',
    pinned: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'demo-4',
    title: 'JavaScript Async Patterns',
    content: 'Quick review of Promises, async/await, and event loops:\n- Microtasks (Promise.then, queueMicrotask) take priority over Macrotasks (setTimeout).\n- Always wrap async calls with try/catch or chain .catch() for robust error handling.',
    category: 'Study',
    color: '#f59e0b',
    pinned: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
  }
];

// App State
let notes = loadNotes();
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'newest';

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const emptyState = document.getElementById('empty-state');
const currentViewTitle = document.getElementById('current-view-title');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const sortSelect = document.getElementById('sort-select');
const navItems = document.querySelectorAll('.nav-item');

// Modal Elements
const noteModal = document.getElementById('note-modal');
const modalTitle = document.getElementById('modal-title');
const noteForm = document.getElementById('note-form');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title-input');
const noteCategorySelect = document.getElementById('note-category-select');
const noteContentInput = document.getElementById('note-content-input');
const newNoteBtn = document.getElementById('new-note-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelNoteBtn = document.getElementById('cancel-note-btn');

// Theme & Export Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const exportBtn = document.getElementById('export-btn');

// Initialize
initTheme();
renderNotes();
updateBadgeCounts();

// ----------------- Data Storage -----------------
function loadNotes() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotes));
    return [...initialNotes];
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse notes from storage:', e);
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  updateBadgeCounts();
  renderNotes();
}

// ----------------- Rendering -----------------
function renderNotes() {
  let filtered = notes.filter(note => {
    // Category filter
    if (currentCategory === 'pinned' && !note.pinned) return false;
    if (currentCategory !== 'all' && currentCategory !== 'pinned' && note.category !== currentCategory) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchCategory = note.category.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchCategory) return false;
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    // Keep pinned items at top unless we're already inside pinned view
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (currentSort === 'newest') {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    } else if (currentSort === 'oldest') {
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    } else if (currentSort === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  notesGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(note => {
      const card = createNoteCard(note);
      notesGrid.appendChild(card);
    });
  }
}

function createNoteCard(note) {
  const card = document.createElement('div');
  const accent = note.color || '#3b82f6';
  card.className = `note-card ${note.pinned ? 'pinned' : ''}`;
  card.style.setProperty('--card-accent', accent);

  const formattedDate = formatDate(note.updatedAt);

  card.innerHTML = `
    <div class="card-top">
      <span class="card-tag" style="background-color: ${accent};">${escapeHTML(note.category)}</span>
      <div class="card-actions">
        <button class="action-icon-btn ${note.pinned ? 'pinned-active' : ''}" title="${note.pinned ? 'Unpin' : 'Pin'}" data-action="pin">
          📌
        </button>
        <button class="action-icon-btn" title="Edit note" data-action="edit">
          ✏️
        </button>
        <button class="action-icon-btn" title="Delete note" data-action="delete">
          🗑️
        </button>
      </div>
    </div>
    <h3 class="note-title">${escapeHTML(note.title)}</h3>
    <div class="note-content">${escapeHTML(note.content)}</div>
    <div class="card-footer">
      <span>Updated ${formattedDate}</span>
    </div>
  `;

  // Action listeners
  card.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) {
      openEditModal(note);
      return;
    }

    const action = btn.dataset.action;
    if (action === 'pin') {
      e.stopPropagation();
      togglePinNote(note.id);
    } else if (action === 'edit') {
      e.stopPropagation();
      openEditModal(note);
    } else if (action === 'delete') {
      e.stopPropagation();
      deleteNote(note.id);
    }
  });

  return card;
}

function updateBadgeCounts() {
  const counts = {
    all: notes.length,
    pinned: notes.filter(n => n.pinned).length,
    personal: notes.filter(n => n.category === 'Personal').length,
    work: notes.filter(n => n.category === 'Work').length,
    ideas: notes.filter(n => n.category === 'Ideas').length,
    study: notes.filter(n => n.category === 'Study').length,
  };

  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-pinned').textContent = counts.pinned;
  document.getElementById('count-personal').textContent = counts.personal;
  document.getElementById('count-work').textContent = counts.work;
  document.getElementById('count-ideas').textContent = counts.ideas;
  document.getElementById('count-study').textContent = counts.study;
}

// ----------------- Note Operations -----------------
function togglePinNote(id) {
  notes = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
  saveNotes();
}

function deleteNote(id) {
  if (confirm('Are you sure you want to delete this note?')) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
  }
}

function openCreateModal() {
  modalTitle.textContent = 'New Note';
  noteIdInput.value = '';
  noteTitleInput.value = '';
  noteContentInput.value = '';
  noteCategorySelect.value = currentCategory !== 'all' && currentCategory !== 'pinned' ? currentCategory : 'Personal';
  
  // Select first color by default
  const defaultRadio = document.querySelector('input[name="note-color"][value="#3b82f6"]');
  if (defaultRadio) defaultRadio.checked = true;

  noteModal.classList.add('open');
  setTimeout(() => noteTitleInput.focus(), 50);
}

function openEditModal(note) {
  modalTitle.textContent = 'Edit Note';
  noteIdInput.value = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  noteCategorySelect.value = note.category;

  const colorRadio = document.querySelector(`input[name="note-color"][value="${note.color}"]`);
  if (colorRadio) {
    colorRadio.checked = true;
  } else {
    const defaultRadio = document.querySelector('input[name="note-color"][value="#3b82f6"]');
    if (defaultRadio) defaultRadio.checked = true;
  }

  noteModal.classList.add('open');
  setTimeout(() => noteTitleInput.focus(), 50);
}

function closeModal() {
  noteModal.classList.remove('open');
}

// Form Submit
noteForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = noteIdInput.value;
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const category = noteCategorySelect.value;
  const selectedColorInput = document.querySelector('input[name="note-color"]:checked');
  const color = selectedColorInput ? selectedColorInput.value : '#3b82f6';

  if (!title) return;

  if (id) {
    // Update existing
    notes = notes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          title,
          content,
          category,
          color,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });
  } else {
    // Create new
    const newNote = {
      id: 'note_' + Date.now(),
      title,
      content,
      category,
      color,
      pinned: false,
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
  }

  saveNotes();
  closeModal();
});

// Modal Event Listeners
newNoteBtn.addEventListener('click', openCreateModal);
closeModalBtn.addEventListener('click', closeModal);
cancelNoteBtn.addEventListener('click', closeModal);

noteModal.addEventListener('click', (e) => {
  if (e.target === noteModal) {
    closeModal();
  }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && noteModal.classList.contains('open')) {
    closeModal();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && noteModal.classList.contains('open')) {
    noteForm.requestSubmit();
  } else if (e.key === '/' && !noteModal.classList.contains('open') && document.activeElement !== searchInput && document.activeElement !== noteTitleInput && document.activeElement !== noteContentInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

// Category Switcher
const categoryTitles = {
  all: 'All Notes',
  pinned: 'Pinned Notes',
  Personal: 'Personal Notes',
  Work: 'Work Notes',
  Ideas: 'Ideas & Thoughts',
  Study: 'Study & Learning'
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    currentCategory = item.dataset.category;
    currentViewTitle.textContent = categoryTitles[currentCategory] || currentCategory;
    renderNotes();
  });
});

// Search Filter
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
  renderNotes();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.style.display = 'none';
  renderNotes();
  searchInput.focus();
});

// Sort Switcher
sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderNotes();
});

// Export Notes
exportBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `notehub_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

// ----------------- Theme Switcher -----------------
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light Mode';
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark Mode';
  }
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
  updateThemeButton(nextTheme);
});

// ----------------- Helpers -----------------
function formatDate(isoStr) {
  const date = new Date(isoStr);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor((now - date) / (1000 * 60)));
    return `${mins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
