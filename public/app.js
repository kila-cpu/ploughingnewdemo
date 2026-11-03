// NPA Administration wireframes: one page, hash-routed, all data in memory.
// Screens follow the old Django admin's layout (header, breadcrumbs, grouped
// sidebar, changelist + filter panel, long change forms) with a modern finish.
const D = window.SEED;
const A = {};
window.A = A;

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '€' + Number(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fdt = s => s ? new Date(s).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
const fd = s => s ? new Date(s).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
const now = () => new Date().toISOString();
const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);
const U = o => D.users.find(u => u.id === o.userId) || { username: '?', code: '', name: '' };
const orderById = id => D.orders.find(o => o.id === +id);
const catName = id => (D.CATEGORIES.find(c => c.id === +id) || {}).name || '–';
const formLabel = o => `${o.clientType || 'OU'} Form # ${o.id}, User: ${U(o).username}`;
const loc = o => !o.stand ? (o.area ? `${o.area} · stand TBC` : '–') : o.clientType === 'IN' ? `${o.venue} · ${o.block}${o.stand}` : `Row ${o.row} · Block ${o.block} · Stand ${o.stand}`;
const getp = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
const setp = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => { a[k] = a[k] ?? {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };
const daysAgo = s => (Date.now() - new Date(s)) / 864e5;
const DATE_OPTS = get => [
  ['today', 'Today', r => get(r) && new Date(get(r)).toDateString() === new Date().toDateString()],
  ['7', 'Past 7 days', r => get(r) && daysAgo(get(r)) <= 7],
  ['month', 'This month', r => get(r) && new Date(get(r)).getMonth() === new Date().getMonth() && new Date(get(r)).getFullYear() === new Date().getFullYear()],
  ['year', 'This year', r => get(r) && new Date(get(r)).getFullYear() === new Date().getFullYear()]];
const YN = [['yes', 'Yes'], ['no', 'No']];
const yn = (get) => YN.map(([v, l]) => [v, l, r => !!get(r) === (v === 'yes')]);

const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  group: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14h6M9 18h4"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  corner: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 10h7V3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  po: '<path d="M6 2h9l5 5v15H6z"/><path d="M9 13h6M9 17h6M9 9h2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  tree: '<path d="M12 22v-5"/><path d="M12 2 5 12h4l-3 5h12l-3-5h4z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', play: '<path d="m6 4 14 8-14 8z"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  euro: '<path d="M4 10h12M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12a7.9 7.9 0 0 0 7.8 8 7.7 7.7 0 0 0 5.2-2"/>',
  map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  hardhat: '<path d="M2 18h20M4 18v-3a8 8 0 0 1 16 0v3M10 7V5h4v2"/>',
  tractor: '<circle cx="7" cy="16" r="4"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M11 16h5M3.5 13V6h7l2 6h6.5a2 2 0 0 1 2 2v2"/><path d="M10.5 6V3"/>'
};
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
const yesNo = v => v ? `<span class="ic-yes" title="Yes">${ic('check', '')}</span>` : `<span class="ic-no" title="No">${ic('x', '')}</span>`;
const PILL = { 'Pending Review': 'orange', Pending: 'orange', Approved: 'green', Rejected: 'red', 'Not uploaded': 'grey', SUCCESS: 'green', INFO: 'blue', WARNING: 'orange', ERROR: 'red',
  New: 'blue', Confirmed: 'green', Delivered: 'grey', Allocated: 'green', Requested: 'orange', 'No Corner': 'grey', Bounced: 'red', Scheduled: 'blue' };
const pill = (s, cls) => `<span class="pill p-${cls || PILL[s] || 'grey'}">${esc(s)}</span>`;
const ctag = t => t === 'IN' ? '<span class="tag in">IN</span>' : t === 'OU' ? '<span class="tag ou">OU</span>' : '<span class="tag">–</span>';

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = ic('check') + esc(msg);
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
A.toast = toast;

function csv(name, headers, rows) {
  const e = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const text = [headers.map(e).join(',')].concat(rows.map(r => r.map(e).join(','))).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  toast('Downloaded ' + name);
}

