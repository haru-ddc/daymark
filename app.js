const STORAGE_KEY = 'daymark.tasks.v1';
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const countLabel = document.querySelector('#task-count');
const clearButton = document.querySelector('#clear-completed');
const progressLabel = document.querySelector('#progress-label');
const progressFill = document.querySelector('#progress-fill');
const todayLabel = document.querySelector('#today-label');

let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === 'string') : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  list.replaceChildren();
  tasks.forEach(task => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'check';
    checkbox.checked = Boolean(task.done);
    checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.done ? 'not done' : 'done'}`);
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
      render();
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${task.text}`);
    remove.addEventListener('click', () => {
      tasks = tasks.filter(candidate => candidate.id !== task.id);
      saveTasks();
      render();
    });

    item.append(checkbox, text, remove);
    list.append(item);
  });

  const done = tasks.filter(task => task.done).length;
  const remaining = tasks.length - done;
  emptyState.hidden = tasks.length > 0;
  list.hidden = tasks.length === 0;
  countLabel.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  clearButton.hidden = done === 0;
  progressFill.style.width = tasks.length ? `${Math.round(done / tasks.length * 100)}%` : '0%';
  progressLabel.textContent = tasks.length === 0 ? 'You’ve got this.' : remaining === 0 ? 'Everything is done. Nice work!' : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left — you’ve got this.`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, done: false });
  saveTasks();
  render();
  input.value = '';
  input.focus();
});

clearButton.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  render();
});

todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
render();
