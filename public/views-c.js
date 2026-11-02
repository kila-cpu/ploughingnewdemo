// Emails, reports, settings, login, and the router.

// ---------- emails ----------
const compose = { aud: 'all', venue: D.VENUES[0], cat: D.CATEGORIES[0].id, subject: '', body: 'Dear {first_name},\n\n\n\nKind regards,\nNPA Exhibitor Team', doc: '', ids: [] };
const AUD = {
  all: ['Every exhibitor with an order form', () => D.orders],
  submitted: ['Submitted bookings only', () => D.orders.filter(o => o.submitted)],
  indoor: ['Indoor exhibitors', () => D.orders.filter(o => o.clientType === 'IN')],
  outdoor: ['Outdoor exhibitors', () => D.orders.filter(o => o.clientType === 'OU')],
  venue: ['One indoor venue…', () => D.orders.filter(o => o.venue === compose.venue)],
  category: ['One category…', () => D.orders.filter(o => o.categories.includes(+compose.cat))],
  unpaid: ['Unpaid balances', () => D.orders.filter(o => o.submitted && !o.pay.confirmed)],
  insurance: ['Insurance missing or rejected', () => D.orders.filter(o => o.submitted && o.insuranceStatus !== 'Approved')],
  incomplete: ['Started but not submitted', () => D.orders.filter(o => !o.submitted)],
  woodbark: ['Exhibitors with a woodbark order', () => D.orders.filter(o => D.woodbark.some(w => w.userId === o.userId))],
  selected: ['Selected order forms', () => D.orders.filter(o => compose.ids.includes(o.id))]
};
const REM = { 'Unpaid Deposits': o => o.submitted && !o.pay.confirmed, 'Insurance Documents': o => o.submitted && o.insuranceStatus !== 'Approved', 'Incomplete Bookings': o => !o.submitted, 'Final Payment Deadlines': o => o.submitted && !o.pay.full, 'Pending Documents': o => o.submitted && !o.insuranceFile };
const merge = (t, o) => !o ? t : t.replace(/{first_name}/g, o.account.first).replace(/{company}/g, o.company.name).replace(/{order_number}/g, o.id)
  .replace(/{balance_due}/g, money(o.pay.confirmed ? 0 : o.grandTotal)).replace(/{stand}/g, loc(o)).replace(/{username}/g, U(o).username);

