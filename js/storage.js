/* ── STORAGE LAYER ── */
const KEYS = {
  deals: 'bd_deals',
  tasks: 'bd_tasks',
  contacts: 'bd_contacts',
};

const Storage = {
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  /* ── DEALS ── */
  getDeals()          { return this._get(KEYS.deals); },
  getDeal(id)         { return this.getDeals().find(d => d.id === id) || null; },
  saveDeal(deal) {
    const deals = this.getDeals();
    const idx   = deals.findIndex(d => d.id === deal.id);
    if (idx >= 0) deals[idx] = deal; else deals.unshift(deal);
    this._set(KEYS.deals, deals);
    this._updateContacts(deal.assignees || []);
  },
  deleteDeal(id) {
    const deals = this.getDeals().filter(d => d.id !== id);
    this._set(KEYS.deals, deals);
    // also remove tasks for this deal
    const tasks = this.getTasks().filter(t => t.dealId !== id);
    this._set(KEYS.tasks, tasks);
  },
  moveDeal(id, stage) {
    const deal = this.getDeal(id);
    if (!deal) return;
    deal.stage = stage;
    deal.updatedAt = new Date().toISOString();
    deal.activityLog = deal.activityLog || [];
    deal.activityLog.unshift({ id: uid(), type: 'stage', text: `Chuyển sang giai đoạn ${stage}`, date: new Date().toISOString() });
    this.saveDeal(deal);
  },

  /* ── TASKS ── */
  getTasks()          { return this._get(KEYS.tasks); },
  getTask(id)         { return this.getTasks().find(t => t.id === id) || null; },
  getTasksForDeal(dealId) { return this.getTasks().filter(t => t.dealId === dealId); },
  saveTask(task) {
    const tasks = this.getTasks();
    const idx   = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) tasks[idx] = task; else tasks.unshift(task);
    this._set(KEYS.tasks, tasks);
    this._updateContacts(task.assignees || []);
  },
  deleteTask(id) {
    this._set(KEYS.tasks, this.getTasks().filter(t => t.id !== id));
  },

  /* ── CONTACTS (autocomplete) ── */
  getContacts()       { return this._get(KEYS.contacts); },
  _updateContacts(names) {
    const existing = new Set(this.getContacts());
    names.forEach(n => { if (n) existing.add(n.trim()); });
    this._set(KEYS.contacts, [...existing]);
  },
  addContact(name) { this._updateContacts([name]); },

  /* ── SEED DATA (first run) ── */
  seed() {
    if (this.getDeals().length) return;
    const now = new Date();
    const d = (days) => new Date(now.getTime() + days * 86400000).toISOString();

    const deals = [
      { id: uid(), name: 'Nguyễn Văn Thành', company: 'TechViet Corp', value: 150000000, stage: 'MQL', source: 'Referral', nextAppointment: d(3), assignees: ['Nam', 'Linh'], contacts: [], notes: 'Khách quan tâm gói Enterprise', priority: 'high', probability: 30, activityLog: [{ id: uid(), type: 'note', text: 'Khách hàng liên hệ qua referral từ anh Minh', date: d(-5) }], createdAt: d(-5), updatedAt: now.toISOString() },
      { id: uid(), name: 'Trần Thị Lan', company: 'SmartBuild JSC', value: 320000000, stage: 'SAL', source: 'Website', nextAppointment: d(1), assignees: ['Linh'], contacts: [], notes: '', priority: 'medium', probability: 50, activityLog: [], createdAt: d(-10), updatedAt: now.toISOString() },
      { id: uid(), name: 'Phạm Hoàng Long', company: 'Sunrise Media', value: 85000000, stage: 'SQL', source: 'Cold Outreach', nextAppointment: d(7), assignees: ['Nam'], contacts: [], notes: 'Cần demo lần 2', priority: 'medium', probability: 70, activityLog: [], createdAt: d(-15), updatedAt: now.toISOString() },
      { id: uid(), name: 'Lê Minh Tuấn', company: 'GreenEnergy VN', value: 500000000, stage: 'CONTRACT', source: 'Event', nextAppointment: d(2), assignees: ['Nam', 'Linh'], contacts: [], notes: 'Đang soạn hợp đồng', priority: 'high', probability: 90, activityLog: [], createdAt: d(-20), updatedAt: now.toISOString() },
    ];

    const firstDeal = deals[0];
    const tasks = [
      { id: uid(), dealId: firstDeal.id, title: 'Gửi proposal cho TechViet', description: 'Chuẩn bị và gửi proposal theo yêu cầu', dueDate: d(2), reminderAt: null, status: 'todo', priority: 'high', assignees: ['Nam'], subtasks: [{ id: uid(), title: 'Draft proposal', done: true, assignees: ['Nam'] }, { id: uid(), title: 'Duyệt nội bộ', done: false, assignees: ['Linh'] }], createdAt: d(-1), updatedAt: now.toISOString() },
      { id: uid(), dealId: deals[2].id, title: 'Chuẩn bị demo lần 2', description: '', dueDate: d(6), reminderAt: d(5) + 'T09:00:00', status: 'todo', priority: 'medium', assignees: ['Nam'], subtasks: [], createdAt: d(-2), updatedAt: now.toISOString() },
    ];

    deals.forEach(d => this.saveDeal(d));
    tasks.forEach(t => this.saveTask(t));
    this._updateContacts(['Nam', 'Linh', 'Minh', 'Hoa']);
  },
};
