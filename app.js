const STORAGE_KEY = 'agus-pomodoro-state-v4';
const DEVICE_KEY = 'agus-pomodoro-device-id';
const CONFIG_ENDPOINT = '/api/config';
const RADIUS = 136;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const els = {
  modeLabel: document.getElementById('modeLabel'),
  centerNote: document.getElementById('centerNote'),
  timer: document.getElementById('timer'),
  progressRing: document.getElementById('progressRing'),
  projectInput: document.getElementById('projectInput'),
  taskInput: document.getElementById('taskInput'),
  progressText: document.getElementById('progressText'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  skipBtn: document.getElementById('skipBtn'),
  resetBtn: document.getElementById('resetBtn'),
  status: document.getElementById('status'),
  completedToday: document.getElementById('completedToday'),
  modeMetric: document.getElementById('modeMetric'),
  todayMinutesMetric: document.getElementById('todayMinutesMetric'),
  focusModeBtn: document.getElementById('focusModeBtn'),
  workInput: document.getElementById('workInput'),
  shortBreakInput: document.getElementById('shortBreakInput'),
  longBreakInput: document.getElementById('longBreakInput'),
  longBreakEveryInput: document.getElementById('longBreakEveryInput'),
  autoStartNext: document.getElementById('autoStartNext'),
  notificationsEnabled: document.getElementById('notificationsEnabled'),
  modeBtns: [...document.querySelectorAll('.mode-btn')],
  infoBtn: document.getElementById('infoBtn'),
  infoModal: document.getElementById('infoModal'),
  closeInfoBtn: document.getElementById('closeInfoBtn'),
  configBtnTop: document.getElementById('configBtnTop'),
  authBtn: document.getElementById('authBtn'),
  metricsBtn: document.getElementById('metricsBtn'),
  sessionModal: document.getElementById('sessionModal'),
  closeSessionBtn: document.getElementById('closeSessionBtn'),
  configModal: document.getElementById('configModal'),
  closeConfigBtn: document.getElementById('closeConfigBtn'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  metricsModal: document.getElementById('metricsModal'),
  closeMetricsBtn: document.getElementById('closeMetricsBtn'),
  metricsProjectFilter: document.getElementById('metricsProjectFilter'),
  metricsTaskFilter: document.getElementById('metricsTaskFilter'),
  metricsRangeFilter: document.getElementById('metricsRangeFilter'),
  metricsDateRow: document.getElementById('metricsDateRow'),
  metricsStartDate: document.getElementById('metricsStartDate'),
  metricsEndDate: document.getElementById('metricsEndDate'),
  metricsSummaryMinutes: document.getElementById('metricsSummaryMinutes'),
  metricsSummaryPomodoros: document.getElementById('metricsSummaryPomodoros'),
  metricsSummaryTasks: document.getElementById('metricsSummaryTasks'),
  metricsSummaryProjects: document.getElementById('metricsSummaryProjects'),
  metricsSummaryTopProject: document.getElementById('metricsSummaryTopProject'),
  metricsSummaryTopTask: document.getElementById('metricsSummaryTopTask'),
  metricsProjectChart: document.getElementById('metricsProjectChart'),
  metricsDayChart: document.getElementById('metricsDayChart'),
  metricsTaskChart: document.getElementById('metricsTaskChart'),
  metricsMonthChart: document.getElementById('metricsMonthChart'),
  metricsResultsCount: document.getElementById('metricsResultsCount'),
  metricsSessionList: document.getElementById('metricsSessionList'),
  authStatus: document.getElementById('authStatus'),
  authMessage: document.getElementById('authMessage'),
  authName: document.getElementById('authName'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  signInBtn: document.getElementById('signInBtn'),
  signUpBtn: document.getElementById('signUpBtn'),
  signOutBtn: document.getElementById('signOutBtn'),
  focusOverlay: document.getElementById('focusOverlay'),
  closeFocusBtn: document.getElementById('closeFocusBtn'),
  focusModeLabel: document.getElementById('focusModeLabel'),
  focusTaskLabel: document.getElementById('focusTaskLabel'),
  focusTimer: document.getElementById('focusTimer'),
  focusOverlayText: document.getElementById('focusOverlayText'),
  focusStartBtn: document.getElementById('focusStartBtn'),
  focusPauseBtn: document.getElementById('focusPauseBtn'),
  focusSkipBtn: document.getElementById('focusSkipBtn'),
  todayFocusTotal: document.getElementById('todayFocusTotal'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  syncBadge: document.getElementById('syncBadge'),
  syncStatus: document.getElementById('syncStatus'),
};

const state = {
  currentMode: 'work',
  timeLeft: 25 * 60,
  sessionTotal: 25 * 60,
  isRunning: false,
  intervalId: null,
  localCompletedToday: 0,
  cyclesCompleted: 0,
  lastActiveDate: getTodayKey(),
  history: [],
  sessionRows: [],
  deviceId: getOrCreateDeviceId(),
  currentUser: null,
  authReady: false,
  metrics: {
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    yearMinutes: 0,
    pomodorosToday: 0,
  },
  metricsFilters: {
    range: 'today',
    project: '',
    task: '',
    startDate: '',
    endDate: '',
  },
  supabaseClient: null,
  supabaseReady: false,
};

function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getOrCreateDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const created = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(DEVICE_KEY, created);
  return created;
}

function getDurations() {
  return {
    work: Math.max(1, parseInt(els.workInput.value || '25', 10)) * 60,
    shortBreak: Math.max(1, parseInt(els.shortBreakInput.value || '5', 10)) * 60,
    longBreak: Math.max(1, parseInt(els.longBreakInput.value || '15', 10)) * 60,
    longBreakEvery: Math.max(1, parseInt(els.longBreakEveryInput.value || '4', 10)),
  };
}

function modeText(mode) {
  if (mode === 'shortBreak') return 'Descanso corto';
  if (mode === 'longBreak') return 'Descanso largo';
  return 'Trabajo';
}

function modeAccent(mode) {
  if (mode === 'shortBreak') return '#38bdf8';
  if (mode === 'longBreak') return '#f59e0b';
  return '#7c3aed';
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatMinutesLabel(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
  }
  return `${minutes} min`;
}

function getLocalHistoryTotal() {
  return state.history.reduce((acc, item) => acc + (item.minutes || 0), 0);
}

function getLocalFallbackMetrics() {
  const localMinutes = getLocalHistoryTotal();
  return {
    todayMinutes: localMinutes,
    weekMinutes: localMinutes,
    monthMinutes: localMinutes,
    yearMinutes: localMinutes,
    pomodorosToday: state.localCompletedToday,
  };
}

function saveState() {
  const data = {
    currentMode: state.currentMode,
    timeLeft: state.timeLeft,
    sessionTotal: state.sessionTotal,
    localCompletedToday: state.localCompletedToday,
    cyclesCompleted: state.cyclesCompleted,
    lastActiveDate: state.lastActiveDate,
    project: els.projectInput.value,
    task: els.taskInput.value,
    history: state.history,
    deviceId: state.deviceId,
    userId: state.currentUser?.id || null,
    settings: {
      work: els.workInput.value,
      shortBreak: els.shortBreakInput.value,
      longBreak: els.longBreakInput.value,
      longBreakEvery: els.longBreakEveryInput.value,
      autoStartNext: els.autoStartNext.checked,
      notificationsEnabled: els.notificationsEnabled.checked,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (!data) return;

    const today = getTodayKey();
    state.lastActiveDate = data.lastActiveDate || today;
    state.localCompletedToday = state.lastActiveDate === today ? (data.localCompletedToday || 0) : 0;
    state.cyclesCompleted = data.cyclesCompleted || 0;
    state.currentMode = data.currentMode || 'work';
    state.timeLeft = Number.isFinite(data.timeLeft) ? data.timeLeft : 25 * 60;
    state.sessionTotal = Number.isFinite(data.sessionTotal) ? data.sessionTotal : 25 * 60;
    state.history = state.lastActiveDate === today && Array.isArray(data.history) ? data.history : [];
    state.deviceId = data.deviceId || state.deviceId;

    els.projectInput.value = data.project || 'General';
    els.taskInput.value = data.task || '';
    els.workInput.value = data.settings?.work || 25;
    els.shortBreakInput.value = data.settings?.shortBreak || 5;
    els.longBreakInput.value = data.settings?.longBreak || 15;
    els.longBreakEveryInput.value = data.settings?.longBreakEvery || 4;
    els.autoStartNext.checked = Boolean(data.settings?.autoStartNext ?? true);
    els.notificationsEnabled.checked = Boolean(data.settings?.notificationsEnabled ?? false);
  } catch (error) {
    console.error('No se pudo cargar el estado:', error);
  }
}

function setStatus(text) {
  els.status.textContent = text;
}

function setSyncStatus(text, ok = false) {
  els.syncStatus.textContent = text;
  els.syncBadge.classList.toggle('ok', ok);
}

function isAuthenticated() {
  return Boolean(state.currentUser?.id);
}

function getUserLabel() {
  return state.currentUser?.user_metadata?.full_name || state.currentUser?.email || 'Sin sesión';
}

function syncLocalOwnership() {
  const storedOwner = localStorage.getItem(`${STORAGE_KEY}-owner`);
  const currentOwner = state.currentUser?.id || 'guest';
  if (storedOwner && storedOwner !== currentOwner) {
    state.localCompletedToday = 0;
    state.history = [];
  }
  localStorage.setItem(`${STORAGE_KEY}-owner`, currentOwner);
}

function updateAuthUi() {
  const loggedIn = isAuthenticated();
  if (els.authBtn) {
    els.authBtn.textContent = loggedIn ? 'Mi sesión' : 'Ingresar';
  }
  if (els.authStatus) {
    els.authStatus.innerHTML = loggedIn
      ? `Sesión activa: <strong>${escapeHtml(getUserLabel())}</strong>. Tus métricas y sesiones se guardan con esta cuenta.`
      : 'No hay sesión iniciada. Cada persona debe entrar con su correo para ver sus propias métricas.';
  }
  if (els.signOutBtn) {
    els.signOutBtn.style.display = loggedIn ? 'block' : 'none';
  }
  if (loggedIn && els.authName) {
    els.authName.value = state.currentUser?.user_metadata?.full_name || '';
  }
  if (loggedIn && els.authEmail) {
    els.authEmail.value = state.currentUser?.email || '';
  }
}

function setAuthMessage(text = '', tone = '') {
  if (!els.authMessage) return;
  els.authMessage.textContent = text;
  els.authMessage.className = 'auth-message';
  if (tone) {
    els.authMessage.classList.add(tone);
  }
}

function normalizeTask(task) {
  return (task || 'Sin tarea definida').trim();
}

function normalizeProject(projectName) {
  return (projectName || 'General').trim();
}

function sameOrAfterDay(date, yyyyMmDd) {
  return new Date(`${yyyyMmDd}T00:00:00`) <= date;
}

function sameOrBeforeDay(date, yyyyMmDd) {
  return date < addDays(new Date(`${yyyyMmDd}T00:00:00`), 1);
}

function filterRows(rows, filters) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const taskNeedle = (filters.task || '').trim().toLowerCase();

  return rows.filter((row) => {
    if (row.mode !== 'work') return false;

    const createdAt = new Date(row.created_at);
    const task = normalizeTask(row.task).toLowerCase();
    const project = normalizeProject(row.project_name).toLowerCase();
    const projectNeedle = (filters.project || '').trim().toLowerCase();

    if (taskNeedle && !task.includes(taskNeedle)) {
      return false;
    }
    if (projectNeedle && !project.includes(projectNeedle)) {
      return false;
    }

    if (filters.range === 'today' && createdAt < dayStart) return false;
    if (filters.range === 'week' && createdAt < weekStart) return false;
    if (filters.range === 'month' && createdAt < monthStart) return false;
    if (filters.range === 'year' && createdAt < yearStart) return false;

    if (filters.range === 'custom') {
      if (filters.startDate && !sameOrAfterDay(createdAt, filters.startDate)) return false;
      if (filters.endDate && !sameOrBeforeDay(createdAt, filters.endDate)) return false;
    }

    return true;
  });
}

function computeMetricsSummary(rows) {
  const totalMinutes = rows.reduce((acc, row) => acc + (Number(row.minutes) || 0), 0);
  const taskTotals = new Map();
  const projectTotals = new Map();
  rows.forEach((row) => {
    const task = normalizeTask(row.task);
    const project = normalizeProject(row.project_name);
    taskTotals.set(task, (taskTotals.get(task) || 0) + (Number(row.minutes) || 0));
    projectTotals.set(project, (projectTotals.get(project) || 0) + (Number(row.minutes) || 0));
  });

  let topTask = '-';
  let topMinutes = -1;
  taskTotals.forEach((minutes, task) => {
    if (minutes > topMinutes) {
      topMinutes = minutes;
      topTask = task;
    }
  });

  return {
    totalMinutes,
    pomodoros: rows.length,
    distinctTasks: taskTotals.size,
    distinctProjects: projectTotals.size,
    topTask,
    topProject: [...projectTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
  };
}

function aggregateByProject(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const project = normalizeProject(row.project_name);
    totals.set(project, (totals.get(project) || 0) + (Number(row.minutes) || 0));
  });

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function aggregateByDay(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const createdAt = new Date(row.created_at);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) || 0) + (Number(row.minutes) || 0));
  });

  return [...totals.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-8)
    .map(([key, value]) => ({
      label: new Date(`${key}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      value,
    }));
}

function aggregateByTask(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const task = normalizeTask(row.task);
    totals.set(task, (totals.get(task) || 0) + (Number(row.minutes) || 0));
  });

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function aggregateByMonth(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const createdAt = new Date(row.created_at);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) || 0) + (Number(row.minutes) || 0));
  });

  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, value]) => {
      const [year, month] = key.split('-');
      return {
        label: `${month}/${year.slice(2)}`,
        value,
      };
    });
}

function uniqueSortedLabels(rows, field, normalizer) {
  return [...new Set(rows.map((row) => normalizer(row[field])).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
}

function populateSelectOptions(select, options, placeholder) {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = placeholder;
  select.appendChild(defaultOption);

  options.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.appendChild(option);
  });

  if (options.includes(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = '';
  }
}

function syncMetricsSelects() {
  const baseRows = state.sessionRows.filter((row) => row.mode === 'work');
  const projectOptions = uniqueSortedLabels(baseRows, 'project_name', normalizeProject);
  populateSelectOptions(els.metricsProjectFilter, projectOptions, 'Todos los proyectos');

  const rowsForTasks = state.metricsFilters.project
    ? baseRows.filter((row) => normalizeProject(row.project_name) === state.metricsFilters.project)
    : baseRows;
  const taskOptions = uniqueSortedLabels(rowsForTasks, 'task', normalizeTask);
  populateSelectOptions(els.metricsTaskFilter, taskOptions, 'Todas las tareas');

  state.metricsFilters.project = els.metricsProjectFilter?.value || '';
  state.metricsFilters.task = els.metricsTaskFilter?.value || '';
}

function renderBarChart(container, items, tone = 'project') {
  if (!container) return;

  container.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'metrics-empty';
    empty.textContent = 'Todavía no hay datos suficientes para mostrar este gráfico.';
    container.appendChild(empty);
    return;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const width = `${Math.max(8, (item.value / maxValue) * 100)}%`;
    row.innerHTML = `
      <div class="bar-meta">
        <strong title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</strong>
        <span>${formatMinutesLabel(item.value)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${tone}" style="width:${width};"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

function updateMetricsFilterUi() {
  const isCustom = state.metricsFilters.range === 'custom';
  if (els.metricsDateRow) {
    els.metricsDateRow.classList.toggle('open', isCustom);
  }
  if (els.metricsStartDate) els.metricsStartDate.disabled = !isCustom;
  if (els.metricsEndDate) els.metricsEndDate.disabled = !isCustom;
}

function renderMetricsDashboard() {
  if (!els.metricsSessionList) return;

  syncMetricsSelects();
  const filteredRows = filterRows(state.sessionRows, state.metricsFilters);
  const summary = computeMetricsSummary(filteredRows);
  const projectChartData = aggregateByProject(filteredRows);
  const dayChartData = aggregateByDay(filteredRows);
  const taskChartData = aggregateByTask(filteredRows);
  const monthChartData = aggregateByMonth(filteredRows);

  if (els.metricsSummaryMinutes) els.metricsSummaryMinutes.textContent = formatMinutesLabel(summary.totalMinutes);
  if (els.metricsSummaryPomodoros) els.metricsSummaryPomodoros.textContent = String(summary.pomodoros);
  if (els.metricsSummaryTasks) els.metricsSummaryTasks.textContent = String(summary.distinctTasks);
  if (els.metricsSummaryProjects) els.metricsSummaryProjects.textContent = String(summary.distinctProjects);
  if (els.metricsSummaryTopProject) els.metricsSummaryTopProject.textContent = summary.topProject;
  if (els.metricsSummaryTopTask) els.metricsSummaryTopTask.textContent = summary.topTask;
  if (els.metricsResultsCount) {
    els.metricsResultsCount.textContent = `${filteredRows.length} ${filteredRows.length === 1 ? 'resultado' : 'resultados'}`;
  }

  renderBarChart(els.metricsProjectChart, projectChartData, 'project');
  renderBarChart(els.metricsDayChart, dayChartData, 'day');
  renderBarChart(els.metricsTaskChart, taskChartData, 'task');
  renderBarChart(els.metricsMonthChart, monthChartData, 'month');

  els.metricsSessionList.innerHTML = '';
  if (!filteredRows.length) {
    const empty = document.createElement('div');
    empty.className = 'metrics-empty';
    empty.textContent = 'No hay sesiones que coincidan con esos filtros.';
    els.metricsSessionList.appendChild(empty);
    return;
  }

  filteredRows
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .forEach((row) => {
      const item = document.createElement('div');
      item.className = 'metrics-session-item';
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(normalizeProject(row.project_name))}</strong>
          <div class="metrics-session-task">${escapeHtml(normalizeTask(row.task))}</div>
          <span>${new Date(row.created_at).toLocaleDateString('es-AR')} · ${new Date(row.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <strong>${Number(row.minutes) || 0} min</strong>
      `;
      els.metricsSessionList.appendChild(item);
    });
}
function updateModeButtons() {
  els.modeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
  });
}

function updateProgress() {
  const total = Math.max(1, state.sessionTotal);
  const elapsed = Math.max(0, total - state.timeLeft);
  const percent = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const accent = modeAccent(state.currentMode);

  els.progressRing.style.strokeDasharray = String(CIRCUMFERENCE);
  els.progressRing.style.strokeDashoffset = String(offset);
  els.progressRing.style.stroke = accent;

  const text = state.isRunning
    ? `${Math.round(percent)}% del bloque completado.`
    : percent > 0
      ? `Bloque en pausa: ${Math.round(percent)}% completado.`
      : 'Todavía no empezaste este bloque.';

  els.progressText.textContent = text;
  els.focusOverlayText.textContent = text;
}

function applyMetricsToUi() {
  const metrics = state.supabaseReady ? state.metrics : getLocalFallbackMetrics();
  els.completedToday.textContent = metrics.pomodorosToday;
  els.todayMinutesMetric.textContent = formatMinutesLabel(metrics.todayMinutes);
  els.todayFocusTotal.textContent = formatMinutesLabel(metrics.todayMinutes);
}

function updateDisplay() {
  const time = formatTime(state.timeLeft);
  const mode = modeText(state.currentMode);
  const currentTask = els.taskInput.value.trim() || 'Sin tarea definida';

  els.modeLabel.textContent = mode;
  els.timer.textContent = time;
  els.centerNote.textContent = state.currentMode === 'work'
    ? 'Tiempo de foco profundo.'
    : state.currentMode === 'shortBreak'
      ? 'Pausa breve para resetear.'
      : 'Pausa larga para recuperar energía.';
  els.modeMetric.textContent = mode;
  els.focusModeLabel.textContent = mode;
  els.focusTaskLabel.textContent = currentTask;
  els.focusTimer.textContent = time;

  applyMetricsToUi();
  updateModeButtons();
  updateProgress();
  document.title = `${time} · ${mode}${currentTask ? ' · ' + currentTask : ''}`;
  saveState();
}

function setMode(mode, resetTime = true) {
  state.currentMode = mode;
  if (resetTime) {
    const durations = getDurations();
    state.sessionTotal = durations[mode];
    state.timeLeft = durations[mode];
  }
  updateDisplay();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function softChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (_) {}
}

function notify(title, body) {
  if (!els.notificationsEnabled.checked) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body });
}

async function requestNotificationPermissionIfNeeded() {
  if (!('Notification' in window)) {
    els.notificationsEnabled.checked = false;
    saveState();
    return;
  }
  if (Notification.permission === 'granted') return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    els.notificationsEnabled.checked = false;
    saveState();
  }
}

function animateEnd() {
  els.focusTimer.classList.remove('pulse');
  void els.focusTimer.offsetWidth;
  els.focusTimer.classList.add('pulse');
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function startOfWeek(date = new Date()) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff, 0, 0, 0, 0);
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function computeMetricsFromRows(rows) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const nextDay = addDays(dayStart, 1);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const metrics = {
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    yearMinutes: 0,
    pomodorosToday: 0,
  };

  rows.forEach((row) => {
    if (row.mode !== 'work') return;
    const createdAt = new Date(row.created_at);
    const minutes = Number(row.minutes) || 0;

    if (createdAt >= yearStart) metrics.yearMinutes += minutes;
    if (createdAt >= monthStart) metrics.monthMinutes += minutes;
    if (createdAt >= weekStart) metrics.weekMinutes += minutes;
    if (createdAt >= dayStart && createdAt < nextDay) {
      metrics.todayMinutes += minutes;
      metrics.pomodorosToday += 1;
    }
  });

  return metrics;
}

function buildTodayHistory(rows) {
  const dayStart = startOfDay(new Date());
  const nextDay = addDays(dayStart, 1);

  return rows
    .filter((row) => row.mode === 'work')
    .filter((row) => {
      const createdAt = new Date(row.created_at);
      return createdAt >= dayStart && createdAt < nextDay;
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((row) => ({
      project_name: row.project_name || 'General',
      task: row.task || 'Sin tarea definida',
      minutes: Number(row.minutes) || 0,
      time: new Date(row.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }));
}

async function loadRuntimeSupabaseConfig() {
  const inlineConfig = window.__POMODORO_CONFIG__;
  if (inlineConfig?.url && inlineConfig?.anonKey) {
    return inlineConfig;
  }

  const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content || '';
  const metaKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || '';
  if (metaUrl && metaKey) {
    return { url: metaUrl, anonKey: metaKey };
  }

  const canFetchConfig = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  if (!canFetchConfig) return null;

  try {
    const response = await fetch(CONFIG_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) return null;

    const config = await response.json();
    if (config?.url && config?.anonKey) {
      return config;
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración remota de Supabase:', error);
  }

  return null;
}

async function initSupabase() {
  if (!window.supabase?.createClient) {
    setSyncStatus('SDK de Supabase no disponible.', false);
    return;
  }

  const config = await loadRuntimeSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    setSyncStatus('Modo local activo. Falta configurar Supabase.', false);
    return;
  }

  try {
    state.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    state.supabaseReady = true;
    setSyncStatus('Supabase conectado.', true);

    const { data, error } = await state.supabaseClient.auth.getSession();
    if (error) {
      console.error('No se pudo recuperar la sesión:', error);
    }
    handleAuthSession(data?.session || null);
    state.supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleAuthSession(session);
    });
  } catch (error) {
    console.error('No se pudo crear el cliente de Supabase:', error);
    state.supabaseClient = null;
    state.supabaseReady = false;
    setSyncStatus('Error inicializando Supabase.', false);
  }
}

function handleAuthSession(session) {
  state.currentUser = session?.user || null;
  state.authReady = true;
  syncLocalOwnership();
  updateAuthUi();
  if (isAuthenticated()) {
    setStatus('Sesión iniciada. Tus métricas se sincronizan con tu cuenta.');
    void refreshMetrics();
  } else {
    state.metrics = getLocalFallbackMetrics();
    state.sessionRows = [];
    renderHistory();
    renderMetricsDashboard();
    updateDisplay();
  }
}

async function saveSessionToSupabase({ task, project_name, minutes, mode, createdAt }) {
  if (!state.supabaseClient) return false;
  if (!isAuthenticated()) {
    setStatus('Iniciá sesión para guardar tu trabajo en la nube.');
    return false;
  }

  try {
    const { error } = await state.supabaseClient
      .from('pomodoro_sessions')
      .insert([
        {
          task,
          project_name: normalizeProject(project_name),
          minutes,
          mode,
          created_at: createdAt,
          device_id: state.deviceId,
          user_id: state.currentUser.id,
          user_label: getUserLabel(),
        }
      ]);

    if (error) {
      console.error('Error guardando sesión en Supabase:', error);
      setSyncStatus('No se pudo guardar en Supabase.', false);
      return false;
    }

    setSyncStatus('Sesión guardada en Supabase.', true);
    return true;
  } catch (error) {
    console.error('Error inesperado guardando sesión:', error);
    setSyncStatus('Error de red al guardar la sesión.', false);
    return false;
  }
}

async function refreshMetrics() {
  if (!state.supabaseClient || !isAuthenticated()) {
    state.metrics = getLocalFallbackMetrics();
    renderHistory();
    renderMetricsDashboard();
    updateDisplay();
    return;
  }

  try {
    const { data, error } = await state.supabaseClient
      .from('pomodoro_sessions')
      .select('task, project_name, minutes, mode, created_at')
      .eq('user_id', state.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error consultando métricas:', error);
      setSyncStatus('No se pudieron consultar métricas.', false);
      state.metrics = getLocalFallbackMetrics();
      updateDisplay();
      return;
    }

    state.sessionRows = data || [];
    state.metrics = computeMetricsFromRows(data || []);
    state.history = buildTodayHistory(data || []);
    renderHistory();
    renderMetricsDashboard();
    setSyncStatus('Métricas sincronizadas.', true);
  } catch (error) {
    console.error('Error inesperado consultando métricas:', error);
    setSyncStatus('Error de red consultando métricas.', false);
    state.metrics = getLocalFallbackMetrics();
    state.sessionRows = [];
    renderMetricsDashboard();
  }

  updateDisplay();
}

function renderHistory() {
  if (!els.historyList) return;

  els.historyList.innerHTML = '';
  if (!state.history.length) {
    const empty = document.createElement('div');
    empty.className = 'task-item';
    empty.innerHTML = '<span>Aún no completaste sesiones hoy.</span>';
    els.historyList.appendChild(empty);
    return;
  }

  state.history.slice().reverse().forEach((item) => {
    const entry = document.createElement('div');
    entry.className = 'task-item';
    const safeTask = escapeHtml(item.task || 'Sin tarea');
    const safeProject = escapeHtml(item.project_name || 'General');
    const safeTime = escapeHtml(item.time || '');
    entry.innerHTML = `
      <span style="display:flex; flex-direction:column; gap:2px; white-space:normal;">
        <strong style="font-size:13px; font-weight:800; color:var(--text);">${safeProject}</strong>
        <span style="font-size:13px; color:var(--text);">${safeTask}</span>
        <span style="font-size:12px; color:var(--muted);">${item.minutes} min · ${safeTime}</span>
      </span>
    `;
    els.historyList.appendChild(entry);
  });
}

function clearTodayLocalHistory() {
  state.history = [];
  saveState();
  renderHistory();
  updateDisplay();
  setStatus('Historial local del día limpiado. Las métricas guardadas no se borraron.');
}
function tick() {
  state.timeLeft -= 1;
  if (state.timeLeft <= 0) {
    finishSession(true);
    return;
  }
  updateDisplay();
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  if (!state.sessionTotal || state.timeLeft > state.sessionTotal) {
    state.sessionTotal = getDurations()[state.currentMode];
  }
  state.intervalId = setInterval(tick, 1000);
  setStatus(state.currentMode === 'work' ? 'En foco. Cero distracciones.' : 'Descansando. Afloja un poco.');
  updateDisplay();
}

function pauseTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;
  setStatus('Pausado.');
  updateDisplay();
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;
  const durations = getDurations();
  state.sessionTotal = durations[state.currentMode];
  state.timeLeft = durations[state.currentMode];
  updateDisplay();
  setStatus('Bloque actual reiniciado. Tus estadísticas siguen intactas.');
}

function getCurrentNextMode() {
  const durations = getDurations();
  if (state.currentMode === 'work') {
    return state.cyclesCompleted > 0 && state.cyclesCompleted % durations.longBreakEvery === 0
      ? 'longBreak'
      : 'shortBreak';
  }
  return 'work';
}

async function persistCompletedWorkSession(session) {
  const saved = await saveSessionToSupabase(session);
  if (!saved) {
    updateDisplay();
    return;
  }
  await refreshMetrics();
}

function finishSession(countAsCompleted) {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;
  softChime();
  animateEnd();

  const durations = getDurations();

  if (state.currentMode === 'work' && countAsCompleted) {
    state.localCompletedToday += 1;
    state.cyclesCompleted += 1;

    const completedTask = els.taskInput.value.trim() || 'Sin tarea definida';
    const completedProject = normalizeProject(els.projectInput.value);
    const completedMinutes = Math.round((state.sessionTotal || durations.work) / 60);
    const completedAt = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const sessionCreatedAt = new Date().toISOString();

    state.history.push({
      project_name: completedProject,
      task: completedTask,
      minutes: completedMinutes,
      time: completedAt,
    });
    renderHistory();

    void persistCompletedWorkSession({
      task: completedTask,
      project_name: completedProject,
      minutes: completedMinutes,
      mode: 'work',
      createdAt: sessionCreatedAt,
    });

    const nextMode = getCurrentNextMode();
    setMode(nextMode, true);
    setStatus(`Bloque completado. Ahora toca ${modeText(nextMode).toLowerCase()}.`);
    notify('Pomodoro terminado', `Completaste un bloque. Ahora toca ${modeText(nextMode).toLowerCase()}.`);
  } else if (state.currentMode === 'work') {
    const nextMode = getCurrentNextMode();
    setMode(nextMode, true);
    setStatus('Bloque omitido. No se registró tiempo trabajado.');
  } else {
    setMode('work', true);
    setStatus(countAsCompleted ? 'Descanso terminado. Vuelve al foco.' : 'Descanso omitido. Vuelve al foco.');
    if (countAsCompleted) {
      notify('Descanso terminado', 'Empieza el siguiente bloque de trabajo.');
    }
  }

  if (els.autoStartNext.checked) {
    startTimer();
  }
}

function skipCurrent() {
  finishSession(false);
}

function handleDateReset() {
  const today = getTodayKey();
  if (state.lastActiveDate !== today) {
    state.lastActiveDate = today;
    state.localCompletedToday = 0;
    state.cyclesCompleted = 0;
    state.history = [];
  }
}

async function signUpWithEmail() {
  if (!state.supabaseClient) return;

  const fullName = els.authName.value.trim();
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) {
    setStatus('Completá email y contraseña para crear la cuenta.');
    setAuthMessage('Completá email y contraseña para crear la cuenta.', 'error');
    return;
  }

  const { data, error } = await state.supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0],
      },
    },
  });
  if (error) {
    setStatus(`No se pudo crear la cuenta: ${error.message}`);
    setAuthMessage(`No se pudo crear la cuenta: ${error.message}`, 'error');
    return;
  }

  els.authPassword.value = '';

  if (!data.session) {
    const message = 'Solicitud enviada. Si la cuenta es nueva, revisá tu email, confirmá el enlace y después iniciá sesión. Si ya existía, iniciá sesión directamente o recuperá acceso.';
    setStatus(message);
    setAuthMessage(message, 'success');
    return;
  }

  const message = 'Cuenta creada y sesión iniciada.';
  setStatus(message);
  setAuthMessage(message, 'success');
}

async function signInWithEmail() {
  if (!state.supabaseClient) return;

  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) {
    setStatus('Completá email y contraseña para iniciar sesión.');
    setAuthMessage('Completá email y contraseña para iniciar sesión.', 'error');
    return;
  }

  const { error } = await state.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setStatus(`No se pudo iniciar sesión: ${error.message}`);
    setAuthMessage(`No se pudo iniciar sesión: ${error.message}`, 'error');
    return;
  }

  els.authPassword.value = '';
  setAuthMessage('Sesión iniciada correctamente.', 'success');
  closeSession();
}

async function signOutCurrentUser() {
  if (!state.supabaseClient) return;

  const { error } = await state.supabaseClient.auth.signOut();
  if (error) {
    setStatus(`No se pudo cerrar la sesión: ${error.message}`);
    setAuthMessage(`No se pudo cerrar la sesión: ${error.message}`, 'error');
    return;
  }

  setStatus('Sesión cerrada.');
  setAuthMessage('Sesión cerrada.', 'success');
}

function openInfo() { els.infoModal.classList.add('open'); }
function closeInfo() { els.infoModal.classList.remove('open'); }
function openSession() { els.sessionModal.classList.add('open'); }
function closeSession() { els.sessionModal.classList.remove('open'); }
function openConfig() { els.configModal.classList.add('open'); }
function closeConfig() { els.configModal.classList.remove('open'); }
function openMetrics() { els.metricsModal.classList.add('open'); updateMetricsFilterUi(); renderMetricsDashboard(); }
function closeMetrics() { els.metricsModal.classList.remove('open'); }
function openFocusMode() { els.focusOverlay.classList.add('open'); updateDisplay(); }
function closeFocusMode() { els.focusOverlay.classList.remove('open'); }

function bind(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}
bind(els.startBtn, 'click', startTimer);
bind(els.pauseBtn, 'click', pauseTimer);
bind(els.skipBtn, 'click', skipCurrent);
bind(els.resetBtn, 'click', resetTimer);

bind(els.focusStartBtn, 'click', startTimer);
bind(els.focusPauseBtn, 'click', pauseTimer);
bind(els.focusSkipBtn, 'click', skipCurrent);
bind(els.clearHistoryBtn, 'click', clearTodayLocalHistory);

els.modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
    setMode(btn.dataset.mode, true);
    setStatus(`Modo cambiado a ${modeText(btn.dataset.mode).toLowerCase()}.`);
  });
});

[els.workInput, els.shortBreakInput, els.longBreakInput, els.longBreakEveryInput].forEach((input) => {
  input.addEventListener('change', () => {
    if (!state.isRunning) {
      setMode(state.currentMode, true);
    }
    setStatus('Configuración actualizada.');
  });
});

bind(els.projectInput, 'input', updateDisplay);
bind(els.taskInput, 'input', updateDisplay);

bind(els.notificationsEnabled, 'change', async () => {
  if (els.notificationsEnabled.checked) {
    await requestNotificationPermissionIfNeeded();
  }
  saveState();
});

bind(els.infoBtn, 'click', openInfo);
bind(els.closeInfoBtn, 'click', closeInfo);
bind(els.infoModal, 'click', (e) => {
  if (e.target === els.infoModal) closeInfo();
});

bind(els.metricsBtn, 'click', openMetrics);
bind(els.closeMetricsBtn, 'click', closeMetrics);
bind(els.metricsModal, 'click', (e) => {
  if (e.target === els.metricsModal) closeMetrics();
});

bind(els.configBtnTop, 'click', openConfig);
bind(els.authBtn, 'click', openSession);
bind(els.closeSessionBtn, 'click', closeSession);
bind(els.sessionModal, 'click', (e) => {
  if (e.target === els.sessionModal) closeSession();
});
bind(els.closeConfigBtn, 'click', closeConfig);
bind(els.saveConfigBtn, 'click', () => {
  setMode(state.currentMode, true);
  saveState();
  setStatus('Configuración guardada.');
  closeConfig();
});
bind(els.signInBtn, 'click', signInWithEmail);
bind(els.signUpBtn, 'click', signUpWithEmail);
bind(els.signOutBtn, 'click', signOutCurrentUser);
bind(els.metricsProjectFilter, 'change', () => {
  state.metricsFilters.project = els.metricsProjectFilter.value;
  state.metricsFilters.task = '';
  renderMetricsDashboard();
});
bind(els.metricsTaskFilter, 'change', () => {
  state.metricsFilters.task = els.metricsTaskFilter.value;
  renderMetricsDashboard();
});
bind(els.metricsRangeFilter, 'change', () => {
  state.metricsFilters.range = els.metricsRangeFilter.value;
  updateMetricsFilterUi();
  renderMetricsDashboard();
});
bind(els.metricsStartDate, 'change', () => {
  state.metricsFilters.startDate = els.metricsStartDate.value;
  renderMetricsDashboard();
});
bind(els.metricsEndDate, 'change', () => {
  state.metricsFilters.endDate = els.metricsEndDate.value;
  renderMetricsDashboard();
});
bind(els.configModal, 'click', (e) => {
  if (e.target === els.configModal) closeConfig();
});

bind(els.focusModeBtn, 'click', openFocusMode);
bind(els.closeFocusBtn, 'click', closeFocusMode);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeInfo();
    closeMetrics();
    closeSession();
    closeConfig();
    closeFocusMode();
  }
});

window.addEventListener('beforeunload', saveState);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.supabaseReady) {
    void refreshMetrics();
  }
});

async function init() {
  loadState();
  handleDateReset();
  updateAuthUi();
  updateMetricsFilterUi();
  renderMetricsDashboard();

  if (!state.timeLeft || !Number.isFinite(state.timeLeft)) {
    state.timeLeft = getDurations()[state.currentMode];
  }
  if (!state.sessionTotal || !Number.isFinite(state.sessionTotal)) {
    state.sessionTotal = getDurations()[state.currentMode];
  }

  renderHistory();
  updateDisplay();
  setStatus('Listo para empezar.');

  await initSupabase();
  await refreshMetrics();
}

void init();
