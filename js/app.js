/* ── APP ENTRY POINT ── */

const Notifications = {
  _granted: false,
  _interval: null,

  async request() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { this._granted = true; return; }
    if (Notification.permission !== 'denied') {
      this._granted = (await Notification.requestPermission()) === 'granted';
    }
  },

  reschedule() {
    if (this._interval) clearInterval(this._interval);
    this.checkAndFire();
    this._interval = setInterval(() => this.checkAndFire(), 60 * 1000);
  },

  /* ── CORE CHECK ── */
  checkAndFire() {
    const now   = new Date();
    const log   = this._getLog();
    const tasks = Storage.getTasks();
    let changed = false;

    tasks.forEach(task => {
      if (task.status === 'done') return;
      if (!this._shouldFire(task, now, log)) return;
      this._fire(task);
      log[task.id] = now.toISOString();
      changed = true;
    });

    if (changed) this._setLog(log);
  },

  _shouldFire(task, now, log) {
    // Support legacy reminderAt (once, fixed datetime)
    if (!task.reminder && task.reminderAt) {
      const target = new Date(task.reminderAt);
      if (now < target) return false;
      const last = log[task.id] ? new Date(log[task.id]) : null;
      return !last; // only fire once
    }

    const r = task.reminder;
    if (!r || r.type === 'none') return false;

    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const [h, m] = (r.time || '09:00').split(':').map(Number);

    // Has the clock passed the fire time today?
    const fireToday = new Date(now);
    fireToday.setHours(h, m, 0, 0);
    if (now < fireToday) return false;

    // Already fired today?
    const last = log[task.id] ? new Date(log[task.id]) : null;
    if (last && last.toDateString() === now.toDateString()) return false;

    if (r.type === 'before_due') {
      if (!task.dueDate) return false;
      const due   = new Date(task.dueDate); due.setHours(23, 59, 59, 999);
      const start = new Date(task.dueDate);
      start.setDate(start.getDate() - (r.daysBefore || 1));
      start.setHours(0, 0, 0, 0);
      return today >= start && now <= due;
    }

    // Date range check
    if (r.startDate) {
      const start = new Date(r.startDate); start.setHours(0, 0, 0, 0);
      if (today < start) return false;
    }
    const endBound = r.endDate || task.dueDate;
    if (endBound) {
      const end = new Date(endBound); end.setHours(23, 59, 59, 999);
      if (now > end) return false;
    }

    if (r.type === 'once') {
      // Only fire on the startDate
      if (!r.startDate) return !last;
      const start = new Date(r.startDate); start.setHours(0, 0, 0, 0);
      return today.getTime() === start.getTime() && !last;
    }

    if (r.type === 'weekly') {
      if (last && (now - last) < 6 * 86400000) return false;
      if (r.startDate) {
        return now.getDay() === new Date(r.startDate).getDay();
      }
      return true;
    }

    if (r.type === 'workdays') {
      const day = now.getDay();
      return day >= 1 && day <= 5;
    }

    // daily
    return true;
  },

  /* ── FIRE NOTIFICATION ── */
  _fire(task) {
    const deals     = Storage.getDeals();
    const deal      = task.dealId ? deals.find(d => d.id === task.dealId) : null;
    const assignees = task.assignees || [];

    const lines = [
      task.dueDate     ? `📅 Hạn: ${fmtDate(task.dueDate)}`          : '',
      deal             ? `🏢 Deal: ${deal.name}`                       : '',
      assignees.length ? `👥 Người liên quan: ${assignees.join(', ')}` : '',
    ].filter(Boolean);

    if (this._granted) {
      new Notification('🔔 BD Manager – Nhắc việc', {
        body: lines.join('\n') || task.title,
        tag:  task.id,
      });
    }

    this._showToast(task, deal, assignees, lines);
  },

  _showToast(task, deal, assignees, lines) {
    const shareText = [
      `🔔 Nhắc việc: ${task.title}`,
      ...lines,
    ].join('\n');

    const c   = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast reminder-toast';
    div.innerHTML = `
      <div class="rt-title">🔔 ${task.title}</div>
      ${deal      ? `<div class="rt-meta">🏢 ${deal.name}</div>` : ''}
      ${assignees.length ? `<div class="rt-meta">👥 ${assignees.join(', ')}</div>` : ''}
      ${task.dueDate ? `<div class="rt-meta">📅 Hạn: ${fmtDate(task.dueDate)}</div>` : ''}
      <div class="rt-actions">
        <button class="rt-copy" onclick="
          navigator.clipboard.writeText(${JSON.stringify(shareText)})
            .then(()=>{ this.textContent='✓ Đã copy!'; setTimeout(()=>this.textContent='📋 Copy gửi nhóm',2000); });
        ">📋 Copy gửi nhóm</button>
        <button class="rt-close" onclick="this.closest('.reminder-toast').remove()">✕</button>
      </div>
    `;
    c.appendChild(div);
    setTimeout(() => div.remove(), 15000);
  },

  /* ── PERSISTENCE ── */
  _getLog() {
    try { return JSON.parse(localStorage.getItem('bd_reminder_log')) || {}; }
    catch { return {}; }
  },
  _setLog(log) { localStorage.setItem('bd_reminder_log', JSON.stringify(log)); },
};

/* ── APP ── */
const App = {
  currentView: 'pipeline',

  init() {
    Storage.seed();
    Notifications.request().then(() => Notifications.reschedule());
    this._bindNav();
    this._bindActions();
    this.renderCurrentView();
    this.refreshSidebar();
  },

  _bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        this.switchView(item.dataset.view);
      });
    });
  },

  _bindActions() {
    document.getElementById('btn-add-deal').addEventListener('click', () => Modals.openDealForm());
    document.getElementById('btn-add-task').addEventListener('click', () => Modals.openTaskForm());
    document.getElementById('btn-export').addEventListener('click', () => this.exportData());
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    this.renderCurrentView();
  },

  renderCurrentView() {
    if (this.currentView === 'pipeline')  Pipeline.render();
    if (this.currentView === 'tasks')     TasksView.render();
    if (this.currentView === 'dashboard') Dashboard.render();
  },

  refresh() {
    this.renderCurrentView();
    this.refreshSidebar();
  },

  refreshSidebar() {
    const deals   = Storage.getDeals();
    const tasks   = Storage.getTasks();
    const active  = deals.filter(d => d.stage !== 'FAIL' && d.stage !== 'CUS').length;
    const overdue = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length;
    const open    = tasks.filter(t => t.status !== 'done').length;
    const pipelineVal = deals
      .filter(d => d.stage !== 'FAIL' && d.stage !== 'CUS')
      .reduce((s, d) => s + ((d.value || 0) * (d.probability || 50) / 100), 0);

    document.getElementById('sidebar-quickstats').innerHTML = `
      <div class="qs-title">Tổng quan</div>
      <div class="qs-row"><span class="qs-label">Deal active</span><span class="qs-val">${active}</span></div>
      <div class="qs-row"><span class="qs-label">Task mở</span><span class="qs-val">${open}</span></div>
      ${overdue ? `<div class="qs-row"><span class="qs-label">Quá hạn</span><span class="qs-val" style="color:#EF4444">${overdue}</span></div>` : ''}
      <div class="qs-row"><span class="qs-label">Pipeline</span><span class="qs-val" style="color:#60A5FA">${fmtMoney(pipelineVal)}</span></div>
    `;
  },

  exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      deals: Storage.getDeals(),
      tasks: Storage.getTasks(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `bd-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu thành công', 'success');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