function emailTabs(tab) {
  const t = [['compose', 'Compose', 'send'], ['configs', 'Reminder configurations', 'mail', D.emailConfigs.length], ['schedules', 'Reminder schedules', 'clock', D.schedules.length], ['logs', 'Email logs', 'list', D.emailLogs.length]];
  return `<div class="tabs">${t.map(([k, l, i, n]) => `<a class="${tab === k ? 'on' : ''}" href="#/emails/${k}">${ic(i)}${l}${n != null ? `<span class="cnt">${n}</span>` : ''}</a>`).join('')}</div>`;
}
function vEmails(tab = 'compose') {
  const crumbs = [['Emails'], [{ compose: 'Compose email', configs: 'Reminder configurations', schedules: 'Reminder schedules', logs: 'Email logs' }[tab]]];
  if (tab === 'compose') {
    const rec = AUD[compose.aud][1]();
    const first = rec[0];
    return shell(crumbs, head('Emails', 'Send a one-off email to a group of exhibitors, or manage the automatic reminders.') + emailTabs(tab) + `
      <div class="grid" style="grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start" id="cmpgrid">
        <div class="card"><div class="card-h"><h3>New email</h3></div><div class="card-b grid" style="gap:14px" id="cmp">
          ${F('Send to', 'aud', compose.aud, 'select', { opts: Object.entries(AUD).filter(([k]) => k !== 'selected' || compose.ids.length).map(([k, [l]]) => [k, l]), on: 'A.cmp(true)' })}
          ${compose.aud === 'venue' ? F('Venue', 'venue', compose.venue, 'select', { opts: D.VENUES, on: 'A.cmp(true)' }) : ''}
          ${compose.aud === 'category' ? F('Category', 'cat', compose.cat, 'select', { opts: D.CATEGORIES.map(c => [c.id, c.name]), on: 'A.cmp(true)' }) : ''}
          <div class="banner" style="margin:0">${ic('users')}<div><b>${rec.length} recipients</b> · ${esc(AUD[compose.aud][0])}${rec.length ? ` — ${rec.slice(0, 3).map(o => esc(o.company.name)).join(', ')}${rec.length > 3 ? ` and ${rec.length - 3} more` : ''}` : ''}</div></div>
          ${F('Subject', 'subject', compose.subject, 'text', { ph: 'e.g. Ploughing 2027 – indoor floor plans now available', on: 'A.cmp()' })}
          <div class="f"><label class="l">Message</label><textarea class="inp" name="body" rows="9" oninput="A.cmp()" id="cbody">${esc(compose.body)}</textarea>
            <div class="row wrap" style="gap:6px;margin-top:8px"><span class="muted small">Insert:</span>${['first_name', 'company', 'order_number', 'stand', 'balance_due', 'username'].map(k => `<button class="chip" type="button" onclick="A.tagIns('{${k}}')">{${k}}</button>`).join('')}</div></div>
          ${F('Attach a doc', 'doc', compose.doc, 'select', { opts: [['', '— None —'], ...D.docs.map(d => [d.file, d.title])], on: 'A.cmp()' })}
          <div class="row wrap">${btn('Send test to me', "A.toast('Test sent to crm_admin@npa.example')", '', 'mail')}<span class="sp" style="flex:1"></span>${btn('Schedule…', 'A.schedSend()', '', 'clock')}${btn(`Send to ${rec.length}`, 'A.sendNow()', 'pri', 'send')}</div>
        </div></div>
        <div class="card"><div class="card-h"><h3>Preview</h3><span class="r muted small">${first ? 'As ' + esc(first.company.name) + ' will see it' : 'No recipients'}</span></div><div class="card-b">
          <div class="preview"><div class="ph2"><div><span class="dim">From</span> NPA Exhibitor Team &lt;${esc(D.settings.system.adminEmail)}&gt;</div><div><span class="dim">To</span> ${first ? esc(first.account.email) : '–'}</div><div><span class="dim">Subject</span> <b id="psub">${esc(merge(compose.subject, first)) || '<span class="dim">(no subject)</span>'}</b></div></div>
          <div class="pb" id="pbody">${esc(merge(compose.body, first))}</div>${compose.doc ? `<div class="ph2" style="border-top:1px solid var(--line);border-bottom:0">${ic('file')} ${esc(compose.doc)}</div>` : ''}</div>
        </div></div>
      </div>`);
  }
  if (tab === 'configs') return shell(crumbs, head('Emails', 'Reminder emails that go out automatically on a schedule until the exhibitor acts.', btn('Send reminders now', 'A.sendAll()', '', 'send') + link('Add reminder', '#/emails/config/add', 'pri', 'plus')) + emailTabs(tab) + listView({
    key: 'econf', coll: 'emailConfigs', noun: 'reminder email configurations', rows: D.emailConfigs, link: c => '#/emails/config/' + c.id, search: [c => c.name, c => c.subject],
    cols: [{ h: 'Name', v: c => c.name }, { h: 'Reminder type', v: c => c.type }, { h: 'Subject', v: c => c.subject }, { h: 'Who it reaches now', v: c => D.orders.filter(REM[c.type] || (() => false)).length, num: true },
      { h: 'Days between', v: c => c.days, num: true }, { h: 'Max per form', v: c => c.max, num: true }, { h: 'Recipients', v: c => '', html: c => [c.account && 'Account', c.contact && 'Contact', c.ccAdmin && 'CC admin'].filter(Boolean).join(', ') || 'None', nosort: true },
      { h: 'Enabled', v: c => c.enabled, html: c => `<label class="toggle"><input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="A.tog('emailConfigs',${c.id},'enabled')"><span></span></label>` },
      { h: 'Updated at', v: c => c.updated, html: c => fdt(c.updated) }, { h: 'Schedules', v: c => D.schedules.filter(s => s.configId === c.id).length, num: true }],
    filters: [{ label: 'enabled', k: 'en', opts: yn(c => c.enabled) }, { label: 'reminder type', k: 'type', get: c => c.type, opts: Object.keys(REM).map(x => [x, x]) },
      { label: 'include account email', k: 'acc', opts: yn(c => c.account) }, { label: 'include contact email', k: 'con', opts: yn(c => c.contact) }, { label: 'cc admin', k: 'cc', opts: yn(c => c.ccAdmin) }],
    bulk: [['Send selected now', ids => ids.forEach(i => runReminder(+i))]]
  }));
  if (tab === 'schedules') return shell(crumbs, head('Emails', 'When each reminder runs. A schedule only sends if its reminder is enabled.', btn('Run due schedules', 'A.runDue()', '', 'play') + btn('Add schedule', 'A.schedModal()', 'pri', 'plus')) + emailTabs(tab) + listView({
    key: 'sched', coll: 'schedules', noun: 'reminder schedules', rows: D.schedules, link: s => `javascript:A.schedModal(${s.id})`, search: [s => cfg(s).name],
    cols: [{ h: 'Name', v: s => cfg(s).name }, { h: 'Config', v: s => cfg(s).name + (cfg(s).enabled ? ' - Enabled' : ' - Disabled') }, { h: 'Schedule', v: s => `on ${s.day} at ${s.time}` },
      { h: 'Enabled', v: s => s.enabled, html: s => `<label class="toggle"><input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="A.tog('schedules',${s.id},'enabled')"><span></span></label>` },
      { h: 'Last run', v: s => s.lastRun, html: s => fdt(s.lastRun) }, { h: 'Next run', v: s => s.nextRun, html: s => s.enabled ? fdt(s.nextRun) : '<span class="dim">Paused</span>' },
      { h: 'Actions', nosort: true, v: () => '', html: s => btn('Run now', `A.runSched(${s.id})`, 'sm soft', 'play') }],
    filters: [{ label: 'enabled', k: 'en', opts: yn(s => s.enabled) }, { label: 'day of week', k: 'day', get: s => s.day, opts: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => [d, d]) },
      { label: 'config', k: 'cfg', get: s => s.configId, opts: D.emailConfigs.map(c => [c.id, c.name]) }]
  }));
  return shell(crumbs, head('Emails', 'Every email the system has sent: reminders, notifications and one-off emails.') + emailTabs(tab) + listView({
    key: 'elogs', coll: 'emailLogs', noun: 'emails', rows: D.emailLogs, nobulk: true, search: [l => l.to, l => l.subject, l => l.orderId, l => orderById(l.orderId)?.company.name],
    cols: [{ h: 'Form', v: l => l.orderId || '', html: l => { const o = orderById(l.orderId); return o ? `<a class="lnk" href="#/orders/${o.id}">${esc(formLabel(o))}</a>` : '<span class="dim">–</span>'; } },
      { h: 'Company', v: l => orderById(l.orderId)?.company.name || '' }, { h: 'Sent to', v: l => l.to }, { h: 'Kind', v: l => l.kind, html: l => `<span class="tag">${esc(l.kind)}</span>` },
      { h: 'Reminder type', v: l => l.type }, { h: 'Reminder number', v: l => l.n || '', html: l => l.n || '<span class="dim">–</span>', num: true }, { h: 'Subject', v: l => l.subject },
      { h: 'Sent at', v: l => l.at, html: l => fdt(l.at) }, { h: 'Status', v: l => l.status, html: l => pill(l.status) }],
    filters: [{ label: 'sent at', k: 'at', opts: DATE_OPTS(l => l.at) }, { label: 'kind', k: 'kind', get: l => l.kind, opts: ['Reminder', 'Broadcast', 'Notification'].map(x => [x, x]) },
      { label: 'reminder number', k: 'n', get: l => l.n, opts: [1, 2, 3, 4].map(n => [n, n]) }, { label: 'reminder type', k: 'type', get: l => l.type, opts: Object.keys(REM).map(x => [x, x]) },
      { label: 'status', k: 'st', get: l => l.status, opts: [['Delivered', 'Delivered'], ['Bounced', 'Bounced'], ['Scheduled', 'Scheduled']] }]
  }));
}
const cfg = s => D.emailConfigs.find(c => c.id === s.configId) || { name: '?' };
A.cmp = full => {
  const v = collect(document.getElementById('cmp'), {});
  Object.assign(compose, v);
  if (full) return render();
  const first = AUD[compose.aud][1]()[0];
  document.getElementById('psub').innerHTML = esc(merge(compose.subject, first)) || '<span class="dim">(no subject)</span>';
  document.getElementById('pbody').textContent = merge(compose.body, first);
};
A.tagIns = tag => { const t = document.getElementById('cbody'); const s = t.selectionStart; t.value = t.value.slice(0, s) + tag + t.value.slice(t.selectionEnd); t.focus(); t.selectionStart = t.selectionEnd = s + tag.length; A.cmp(); };
function logBroadcast(rec, status, at) {
  rec.forEach(o => D.emailLogs.unshift({ id: D.emailLogs.length + 1, orderId: o.id, kind: 'Broadcast', type: AUD[compose.aud][0], n: null, at, subject: merge(compose.subject, o), to: o.account.email, status }));
}
A.sendNow = () => {
  A.cmp();
  const rec = AUD[compose.aud][1]();
  if (!compose.subject.trim()) return toast('Add a subject first');
  if (!rec.length) return toast('No one matches that audience');
  confirmBox('Send this email?', `“<b>${esc(compose.subject)}</b>” goes to <b>${rec.length}</b> exhibitors now. Each gets their own copy with their details filled in.`, `Send to ${rec.length}`, () => {
    logBroadcast(rec, 'Delivered', now()); toast(`Email sent to ${rec.length} exhibitors`); compose.subject = ''; location.hash = '#/emails/logs';
  });
};
A.schedSend = () => {
  A.cmp();
  if (!compose.subject.trim()) return toast('Add a subject first');
  const t = new Date(Date.now() + 864e5); t.setHours(9, 0, 0, 0);
  modal('Schedule email', `<div id="sform">${F('Send on', 'when', new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 16), 'datetime-local')}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.doSched()">Schedule</button>`);
};
A.doSched = () => { const v = collect(document.getElementById('sform'), {}); const rec = AUD[compose.aud][1](); logBroadcast(rec, 'Scheduled', new Date(v.when).toISOString()); A.close(); toast(`Scheduled for ${fdt(new Date(v.when).toISOString())}`); location.hash = '#/emails/logs'; };
function runReminder(cid) {
  const c = D.emailConfigs.find(x => x.id === cid);
  if (!c.enabled) { toast(`${c.name} is disabled — enable it first`); return 0; }
  const rec = D.orders.filter(REM[c.type] || (() => false)).filter(o => D.emailLogs.filter(l => l.orderId === o.id && l.configId === cid).length < c.max);
  rec.forEach(o => { const n = D.emailLogs.filter(l => l.orderId === o.id && l.configId === cid).length + 1; D.emailLogs.unshift({ id: D.emailLogs.length + 1, orderId: o.id, kind: 'Reminder', type: c.type, configId: cid, n, at: now(), subject: c.subject, to: o.account.email, status: 'Delivered' }); });
  toast(`${c.name}: sent ${rec.length} reminders`);
  return rec.length;
}
A.sendAll = () => confirmBox('Send reminders now?', 'Runs every enabled reminder straight away, skipping exhibitors who have already had the maximum.', 'Send now', () => { D.emailConfigs.filter(c => c.enabled).forEach(c => runReminder(c.id)); render(); });
A.runSched = id => { const s = D.schedules.find(x => x.id === id); runReminder(s.configId); s.lastRun = now(); render(); };
A.runDue = () => { D.schedules.filter(s => s.enabled && new Date(s.nextRun) <= new Date()).forEach(s => A.runSched(s.id)); toast('Due schedules have run'); render(); };
A.schedModal = id => {
  const s = id ? D.schedules.find(x => x.id === id) : { configId: 1, day: 'Wednesday', time: '09:00', enabled: true };
  modal(id ? 'Change reminder schedule' : 'Add reminder schedule', `<div id="scform" class="grid" style="gap:14px">${F('Reminder', 'configId', s.configId, 'select', { num: true, opts: D.emailConfigs.map(c => [c.id, c.name]) })}
    <div class="grid g2" style="gap:12px">${F('Day of week', 'day', s.day, 'select', { opts: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] })}${F('Time', 'time', s.time, 'time')}</div>${F('Enabled', 'enabled', s.enabled, 'checkbox')}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveSched(${id || 0})">Save</button>`);
};
A.saveSched = id => {
  const v = collect(document.getElementById('scform'), {});
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const n = new Date(); const [h, m] = v.time.split(':'); n.setDate(n.getDate() + ((days.indexOf(v.day) - n.getDay() + 7) % 7 || 7)); n.setHours(+h, +m, 0, 0);
  v.nextRun = n.toISOString();
  if (id) Object.assign(D.schedules.find(s => s.id === id), v); else D.schedules.push({ id: Math.max(0, ...D.schedules.map(s => s.id)) + 1, lastRun: null, ...v });
  A.close(); toast('Schedule saved'); render();
};
function vEmailConfig(id) {
  const src = id === 'add' ? null : D.emailConfigs.find(c => c.id === +id);
  if (id !== 'add' && !src) return notFound('Reminder');
  const c = useDraft('ec' + id, () => src ? structuredClone(src) : { id: Math.max(...D.emailConfigs.map(x => x.id)) + 1, name: '', type: 'Unpaid Deposits', subject: '', body: 'Dear {first_name},\n\n\n\nKind regards,\nNPA Exhibitor Team', days: 7, max: 3, account: true, contact: true, ccAdmin: false, enabled: false, isNew: true });
  const reach = D.orders.filter(REM[c.type] || (() => false));
  return shell([['Emails'], ['Reminder configurations', '#/emails/configs'], [c.isNew ? 'Add' : c.name]], `
    ${head(c.isNew ? 'Add reminder email' : esc(c.name), `Goes to exhibitors matching “${esc(c.type)}” — <b>${reach.length}</b> right now.`, c.isNew ? '' : btn('Send now', `A.saveEc('cont');runReminder(${c.id})`, '', 'send'))}
    <form id="form" onsubmit="return false">
    ${sec('ec', 'Reminder', fields([F('Name', 'name', c.name), F('Reminder type', 'type', c.type, 'select', { opts: Object.keys(REM), on: 'A.ecLive()', help: 'Decides who gets it. They stop getting it once they act (pay, upload, submit).' }),
      F('Subject', 'subject', c.subject, 'text', { full: true }), F('Body', 'body', c.body, 'textarea', { full: true, rows: 8, help: 'Merge tags: {first_name} {company} {order_number} {stand} {balance_due} {username}' }),
      F('Days between reminders', 'days', c.days, 'number'), F('Max reminders per form', 'max', c.max, 'number'),
      `<div class="f full"><div class="chkgrid">${F('Include account email', 'account', c.account, 'checkbox')}${F('Include contact email', 'contact', c.contact, 'checkbox')}${F('CC admin', 'ccAdmin', c.ccAdmin, 'checkbox')}${F('Enabled', 'enabled', c.enabled, 'checkbox')}</div></div>`]))}
    </form>${savebar('A.saveEc', c.isNew ? '' : 'A.delEc()')}`);
}
A.ecLive = () => { collect(document.getElementById('form'), draft); render(); };
A.saveEc = mode => {
  collect(document.getElementById('form'), draft);
  if (!draft.name) return toast('Name is required');
  const isNew = draft.isNew; delete draft.isNew; draft.updated = now();
  if (isNew) D.emailConfigs.push(draft); else D.emailConfigs[D.emailConfigs.findIndex(c => c.id === draft.id)] = draft;
  toast(`Reminder “${draft.name}” saved`);
  const id = draft.id; draftKey = null;
  location.hash = mode === 'done' ? '#/emails/configs' : mode === 'add' ? '#/emails/config/add' : '#/emails/config/' + id; render();
};
A.delEc = () => confirmBox('Delete reminder?', `Delete “${esc(draft.name)}” and its schedules?`, 'Yes, delete', () => { D.emailConfigs = D.emailConfigs.filter(c => c.id !== draft.id); D.schedules = D.schedules.filter(s => s.configId !== draft.id); draftKey = null; toast('Reminder deleted'); location.hash = '#/emails/configs'; }, true);