// ---------- modal ----------
let onOk = null;
function modal(title, body, foot, wide) {
  A.close();
  const d = document.createElement('div');
  d.className = 'scrim';
  d.id = 'scrim';
  d.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="mh"><h3>${title}</h3><button onclick="A.close()">${ic('x')}</button></div><div class="mb" id="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
  d.addEventListener('mousedown', e => { if (e.target === d) A.close(); });
  document.body.appendChild(d);
}
A.close = () => { const s = document.getElementById('scrim'); if (s) s.remove(); };
function confirmBox(title, text, okLabel, fn, danger) {
  onOk = fn;
  modal(title, `<p style="margin:0">${text}</p>`, `<button class="btn" onclick="A.close()">Cancel</button><button class="btn ${danger ? 'danger' : 'pri'}" onclick="A.ok()">${okLabel}</button>`);
}
A.ok = () => { const f = onOk; onOk = null; A.close(); f && f(); };
A.fakeOpen = name => toast('Would open ' + name);

// ---------- navigation ----------
const pendingIns = () => D.ins.filter(r => r.status === 'Pending').length;
const toAllocate = () => D.orders.filter(o => o.submitted && !o.stand).length;
const pendingPO = () => D.pos.filter(p => p.status === 'Pending').length;
const NAV = [
  { items: [['Dashboard', '', 'home']] },
  { h: 'Authentication and Authorization', items: [['Groups', 'groups', 'group', 'groups/add'], ['Users', 'users', 'users', 'users/add', true]] },
  { h: 'Docs', items: [['Docs', 'docs', 'doc', 'docs/add']] },
  { h: 'Order', items: [['Order forms', 'orders', 'form', 'orders/add', true], ['Stand allocation', 'allocation', 'map', null, true, toAllocate], ['Insurance reviews', 'insurance', 'shield', null, true, pendingIns],
    ['Corner allocations', 'corners', 'corner', null, true], ['Exhibition spaces', 'spaces', 'grid'], ['Purchase orders', 'pos', 'po', 'pos/add', false, pendingPO],
    ['Payment processing logs', 'paylogs', 'card']] },
  { h: 'Woodbark', items: [['Woodbark orders', 'woodbark', 'tree', 'woodbark/add', true]] },
  { h: 'Emails', items: [['Compose email', 'emails/compose', 'send', null, true], ['Reminder configurations', 'emails/configs', 'mail', 'emails/config/add'],
    ['Reminder schedules', 'emails/schedules', 'clock'], ['Email logs', 'emails/logs', 'list']] },
  { h: 'Report builder', items: [['Reports', 'reports', 'chart', 'reports/add', true], ['Formats', 'formats', 'file']] },
  { h: 'Settings', items: [['Categories', 'settings/categories', 'tag', 'settings/categories/add'], ['Corner inventories', 'corners', 'corner'], ['Counties', 'settings/counties', 'pin'],
    ['Countries', 'settings/countries', 'globe'], ['Electricity and litter', 'settings/electricity', 'bolt'], ['Indoor dates', 'settings/indoor', 'cal'],
    ['Outdoor dates', 'settings/outdoor', 'cal'], ['System settings', 'settings/system', 'cog'], ['Text blocks', 'settings/text', 'text'], ['Woodbark rates', 'settings/woodbark', 'euro']] }];

let path = '';
function navHtml() {
  let best = '';
  NAV.forEach(g => g.items.forEach(([, p]) => { if (p && (path === p || path.startsWith(p + '/')) && p.length > best.length) best = p; }));
  if (path.startsWith('emails/config')) best = 'emails/configs';
  if (path === 'emails') best = 'emails/compose';
  const shown = new Set();
  return NAV.map(g => `<div class="navgrp">${g.h ? `<h6>${g.h}</h6>` : ''}${g.items.map(([l, p, icon, add, key, cnt]) => {
    const on = p === best && !(p === 'corners' && shown.has(p) ) && (p !== '' || path === '');
    if (on) shown.add(p);
    const n = cnt ? cnt() : 0;
    return `<a class="navi ${on ? 'on' : ''}" href="#/${p}">${ic(icon)}<span class="lbl">${l}</span>${key ? '<span class="key" title="Key area in the NPA brief"></span>' : ''}${n ? `<span class="cnt">${n}</span>` : ''}${add ? `<span class="add" onclick="event.preventDefault();event.stopPropagation();location.hash='#/${add}'">${ic('plus')}Add</span>` : ''}</a>`;
  }).join('')}</div>`).join('') + `<div class="sidefoot"><span class="key" style="width:6px;height:6px;border-radius:50%;background:var(--amber);display:inline-block"></span> Key areas from the NPA brief</div>`;
}

