/* ── UTILS ── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const STAGES = [
  { key: 'MQL',      label: 'MQL',       color: '#6366F1' },
  { key: 'SAL',      label: 'SAL',       color: '#F59E0B' },
  { key: 'SQL',      label: 'SQL',       color: '#3B82F6' },
  { key: 'CONTRACT', label: 'CONTRACT',  color: '#8B5CF6' },
  { key: 'CUS',      label: 'CUS / Won', color: '#10B981' },
  { key: 'FAIL',     label: 'Lost',      color: '#94A3B8' },
];

const AVATAR_COLORS = ['#6366F1','#F59E0B','#3B82F6','#8B5CF6','#10B981','#EF4444','#EC4899','#14B8A6'];
function avatarColor(name) {
  let h = 0; for (let c of (name||'?')) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

function fmtMoney(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (n >= 1e6) return (n/1e6).toFixed(0) + ' triệu';
  return n.toLocaleString('vi-VN') + 'đ';
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function fmtRelative(iso) {
  if (!iso) return '';
  const diff = new Date(iso) - new Date();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  return `${days} ngày nữa`;
}

function daysUntil(iso) {
  if (!iso) return Infinity;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

function isOverdue(iso) { return iso && daysUntil(iso) < 0; }
function isSoon(iso)    { const d = daysUntil(iso); return d >= 0 && d <= 3; }

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function showToast(msg, type = 'default', duration = 3000) {
  const c = document.getElementById('toast-container');
  const t = el('div', `toast ${type}`, msg);
  c.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

function openModal(content, wide = false) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  box.className = 'modal-box' + (wide ? ' wide' : '');
  box.innerHTML = content;
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-box').innerHTML = '';
}

function renderAvatars(assignees) {
  if (!assignees || !assignees.length) return '<span class="text-muted">—</span>';
  return assignees.map(a =>
    `<div class="avatar" style="background:${avatarColor(a)}" title="${a}">${initials(a)}</div>`
  ).join('');
}

function renderTagsInput(containerId, inputId, initial = []) {
  const wrap  = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  let tags = [...initial];

  function refresh() {
    wrap.querySelectorAll('.tag-chip').forEach(e => e.remove());
    tags.forEach(tag => {
      const chip = el('span', 'tag-chip', `${tag}<span class="tag-chip-remove">×</span>`);
      chip.querySelector('.tag-chip-remove').onclick = () => { tags = tags.filter(t => t !== tag); refresh(); };
      wrap.insertBefore(chip, input);
    });
  }

  input.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      const v = input.value.trim().replace(/,$/, '');
      if (v && !tags.includes(v)) { tags.push(v); Storage.addContact(v); }
      input.value = '';
      refresh();
    }
    if (e.key === 'Backspace' && !input.value && tags.length) {
      tags.pop(); refresh();
    }
  });

  refresh();

  return { getTags: () => tags, setTags: (t) => { tags = [...t]; refresh(); } };
}

// Datalist autocomplete helper
function setupAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;
  const contacts = Storage.getContacts();
  list.innerHTML = contacts.map(c => `<option value="${c}">`).join('');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
