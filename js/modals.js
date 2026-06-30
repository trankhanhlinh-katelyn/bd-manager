/* ── MODALS ── */

const Modals = {

  /* ── DEAL FORM ── */
  openDealForm(dealId = null) {
    const deal = dealId ? Storage.getDeal(dealId) : null;
    const title = deal ? 'Chỉnh sửa Deal' : 'Thêm Deal mới';
    const contacts = Storage.getContacts();
    const datalistOpts = contacts.map(c => `<option value="${c}">`).join('');

    openModal(`
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tên khách hàng *</label>
            <input id="fd-name" class="form-control" placeholder="Nguyễn Văn A" value="${deal?.name||''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Công ty</label>
            <input id="fd-company" class="form-control" placeholder="ABC Corp" value="${deal?.company||''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Giá trị dự kiến (đ)</label>
            <input id="fd-value" class="form-control" type="number" min="0" placeholder="100000000" value="${deal?.value||''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Giai đoạn</label>
            <select id="fd-stage" class="form-control">
              ${STAGES.map(s => `<option value="${s.key}" ${deal?.stage===s.key?'selected':''}>${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nguồn (Source)</label>
            <select id="fd-source" class="form-control">
              ${['Referral','Cold Outreach','Website','Event','Social Media','Khác'].map(s=>`<option value="${s}" ${deal?.source===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ngày hẹn tiếp theo</label>
            <input id="fd-appt" class="form-control" type="date" value="${deal?.nextAppointment ? deal.nextAppointment.slice(0,10) : ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Ưu tiên</label>
            <select id="fd-priority" class="form-control">
              <option value="high"   ${deal?.priority==='high'?'selected':''}>Cao</option>
              <option value="medium" ${deal?.priority==='medium'||!deal?.priority?'selected':''}>Trung bình</option>
              <option value="low"    ${deal?.priority==='low'?'selected':''}>Thấp</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Xác suất (%)</label>
            <input id="fd-prob" class="form-control" type="number" min="0" max="100" placeholder="50" value="${deal?.probability||''}" />
          </div>
        </div>
        <div class="form-group form-row single">
          <label class="form-label">Người phụ trách (nhấn Enter hoặc phẩy để thêm)</label>
          <datalist id="fd-contacts-list">${datalistOpts}</datalist>
          <div class="tags-input-wrap" id="fd-assignees-wrap">
            <input id="fd-assignees-input" class="tags-input" placeholder="Tên người phụ trách..." list="fd-contacts-list" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <textarea id="fd-notes" class="form-control" placeholder="Ghi chú về deal...">${deal?.notes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        ${deal ? `<button class="btn-danger" id="fd-delete">Xoá deal</button>` : ''}
        <button class="btn-secondary" onclick="closeModal()">Huỷ</button>
        <button class="btn-primary" id="fd-save">Lưu</button>
      </div>
    `);

    const tagCtrl = renderTagsInput('fd-assignees-wrap', 'fd-assignees-input', deal?.assignees || []);

    document.getElementById('fd-save').onclick = () => {
      const name = document.getElementById('fd-name').value.trim();
      if (!name) { showToast('Vui lòng nhập tên khách hàng', 'error'); return; }
      const updated = {
        id: deal?.id || uid(),
        name,
        company: document.getElementById('fd-company').value.trim(),
        value: parseFloat(document.getElementById('fd-value').value) || 0,
        stage: document.getElementById('fd-stage').value,
        source: document.getElementById('fd-source').value,
        nextAppointment: document.getElementById('fd-appt').value || null,
        priority: document.getElementById('fd-priority').value,
        probability: parseInt(document.getElementById('fd-prob').value) || 0,
        assignees: tagCtrl.getTags(),
        contacts: deal?.contacts || [],
        notes: document.getElementById('fd-notes').value.trim(),
        activityLog: deal?.activityLog || [],
        createdAt: deal?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!deal) {
        updated.activityLog.unshift({ id: uid(), type: 'create', text: 'Deal được tạo', date: new Date().toISOString() });
      }
      Storage.saveDeal(updated);
      closeModal();
      showToast(deal ? 'Đã cập nhật deal' : 'Đã thêm deal mới', 'success');
      App.refresh();
    };

    if (deal) {
      document.getElementById('fd-delete').onclick = () => {
        if (confirm(`Xoá deal "${deal.name}"? Tất cả task liên quan cũng sẽ bị xoá.`)) {
          Storage.deleteDeal(deal.id);
          closeModal();
          showToast('Đã xoá deal', 'warning');
          App.refresh();
        }
      };
    }
  },

  /* ── DEAL DETAIL ── */
  openDealDetail(dealId) {
    const deal = Storage.getDeal(dealId);
    if (!deal) return;
    const tasks = Storage.getTasksForDeal(dealId);
    const stage = STAGES.find(s => s.key === deal.stage);

    openModal(this._dealDetailHTML(deal, tasks, stage), true);
    this._bindDealDetail(deal, tasks);
  },

  _dealDetailHTML(deal, tasks, stage) {
    return `
      <div class="modal-header">
        <div>
          <span class="modal-title">${deal.name}</span>
          <div style="margin-top:4px"><span class="stage-badge ${deal.stage}">${stage?.label || deal.stage}</span></div>
        </div>
        <div class="gap-btn">
          <button class="btn-secondary" onclick="Modals.openDealForm('${deal.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Sửa
          </button>
          <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="modal-body">
        <div class="deal-info-grid" style="margin-bottom:16px">
          <div class="info-item"><div class="info-item-label">Công ty</div><div class="info-item-value">${deal.company||'—'}</div></div>
          <div class="info-item"><div class="info-item-label">Giá trị</div><div class="info-item-value" style="color:var(--primary)">${fmtMoney(deal.value)}</div></div>
          <div class="info-item"><div class="info-item-label">Ngày hẹn</div><div class="info-item-value ${isOverdue(deal.nextAppointment)?'overdue':''}">${fmtDate(deal.nextAppointment)}</div></div>
          <div class="info-item"><div class="info-item-label">Nguồn</div><div class="info-item-value">${deal.source||'—'}</div></div>
          <div class="info-item"><div class="info-item-label">Xác suất</div><div class="info-item-value">${deal.probability||0}%</div></div>
          <div class="info-item"><div class="info-item-label">Người phụ trách</div><div class="info-item-value">${deal.assignees?.join(', ')||'—'}</div></div>
        </div>
        ${deal.notes ? `<div style="background:var(--bg);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--text-2);margin-bottom:16px">${deal.notes}</div>` : ''}

        <div class="deal-detail-tabs">
          <div class="detail-tab active" data-tab="tasks">Công việc (${tasks.length})</div>
          <div class="detail-tab" data-tab="activity">Lịch sử hoạt động</div>
        </div>

        <div id="detail-tab-tasks">
          <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
            <button class="btn-primary" id="dd-add-task" style="padding:7px 12px;font-size:12px">+ Thêm task</button>
          </div>
          <div id="detail-tasks-list">
            ${this._renderDetailTasks(tasks)}
          </div>
        </div>

        <div id="detail-tab-activity" style="display:none">
          <div class="activity-log" id="detail-activity-log">
            ${this._renderActivity(deal.activityLog || [])}
          </div>
          <div class="add-activity-row">
            <input id="dd-activity-input" class="add-activity-input" placeholder="Ghi chú hoạt động mới..." />
            <button class="btn-primary" id="dd-activity-add" style="padding:8px 14px;font-size:12px">Thêm</button>
          </div>
        </div>
      </div>
    `;
  },

  _renderDetailTasks(tasks) {
    if (!tasks.length) return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><div class="empty-state-title">Chưa có task nào</div></div>`;
    return tasks.map(t => {
      const done  = t.subtasks?.filter(s => s.done).length || 0;
      const total = t.subtasks?.length || 0;
      const r     = getReminderSummary(t);
      return `
        <div class="task-card" style="margin-bottom:8px">
          <div class="task-card-main">
            <div class="task-checkbox ${t.status==='done'?'checked':''}" onclick="TasksView.toggleStatus('${t.id}');Modals.refreshDetailTasks('${t.dealId}')"></div>
            <div class="task-card-body">
              <div class="task-card-title ${t.status==='done'?'done':''}">${t.title}</div>
              <div class="task-card-meta">
                <span class="task-badge badge-prio-${t.priority}">${{high:'Cao',medium:'TB',low:'Thấp'}[t.priority]||''}</span>
                ${t.dueDate ? `<span class="task-badge badge-due ${isOverdue(t.dueDate)?'overdue':isSoon(t.dueDate)?'soon':''}">${fmtDateShort(t.dueDate)}</span>` : ''}
                ${r ? `<span class="task-badge reminder-badge">🔔 ${r}</span>` : ''}
                ${t.assignees?.length ? `<span class="text-muted">${t.assignees.join(', ')}</span>` : ''}
                ${total > 0 ? `<span class="text-muted">${done}/${total} subtask</span>` : ''}
              </div>
            </div>
            <div class="task-card-actions">
              <button class="action-btn" onclick="Modals.openTaskForm('${t.dealId}','${t.id}')" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" onclick="TasksView.deleteTask('${t.id}');Modals.refreshDetailTasks('${t.dealId}')" title="Xoá"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  refreshDetailTasks(dealId) {
    const tasks = Storage.getTasksForDeal(dealId);
    const el = document.getElementById('detail-tasks-list');
    if (el) el.innerHTML = this._renderDetailTasks(tasks);
    App.refreshSidebar();
    Pipeline.render();
  },

  _renderActivity(log) {
    if (!log.length) return '<div class="text-muted" style="padding:12px 0">Chưa có hoạt động nào</div>';
    const icons = { create: '🎉', stage: '🔄', note: '📝', task: '✅', default: '📌' };
    return log.map(a => `
      <div class="activity-item">
        <div class="activity-icon">${icons[a.type] || icons.default}</div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${fmtDate(a.date)}</div>
        </div>
      </div>
    `).join('');
  },

  _bindDealDetail(deal, tasks) {
    document.querySelectorAll('.detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('detail-tab-tasks').style.display    = tab.dataset.tab === 'tasks'    ? '' : 'none';
        document.getElementById('detail-tab-activity').style.display = tab.dataset.tab === 'activity' ? '' : 'none';
      });
    });

    document.getElementById('dd-add-task').onclick = () => this.openTaskForm(deal.id);

    document.getElementById('dd-activity-add').onclick = () => {
      const input = document.getElementById('dd-activity-input');
      const text  = input.value.trim();
      if (!text) return;
      const d = Storage.getDeal(deal.id);
      d.activityLog = d.activityLog || [];
      d.activityLog.unshift({ id: uid(), type: 'note', text, date: new Date().toISOString() });
      Storage.saveDeal(d);
      input.value = '';
      document.getElementById('detail-activity-log').innerHTML = this._renderActivity(d.activityLog);
    };
  },

  /* ── TASK FORM ── */
  openTaskForm(dealId = null, taskId = null) {
    const task   = taskId ? Storage.getTask(taskId) : null;
    const deals  = Storage.getDeals();
    const contacts = Storage.getContacts();
    const datalistOpts = contacts.map(c => `<option value="${c}">`).join('');
    const title  = task ? 'Chỉnh sửa Task' : 'Thêm Task mới';
    const effectiveDealId = task?.dealId || dealId;

    // Get existing reminder data (support old reminderAt format)
    const r = task?.reminder || (task?.reminderAt ? {
      type: 'once',
      startDate: task.reminderAt.slice(0, 10),
      time: task.reminderAt.slice(11, 16),
      endDate: null, daysBefore: null
    } : null);

    openModal(`
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tên công việc *</label>
          <input id="ft-title" class="form-control" placeholder="Gửi proposal, Gọi điện tư vấn..." value="${task?.title||''}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Gắn với Deal</label>
            <select id="ft-deal" class="form-control">
              <option value="">— Không gắn deal —</option>
              ${deals.map(d => `<option value="${d.id}" ${effectiveDealId===d.id?'selected':''}>${d.name}${d.company?' · '+d.company:''}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Trạng thái</label>
            <select id="ft-status" class="form-control">
              <option value="todo"        ${task?.status==='todo'||!task?'selected':''}>Chưa làm</option>
              <option value="in_progress" ${task?.status==='in_progress'?'selected':''}>Đang làm</option>
              <option value="done"        ${task?.status==='done'?'selected':''}>Hoàn thành</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Ưu tiên</label>
            <select id="ft-priority" class="form-control">
              <option value="high"   ${task?.priority==='high'?'selected':''}>Cao</option>
              <option value="medium" ${task?.priority==='medium'||!task?'selected':''}>Trung bình</option>
              <option value="low"    ${task?.priority==='low'?'selected':''}>Thấp</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hạn hoàn thành</label>
            <input id="ft-due" class="form-control" type="date" value="${task?.dueDate ? task.dueDate.slice(0,10) : ''}" />
          </div>
        </div>

        <!-- REMINDER SECTION -->
        <div class="reminder-section">
          <div class="reminder-section-title">🔔 Cài đặt nhắc nhở</div>
          <div class="form-group" style="margin-bottom:10px">
            <label class="form-label">Kiểu nhắc</label>
            <select id="ft-reminder-type" class="form-control" onchange="Modals._onReminderTypeChange()">
              <option value="none"       ${!r||r.type==='none'?'selected':''}>Không nhắc</option>
              <option value="once"       ${r?.type==='once'?'selected':''}>Một lần</option>
              <option value="daily"      ${r?.type==='daily'?'selected':''}>Hàng ngày</option>
              <option value="weekly"     ${r?.type==='weekly'?'selected':''}>Hàng tuần (cùng thứ)</option>
              <option value="workdays"   ${r?.type==='workdays'?'selected':''}>Ngày làm việc (T2 – T6)</option>
              <option value="before_due" ${r?.type==='before_due'?'selected':''}>Trước hạn N ngày</option>
            </select>
          </div>

          <div id="ft-reminder-fields" style="display:${r&&r.type!=='none'?'':'none'}">
            <div class="form-row" id="ft-r-startrow" style="display:${r?.type==='before_due'?'none':''}">
              <div class="form-group">
                <label class="form-label">Bắt đầu nhắc từ ngày</label>
                <input id="ft-reminder-start" class="form-control" type="date" value="${r?.startDate||''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Lúc mấy giờ</label>
                <input id="ft-reminder-time" class="form-control" type="time" value="${r?.time||'09:00'}" />
              </div>
            </div>

            <div class="form-row" id="ft-r-endrow" style="display:${!r||r.type==='once'||r.type==='before_due'?'none':''}">
              <div class="form-group">
                <label class="form-label">Nhắc đến ngày (trống = đến hạn task)</label>
                <input id="ft-reminder-end" class="form-control" type="date" value="${r?.endDate||''}" />
              </div>
            </div>

            <div class="form-row" id="ft-r-beforerow" style="display:${r?.type==='before_due'?'':'none'}">
              <div class="form-group">
                <label class="form-label">Giờ nhắc</label>
                <input id="ft-reminder-time2" class="form-control" type="time" value="${r?.time||'09:00'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Nhắc trước hạn bao nhiêu ngày</label>
                <input id="ft-reminder-days" class="form-control" type="number" min="1" max="60" value="${r?.daysBefore||1}" placeholder="Số ngày" />
              </div>
            </div>

            <div class="reminder-note">
              💡 Thông báo nhắc nhở sẽ hiển thị tên tất cả người được assign — bạn có thể <strong>copy và gửi</strong> cho họ qua Zalo / Slack.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Người phụ trách (nhấn Enter để thêm)</label>
          <datalist id="ft-contacts-list">${datalistOpts}</datalist>
          <div class="tags-input-wrap" id="ft-assignees-wrap">
            <input id="ft-assignees-input" class="tags-input" placeholder="Tên người phụ trách..." list="ft-contacts-list" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mô tả</label>
          <textarea id="ft-desc" class="form-control" placeholder="Chi tiết công việc...">${task?.description||''}</textarea>
        </div>

        ${task ? `
        <div class="divider"></div>
        <div class="form-label" style="margin-bottom:10px">Subtasks</div>
        <div id="ft-subtasks">
          ${(task.subtasks||[]).map(s => `
            <div class="subtask-row" id="sub-${s.id}">
              <div class="subtask-cb ${s.done?'checked':''}" onclick="this.classList.toggle('checked');document.getElementById('sub-${s.id}').dataset.done=this.classList.contains('checked')"></div>
              <span class="subtask-title ${s.done?'done':''}">${s.title}</span>
              <span class="subtask-assignees">${s.assignees?.join(', ')||''}</span>
              <button class="action-btn danger" onclick="document.getElementById('sub-${s.id}').remove()" title="Xoá"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>`).join('')}
        </div>
        <div class="add-subtask-row">
          <input id="ft-new-sub" class="add-subtask-input" placeholder="Thêm subtask..." />
          <button class="add-subtask-btn" id="ft-add-sub">Thêm</button>
        </div>` : ''}
      </div>
      <div class="modal-footer">
        ${task ? `<button class="btn-danger" id="ft-delete">Xoá task</button>` : ''}
        <button class="btn-secondary" onclick="closeModal()">Huỷ</button>
        <button class="btn-primary" id="ft-save">Lưu</button>
      </div>
    `);

    const tagCtrl = renderTagsInput('ft-assignees-wrap', 'ft-assignees-input', task?.assignees || []);

    // Subtask add
    if (task) {
      document.getElementById('ft-add-sub').onclick = () => {
        const input = document.getElementById('ft-new-sub');
        const val   = input.value.trim();
        if (!val) return;
        const id  = uid();
        const row = document.createElement('div');
        row.className = 'subtask-row';
        row.id = `sub-${id}`;
        row.dataset.new = '1';
        row.dataset.title = val;
        row.innerHTML = `
          <div class="subtask-cb" onclick="this.classList.toggle('checked');document.getElementById('sub-${id}').dataset.done=this.classList.contains('checked')"></div>
          <span class="subtask-title">${val}</span>
          <button class="action-btn danger" onclick="document.getElementById('sub-${id}').remove()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        `;
        document.getElementById('ft-subtasks').appendChild(row);
        input.value = '';
      };
      document.getElementById('ft-new-sub').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ft-add-sub').click(); }
      });
    }

    document.getElementById('ft-save').onclick = () => {
      const title = document.getElementById('ft-title').value.trim();
      if (!title) { showToast('Vui lòng nhập tên công việc', 'error'); return; }

      let subtasks = task?.subtasks || [];
      if (task) {
        subtasks = [];
        document.querySelectorAll('#ft-subtasks .subtask-row').forEach(row => {
          if (row.dataset.new === '1') {
            subtasks.push({ id: uid(), title: row.dataset.title, done: row.dataset.done === 'true', assignees: [] });
          } else {
            const id = row.id.replace('sub-', '');
            const orig = task.subtasks.find(s => s.id === id);
            if (orig) subtasks.push({ ...orig, done: row.dataset.done === 'true' || row.querySelector('.subtask-cb').classList.contains('checked') });
          }
        });
      }

      const reminder = this._buildReminder();
      const updated = {
        id: task?.id || uid(),
        dealId: document.getElementById('ft-deal').value || null,
        title,
        description: document.getElementById('ft-desc').value.trim(),
        dueDate: document.getElementById('ft-due').value || null,
        reminder,
        status: document.getElementById('ft-status').value,
        priority: document.getElementById('ft-priority').value,
        assignees: tagCtrl.getTags(),
        subtasks,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      Storage.saveTask(updated);
      Notifications.reschedule();
      closeModal();
      showToast(task ? 'Đã cập nhật task' : 'Đã thêm task mới', 'success');
      App.refresh();
      if (effectiveDealId) Modals.openDealDetail(effectiveDealId);
    };

    if (task) {
      document.getElementById('ft-delete').onclick = () => {
        Storage.deleteTask(task.id);
        closeModal();
        showToast('Đã xoá task', 'warning');
        App.refresh();
        if (effectiveDealId) Modals.openDealDetail(effectiveDealId);
      };
    }
  },

  // Called by onchange on the reminder type dropdown
  _onReminderTypeChange() {
    const type     = document.getElementById('ft-reminder-type').value;
    const fields   = document.getElementById('ft-reminder-fields');
    const startRow = document.getElementById('ft-r-startrow');
    const endRow   = document.getElementById('ft-r-endrow');
    const beforeRow= document.getElementById('ft-r-beforerow');

    if (type === 'none') { fields.style.display = 'none'; return; }
    fields.style.display = '';

    startRow.style.display  = type === 'before_due' ? 'none' : '';
    endRow.style.display    = (type === 'once' || type === 'before_due') ? 'none' : '';
    beforeRow.style.display = type === 'before_due' ? '' : 'none';
  },

  _buildReminder() {
    const type = document.getElementById('ft-reminder-type')?.value || 'none';
    if (type === 'none') return null;

    if (type === 'before_due') {
      return {
        type,
        time: document.getElementById('ft-reminder-time2')?.value || '09:00',
        daysBefore: parseInt(document.getElementById('ft-reminder-days')?.value) || 1,
        startDate: null,
        endDate: null,
      };
    }

    return {
      type,
      startDate: document.getElementById('ft-reminder-start')?.value || null,
      endDate:   document.getElementById('ft-reminder-end')?.value   || null,
      time:      document.getElementById('ft-reminder-time')?.value  || '09:00',
      daysBefore: null,
    };
  },
};

/* helper: short reminder description for badges */
function getReminderSummary(task) {
  const r = task.reminder;
  if (!r || r.type === 'none') return null;
  const typeMap = { once: 'Một lần', daily: 'Hàng ngày', weekly: 'Hàng tuần', workdays: 'T2-T6', before_due: `Trước ${r.daysBefore||1} ngày` };
  const label = typeMap[r.type] || '';
  const time  = r.time ? ` ${r.time}` : '';
  return label + time;
}
