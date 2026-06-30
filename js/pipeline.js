/* ── PIPELINE BOARD ── */

const Pipeline = {
  render() {
    const board   = document.getElementById('pipeline-board');
    const deals   = Storage.getDeals();
    const allTasks = Storage.getTasks();
    board.innerHTML = '';

    STAGES.forEach(stage => {
      const stageDeals = deals.filter(d => d.stage === stage.key);
      const totalVal   = stageDeals.reduce((s, d) => s + (d.value || 0), 0);

      const col = document.createElement('div');
      col.className  = 'stage-col';
      col.dataset.stage = stage.key;
      col.innerHTML = `
        <div class="stage-header" data-stage="${stage.key}">
          <div class="stage-label">
            <div class="stage-dot" style="background:${stage.color}"></div>
            ${stage.label}
          </div>
          <span class="stage-count">${stageDeals.length}</span>
        </div>
        ${totalVal ? `<div class="stage-value">${fmtMoney(totalVal)}</div>` : '<div class="stage-value" style="visibility:hidden">—</div>'}
        <div class="stage-cards" data-stage="${stage.key}"></div>
      `;
      board.appendChild(col);

      const cardsEl = col.querySelector('.stage-cards');

      if (!stageDeals.length) {
        cardsEl.innerHTML = `<div class="empty-state" style="padding:20px 8px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          <div class="empty-state-sub">Kéo deal vào đây</div>
        </div>`;
      } else {
        stageDeals.forEach(deal => {
          const card = this._buildCard(deal, allTasks.filter(t => t.dealId === deal.id));
          cardsEl.appendChild(card);
        });
      }

      // drag-over targets
      cardsEl.addEventListener('dragover', e => {
        e.preventDefault();
        cardsEl.classList.add('drag-over');
      });
      cardsEl.addEventListener('dragleave', e => {
        if (!cardsEl.contains(e.relatedTarget)) cardsEl.classList.remove('drag-over');
      });
      cardsEl.addEventListener('drop', e => {
        e.preventDefault();
        cardsEl.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain');
        if (!dealId) return;
        Storage.moveDeal(dealId, stage.key);
        showToast(`Chuyển sang ${stage.label}`, 'success');
        App.refresh();
      });
    });

    // update summary
    const summary = document.getElementById('pipeline-summary');
    const active  = deals.filter(d => d.stage !== 'FAIL' && d.stage !== 'CUS');
    const totalV  = active.reduce((s, d) => s + (d.value || 0), 0);
    summary.textContent = `${deals.length} deal · ${active.length} đang active · Pipeline: ${fmtMoney(totalV)}`;
  },

  _buildCard(deal, tasks) {
    const done  = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    const pct   = total ? Math.round(done / total * 100) : 0;

    const card = document.createElement('div');
    card.className     = 'deal-card';
    card.draggable     = true;
    card.dataset.dealId = deal.id;

    const dueCls = isOverdue(deal.nextAppointment) ? 'overdue' : isSoon(deal.nextAppointment) ? 'soon' : '';

    card.innerHTML = `
      <div class="deal-card-priority ${deal.priority}"></div>
      <div class="deal-card-name" title="${deal.name}">${deal.name}</div>
      ${deal.company ? `<div class="deal-card-company" title="${deal.company}">${deal.company}</div>` : ''}
      <div class="deal-card-meta">
        ${deal.value ? `<div class="deal-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span class="val">${fmtMoney(deal.value)}</span></div>` : ''}
        ${deal.nextAppointment ? `<div class="deal-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span class="${dueCls||'val'}">${fmtRelative(deal.nextAppointment)}</span></div>` : ''}
        ${deal.source ? `<div class="deal-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg><span>${deal.source}</span></div>` : ''}
      </div>
      <div class="deal-card-footer">
        <div class="deal-assignees">${renderAvatars(deal.assignees)}</div>
        ${total > 0 ? `<div class="task-progress">
          <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
          <span class="task-progress-text">${done}/${total}</span>
        </div>` : ''}
      </div>
    `;

    // drag
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', deal.id);
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    // click → deal detail
    card.addEventListener('click', e => {
      if (e.target.closest('.deal-card-priority')) return;
      Modals.openDealDetail(deal.id);
    });

    return card;
  },
};
