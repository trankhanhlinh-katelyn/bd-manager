/* ── TASKS VIEW ── */

const TasksView = {
  render() {
    this._populateDealFilter();
    this._renderList();
    this._bindFilters();
  },

  _populateDealFilter() {
    const sel = document.getElementById('filter-task-deal');
    const deals = Storage.getDeals();
    sel.innerHTML = `<option value="">Tất cả deal</option>` +
      deals.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  },

  _bindFilters() {
    ['filter-task-status','filter-task-deal','filter-task-priority'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._bound) {
        el.addEventListener('change', () => this._renderList());
        el._bound = true;
      }
    });
    const search = document.getElementById('search-tasks');
    if (search && !search._bound) {
      search.addEventListener('input', () => this._renderList());
      search._bound = true;
    }
  },

  _getFiltered() {
    const status   = document.getElementById('filter-task-status')?.value || '';
    const dealId   = document.getElementById('filter-task-deal')?.value   || '';
    const priority = document.getElementById('filter-task-priority')?.value || '';
    const q        = (document.getElementById('search-tasks')?.value || '').toLowerCase();

    return Storage.getTasks().filter(t => {
      if (status   && t.status   !== status)   return false;
      if (dealId   && t.dealId   !== dealId)   return false;
      if (priority && t.priority !== priority) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  },

  _renderList() {
    const list  = document.getElementById('tasks-list');
    const tasks = this._getFiltered();
    const deals = Storage.getDeals();

    const overdue    = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate));
    const today      = tasks.filter(t => t.status !== 'done' && !isOverdue(t.dueDate) && isSoon(t.dueDate));
    const upcoming   = tasks.filter(t => t.status !== 'done' && !isOverdue(t.dueDate) && !isSoon(t.dueDate));
    const done       = tasks.filter(t => t.status === 'done');

    // summary
    const summary = document.getElementById('tasks-summary');
    if (summary) summary.textContent = `${tasks.length} task · ${overdue.length} quá hạn · ${done.length} hoàn thành`;

    list.innerHTML = '';

    if (!tasks.length) {
      list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><div class="empty-state-title">Không có task nào</div><div class="empty-state-sub">Nhấn "+ Thêm Task" để bắt đầu</div></div>`;
      return;
    }

    const groups = [
      { label: '🔴  Quá hạn', tasks: overdue },
      { label: '🟡  Hôm nay / Sắp đến (3 ngày)', tasks: today },
      { label: '📋  Sắp tới', tasks: upcoming },
      { label: '✅  Hoàn thành', tasks: done },
    ];

    groups.forEach(g => {
      if (!g.tasks.length) return;
      const header = document.createElement('div');
      header.className = 'task-group-header';
      header.textContent = g.label;
      list.appendChild(header);
      g.tasks.forEach(t => {
        const deal = t.dealId ? deals.find(d => d.id === t.dealId) : null;
        list.appendChild(this._buildCard(t, deal));
      });
    });
  },

  _buildCard(task, deal) {
    const wrapper = document.createElement('div');
    wrapper.className = 'task-card';
    wrapper.dataset.taskId = task.id;

    const doneSubs  = task.subtasks?.filter(s => s.done).length || 0;
    const totalSubs = task.subtasks?.length || 0;
    const subPct    = totalSubs ? Math.round(doneSubs / totalSubs * 100) : 0;
    const dueCls    = isOverdue(task.dueDate) ? 'overdue' : isSoon(task.dueDate) ? 'soon' : '';
    const prioMap   = { high: 'Cao', medium: 'TB', low: 'Thấp' };

    wrapper.innerHTML = `
      <div class="task-card-main">
        <div class="task-checkbox ${task.status==='done'?'checked':''}" data-id="${task.id}"></div>
        <div class="task-card-body">
          <div class="task-card-title ${task.status==='done'?'done':''}">${task.title}</div>
          <div class="task-card-meta">
            ${deal ? `<span class="task-badge badge-deal">${deal.name}</span>` : ''}
            <span class="task-badge badge-prio-${task.priority}">${prioMap[task.priority]||''}</span>
            ${task.dueDate ? `<span class="task-badge badge-due ${dueCls}">${fmtDateShort(task.dueDate)} · ${fmtRelative(task.dueDate)}</span>` : ''}
            ${getReminderSummary(task) ? `<span class="task-badge reminder-badge">🔔 ${getReminderSummary(task)}</span>` : ''}
            ${task.assignees?.length ? `<span class="text-muted">${task.assignees.join(', ')}</span>` : ''}
          </div>
        </div>
        <div class="task-card-actions">
          ${totalSubs > 0 ? `<span class="text-muted" style="font-size:11px;white-space:nowrap">${doneSubs}/${totalSubs}</span>` : ''}
          <button class="action-btn" data-edit="${task.id}" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="action-btn danger" data-delete="${task.id}" title="Xoá"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
        </div>
      </div>
      ${totalSubs > 0 ? `
      <div class="task-subtasks">
        <div class="subtask-progress-bar"><div class="subtask-progress-fill" style="width:${subPct}%"></div></div>
        ${task.subtasks.map(s => `
          <div class="subtask-row" data-sub-id="${s.id}" data-task-id="${task.id}">
            <div class="subtask-cb ${s.done?'checked':''}" data-sub="${s.id}" data-task="${task.id}"></div>
            <span class="subtask-title ${s.done?'done':''}">${s.title}</span>
            ${s.assignees?.length ? `<span class="subtask-assignees">${s.assignees.join(', ')}</span>` : ''}
          </div>`).join('')}
        <div class="add-subtask-row">
          <input class="add-subtask-input" data-task="${task.id}" placeholder="Thêm subtask..." />
          <button class="add-subtask-btn" data-task="${task.id}">Thêm</button>
        </div>
      </div>` : `
      <div class="task-subtasks" style="padding-top:6px">
        <div class="add-subtask-row">
          <input class="add-subtask-input" data-task="${task.id}" placeholder="Thêm subtask..." />
          <button class="add-subtask-btn" data-task="${task.id}">Thêm</button>
        </div>
      </div>`}
    `;

    // toggle status
    wrapper.querySelector('.task-checkbox').addEventListener('click', () => {
      this.toggleStatus(task.id);
    });

    // subtask checkboxes
    wrapper.querySelectorAll('.subtask-cb').forEach(cb => {
      cb.addEventListener('click', () => {
        const subId  = cb.dataset.sub;
        const taskId = cb.dataset.task;
        this.toggleSubtask(taskId, subId);
      });
    });

    // add subtask
    const addBtn   = wrapper.querySelector('.add-subtask-btn');
    const addInput = wrapper.querySelector('.add-subtask-input');
    if (addBtn) {
      addBtn.addEventListener('click', () => this._addSubtask(task.id, addInput?.value?.trim()));
      addInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this._addSubtask(task.id, addInput.value.trim()); } });
    }

    // edit
    wrapper.querySelector('[data-edit]')?.addEventListener('click', () => Modals.openTaskForm(task.dealId, task.id));

    // delete
    wrapper.querySelector('[data-delete]')?.addEventListener('click', () => this.deleteTask(task.id));

    return wrapper;
  },

  toggleStatus(taskId) {
    const task = Storage.getTask(taskId);
    if (!task) return;
    task.status    = task.status === 'done' ? 'todo' : 'done';
    task.updatedAt = new Date().toISOString();
    Storage.saveTask(task);
    this._renderList();
    App.refreshSidebar();
    Pipeline.render();
  },

  toggleSubtask(taskId, subId) {
    const task = Storage.getTask(taskId);
    if (!task) return;
    const sub = task.subtasks?.find(s => s.id === subId);
    if (!sub) return;
    sub.done = !sub.done;
    task.updatedAt = new Date().toISOString();
    Storage.saveTask(task);
    this._renderList();
    Pipeline.render();
  },

  _addSubtask(taskId, title) {
    if (!title) return;
    const task = Storage.getTask(taskId);
    if (!task) return;
    task.subtasks = task.subtasks || [];
    task.subtasks.push({ id: uid(), title, done: false, assignees: [] });
    task.updatedAt = new Date().toISOString();
    Storage.saveTask(task);
    this._renderList();
    Pipeline.render();
  },

  deleteTask(taskId) {
    if (!confirm('Xoá task này?')) return;
    Storage.deleteTask(taskId);
    showToast('Đã xoá task', 'warning');
    this._renderList();
    App.refreshSidebar();
    Pipeline.render();
  },
};
