// Features from NPA's "Database Wishlist": correspondence and call logging, change history,
// duplicate/shared entries, Big Red Cloud payments, security details, wristbands,
// trade pack addresses, credit notes, AutoCAD import/export and booking types.

const tbl = (head_, rows, empty) => rows.length ? `<div class="tbl-wrap"><table class="t"><thead><tr>${head_.map(h => `<th class="nosort">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<div class="empty" style="padding:22px">${empty}</div>`;

// ---------- change history ----------
// Field-level differences between the saved record and the edited copy.
function diff(before, after, pre = '') {
  const out = [];
  if (!before) return out;
  const skip = new Set(['history', 'isNew', 'grandTotal', 'pastYears']);
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (skip.has(k)) continue;
    const a = before[k], b = after[k], name = pre ? `${pre} ${k}` : k;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) out.push(...diff(a, b, name));
    else if (typeof a === 'string' && typeof b === 'string' && /^\d{4}-\d\d-\d\dT/.test(a) && a.slice(0, 10) === b.slice(0, 10)) continue;
    else if (JSON.stringify(a ?? '') !== JSON.stringify(b ?? '')) out.push([label(name), show(a), show(b)]);
  }
  return out;
}
const label = k => k.replace(/([A-Z])/g, ' $1').replace(/\./g, ' ').replace(/^./, c => c.toUpperCase()).toLowerCase().replace(/^./, c => c.toUpperCase());
const show = v => v === true ? 'Yes' : v === false ? 'No' : Array.isArray(v) ? v.join(', ') : v == null || v === '' ? '—' : String(v);
function logAudit(record, href, what, changes = []) { D.audit.unshift({ at: now(), who: 'CRM_ADMIN', record, href, what, changes }); }

function vHistory() {
  return shell([['Activity'], ['Change history']], head('Change history', 'Every change made in the backend: who changed what, when, and the old and new values.') + listView({
    key: 'audit', coll: 'audit', noun: 'changes', rows: D.audit, nobulk: true, nodelete: true, search: [a => a.record, a => a.who, a => a.what],
    cols: [{ h: 'When', v: a => a.at, html: a => fdt(a.at) }, { h: 'Who', v: a => a.who }, { h: 'Record', v: a => a.record, html: a => a.href ? `<a class="lnk" href="${a.href}">${esc(a.record)}</a>` : esc(a.record) },
      { h: 'Change', v: a => a.what, html: a => `${esc(a.what)}${a.changes.length ? `<div class="chg">${a.changes.slice(0, 5).map(([f, x, y]) => `<span><b>${esc(f)}</b> <s>${esc(x)}</s> → ${esc(y)}</span>`).join('')}</div>` : ''}`, nosort: true }],
    filters: [{ label: 'who', k: 'who', get: a => a.who, opts: [...new Set(D.audit.map(a => a.who))].map(w => [w, w]) },
      { label: 'record type', k: 'type', opts: [['order', 'Order forms', a => /Form #/.test(a.record)], ['user', 'Users', a => a.record.startsWith('User')], ['other', 'Settings & docs', a => !/Form #|^User/.test(a.record)]] },
      { label: 'when', k: 'd', opts: DATE_OPTS(a => a.at) }]
  }));
}

// ---------- correspondence & calls ----------
const KIND = { Call: ['phone', 'blue'], 'Email in': ['mail', 'green'], 'Email out': ['send', 'grey'], Note: ['edit', 'orange'] };
function corrItems(userId) {
  const u = D.users.find(x => x.id === userId);
  const mine = D.correspondence.filter(c => c.userId === userId);
  const emails = D.emailLogs.filter(l => l.orderId && orderById(l.orderId)?.userId === userId).map(l => ({ kind: 'Email out', at: l.at, who: 'System', subject: l.subject, body: `${l.kind}${l.type ? ' · ' + l.type : ''} to ${l.to}`, auto: true }));
  return [...mine, ...emails].sort((a, b) => b.at.localeCompare(a.at)).map(c => ({ ...c, u }));
}
const corrRow = c => `<div class="ra corr"><span class="dot k-${KIND[c.kind][1]}">${ic(KIND[c.kind][0], '')}</span><div style="flex:1;min-width:0">
  <div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(c.subject)}</b>${pill(c.kind + (c.dir ? ' · ' + c.dir : ''), KIND[c.kind][1])}${c.followUp ? pill('Follow up ' + fd(c.followUp), 'orange') : ''}</div>
  <small>${esc(c.body)}</small><small class="dim">${fdt(c.at)} · ${esc(c.who)}${c.u && c.showWho ? ` · <a href="#/users/${c.u.id}">${esc(c.u.name)}</a>` : ''}</small></div></div>`;
function corrSec(userId, orderId) {
  const items = corrItems(userId);
  return sec('correspondence', 'Correspondence', `<div class="card-b" style="padding-top:6px">${items.length ? items.slice(0, 12).map(corrRow).join('') : '<div class="empty">Nothing logged yet.</div>'}
    ${items.length > 12 ? `<a class="small" href="#/correspondence?u=${userId}">See all ${items.length} →</a>` : ''}</div>`,
    { right: btn('Log a call', `A.corrModal(${userId},'Call',${orderId || 'null'})`, 'sm', 'phone') + ' ' + btn('Add email', `A.corrModal(${userId},'Email in',${orderId || 'null'})`, 'sm', 'mail') + ' ' + btn('Add note', `A.corrModal(${userId},'Note',${orderId || 'null'})`, 'sm', 'edit') });
}
function vCorr(q) {
  const params = new URLSearchParams(q || '');
  const uid = +params.get('u') || null;
  const exhibitors = D.users.filter(u => !u.staff);
  const items = (uid ? corrItems(uid) : D.correspondence.map(c => ({ ...c, u: D.users.find(x => x.id === c.userId) }))).map(c => ({ ...c, showWho: true }));
  const st = ui.corr = ui.corr || { kind: '', who: '', q: '' };
  const rows = items.filter(c => (!st.kind || c.kind === st.kind) && (!st.who || c.who === st.who) && (!st.q || (c.subject + c.body + (c.u?.name || '')).toLowerCase().includes(st.q.toLowerCase())));
  const due = D.correspondence.filter(c => c.followUp).sort((a, b) => a.followUp.localeCompare(b.followUp));
  return shell([['Activity'], ['Correspondence & calls']], head('Correspondence & calls', 'One shared place for the team to log calls, file emails and leave notes against an exhibitor. Everyone sees the same history.',
      btn('Log a call', `A.corrModal(${uid || 'null'},'Call')`, 'pri', 'phone') + btn('Add email', `A.corrModal(${uid || 'null'},'Email in')`, '', 'mail') + btn('Add note', `A.corrModal(${uid || 'null'},'Note')`, '', 'edit')) + `
    <div class="cl nofilt" style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start">
      <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px"><h3>${uid ? esc(D.users.find(x => x.id === uid)?.name) : 'Everything logged'}</h3>
        <div class="r row" style="gap:6px;flex-wrap:wrap">
          <select class="inp" style="width:auto;padding:6px 28px 6px 10px" onchange="location.hash='#/correspondence'+(this.value?'?u='+this.value:'')"><option value="">All exhibitors</option>${exhibitors.map(u => `<option value="${u.id}" ${u.id === uid ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
          ${['', 'Call', 'Email in', 'Email out', 'Note'].map(k => `<button class="chip ${st.kind === k ? 'on' : ''}" onclick="ui.corr.kind='${k}';render()">${k || 'All'}</button>`).join('')}</div></div>
        <div style="padding:0 18px 10px"><input class="inp" placeholder="Search subject, notes or company" value="${esc(st.q)}" onchange="ui.corr.q=this.value;render()"></div>
        <div class="card-b" style="padding-top:0">${rows.length ? rows.slice(0, 60).map(corrRow).join('') : '<div class="empty">Nothing matches.</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Follow-ups due</h3><span class="r muted small">${due.length}</span></div><div class="card-b" style="padding-top:4px">
        ${due.length ? due.map(c => { const u = D.users.find(x => x.id === c.userId); return `<div class="ra"><span class="dot k-orange">${ic('clock', '')}</span><div style="flex:1"><b>${fd(c.followUp)}</b> · <a href="#/users/${u.id}">${esc(u.name)}</a><small>${esc(c.subject)}</small></div></div>`; }).join('') : '<div class="empty">Nothing due.</div>'}</div></div>
    </div>`);
}
A.corrModal = (userId, kind, orderId) => {
  const ex = D.users.filter(u => !u.staff);
  modal(kind === 'Call' ? 'Log a call' : kind === 'Note' ? 'Add a note' : 'Add an email', `<div id="cform" class="grid" style="gap:14px">
    ${F('Exhibitor', 'userId', userId || ex[0].id, 'select', { num: true, opts: ex.map(u => [u.id, `${u.name} (${u.username})`]) })}
    ${kind === 'Call' ? F('Direction', 'dir', 'Incoming', 'select', { opts: ['Incoming', 'Outgoing'] }) : kind === 'Note' ? '' : F('Direction', 'kind', 'Email in', 'select', { opts: [['Email in', 'Received from the exhibitor'], ['Email out', 'Sent to the exhibitor']] })}
    ${F(kind === 'Note' ? 'Title' : 'Subject', 'subject', '')}${F(kind === 'Call' ? 'What was discussed' : kind === 'Note' ? 'Note' : 'Email text', 'body', '', 'textarea')}
    ${kind === 'Note' ? '' : F('Follow up on', 'followUp', '', 'date', { help: 'Optional. Shows in Follow-ups due.' })}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveCorr('${kind}',${orderId || 'null'})">${ic('check')}Save</button>`);
};
A.saveCorr = (kind, orderId) => {
  const v = collect(document.getElementById('cform'), {});
  if (!v.subject.trim()) return toast('Add a subject');
  D.correspondence.unshift({ id: D.correspondence.length + 1, userId: v.userId, orderId, kind: v.kind || kind, dir: v.dir || '', at: now(), who: 'CRM_ADMIN', subject: v.subject, body: v.body, followUp: v.followUp || '' });
  A.close(); toast(`${kind === 'Call' ? 'Call' : kind === 'Note' ? 'Note' : 'Email'} logged`); const y = scrollY; render(); scrollTo(0, y);
};

