/* ── DASHBOARD ── */

const Dashboard = {
  render() {
    const deals  = Storage.getDeals();
    const tasks  = Storage.getTasks();
    const now    = new Date();

    document.getElementById('dashboard-date').textContent =
      now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const active   = deals.filter(d => d.stage !== 'FAIL' && d.stage !== 'CUS');
    const won      = deals.filter(d => d.stage === 'CUS');
    const wonVal   = won.reduce((s, d) => s + (d.value || 0), 0);
    const pipeline = active.reduce((s, d) => s + ((d.value || 0) * (d.probability || 50) / 100), 0);
    const overdue  = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate));
    const openTasks = tasks.filter(t => t.status !== 'done');

    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
      <!-- STATS ROW -->
      <div class="dash-stats">
        <div class="stat-card primary">
          <div class="stat-card-label">Deal đang active</div>
          <div class="stat-card-value">${active.length}</div>
          <div class="stat-card-sub">${deals.length} tổng · ${won.length} đã chốt</div>
        </div>
        <div class="stat-card success">
          <div class="stat-card-label">Doanh thu đã chốt</div>
          <div class="stat-card-value">${fmtMoney(wonVal)}</div>
          <div class="stat-card-sub">${won.length} hợp đồng</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-card-label">Pipeline dự kiến</div>
          <div class="stat-card-value">${fmtMoney(pipeline)}</div>
          <div class="stat-card-sub">Theo xác suất chốt</div>
        </div>
        <div class="stat-card ${overdue.length ? 'danger' : ''}">
          <div class="stat-card-label">Task quá hạn</div>
          <div class="stat-card-value">${overdue.length}</div>
          <div class="stat-card-sub">${openTasks.length} task đang mở</div>
        </div>
      </div>

      <!-- FUNNEL + UPCOMING -->
      <div class="dash-row">
        <div class="dash-panel">
          <div class="dash-panel-title">Pipeline Funnel</div>
          ${this._renderFunnel(deals)}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">
            Công việc sắp đến
            <span class="text-muted" style="font-weight:400;font-size:11.5px">7 ngày tới</span>
          </div>
          ${this._renderUpcoming(tasks, deals)}
        </div>
      </div>

      <!-- APPOINTMENTS + OVERDUE TASKS -->
      <div class="dash-row">
        <div class="dash-panel">
          <div class="dash-panel-title">Lịch hẹn sắp tới</div>
          ${this._renderAppointments(deals)}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title" style="color:${overdue.length?'var(--danger)':'inherit'}">
            Task quá hạn ${overdue.length ? `<span style="background:#FEF2F2;color:var(--danger);padding:2px 8px;border-radius:99px;font-size:11px">${overdue.length}</span>` : ''}
          </div>
          ${this._renderOverdue(overdue, deals)}
        </div>
      </div>
    `;
  },

  _renderFunnel(deals) {
    if (!deals.length) return '<div class="text-muted">Chưa có deal nào</div>';
    const max = Math.max(...STAGES.map(s => deals.filter(d => d.stage === s.key).length), 1);
    return `<div class="funnel">` + STAGES.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage.key);
      const cnt  = stageDeals.length;
      const val  = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
      const pct  = Math.max(cnt / max * 100, cnt > 0 ? 10 : 0);
      return `
        <div class="funnel-row">
          <div class="funnel-label">${stage.label}</div>
          <div class="funnel-bar-wrap">
            <div class="funnel-bar" style="width:${pct}%;background:${stage.color}">
              ${cnt > 0 ? `<span class="funnel-bar-text">${cnt}</span>` : ''}
            </div>
          </div>
          <div class="funnel-meta">${val ? fmtMoney(val) : cnt ? '—' : ''}</div>
        </div>`;
    }).join('') + `</div>`;
  },

  _renderUpcoming(tasks, deals) {
    const in7 = tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      const d = daysUntil(t.dueDate);
      return d >= 0 && d <= 7;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (!in7.length) return '<div class="text-muted">Không có task nào trong 7 ngày tới 🎉</div>';

    return in7.slice(0, 8).map(t => {
      const deal = t.dealId ? deals.find(d => d.id === t.dealId) : null;
      const cls  = isSoon(t.dueDate) ? 'soon' : '';
      return `
        <div class="upcoming-task-row">
          <div class="upcoming-dot ${cls}"></div>
          <div>
            <div class="upcoming-task-title">${t.title}</div>
            <div class="upcoming-task-meta">${deal ? deal.name + ' · ' : ''}${fmtRelative(t.dueDate)}${t.assignees?.length ? ' · ' + t.assignees.join(', ') : ''}</div>
          </div>
        </div>`;
    }).join('');
  },

  _renderAppointments(deals) {
    const appts = deals
      .filter(d => d.nextAppointment && d.stage !== 'FAIL' && d.stage !== 'CUS')
      .sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment))
      .slice(0, 8);

    if (!appts.length) return '<div class="text-muted">Không có lịch hẹn nào</div>';

    return appts.map(d => {
      const cls = isOverdue(d.nextAppointment) ? 'overdue' : isSoon(d.nextAppointment) ? 'soon' : '';
      const stage = STAGES.find(s => s.key === d.stage);
      return `
        <div class="upcoming-task-row">
          <div class="upcoming-dot" style="background:${stage?.color||'var(--primary)'}"></div>
          <div style="flex:1;min-width:0">
            <div class="upcoming-task-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}${d.company ? ' · ' + d.company : ''}</div>
            <div class="upcoming-task-meta">
              <span class="${cls}">${fmtDate(d.nextAppointment)} · ${fmtRelative(d.nextAppointment)}</span>
              ${d.assignees?.length ? ' · ' + d.assignees.join(', ') : ''}
            </div>
          </div>
          <span class="stage-badge ${d.stage}" style="flex-shrink:0">${stage?.label||d.stage}</span>
        </div>`;
    }).join('');
  },

  _renderOverdue(overdue, deals) {
    if (!overdue.length) return '<div class="text-muted" style="color:var(--success)">Không có task quá hạn ✓</div>';
    return overdue.slice(0, 8).map(t => {
      const deal = t.dealId ? deals.find(d => d.id === t.dealId) : null;
      return `
        <div class="upcoming-task-row">
          <div class="upcoming-dot overdue"></div>
          <div>
            <div class="upcoming-task-title">${t.title}</div>
            <div class="upcoming-task-meta" style="color:var(--danger)">${deal ? deal.name + ' · ' : ''}${fmtRelative(t.dueDate)}</div>
          </div>
        </div>`;
    }).join('');
  },
};
