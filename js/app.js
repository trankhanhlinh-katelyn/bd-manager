/* ── APP ENTRY POINT ── */

const Notifications = {
  _granted: false,

  async request() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { this._granted = true; return; }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      this._granted = perm === 'granted';
    }
  },

  scheduleReminder(task) {
    if (!task.reminderAt) return;
    const delay = new Date(task.reminderAt) - new Date();
    if (delay <= 0) return;
    setTimeout(() => {
      if (this._granted) {
        new Notification('BD Manager – Nhắc việc', {
          body: task.title + (task.dueDate ? `\nHạn: ${fmtDate(task.dueDate)}` : ''),
          icon: null,
        });
      }
      showToast(`🔔 Nhắc: ${task.title}`, 'warning', 6000);
    }, delay);
  },

  scheduleAll() {
    Storage.getTasks().forEach(t => { if (t.reminderAt && t.status !== 'done') this.scheduleReminder(t); });
  },
};

const App = {
  currentView: 'pipeline',

  init() {
    Storage.seed();
    Notifications.request().then(() => Notifications.scheduleAll());
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
    const deals  = Storage.getDeals();
    const tasks  = Storage.getTasks();
    const active = deals.filter(d => d.stage !== 'FAIL' && d.stage !== 'CUS').length;
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
    a.href     = url;
    a.download = `bd-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu thành công', 'success');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