// ---------- reports ----------
const RF = {
  id: ['Order #', o => o.id], code: ['Account code', o => U(o).code], company: ['Company name', o => o.company.name], contact: ['Contact name', o => o.account.first + ' ' + o.account.last],
  email: ['Email', o => o.account.email], mobile: ['Mobile', o => o.company.mobile], county: ['County', o => o.company.county], website: ['Website', o => o.company.website],
  clientType: ['Client type', o => o.clientType === 'IN' ? 'Indoor' : 'Outdoor'], venue: ['Venue', o => o.venue || 'Outdoor'], category: ['Category', o => catName(o.category)],
  row: ['Row', o => o.row], block: ['Block', o => o.block], stand: ['Stand', o => o.stand], unit: ['Unit number', o => o.unit], frontage: ['Frontage / units', o => o.frontage], depth: ['Depth', o => o.adminDepth],
  corner: ['Corner', o => o.cornerStatus], structure: ['Structure', o => structureText(o)], other: ['Other structure', o => o.structure.other], electricity: ['Electricity', o => elecText(o)], water: ['Water', o => o.util.water ? 'Yes' : 'No'],
  siteContact: ['Site contact', o => o.company.siteName + ' ' + o.company.siteNumber], sharing: ['Sharing with', o => o.sharingWith], signage: ['Trade arena signage', o => o.company.signage], particulars: ['Particulars', o => o.particulars],
  grandTotal: ['Grand total', o => o.grandTotal.toFixed(2)], submittedDate: ['Submitted date', o => o.submittedDate ? fd(o.submittedDate) : ''], insurance: ['Insurance status', o => o.insuranceStatus], paid: ['Paid', o => o.pay.confirmed ? 'Yes' : 'No']
};
const RF_GROUPS = [['Exhibitor', ['id', 'code', 'company', 'contact', 'email', 'mobile', 'county', 'website', 'signage', 'particulars', 'sharing']], ['Location', ['clientType', 'venue', 'category', 'row', 'block', 'stand', 'unit', 'frontage', 'depth', 'corner']],
  ['Site & services', ['structure', 'other', 'electricity', 'water', 'siteContact']], ['Money & status', ['grandTotal', 'submittedDate', 'insurance', 'paid']]];