// ---------- duplicate & shared entries ----------
const norm = s => (s || '').toLowerCase().replace(/\b(ltd|limited|teo|the)\b/g, '').replace(/[^a-z0-9]/g, '');
function dupPairs() {
  const ex = D.users.filter(u => !u.staff), pairs = [];
  for (let i = 0; i < ex.length; i++) for (let j = i + 1; j < ex.length; j++) {
    const a = ex[i], b = ex[j], why = [];
    if (norm(a.name) === norm(b.name)) why.push('Same company name');
    if (a.email === b.email) why.push('Same email');
    if (a.landline === b.landline) why.push('Same landline');
    if (why.length) pairs.push({ key: [a.id, b.id].sort().join('-'), a, b, why });
  }
  return pairs;
}
function vDups() {
  const pairs = dupPairs();
  const dec = k => D.dupDecisions.find(d => d.key === k);
  const open = pairs.filter(p => !dec(p.key));
  const card = u => `<div class="dupc"><b><a href="#/users/${u.id}">${esc(u.name)}</a></b><span class="mono small">${esc(u.username)}</span><small>${esc(u.email)}<br>${esc(u.landline)} · last login ${fd(u.lastLogin)}<br>${D.orders.filter(o => o.userId === u.id).length} order form(s)</small></div>`;
  return shell([['Activity'], ['Duplicate & shared entries']], head('Duplicate & shared entries', 'Exhibitors entered more than once. Record each pair as a duplicate to merge, as two companies sharing a stand, or as not a match.') + `
    <div class="grid g4" style="margin-bottom:16px"><div class="card kpi"><div class="k">${ic('users')}Possible duplicates</div><div class="v">${open.length}</div><div class="s">waiting for a decision</div></div>
      <div class="card kpi"><div class="k">${ic('check')}Recorded</div><div class="v">${D.dupDecisions.length}</div><div class="s">merged, shared or not a match</div></div></div>
    ${open.map(p => `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>${p.why.map(w => pill(w, 'orange')).join(' ')}</h3></div><div class="card-b">
      <div class="duppair">${card(p.a)}<span class="vs">${ic('copy')}</span>${card(p.b)}</div>
      <div class="row wrap" style="gap:8px;margin-top:14px">${btn(`Merge into ${esc(p.a.username)}`, `A.dupDecide('${p.key}','Merged',${p.a.id},${p.b.id})`, 'pri', 'check')}${btn('Record as shared stand', `A.dupDecide('${p.key}','Shared stand',${p.a.id},${p.b.id})`, '', 'users')}${btn('Not a duplicate', `A.dupDecide('${p.key}','Not a duplicate',${p.a.id},${p.b.id})`, '', 'x')}</div></div></div>`).join('') || '<div class="card empty" style="padding:40px">No possible duplicates left to review.</div>'}
    ${D.dupDecisions.length ? `<div class="card"><div class="card-h"><h3>Recorded decisions</h3></div>${tbl(['Exhibitors', 'Decision', 'By', 'When'], D.dupDecisions.map(d => `<tr><td>${esc(d.names)}</td><td>${pill(d.decision, d.decision === 'Merged' ? 'green' : d.decision === 'Shared stand' ? 'blue' : 'grey')}</td><td>${esc(d.who)}</td><td>${fdt(d.at)}</td></tr>`), '')}</div>` : ''}`);
}
A.dupDecide = (key, decision, aId, bId) => {
  const a = D.users.find(u => u.id === aId), b = D.users.find(u => u.id === bId);
  D.dupDecisions.unshift({ key, decision, names: `${a.username} / ${b.username}`, who: 'CRM_ADMIN', at: now() });
  if (decision === 'Merged') { D.orders.filter(o => o.userId === bId).forEach(o => o.userId = aId); D.correspondence.filter(c => c.userId === bId).forEach(c => c.userId = aId); b.active = false; b.mergedInto = a.username; }
  if (decision === 'Shared stand') D.orders.filter(o => o.userId === aId).forEach(o => o.sharingWith = o.sharingWith || b.name);
  logAudit(`User ${a.username}`, '#/users/' + aId, decision === 'Merged' ? `Merged ${b.username} into ${a.username}` : `Recorded ${b.username} as ${decision.toLowerCase()}`);
  toast(decision === 'Merged' ? `${b.username} merged into ${a.username} and deactivated` : `Recorded as ${decision.toLowerCase()}`); render();
};

