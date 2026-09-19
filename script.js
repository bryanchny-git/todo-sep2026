const STORAGE_KEY = "todo-tasks";
const THEME_KEY = "todo-theme";
const LAST_PRIORITY_KEY = "todo-last-priority";
const MAX_TASK_LENGTH = 500;

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const list = document.getElementById("task-list");
const themeToggle = document.getElementById("theme-toggle");
const emptyState = document.getElementById("empty-state");
const taskCounter = document.getElementById("task-counter");
const clearCompletedBtn = document.getElementById("clear-completed");
const prioritySummary = document.getElementById("priority-summary");

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(data)) return [];
    return data.filter(task =>
      task && typeof task === 'object' &&
      typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      ['low', 'medium', 'high'].includes(task.priority) &&
      typeof task.done === 'boolean'
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  list.innerHTML = "";
  const sorted = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  sorted.forEach((task) => {
    const li = document.createElement("li");
    li.classList.add(`priority-${task.priority}`);
    if (task.done) li.classList.add("done");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.textContent = task.text;
    span.addEventListener("dblclick", () => startEditing(task.id));

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.title = "Edit task (or double-click)";
    editBtn.addEventListener("click", () => startEditing(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.type = "button";
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete task: "${task.text}"?`)) {
        deleteTask(task.id);
      }
    });

    li.append(checkbox, span, editBtn, deleteBtn);
    list.appendChild(li);
  });

  updatePrioritySummary();
  emptyState.hidden = tasks.length > 0;
  const remaining = tasks.filter((t) => !t.done).length;
  taskCounter.textContent = tasks.length === 0 ? "" : `${remaining} of ${tasks.length} remaining`;
}

function updatePrioritySummary() {
  const counts = { high: 0, medium: 0, low: 0 };
  tasks.forEach(task => {
    if (!task.done) counts[task.priority]++;
  });

  if (tasks.length === 0) {
    prioritySummary.classList.add("hidden");
    return;
  }

  prioritySummary.classList.remove("hidden");
  prioritySummary.innerHTML = `
    <div class="priority-count">
      <span class="priority-count-dot high"></span>
      <span>${counts.high} High</span>
    </div>
    <div class="priority-count">
      <span class="priority-count-dot medium"></span>
      <span>${counts.medium} Medium</span>
    </div>
    <div class="priority-count">
      <span class="priority-count-dot low"></span>
      <span>${counts.low} Low</span>
    </div>
  `;
}

function startEditing(id) {
  const li = list.querySelector(`[data-id="${id}"]`);
  if (!li || editingId) return;

  editingId = id;
  const span = li.querySelector("span");
  const originalText = span.textContent;

  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className = "task-edit-input";
  input.maxLength = MAX_TASK_LENGTH;

  const finish = () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      editTask(id, newText);
    }
    editingId = null;
    render();
  };

  span.replaceWith(input);
  input.focus();
  input.select();

  input.addEventListener("blur", finish);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish();
    } else if (e.key === "Escape") {
      editingId = null;
      render();
    }
  });
}

function editTask(id, text) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = text;
    saveTasks();
  }
}

function addTask(text, priority) {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  tasks.push({ id, text, priority, done: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || text.length > MAX_TASK_LENGTH) return;
  addTask(text, priorityInput.value);
  localStorage.setItem(LAST_PRIORITY_KEY, priorityInput.value);
  input.value = "";
  input.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

const lastPriority = localStorage.getItem(LAST_PRIORITY_KEY);
if (lastPriority) priorityInput.value = lastPriority;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem(THEME_KEY) ||
  (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

render();