const WB_FIELDS = [['Order', w => w.id], ['Account', w => wbUser(w).username], ['Company', w => wbUser(w).name], ['Deliver to', w => w.delivery], ['Bulk bags', w => w.bags], ['Half bags', w => w.half], ['Spreading', w => w.spread ? 'Yes' : 'No'], ['Total', w => w.total.toFixed(2)], ['Status', w => w.status]];
const QUICK = [
  ['contractors', 'Contractors', 'Outdoor structures, sizes, power and site contacts for the site crew', 'hardhat', ['row', 'block', 'stand', 'company', 'frontage', 'depth', 'structure', 'other', 'electricity', 'water', 'siteContact'], { clientType: 'OU', submitted: 'yes' }],
  ['print', 'Print material', 'Catalogue listing: company, category, stand and signage', 'print', ['company', 'category', 'venue', 'block', 'stand', 'signage', 'website'], { submitted: 'yes' }],
  ['website', 'Website', 'Exhibitor directory for npa.ie', 'globe', ['company', 'category', 'county', 'website', 'venue', 'stand'], { submitted: 'yes' }],
  ['map', 'Site map', 'Every stand with its row, block and unit for the mapping team', 'map', ['clientType', 'venue', 'row', 'block', 'stand', 'unit', 'company', 'frontage', 'corner'], { submitted: 'yes' }]];