// ---------- payments from Big Red Cloud ----------
function brcBlock(o) {
  const rows = D.brc.filter(p => p.orderId === o.id);
  const paid = sum(rows, p => p.amount);
  return `<div class="card-h" style="border-top:1px solid var(--line-2);background:var(--brand-50)"><h3 style="color:var(--brand-800);text-transform:uppercase;font-size:12px;letter-spacing:.7px">Payments from Big Red Cloud</h3><span class="r small muted">${money(paid)} paid · ${money(Math.max(0, o.grandTotal - paid - sum(o.credits || [], c => c.amount)))} outstanding</span></div>
    ${tbl(['Date', 'Big Red Cloud ref', 'Method', 'Amount'], rows.map(p => `<tr><td>${fd(p.at)}</td><td class="mono">${esc(p.ref)}</td><td>${esc(p.method)}</td><td class="num">${money(p.amount)}</td></tr>`), 'No payments synced from Big Red Cloud yet')}`;
}
function vPayments() {
  const unmatched = D.brc.filter(p => p.status === 'Unmatched');
  const last = D.settings.brcSync || '2026-11-03T07:00:00.000Z';
  return shell([['Order'], ['Payments (Big Red Cloud)']], head('Payments (Big Red Cloud)', 'Every payment recorded in Big Red Cloud flows into the booking system and is matched to its order form, so balances are always up to date.',
      btn('Sync now', 'A.brcSync()', 'pri', 'history')) + `
    <div class="banner ok">${ic('check')}<div>Connected to Big Red Cloud. Last sync <b>${fdt(last)}</b>. Payments match on account code; anything that can't be matched waits below.</div></div>
    ${unmatched.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Needs matching</h3><span class="r">${pill(unmatched.length + ' unmatched', 'orange')}</span></div>
      ${tbl(['Date', 'Big Red Cloud ref', 'Account code', 'Amount', 'Match to order'], unmatched.map(p => `<tr><td>${fd(p.at)}</td><td class="mono">${esc(p.ref)}</td><td>${esc(p.account) || '<span class="dim">blank</span>'}</td><td class="num">${money(p.amount)}</td>
        <td><select class="inp" style="width:260px;padding:6px 8px" onchange="A.brcMatch(${p.id},this.value)"><option value="">Choose an order form…</option>${D.orders.filter(o => o.submitted).map(o => `<option value="${o.id}" ${U(o).code === p.account ? 'selected' : ''}>${esc(formLabel(o))} · ${esc(o.company.name)}</option>`).join('')}</select></td></tr>`), '')}</div>` : ''}` +
    listView({ key: 'brc', coll: 'brc', noun: 'payments', rows: D.brc.filter(p => p.status === 'Matched'), nobulk: true, nodelete: true, search: [p => p.ref, p => p.account, p => orderById(p.orderId)?.company.name],
      cols: [{ h: 'Date', v: p => p.at, html: p => fd(p.at) }, { h: 'Big Red Cloud ref', v: p => p.ref, html: p => `<span class="mono">${esc(p.ref)}</span>` }, { h: 'Account', v: p => p.account },
        { h: 'Order form', v: p => p.orderId, html: p => `<a class="lnk" href="#/orders/${p.orderId}">${esc(formLabel(orderById(p.orderId)))}</a>` }, { h: 'Company', v: p => orderById(p.orderId)?.company.name },
        { h: 'Method', v: p => p.method }, { h: 'Amount', v: p => p.amount, html: p => money(p.amount), num: true }],
      filters: [{ label: 'method', k: 'm', get: p => p.method, opts: ['Stripe', 'Bank transfer', 'Card', 'Cheque'].map(x => [x, x]) }, { label: 'date', k: 'd', opts: DATE_OPTS(p => p.at) }],
      foot: rows => `${rows.length} payments · ${money(sum(rows, p => p.amount))}` }));
}
A.brcSync = () => {
  const o = D.orders.filter(x => x.submitted && !x.pay.confirmed)[0];
  if (o) D.brc.unshift({ id: D.brc.length + 1, ref: 'BRC-' + (49100 + D.brc.length), at: now(), account: U(o).code, amount: +(o.grandTotal / 2).toFixed(2), method: 'Bank transfer', orderId: o.id, status: 'Matched' });
  D.settings.brcSync = now(); toast(o ? `Synced: 1 new payment matched to ${formLabel(o)}` : 'Synced: no new payments'); render();
};
A.brcMatch = (id, orderId) => { if (!orderId) return; const p = D.brc.find(x => x.id === id); p.orderId = +orderId; p.status = 'Matched'; logAudit(p.ref, '#/payments', `Matched to ${formLabel(orderById(+orderId))}`); toast(`${p.ref} matched to ${formLabel(orderById(+orderId))}`); render(); };

// ---------- order form sections ----------
function tradePackSec(o) {
  const tp = o.tradePack || {};
  return sec('tradepack', 'Trade pack address', fields([
    F('Send the trade pack to a different address', 'tradePack.alt', tp.alt, 'checkbox', { full: true, on: 'A.orderLive()', help: 'Otherwise it goes to the company address above.' }),
    ...(tp.alt ? [F('For the attention of', 'tradePack.attn', tp.attn), F('Address', 'tradePack.addr1', tp.addr1), F('Town / City', 'tradePack.city', tp.city), F('County', 'tradePack.county', tp.county, 'select', { opts: D.COUNTIES }), F('Eircode / Postcode', 'tradePack.eircode', tp.eircode)] : [])], 'three'));
}
function securitySec(o) {
  const s = o.security || {};
  return sec('security', 'Security details', fields([
    F('Status', 'security.status', s.status, 'select', { opts: ['Not provided', 'Submitted', 'Confirmed'], help: 'Set to Confirmed and the exhibitor stops getting the Security Details reminder.' }),
    F('Security company', 'security.company', s.company), F('Contact name', 'security.contact', s.contact), F('Contact number', 'security.phone', s.phone),
    F('Number of security staff', 'security.staff', s.staff, 'number'), F('Uploaded file', '', '', 'ro', { html: s.file ? `<a href="javascript:A.fakeOpen('${esc(s.file)}')">${esc(s.file)}</a>` : '<span class="dim">Not uploaded yet</span>' })], 'three'),
    { right: s.status === 'Submitted' ? btn('Confirm details', `A.secConfirm(${o.id})`, 'sm ok', 'check') : '' });
}
A.secConfirm = id => { draft.security.status = 'Confirmed'; const o = orderById(id); o.security.status = 'Confirmed'; logAudit(formLabel(o), '#/orders/' + id, 'Confirmed security details', [['Security status', 'Submitted', 'Confirmed']]); toast('Security details confirmed · reminders stopped'); const y = scrollY; render(); scrollTo(0, y); };
function wristbandSec(o) {
  const w = o.wristbands || { included: 0, extra: 0 };
  return sec('wristbands', 'Wristbands', fields([
    F('Included with the stand', 'wristbands.included', w.included, 'number'), F('Extra wristbands bought', 'wristbands.extra', w.extra, 'number', { help: `${money(D.settings.wristbandPrice)} each, bought and paid for through Future Ticketing` }),
    F('Total wristbands', '', '', 'ro', { html: `<b>${(+w.included || 0) + (+w.extra || 0)}</b> <span class="dim small">· ${money((+w.extra || 0) * D.settings.wristbandPrice)} paid via Future Ticketing</span>` })], 'three'),
    { right: '<span class="pill p-blue nodot">Linked to Future Ticketing</span>' });
}
function creditsBlock(o) {
  const cr = o.credits || [];
  return `<div style="padding:0 18px 16px"><div class="muted small" style="font-weight:600;margin:4px 0 8px">Credit notes & statements <span class="dim">(also shown on the exhibitor's dashboard)</span></div>
    ${tbl(['Document', 'Date', 'Reason', 'Amount'], [
      ...cr.map(c => `<tr><td><a href="javascript:A.fakeOpen('${c.id}.pdf')">${c.id}</a> ${pill('Credit note', 'blue')}</td><td>${fd(c.at)}</td><td>${esc(c.reason)}</td><td class="num">−${money(c.amount)}</td></tr>`),
      ...(o.submitted ? [`<tr><td><a href="javascript:A.fakeOpen('statement_${o.id}.pdf')">Statement of account</a> ${pill('Statement', 'grey')}</td><td>${fd(now())}</td><td>Invoices, payments and credits to date</td><td class="num">${money(Math.max(0, o.grandTotal - sum(D.brc.filter(p => p.orderId === o.id), p => p.amount) - sum(cr, c => c.amount)))} due</td></tr>`] : [])], 'No credit notes or statements yet')}</div>`;
}
A.creditModal = id => modal('Issue credit note', `<div id="crform" class="grid" style="gap:14px">${F('Amount (€)', 'amount', '', 'number')}${F('Reason', 'reason', '', 'text', { ph: 'e.g. Reduced frontage' })}</div>`,
  `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveCredit(${id})">${ic('check')}Issue and email</button>`);
A.saveCredit = id => {
  const v = collect(document.getElementById('crform'), {});
  if (!(v.amount > 0)) return toast('Enter an amount');
  const o = orderById(id), c = { id: 'CN-' + (2800 + D.orders.reduce((n, x) => n + (x.credits || []).length, 0)), at: now(), amount: v.amount, reason: v.reason || 'Credit' };
  o.credits.push(c); draft.credits = structuredClone(o.credits);
  logAudit(formLabel(o), '#/orders/' + id, `Issued credit note ${c.id} for ${money(c.amount)}`);
  A.close(); toast(`${c.id} issued and emailed to ${o.account.email}`); const y = scrollY; render(); scrollTo(0, y);
};

// ---------- AutoCAD ----------
// Stand numbers come in from the site map drawing (a Data Extraction CSV or DXF from AutoCAD)
// and go back out as a CSV the drawing's attribute blocks can be updated from.
A.cadImport = () => {
  const todo = D.orders.filter(o => o.submitted && !o.stand && o.area && o.clientType === 'OU').slice(0, 6);
  const rows = todo.map((o, i) => ({ id: o.id, area: o.area, row: String(10 + i), stand: String(200 + i * 4), frontage: o.frontage }));
  A._cad = rows;
  modal('Import stand numbers from AutoCAD', `<p class="muted" style="margin:0 0 12px">Upload the site map as a <b>DXF</b>, or the <b>Data Extraction CSV</b> from AutoCAD. Each stand block's attributes (area, row, stand number, frontage) are read and matched to bookings in the same area with the same frontage.</p>
    ${F('Drawing or CSV', 'cad', 'Ploughing2027_SiteMap_v4.dxf', 'file')}
    <div class="muted small" style="margin:14px 0 6px;font-weight:600">Preview · ${rows.length} stands matched</div>
    ${tbl(['Booking', 'Area', 'Row', 'Stand', 'Frontage'], rows.map(r => `<tr><td>${esc(formLabel(orderById(r.id)))}</td><td>${esc(r.area)}</td><td>${r.row}</td><td>${r.stand}</td><td>${r.frontage}m</td></tr>`), 'Nothing to match')}`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.cadApply()">${ic('check')}Apply ${rows.length} stand numbers</button>`, true);
};
A.cadApply = () => { A._cad.forEach(r => { const o = orderById(r.id); o.row = r.row; o.stand = r.stand; o.history.push({ at: now(), who: 'CRM_ADMIN', what: 'Stand number imported from AutoCAD' }); }); logAudit('Stand allocation', '#/allocation', `Imported ${A._cad.length} stand numbers from AutoCAD`); A.close(); toast(`${A._cad.length} stand numbers imported from the drawing`); render(); };
A.cadExport = () => csv('stands-for-autocad.csv', ['AREA', 'ROW', 'STAND', 'COMPANY', 'SIGNAGE', 'FRONTAGE_M', 'DEPTH_M'],
  D.orders.filter(o => o.submitted && o.stand).map(o => [o.area, o.row || o.block, o.stand, o.company.name, o.company.signage, o.frontage, o.clientType === 'IN' ? 3 : o.is18m ? 18 : 9]));

// ---------- settings: booking types and insurance criteria ----------
function vSettingsX(pg) {
  const s = D.settings, crumbs = [['Settings', '#/settings'], [pg === 'bookings' ? 'Booking types & prices' : 'Insurance criteria']];
  if (pg === 'bookings') return shell(crumbs, head('Booking types & prices', 'What exhibitors can book online, and the price of each. Prices can be changed at any time and apply to new bookings straight away.') + `
    <div class="card"><div id="form">${tbl(['Booking type', 'Bookable online', 'Price', 'Unit'], s.bookingTypes.map((b, i) => `<tr><td><b>${esc(b.name)}</b></td>
      <td><label class="toggle"><input type="checkbox" name="b${i}.online" ${b.online ? 'checked' : ''}><span></span></label></td>
      <td>${b.price == null ? `<a href="#/settings/${b.k}">Set in ${b.k === 'outdoor' ? 'Outdoor' : 'Indoor'} dates →</a>` : `<input class="inp" type="number" step="0.01" style="width:120px" name="b${i}.price" value="${b.price}">`}</td><td class="muted">${esc(b.unit || 'by booking date')}</td></tr>`), '')}
      <div class="fields three" style="border-top:1px solid var(--line-2)">${F('Extra wristband price', 'wristbandPrice', s.wristbandPrice, 'number', { step: '0.01', help: 'Charged through Future Ticketing.' })}</div></div></div>
    <div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveBookingTypes()">${ic('check')}Save</button></div>`);
  return shell(crumbs, head('Insurance criteria', 'What reviewers check every insurance document against. Each check is tied to the rejection reason used when it fails.', btn('Add criterion', 'A.addCrit()', '', 'plus')) + `
    <div class="card"><div id="form">${tbl(['Check', 'Rejection reason if it fails', ''], s.insuranceCriteria.map((c, i) => `<tr><td><input class="inp" name="c${i}.check" value="${esc(c.check)}"></td>
      <td><select class="inp" name="c${i}.reason">${REASONS.map(r => `<option ${r === c.reason ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></td><td>${btn('', `D.settings.insuranceCriteria.splice(${i},1);render()`, 'sm ghost-danger', 'trash')}</td></tr>`), 'No criteria yet')}</div></div>
    <div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveCrit()">${ic('check')}Save</button></div>`);
}
A.saveBookingTypes = () => {
  const v = collect(document.getElementById('form'), {});
  D.settings.bookingTypes.forEach((b, i) => { const n = v['b' + i] || {}; const before = b.price; b.online = !!n.online; if (b.price != null) b.price = n.price; if (before !== b.price) logAudit(`Price: ${b.name}`, '#/settings/bookings', 'Changed price', [['Price', money(before), money(b.price)]]); });
  D.settings.wristbandPrice = v.wristbandPrice; toast('Booking types and prices saved'); render();
};
A.addCrit = () => { D.settings.insuranceCriteria.push({ check: 'New check', reason: REASONS[REASONS.length - 1] }); render(); };
A.saveCrit = () => { const v = collect(document.getElementById('form'), {}); D.settings.insuranceCriteria = Object.keys(v).sort((a, b) => +a.slice(1) - +b.slice(1)).map(k => v[k]); toast('Insurance criteria saved'); render(); };