function shell(crumbs, body) {
  return `<header class="top">
    <button class="burger" onclick="document.body.classList.toggle('navopen')">${ic('menu')}</button>
    <a class="brand" href="#/"><span class="mark">${ic('tractor', '')}</span>NPA Administration <small>Event management</small></a>
    <span class="sp"></span>
    <span class="season">${ic('cal')} ${esc(D.settings.system.eventName.replace('National Ploughing Championships', 'Ploughing'))}</span>
    <div class="userlinks"><span class="hide-m">Welcome, <b>CRM_ADMIN</b></span><a class="hide-m" href="portal.html" target="_blank">View exhibitor portal</a><a class="hide-m" href="javascript:A.changePw()">Change password</a><a href="#/login">Log out</a><span class="avatar">CA</span></div>
  </header>
  <nav class="crumbs"><a href="#/">Home</a>${crumbs.map(([l, h]) => `<span class="sep">›</span>${h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`}`).join('')}</nav>
  <div class="shell"><aside class="side">${navHtml()}</aside><main>${body}</main></div>`;
}
A.changePw = () => modal('Change password', `<div class="fields one" style="padding:0">${F('Old password', 'x1', '', 'password')}${F('New password', 'x2', '', 'password')}${F('New password confirmation', 'x3', '', 'password')}</div>`,
  `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.close();A.toast('Password changed')">Change my password</button>`);

const head = (title, sub, acts = '') => `<div class="ph"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="acts">${acts}</div></div>`;
const btn = (label, onclick, cls = '', icon = '') => `<button class="btn ${cls}" onclick="${onclick}">${icon ? ic(icon) : ''}${label}</button>`;
const link = (label, href, cls = '', icon = '') => `<a class="btn ${cls}" href="${href}">${icon ? ic(icon) : ''}${label}</a>`;

// ---------- generic changelist ----------
const ui = {};
const lists = {};
const L = k => ui[k] || (ui[k] = { q: '', f: {}, sort: null, dir: 1, sel: new Set() });
A.go = (p, filters) => { const k = p.split('/')[0]; if (filters) { L(k).f = filters; L(k).q = ''; } location.hash = '#/' + p; };

