const STORAGE_KEY = 'daymark.tasks.v1';
const THEME_KEY = 'daymark.theme.v1';
const $ = selector => document.querySelector(selector);
const form = $('#task-form'), input = $('#task-input'), dateInput = $('#task-date');
const categoryInput = $('#task-category'), priorityInput = $('#task-priority');
const list = $('#task-list'), emptyState = $('#empty-state'), countLabel = $('#task-count');
const clearButton = $('#clear-completed'), progressLabel = $('#progress-label');
const progressFill = $('#progress-fill'), reminders = $('#reminders');
let tasks = loadTasks(), activeFilter = 'all', editingId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === 'string').map(task => ({
      id: task.id || crypto.randomUUID(), text: task.text, done: Boolean(task.done),
      due: typeof task.due === 'string' ? task.due : '',
      category: ['Personal','Work','Study','Health'].includes(task.category) ? task.category : 'Personal',
      priority: ['low','normal','high'].includes(task.priority) ? task.priority : 'normal'
    })) : [];
  } catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function formatDue(date) {
  if (!date) return '';
  const day = new Date(`${date}T00:00:00`);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((day - today) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due ${new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric' }).format(day)}`;
}
function visibleTasks() {
  if (activeFilter === 'active') return tasks.filter(task => !task.done);
  if (activeFilter === 'completed') return tasks.filter(task => task.done);
  return tasks;
}
function makeButton(label, className, title) {
  const button = document.createElement('button'); button.type = 'button'; button.className = className;
  button.textContent = label; button.setAttribute('aria-label', title); return button;
}
function render() {
  list.replaceChildren();
  const shown = visibleTasks();
  shown.forEach(task => {
    const item = document.createElement('li'); item.className = `task-item${task.done ? ' done' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'check';
    checkbox.checked = task.done; checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.done ? 'not done' : 'done'}`);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; saveTasks(); render(); });
    const body = document.createElement('div'); body.className = 'task-body';
    const text = document.createElement('span'); text.className = 'task-text'; text.textContent = task.text;
    const meta = document.createElement('div'); meta.className = 'task-meta';
    const category = document.createElement('span'); category.className = `tag category-${task.category.toLowerCase()}`; category.textContent = task.category; meta.append(category);
    if (task.due) { const due = document.createElement('span'); const today = new Date().toISOString().slice(0,10); due.className = `due${task.due < today && !task.done ? ' overdue' : ''}`; due.textContent = formatDue(task.due); meta.append(due); }
    body.append(text, meta);
    if (task.priority !== 'normal') { const priority = document.createElement('span'); priority.className = `priority ${task.priority}`; priority.textContent = task.priority === 'high' ? 'High' : 'Low'; item.append(checkbox, body, priority); }
    else item.append(checkbox, body);
    const edit = makeButton('✎','edit-button',`Edit ${task.text}`); edit.addEventListener('click', () => openEditor(task));
    const remove = makeButton('×','delete-button',`Delete ${task.text}`); remove.addEventListener('click', () => { tasks = tasks.filter(candidate => candidate.id !== task.id); saveTasks(); render(); });
    item.append(edit, remove); list.append(item);
  });
  emptyState.hidden = shown.length > 0;
  list.hidden = shown.length === 0;
  if (tasks.length === 0) { emptyState.querySelector('.empty-title').textContent = 'A fresh page.'; emptyState.querySelector('p:last-child').innerHTML = 'Your tasks will find a home here.<br>Start with one small thing.'; }
  else if (!shown.length) { emptyState.querySelector('.empty-title').textContent = `No ${activeFilter} tasks.`; emptyState.querySelector('p:last-child').textContent = 'Try another filter or add a new task.'; }
  countLabel.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  const done = tasks.filter(task => task.done).length, remaining = tasks.length - done;
  clearButton.hidden = done === 0;
  progressFill.style.width = tasks.length ? `${Math.round(done/tasks.length*100)}%` : '0%';
  progressLabel.textContent = !tasks.length ? 'You’ve got this.' : remaining === 0 ? 'Everything is done. Nice work!' : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left — you’ve got this.`;
  updateReminders();
}
function updateReminders() {
  const today = new Date().toISOString().slice(0,10);
  const due = tasks.filter(task => !task.done && task.due && task.due <= today);
  reminders.hidden = due.length === 0;
  reminders.textContent = due.length ? `${due.length === 1 ? 'Reminder' : 'Reminders'}: ${due.map(task => `${task.text}${task.due < today ? ' (overdue)' : ''}`).join(' · ')}` : '';
}
function openEditor(task) {
  editingId = task.id; $('#edit-text').value = task.text; $('#edit-date').value = task.due;
  $('#edit-category').value = task.category; $('#edit-priority').value = task.priority; $('#edit-dialog').showModal(); $('#edit-text').focus();
}
form.addEventListener('submit', event => {
  event.preventDefault(); const text = input.value.trim(); if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, done:false, due:dateInput.value, category:categoryInput.value, priority:priorityInput.value });
  saveTasks(); render(); input.value=''; dateInput.value=''; input.focus();
});
$('#edit-form').addEventListener('submit', event => {
  if (event.submitter?.id !== 'save-edit') return;
  event.preventDefault(); const task = tasks.find(item => item.id === editingId); if (!task) return;
  task.text = $('#edit-text').value.trim(); task.due = $('#edit-date').value;
  task.category = $('#edit-category').value; task.priority = $('#edit-priority').value;
  saveTasks(); $('#edit-dialog').close(); render();
});
$('#edit-form').addEventListener('close', () => { editingId = null; });
clearButton.addEventListener('click', () => { tasks = tasks.filter(task => !task.done); saveTasks(); render(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter; document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button)); render();
}));
$('#theme-toggle').addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark'); localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  $('#theme-toggle').textContent = dark ? '☀' : '☾'; $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
});
if (localStorage.getItem(THEME_KEY) === 'dark') { document.body.classList.add('dark'); $('#theme-toggle').textContent='☀'; $('#theme-toggle').setAttribute('aria-label','Switch to light mode'); }
$('#export-tasks').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app:'Daymark', version:1, exportedAt:new Date().toISOString(), tasks },null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href=url; link.download=`daymark-backup-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text()), imported = Array.isArray(data) ? data : data.tasks;
    if (!Array.isArray(imported) || imported.some(task => !task || typeof task.text !== 'string')) throw new Error('Invalid backup');
    const normalized = imported.map(task => ({ id:crypto.randomUUID(), text:task.text.slice(0,120), done:Boolean(task.done), due:typeof task.due==='string'?task.due:'', category:['Personal','Work','Study','Health'].includes(task.category)?task.category:'Personal', priority:['low','normal','high'].includes(task.priority)?task.priority:'normal' }));
    if (confirm(`Import ${normalized.length} task${normalized.length===1?'':'s'}? This replaces the tasks currently saved in this browser.`)) { tasks=normalized; saveTasks(); render(); }
  } catch { alert('That file does not look like a Daymark backup.'); }
  event.target.value='';
});
$('#today-label').textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
render();