function runReport(r) {
  if (r.root.startsWith('woodbark')) return { headers: WB_FIELDS.map(f => f[0]), rows: D.woodbark.map(w => WB_FIELDS.map(f => f[1](w))) };
  const f = r.filters || {};
  let os = D.orders.slice();
  if (f.clientType) os = os.filter(o => o.clientType === f.clientType);
  if (f.venue) os = os.filter(o => (o.venue || 'Outdoor') === f.venue);
  if (f.submitted) os = os.filter(o => o.submitted === (f.submitted === 'yes'));
  if (f.insurance) os = os.filter(o => o.insuranceStatus === f.insurance);
  if (f.category) os = os.filter(o => o.categories.includes(+f.category));
  const keys = r.fields.length ? r.fields : ['id', 'company'];
  return { headers: keys.map(k => RF[k][0]), rows: os.map(o => keys.map(k => RF[k][1](o))) };
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
A.dl = id => { const r = D.reports.find(x => x.id === id); const { headers, rows } = runReport(r); csv(slug(r.name) + '.csv', headers, rows); };
A.quick = k => { const q = QUICK.find(x => x[0] === k); const { headers, rows } = runReport({ root: 'order', fields: q[4], filters: q[5] }); csv(slug(q[1]) + '-report.csv', headers, rows); };
function vReports() {
  return shell([['Report_Builder'], ['Reports']], head('Reports', 'Need a report? Here is where you can download and create custom reports based on current information.',
    btn('View starred reports', "A.f('reports','star','yes')", '', 'star') + link('Add report', '#/reports/add', 'pri', 'plus')) + `
    <div class="grid g4" style="margin-bottom:16px">${QUICK.map(([k, t, s, i]) => `<div class="card kpi" style="display:flex;flex-direction:column"><div class="k"><span class="kicon" style="background:var(--brand-100);color:var(--brand-700)">${ic(i)}</span>${t}</div>
      <div class="s" style="margin:8px 0 12px;flex:1">${s}</div><div class="row">${btn('Download', `A.quick('${k}')`, 'sm pri', 'download')}${link('Customise', `#/reports/add?${k}`, 'sm')}</div></div>`).join('')}</div>` + listView({
    key: 'reports', coll: 'reports', noun: 'reports', rows: D.reports, link: r => '#/reports/' + r.id, search: [r => r.name, r => r.desc],
    cols: [{ h: 'Name', v: r => r.name }, { h: 'Starred', v: r => r.starred, html: r => `<a href="javascript:A.star(${r.id})" style="color:${r.starred ? 'var(--amber)' : 'var(--dim)'}">${r.starred ? ic('star').replace('<svg class="i"', '<svg class="i" style="fill:currentColor"') : ic('star')}</a>` },
      { h: 'Description', v: r => r.desc, html: r => r.desc ? `<span class="small">${esc(r.desc)}</span>` : '<span class="dim">–</span>' }, { h: 'Root model', v: r => r.root, html: r => `<span class="mono">${esc(r.root)}</span>` },
      { h: 'Created', v: r => r.created, html: r => fd(r.created) }, { h: 'Modified', v: r => r.modified, html: r => fd(r.modified) }, { h: 'User created', v: r => r.by },
      { h: '', nosort: true, v: () => '', html: r => `<span class="row" style="gap:6px;justify-content:flex-end">${btn('', `A.dl(${r.id})`, 'sm', 'download')}${btn('', `A.copyReport(${r.id})`, 'sm', 'copy')}</span>` }],
    filters: [{ label: 'your starred reports', k: 'star', opts: [['yes', 'Starred reports', r => r.starred]] }, { label: 'root model', k: 'root', get: r => r.root, opts: [...new Set(D.reports.map(r => r.root))].map(x => [x, x]) }]
  }));
}
A.star = id => { const r = D.reports.find(x => x.id === id); r.starred = !r.starred; render(); };
A.copyReport = id => { const r = structuredClone(D.reports.find(x => x.id === id)); Object.assign(r, { id: Math.max(...D.reports.map(x => x.id)) + 1, name: r.name + ' (copy)', created: now(), modified: now(), by: 'crm_admin', starred: false }); D.reports.push(r); toast('Copied as “' + r.name + '”'); render(); };

function vReport(id) {
  const [base, q] = String(id).split('?');
  const src = base === 'add' ? null : D.reports.find(r => r.id === +base);
  if (base !== 'add' && !src) return notFound('Report');
  const r = useDraft('rep' + id, () => {
    if (src) return structuredClone(src);
    const qk = QUICK.find(x => x[0] === q);
    return { id: Math.max(...D.reports.map(x => x.id)) + 1, name: qk ? qk[1] + ' report' : '', desc: qk ? qk[2] : '', root: 'order | order form', fields: qk ? qk[4].slice() : ['id', 'company', 'contact', 'email'], filters: qk ? { ...qk[5] } : { submitted: 'yes' }, starred: false, by: 'crm_admin', created: now(), isNew: true };
  });
  const out = runReport(r);
  const wb = r.root.startsWith('woodbark');
  return shell([['Report_Builder'], ['Reports', '#/reports'], [r.isNew ? 'Add report' : r.name]], `
    ${head(r.isNew ? 'Add report' : esc(r.name), 'Pick the fields and filters. The preview updates as you go.', btn('Download CSV', 'A.repDl()', '', 'download') + btn('Save report', 'A.repSave()', 'pri', 'check'))}
    <div class="grid" style="grid-template-columns:minmax(300px,380px) minmax(0,1fr);gap:16px;align-items:start" id="repgrid">
      <div class="card" id="rform"><div class="card-h"><h3>Report</h3></div><div class="card-b grid" style="gap:14px">
        ${F('Name', 'name', r.name)}${F('Description', 'desc', r.desc, 'textarea', { rows: 2 })}
        ${F('Root model', 'root', r.root, 'select', { opts: ['order | order form', 'accounts | company', 'woodbark | woodbark order'], on: 'A.repLive()' })}
        ${wb ? '<div class="muted small">Woodbark reports use a fixed set of columns.</div>' : `
        <div><label class="l" style="font-size:12.5px;font-weight:600;display:block;margin-bottom:8px">Filters</label><div class="grid g2" style="gap:10px">
          ${F('Client type', 'filters.clientType', r.filters.clientType || '', 'select', { opts: [['', 'Any'], ['IN', 'Indoor'], ['OU', 'Outdoor']], on: 'A.repLive()' })}
          ${F('Venue', 'filters.venue', r.filters.venue || '', 'select', { opts: [['', 'Any'], 'Outdoor', ...D.VENUES], on: 'A.repLive()' })}
          ${F('Submitted', 'filters.submitted', r.filters.submitted || '', 'select', { opts: [['', 'Any'], ['yes', 'Yes'], ['no', 'No']], on: 'A.repLive()' })}
          ${F('Insurance', 'filters.insurance', r.filters.insurance || '', 'select', { opts: [['', 'Any'], 'Pending Review', 'Approved', 'Rejected', 'Not uploaded'], on: 'A.repLive()' })}
          <div style="grid-column:1/-1">${F('Category', 'filters.category', r.filters.category || '', 'select', { opts: [['', 'Any'], ...D.CATEGORIES.map(c => [c.id, c.name])], on: 'A.repLive()' })}</div></div></div>
        ${RF_GROUPS.map(([g, ks]) => F(g, 'fields_' + slug(g), r.fields.filter(k => ks.includes(k)), 'multi', { opts: ks.map(k => [k, RF[k][0]]), on: 'A.repLive()' })).join('')}`}
      </div></div>
      <div class="card" style="min-width:0"><div class="card-h"><h3>Preview</h3><span class="r muted small">${out.rows.length} rows · ${out.headers.length} columns${out.rows.length > 12 ? ' · first 12 shown' : ''}</span></div>
        <div class="tbl-wrap"><table class="t"><thead><tr>${out.headers.map(h => `<th class="nosort">${esc(h)}</th>`).join('')}</tr></thead><tbody>${out.rows.slice(0, 12).map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${out.rows.length ? '' : '<div class="empty">No rows match these filters</div>'}</div>
    </div>`);
}
function repCollect() {
  const v = collect(document.getElementById('rform'), {});
  draft.name = v.name; draft.desc = v.desc; draft.root = v.root;
  if (v.filters) draft.filters = Object.fromEntries(Object.entries(v.filters).filter(([, x]) => x));
  const picked = RF_GROUPS.flatMap(([g]) => v['fields_' + slug(g)] || []);
  if (document.querySelector('[data-multi^="fields_"]')) draft.fields = Object.keys(RF).filter(k => picked.includes(k));
}
A.repLive = () => { repCollect(); const y = scrollY; render(); scrollTo(0, y); };
A.repDl = () => { repCollect(); const { headers, rows } = runReport(draft); csv(slug(draft.name || 'report') + '.csv', headers, rows); };
A.repSave = () => {
  repCollect();
  if (!draft.name) return toast('Give the report a name');
  const isNew = draft.isNew; delete draft.isNew; draft.modified = now();
  if (isNew) D.reports.push(draft); else D.reports[D.reports.findIndex(x => x.id === draft.id)] = draft;
  toast(`Report “${draft.name}” saved`); const id = draft.id; draftKey = null; location.hash = '#/reports/' + id; render();
};
function vFormats() {
  return shell([['Report_Builder'], ['Formats']], head('Formats', 'File types reports can be downloaded as.') + listView({
    key: 'formats', coll: 'formats', noun: 'formats', rows: D.formats, search: [f => f.name], nobulk: true,
    cols: [{ h: 'Name', v: f => f.name }, { h: 'Extension', v: f => f.ext, html: f => `<span class="mono">${f.ext}</span>` }, { h: 'Description', v: f => f.desc }]
  }));
}

// ---------- settings ----------
const SETTINGS = [['categories', 'Categories', 'tag', 'Exhibitor categories and which area they belong to'], ['corners', 'Corner inventories', 'corner', 'Corner stands per indoor venue'],
  ['counties', 'Counties', 'pin', 'County list for addresses'], ['countries', 'Countries', 'globe', 'Countries and VAT prefixes'], ['electricity', 'Electricity and litter', 'bolt', 'Power, water and litter rates'],
  ['indoor', 'Indoor dates', 'cal', 'Indoor stand price by booking date'], ['outdoor', 'Outdoor dates', 'cal', 'Outdoor frontage price by booking date'], ['system', 'System settings', 'cog', 'Event, booking toggles, VAT'],
  ['text', 'Text blocks', 'text', 'Wording shown in the exhibitor portal and emails'], ['woodbark', 'Woodbark rates', 'euro', 'Woodbark products and prices']];
function vSettings(pg, sub) {
  const s = D.settings;
  const title = (SETTINGS.find(x => x[0] === pg) || [])[1];
  const crumbs = [['Settings', '#/settings']].concat(title ? [[title]] : []);
  if (!pg) return shell([['Settings']], head('Settings', 'Lists and rates the booking system runs on.') + `<div class="grid g3">${SETTINGS.map(([k, t, i, d]) => `<a class="keyarea" href="#/${k === 'corners' ? 'corners' : 'settings/' + k}"><span class="kicon">${ic(i)}</span><div><b>${t}</b><span>${d}</span></div></a>`).join('')}</div>`);
  if (pg === 'categories') {
    if (sub === 'add') { setTimeout(() => A.catModal()); location.hash = '#/settings/categories'; return ''; }
    return shell(crumbs, head('Categories', 'Each exhibitor picks a category when booking. The area decides whether indoor or outdoor exhibitors see it.', btn('Add category', 'A.catModal()', 'pri', 'plus')) + listView({
      key: 'cats', coll: 'CATEGORIES', noun: 'categories', rows: D.CATEGORIES, link: c => `javascript:A.catModal(${c.id})`, search: [c => c.name],
      cols: [{ h: 'Name', v: c => c.name }, { h: 'Area', v: c => c.area, html: c => c.area === 'Indoor' ? '<span class="tag in">Indoor</span>' : c.area === 'Outdoor' ? '<span class="tag ou">Outdoor</span>' : '<span class="tag">Both</span>' },
        { h: 'Bookings', v: c => D.orders.filter(o => o.categories.includes(c.id)).length, num: true },
        { h: 'Active', v: c => c.active, html: c => `<label class="toggle"><input type="checkbox" ${c.active ? 'checked' : ''} onchange="A.tog('CATEGORIES',${c.id},'active')"><span></span></label>` }],
      filters: [{ label: 'area', k: 'area', get: c => c.area, opts: [['Indoor', 'Indoor'], ['Outdoor', 'Outdoor'], ['Both', 'Both']] }, { label: 'active', k: 'a', opts: yn(c => c.active) }]
    }));
  }
  if (pg === 'counties' || pg === 'countries') {
    const rows = pg === 'counties' ? s.counties : s.countries;
    return shell(crumbs, head(title, '', btn('Add ' + (pg === 'counties' ? 'county' : 'country'), `A.simpleAdd('${pg}')`, 'pri', 'plus')) + listView({
      key: pg, noun: pg, rows, search: [r => r.name], nobulk: true,
      cols: pg === 'counties' ? [{ h: 'County', v: r => r.name }, { h: 'Jurisdiction', v: r => r.province }] : [{ h: 'Country', v: r => r.name }, { h: 'VAT prefix', v: r => r.vatPrefix, html: r => `<span class="mono">${esc(r.vatPrefix) || '–'}</span>` }]
    }));
  }
  if (pg === 'electricity') return shell(crumbs, head(title, 'Used to price the Utilities section of every order form.') + `<form id="form" onsubmit="return false">${sec('el', 'Rates', fields([
    F('Rate WT / 6kW (per connection)', 'rateWt', s.electricity.rateWt, 'number', { step: '0.01' }), F('Rate Amp / 3-phase (per connection)', 'rateAmp', s.electricity.rateAmp, 'number', { step: '0.01' }),
    F('Water rate', 'waterRate', s.electricity.waterRate, 'number', { step: '0.01' }), F('Water rate VAT %', 'waterVat', s.electricity.waterVat, 'number', { step: '0.1' }),
    F('Litter rate (outdoor, per stand)', 'litterRate', s.electricity.litterRate, 'number', { step: '0.01' }), F('VAT rate %', 'vatRate', s.electricity.vatRate, 'number', { step: '0.1' })], 'three'))}</form>
    <div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveObj('electricity')">${ic('check')}Save</button></div>`);
  if (pg === 'indoor' || pg === 'outdoor') {
    const tiers = s[pg + 'Dates'];
    const cur = D.tierFor(tiers, now());
    return shell(crumbs, head(title, `${pg === 'indoor' ? 'Indoor stand' : 'Outdoor frontage'} price goes up on each date. Early bookings get the lower rate. The submitted date on the order form decides the rate.`) + `
      <div class="tiers" style="margin-bottom:16px">${tiers.map(t => `<div class="${t === cur ? 'now' : ''}"><span class="muted small">${esc(t.label)}${t === cur ? ' · <b style="color:#7a5a06">current</b>' : ''}</span><b>${money(t.price)}</b><span class="muted small">${esc(t.unit)} · until ${fd(t.until)}</span></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3>Price bands</h3><div class="r">${btn('Add band', `A.addTier('${pg}')`, 'sm', 'plus')}</div></div><div id="form"><table class="t"><thead><tr><th class="nosort">Label</th><th class="nosort">Applies until (inclusive)</th><th class="nosort">Price</th><th class="nosort">Unit</th><th class="nosort"></th></tr></thead><tbody>
      ${tiers.map((t, i) => `<tr><td><input class="inp" name="t${i}.label" value="${esc(t.label)}"></td><td><input class="inp" type="date" name="t${i}.until" value="${t.until}"></td><td><input class="inp" type="number" step="0.01" name="t${i}.price" value="${t.price}"></td><td><input class="inp" name="t${i}.unit" value="${esc(t.unit)}"></td><td>${tiers.length > 1 ? btn('', `A.delTier('${pg}',${i})`, 'sm ghost-danger', 'trash') : ''}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveTiers('${pg}')">${ic('check')}Save</button></div>`);
  }
  if (pg === 'system') return shell(crumbs, head(title, 'Season-wide switches. Turning bookings off stops exhibitors logging in unless they are login exempt or already submitted.') + `<form id="form" onsubmit="return false">
    ${sec('sys', 'Event', fields([F('Event name', 'eventName', s.system.eventName), F('Event dates', 'eventDates', s.system.eventDates), F('Bookings email (from / CC)', 'adminEmail', s.system.adminEmail, 'email'), F('Invoice prefix', 'invoicePrefix', s.system.invoicePrefix)]))}
    ${sec('tog', 'Exhibition toggle', fields([F('Online bookings open', 'bookingOpen', s.system.bookingOpen, 'checkbox', { help: 'The master switch for the exhibitor portal.' }), F('Indoor bookings open', 'indoorOpen', s.system.indoorOpen, 'checkbox'), F('Outdoor bookings open', 'outdoorOpen', s.system.outdoorOpen, 'checkbox')], 'three'))}
    ${sec('pay', 'Payments', fields([F('VAT %', 'vat', s.system.vat, 'number'), F('Deposit %', 'depositPct', s.system.depositPct, 'number'), F('Balance due by', 'balanceDue', s.system.balanceDue, 'date'), F('Corner premium (indoor)', 'cornerPremium', s.cornerPremium, 'number')], 'three'))}
    </form><div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveObj('system')">${ic('check')}Save</button></div>`);
  if (pg === 'text') return shell(crumbs, head(title, 'Wording the exhibitor portal and emails use. Changes show up straight away.', btn('Add text block', 'A.addText()', 'pri', 'plus')) +
    `<div class="grid g2">${s.textBlocks.map(t => `<div class="card" id="tb${t.id}"><div class="card-h"><h3>${esc(t.title)}</h3><span class="r mono dim">${esc(t.key)}</span></div><div class="card-b grid" style="gap:10px">
      <textarea class="inp" name="body" rows="4">${esc(t.body)}</textarea><div class="row" style="justify-content:flex-end">${btn('Save', `A.saveText(${t.id})`, 'sm pri', 'check')}</div></div></div>`).join('')}</div>`);
  if (pg === 'woodbark') return shell(crumbs, head(title, 'Prices exhibitors see on the woodbark order form.', btn('Add product', 'A.addWbRate()', '', 'plus')) + `
    <div class="card"><div id="form"><table class="t"><thead><tr><th class="nosort">Product</th><th class="nosort">Price (ex VAT)</th><th class="nosort">VAT %</th><th class="nosort num">Price inc VAT</th></tr></thead><tbody>
    ${s.woodbarkRates.map((r, i) => `<tr><td><input class="inp" name="r${i}.product" value="${esc(r.product)}"></td><td><input class="inp" type="number" step="0.01" name="r${i}.price" value="${r.price}"></td><td><input class="inp" type="number" step="0.1" name="r${i}.vat" value="${r.vat}"></td><td class="num">${money(r.price * (1 + r.vat / 100))}</td></tr>`).join('')}
    </tbody></table></div></div><div class="savebar"><span class="sp"></span><button class="btn pri" onclick="A.saveWbRates()">${ic('check')}Save</button></div>`);
  return notFound('Settings page');
}
A.catModal = id => {
  const c = id ? D.CATEGORIES.find(x => x.id === id) : { name: '', area: 'Outdoor', active: true };
  modal(id ? 'Change category' : 'Add category', `<div id="cform" class="grid" style="gap:14px">${F('Name', 'name', c.name)}${F('Area', 'area', c.area, 'select', { opts: ['Outdoor', 'Indoor', 'Both'] })}${F('Active', 'active', c.active, 'checkbox')}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveCat(${id || 0})">Save</button>`);
};
A.saveCat = id => { const v = collect(document.getElementById('cform'), {}); if (!v.name) return toast('Name is required'); if (id) Object.assign(D.CATEGORIES.find(c => c.id === id), v); else D.CATEGORIES.push({ id: Math.max(...D.CATEGORIES.map(c => c.id)) + 1, ...v }); A.close(); toast('Category saved'); render(); };
A.simpleAdd = pg => {
  modal('Add ' + (pg === 'counties' ? 'county' : 'country'), `<div id="aform">${F('Name', 'name', '')}</div>`, `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.doSimpleAdd('${pg}')">Save</button>`);
};
A.doSimpleAdd = pg => { const v = collect(document.getElementById('aform'), {}); if (!v.name) return; const a = D.settings[pg]; a.push({ id: a.length + 1, name: v.name, province: 'ROI', vatPrefix: '' }); A.close(); toast('Added ' + v.name); render(); };
A.saveObj = k => {
  const v = collect(document.getElementById('form'), {});
  if (k === 'system') { D.settings.cornerPremium = v.cornerPremium; delete v.cornerPremium; }
  Object.assign(D.settings[k], v); toast('Settings saved'); render();
};
A.saveTiers = pg => { const v = collect(document.getElementById('form'), {}); D.settings[pg + 'Dates'] = Object.keys(v).sort().map(k => ({ id: +k.slice(1) + 1, ...v[k] })).sort((a, b) => a.until.localeCompare(b.until)); toast('Price bands saved'); render(); };
A.addTier = pg => { const t = D.settings[pg + 'Dates']; const l = t[t.length - 1]; t.push({ id: t.length + 1, label: 'New band', until: l.until, price: l.price, unit: l.unit }); render(); };
A.delTier = (pg, i) => { D.settings[pg + 'Dates'].splice(i, 1); render(); };
A.saveText = id => { D.settings.textBlocks.find(t => t.id === id).body = document.querySelector(`#tb${id} textarea`).value; toast('Text block saved'); };
A.addText = () => modal('Add text block', `<div id="xform" class="grid" style="gap:14px">${F('Title', 'title', '')}${F('Key', 'key', '', 'text', { help: 'Used by developers to place the text, e.g. portal_footer' })}${F('Text', 'body', '', 'textarea')}</div>`,
  `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.doAddText()">Save</button>`);
A.doAddText = () => { const v = collect(document.getElementById('xform'), {}); if (!v.title) return toast('Title is required'); D.settings.textBlocks.push({ id: Math.max(...D.settings.textBlocks.map(t => t.id)) + 1, ...v }); A.close(); toast('Text block added'); render(); };
A.saveWbRates = () => { const v = collect(document.getElementById('form'), {}); D.settings.woodbarkRates = Object.keys(v).sort().map((k, i) => ({ id: i + 1, ...v[k] })); toast('Woodbark rates saved'); render(); };
A.addWbRate = () => { D.settings.woodbarkRates.push({ id: D.settings.woodbarkRates.length + 1, product: 'New product', price: 0, vat: 13.5 }); render(); };

// ---------- login / not found ----------
function vLogin() {
  return `<div class="login"><div class="card"><div class="brand" style="color:var(--brand-900)"><span class="mark">${ic('tractor', '')}</span>NPA Administration</div>
    <h1>Staff sign in</h1><p class="muted" style="margin:0 0 18px">Exhibitors use the separate exhibitor portal.</p>
    <form class="grid" style="gap:14px" onsubmit="location.hash='#/';return false">${F('Username', 'u', 'CRM_ADMIN')}${F('Password', 'p', '', 'password', { ph: 'Any password works in the wireframe' })}
    <button class="btn pri" style="justify-content:center;padding:11px">Log in</button></form></div></div>`;
}
function notFound(what) { return shell([[what]], `<div class="card empty" style="padding:60px">${esc(what)} not found. It may have been deleted. <a href="#/">Back to the dashboard</a></div>`); }

// ---------- router ----------
const ROUTES = [
  [/^$/, vDash], [/^login$/, vLogin], [/^users$/, vUsers], [/^users\/(add|\d+)$/, vUser], [/^groups(?:\/(add|\d+))?$/, vGroups], [/^docs(?:\/(add))?$/, vDocs],
  [/^spaces$/, vSpaces], [/^insurance$/, vInsurance], [/^insurance\/(next|\d+)$/, vInsReview], [/^orders$/, vOrders], [/^orders\/(add|\d+)$/, vOrder],
  [/^paylogs$/, vPayLogs], [/^pos(?:\/(add))?$/, vPOs], [/^corners$/, vCorners], [/^woodbark$/, vWoodbark], [/^woodbark\/(add|\d+)$/, vWb],
  [/^emails\/config\/(add|\d+)$/, vEmailConfig], [/^emails(?:\/(compose|configs|schedules|logs))?$/, vEmails],
  [/^reports$/, vReports], [/^reports\/((?:add|\d+)(?:\?\w+)?)$/, vReport], [/^formats$/, vFormats], [/^settings(?:\/(\w+))?(?:\/(add))?$/, vSettings]];
function render() {
  path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  document.body.classList.remove('navopen');
  for (const [re, fn] of ROUTES) {
    const m = path.match(re);
    if (m) { const html = fn(...m.slice(1)); if (html) document.getElementById('root').innerHTML = html; return; }
  }
  document.getElementById('root').innerHTML = notFound('Page');
}
window.render = render;
// Leaving a change form throws its unsaved copy away.
window.addEventListener('hashchange', () => {
  if (decodeURIComponent(location.hash.replace(/^#\/?/, '')) !== draftPath) draftKey = null;
  render(); scrollTo(0, 0);
});
render();