function listView(c) {
  lists[c.key] = c;
  const s = L(c.key);
  const id = c.id || (r => r.id);
  let rows = c.rows.slice();
  if (s.q) { const q = s.q.toLowerCase(); rows = rows.filter(r => c.search.some(fn => String(fn(r) ?? '').toLowerCase().includes(q))); }
  (c.filters || []).forEach(f => {
    const v = s.f[f.k];
    if (v == null || v === '') return;
    const opt = f.opts.find(o => String(o[0]) === String(v));
    if (opt) rows = rows.filter(r => opt[2] ? opt[2](r) : String(f.get(r)) === String(v));
  });
  if (c.chips && s.f.__chip) { const ch = c.chips.find(x => x[0] === s.f.__chip); if (ch) rows = rows.filter(ch[2]); }
  if (s.sort != null && c.cols[s.sort]) {
    const g = c.cols[s.sort].sv || c.cols[s.sort].v;
    rows.sort((a, b) => { const x = g(a), y = g(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
  }
  c.visible = rows.map(r => String(id(r)));
  const selN = c.visible.filter(x => s.sel.has(x)).length;
  const allOn = rows.length && selN === rows.length;
  const active = s.q || Object.values(s.f).some(v => v);
  const th = c.cols.map((col, i) => `<th class="${col.num ? 'num' : ''} ${col.nosort ? 'nosort' : ''}" ${col.nosort ? '' : `onclick="A.sort('${c.key}',${i})"`}>${col.h}${s.sort === i ? `<span class="ar">${s.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
  const tr = rows.map(r => {
    const rid = String(id(r));
    return `<tr class="${s.sel.has(rid) ? 'sel' : ''}"><td class="cb"><input type="checkbox" ${s.sel.has(rid) ? 'checked' : ''} onchange="A.sel('${c.key}','${rid}',this.checked)"></td>${c.cols.map((col, i) => {
      let cell = col.html ? col.html(r) : esc(col.v(r));
      if (i === 0 && c.link) cell = `<a class="lnk" href="${c.link(r)}">${cell}</a>`;
      return `<td class="${col.num ? 'num' : ''}">${cell}</td>`;
    }).join('')}</tr>`;
  }).join('');
  const filt = (c.filters || []).length ? `<aside class="card filt ${ui._filtOpen ? 'open' : ''}"><div class="card-h" onclick="ui._filtOpen=!ui._filtOpen;this.parentNode.classList.toggle('open')"><h3>Filter${active ? ' · on' : ''}</h3>${active ? `<a href="javascript:A.clear('${c.key}')">Clear all</a>` : ''}</div><div class="fgs">${c.filters.map(f => `<div class="fg"><h5>By ${f.label}</h5>
      <a class="${!s.f[f.k] ? 'on' : ''}" href="javascript:A.f('${c.key}','${f.k}','')">All</a>${f.opts.map(o => `<a class="${String(s.f[f.k]) === String(o[0]) ? 'on' : ''}" href="javascript:A.f('${c.key}','${f.k}','${esc(String(o[0]).replace(/'/g, "\\'"))}')">${esc(o[1])}</a>`).join('')}</div>`).join('')}</div></aside>` : '';
  return `<div class="cl ${filt ? '' : 'nofilt'}"><div class="card" style="min-width:0">
    ${c.chips ? `<div class="chips"><span class="chip ${!s.f.__chip ? 'on' : ''}" onclick="A.f('${c.key}','__chip','')">${c.chipsAll || 'All dates'}</span>${c.chips.map(ch => `<span class="chip ${s.f.__chip === ch[0] ? 'on' : ''}" onclick="A.f('${c.key}','__chip','${ch[0]}')">${ch[1]}</span>`).join('')}</div>` : ''}
    <div class="toolbar"><div class="search">${ic('search')}<input id="q" placeholder="${c.searchPh || 'Search'}" value="${esc(s.q)}" oninput="A.q('${c.key}',this.value)"></div>
      ${c.nobulk ? '' : `<div class="actsel"><select class="inp" id="act-${c.key}"><option value="">Action: ————</option>${(c.bulk || []).map(([l], i) => `<option value="${i}">${l}</option>`).join('')}${c.nodelete ? '' : '<option value="del">Delete selected</option>'}</select><button class="btn sm" onclick="A.bulk('${c.key}')">Go</button></div>
      <span class="selcount">${selN} of ${rows.length} selected</span>`}${c.toolsRight ? `<span style="margin-left:auto" class="row">${c.toolsRight}</span>` : ''}</div>
    <div class="tbl-wrap"><table class="t"><thead><tr>${c.nobulk ? '' : `<th class="cb nosort"><input type="checkbox" ${allOn ? 'checked' : ''} onchange="A.selAll('${c.key}',this.checked)"></th>`}${th}</tr></thead><tbody>${c.nobulk ? tr.replace(/<td class="cb">.*?<\/td>/g, '') : tr}</tbody></table></div>
    ${rows.length ? '' : `<div class="empty">Nothing matches${active ? ` · <a href="javascript:A.clear('${c.key}')">clear search and filters</a>` : ''}</div>`}
    <div class="t-foot">${rows.length} ${c.noun || 'records'}${rows.length !== c.rows.length ? ` (of ${c.rows.length})` : ''}${c.foot ? ' · ' + c.foot(rows) : ''}</div>
  </div>${filt}</div>`;
}
A.q = (k, v) => { L(k).q = v; render(); const q = document.getElementById('q'); if (q) { q.focus(); q.setSelectionRange(v.length, v.length); } };
A.f = (k, fk, v) => { L(k).f[fk] = v; render(); };
A.clear = k => { L(k).q = ''; L(k).f = {}; render(); };
A.sort = (k, i) => { const s = L(k); s.dir = s.sort === i ? -s.dir : 1; s.sort = i; render(); };
A.sel = (k, id, on) => { const s = L(k).sel; on ? s.add(id) : s.delete(id); render(); };
A.selAll = (k, on) => { const s = L(k).sel; lists[k].visible.forEach(id => on ? s.add(id) : s.delete(id)); render(); };
A.bulk = k => {
  const c = lists[k], s = L(k), v = document.getElementById('act-' + k).value;
  const ids = c.visible.filter(x => s.sel.has(x));
  if (v === '') return toast('Choose an action first');
  if (!ids.length) return toast('Select at least one row first');
  if (v === 'del') return confirmBox('Delete selected?', `This removes ${ids.length} ${c.noun || 'records'}. This can't be undone.`, 'Yes, delete', () => {
    D[c.coll] = D[c.coll].filter(r => !ids.includes(String((c.id || (x => x.id))(r))));
    s.sel.clear(); render(); toast(`Deleted ${ids.length} ${c.noun || 'records'}`);
  }, true);
  c.bulk[+v][1](ids); s.sel.clear(); render();
};

// ---------- form helpers ----------
function F(label, name, val, type = 'text', o = {}) {
  let ctl;
  switch (type) {
    case 'checkbox':
      return `<label class="chk ${o.full ? 'full' : ''}" ${o.full ? 'style="grid-column:1/-1"' : ''}><input type="checkbox" name="${name}" ${val ? 'checked' : ''} ${o.on ? `onchange="${o.on}"` : ''}><div><b>${label}</b>${o.help ? `<span>${o.help}</span>` : ''}</div></label>`;
    case 'select':
      ctl = `<select class="inp" name="${name}" ${o.num ? 'data-num="1"' : ''} ${o.on ? `onchange="${o.on}"` : ''}>${o.opts.map(op => { const [v, l] = Array.isArray(op) ? op : [op, op]; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`; break;
    case 'textarea': ctl = `<textarea class="inp" name="${name}" rows="${o.rows || 3}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.on ? `oninput="${o.on}"` : ''}>${esc(val)}</textarea>`; break;
    case 'ro': ctl = `<div class="val">${o.html ?? esc(val)}</div>`; break;
    case 'file':
      ctl = `<div class="file">${ic('file')}<span class="n">${val ? `<a href="javascript:A.fakeOpen('${esc(val)}')">${esc(val)}</a>` : '<span class="dim">No file chosen</span>'}</span><label class="btn sm">${ic('upload')}${val ? 'Replace' : 'Choose file'}<input type="file" hidden onchange="A.pickFile(this,'${name}')"></label><input type="hidden" name="${name}" value="${esc(val)}"></div>`; break;
    case 'multi':
      ctl = `<div class="optchips" data-multi="${name}" ${o.num ? 'data-num="1"' : ''}>${o.opts.map(([v, l]) => `<label><input type="checkbox" data-v="${esc(v)}" ${(val || []).map(String).includes(String(v)) ? 'checked' : ''} ${o.on ? `onchange="${o.on}"` : ''}>${esc(l)}</label>`).join('')}</div>`; break;
    default:
      ctl = `<input class="inp" type="${type}" name="${name}" value="${esc(val)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.step ? `step="${o.step}"` : ''} ${o.on ? `oninput="${o.on}"` : ''} ${o.readonly ? 'readonly' : ''}>`;
  }
  return `<div class="f ${o.full ? 'full' : ''} ${type === 'ro' ? 'ro' : ''}"><label class="l">${label}</label>${ctl}${o.help ? `<div class="help">${o.help}</div>` : ''}</div>`;
}
A.pickFile = (inp, name) => {
  const f = inp.files[0];
  if (!f) return;
  const box = inp.closest('.file');
  box.querySelector('input[type=hidden]').value = f.name;
  box.querySelector('.n').innerHTML = `<b>${esc(f.name)}</b> <span class="dim">· ${Math.round(f.size / 1024)} KB · ready to upload</span>`;
};
function collect(root, obj) {
  root.querySelectorAll('[name]').forEach(el => {
    if (el.closest('[data-multi]')) return;
    let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? 0 : +el.value) : el.value;
    if (el.dataset.num) v = +v;
    setp(obj, el.name, v);
  });
  root.querySelectorAll('[data-multi]').forEach(m => {
    const vals = [...m.querySelectorAll('input:checked')].map(i => i.dataset.v);
    setp(obj, m.dataset.multi, m.dataset.num ? vals.map(Number) : vals);
  });
  return obj;
}
const sec = (id, title, inner, o = {}) => `<section class="card sec" id="s-${id}"><div class="card-h"><h3>${title}</h3>${o.note ? `<span class="note">${o.note}</span>` : ''}${o.right ? `<div class="r">${o.right}</div>` : ''}</div>${inner}</section>`;
const fields = (arr, cls = '') => `<div class="fields ${cls}">${arr.join('')}</div>`;
const jump = items => `<div class="jump">${items.map(([id, l]) => `<a href="javascript:A.jump('s-${id}')">${l}</a>`).join('')}</div>`;
A.jump = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
const savebar = (save, del, extra = '') => `<div class="savebar">${del ? `<button class="btn ghost-danger" onclick="${del}">${ic('trash')}Delete</button>` : ''}<span class="sp"></span>${extra}<button class="btn" onclick="${save}('add')">Save and add another</button><button class="btn" onclick="${save}('cont')">Save and continue editing</button><button class="btn pri" onclick="${save}('done')">${ic('check')}Save</button></div>`;

// Each change form edits a copy; it is written back only on Save.
let draft = null, draftKey = null, draftPath = null;
function useDraft(key, make) { if (draftKey !== key) { draft = make(); draftKey = key; } draftPath = path; return draft; }
const pushRecent = (icon, what, kind, href) => D.recent.unshift({ at: now(), icon, what, kind, href });
