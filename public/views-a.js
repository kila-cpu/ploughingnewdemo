// Dashboard, users & groups, docs, exhibition spaces, insurance reviews.

// ---------- dashboard ----------
function cornerStats() {
  return D.settings.corners.map(c => {
    const os = D.orders.filter(o => o.venue === c.venue && o.hasCorner);
    const alloc = os.filter(o => o.cornerStatus === 'Allocated').length;
    const req = os.filter(o => o.cornerStatus === 'Requested').length;
    return { ...c, alloc, req, left: Math.max(0, c.total - c.held - alloc) };
  });
}

function vDash() {
  const sub = D.orders.filter(o => o.submitted);
  const value = sum(sub, o => o.grandTotal);
  const paid = sum(sub.filter(o => o.pay.confirmed), o => o.grandTotal);
  const cs = cornerStats();
  const cornersLeft = sum(cs, c => c.left), cornersTotal = sum(cs, c => c.total);
  const errors = D.payLogs.filter(l => l.level === 'ERROR').length;
  const reqCorners = sum(cs, c => c.req);
  const areas = [['Outdoor', D.orders.filter(o => o.clientType === 'OU' && o.submitted).length]].concat(D.VENUES.map(v => [v, D.orders.filter(o => o.venue === v && o.submitted).length]));
  const maxA = Math.max(...areas.map(a => a[1]), 1);
  const kpi = (k, v, s, icon, col, href) => `<div class="card kpi"><div class="k"><span class="kicon" style="background:var(--${col}-50);color:var(--${col})">${ic(icon)}</span>${k}</div><div class="v">${v}</div>${href ? `<a class="s" href="${href}">${s} →</a>` : `<div class="s">${s}</div>`}</div>`;
  const key = (t, s, icon, href) => `<a class="keyarea" href="${href}"><span class="kicon">${ic(icon)}</span><div><b>${t}</b><span>${s}</span></div></a>`;
  const attn = (n, t, s, href) => `<a class="attn" href="${href}"><span class="n" style="color:${n ? 'var(--orange)' : 'var(--dim)'}">${n}</span><div class="x"><b>${t}</b><small>${s}</small></div>${ic('right')}</a>`;
  return shell([['Site administration']], `
    ${head('Good morning, CRM_ADMIN', `${esc(D.settings.system.eventName)} · ${esc(D.settings.system.eventDates)} · Online bookings are <b style="color:var(--green)">${D.settings.system.bookingOpen ? 'open' : 'closed'}</b>`,
      link('Order forms', '#/orders', '', 'form') + link('Pull a report', '#/reports', 'pri', 'chart'))}
    <div class="grid g4" style="margin-bottom:16px">
      ${kpi('Bookings submitted', `${sub.length}<span class="dim" style="font-size:15px;font-weight:600"> / ${D.orders.length}</span>`, `${D.orders.length - sub.length} not submitted yet`, 'form', 'blue', '#/orders')}
      ${kpi('Booked value (inc. VAT)', money(value).replace(/\.\d+$/, ''), `${money(paid).replace(/\.\d+$/, '')} paid by card`, 'euro', 'green')}
      ${kpi('Insurance to review', pendingIns(), 'Open review queue', 'shield', 'orange', '#/insurance/next')}
      ${kpi('Indoor corners left', `${cornersLeft}<span class="dim" style="font-size:15px;font-weight:600"> / ${cornersTotal}</span>`, 'Corner allocations', 'corner', 'blue', '#/corners')}
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Key areas</h3><span class="muted small">The headings NPA flagged as essential</span></div>
      <div class="card-b grid g4" style="gap:10px">
        ${key('Users & permissions', 'Create exhibitor logins, set what they can book', 'users', '#/users')}
        ${key('Order forms', 'View and edit bookings as they come in', 'form', '#/orders')}
        ${key('Reports', 'Contractors, print, website and map', 'chart', '#/reports')}
        ${key('Insurance reviews', 'Approve or reject uploaded documents', 'shield', '#/insurance')}
        ${key('Corner allocations', 'Indoor corner spots per venue', 'corner', '#/corners')}
        ${key('Woodbark orders', `${D.woodbark.length} orders this season`, 'tree', '#/woodbark')}
        ${key('Emails', 'Compose, reminders, schedules, logs', 'mail', '#/emails/compose')}
        ${key('Settings', 'Categories, date pricing, rates, text', 'settings', '#/settings')}
      </div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>From NPA's wishlist</h3><span class="muted small">Where each item lives in the wireframes</span></div>
      <div class="card-b grid g4" style="gap:10px">
        ${key('Correspondence & calls', 'Shared inbox, call log and notes per exhibitor', 'phone', '#/correspondence')}
        ${key('Change history', 'Who changed what, with old and new values', 'history', '#/history')}
        ${key('Duplicate & shared entries', 'Merge, record as shared, or dismiss', 'copy', '#/duplicates')}
        ${key('Big Red Cloud payments', 'Payments synced and matched to orders', 'euro', '#/payments')}
        ${key('Prices any time', 'Booking types, price bands and per-order overrides', 'tag', '#/settings/bookings')}
        ${key('Insurance criteria', 'Checklist that drives approve or reject', 'shield', '#/settings/insurance')}
        ${key('Docs per venue or area', 'e.g. Agri Pavilion drawings for Agri Pavilion only', 'doc', '#/docs')}
        ${key('AutoCAD', 'Import and export stand numbers for the site map', 'map', '#/allocation')}
        ${key('Security details', 'Reminder stops once NPA confirms', 'lock', '#/emails/configs')}
        ${key('Exhibitor dashboard', 'Order summary, statements, wristbands, more bookings', 'ext', 'portal.html#/dashboard')}
      </div></div>
    <div class="grid" style="grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px" id="dashcols">
      <div class="grid" style="gap:16px;align-content:start">
        <div class="card"><div class="card-h"><h3>Needs attention</h3></div>
          ${attn(pendingIns(), 'Insurance documents awaiting review', 'Uploaded by exhibitors, not yet approved or rejected', '#/insurance/next')}
          ${attn(D.orders.filter(o => !o.submitted).length, 'Bookings started but not submitted', 'Incomplete bookings reminder runs Wednesdays 09:10', "javascript:A.go('orders',{submitted:'no'})")}
          ${attn(reqCorners, 'Corner requests to allocate', 'Indoor exhibitors who asked for a corner', '#/corners')}
          ${attn(pendingPO(), 'Purchase orders pending', 'Waiting for approval by accounts', "javascript:A.go('pos',{status:'Pending'})")}
          ${attn(errors, 'Payment processing errors', 'Card payments that did not complete', "javascript:A.go('paylogs',{level:'ERROR'})")}
        </div>
        <div class="card"><div class="card-h"><h3>Submitted bookings by area</h3><a class="r small" href="#/reports">Full reports →</a></div><div class="card-b grid" style="gap:12px">
          ${areas.map(([a, n]) => `<div><div class="row" style="justify-content:space-between;margin-bottom:5px"><span style="font-weight:600">${a}</span><span class="muted">${n}</span></div><div class="bar"><i style="width:${n / maxA * 100}%"></i></div></div>`).join('')}
        </div></div>
      </div>
      <div class="card"><div class="card-h"><h3>Recent actions</h3><span class="r muted small">My actions</span></div>
        ${D.recent.slice(0, 11).map(r => `<div class="ra"><span class="dot" style="background:${r.icon === 'add' ? 'var(--green-50);color:var(--green)' : r.icon === 'del' ? 'var(--red-50);color:var(--red)' : 'var(--amber-50);color:#a47506'}">${ic(r.icon === 'add' ? 'plus' : r.icon === 'del' ? 'trash' : 'edit', '')}</span><div><a href="${r.href || '#/'}">${esc(r.what)}</a><small>${esc(r.kind)} · ${fdt(r.at)}</small></div></div>`).join('')}
      </div>
    </div>`);
}

// ---------- users ----------
const access = u => u.staff ? '<span class="dim">Staff</span>' : [u.perms.outdoor ? '<span class="tag ou">Outdoor</span>' : '', ...u.perms.venues.map(v => `<span class="tag in">${esc(v)}</span>`)].join(' ') || '<span class="dim">None</span>';
function vUsers() {
  return shell([['Authentication and Authorization'], ['Users']], head('Users', 'Exhibitor logins and staff accounts. Booking access controls which areas each exhibitor can book.', link('Add user', '#/users/add', 'pri', 'plus')) + listView({
    key: 'users', coll: 'users', noun: 'users', rows: D.users, link: u => '#/users/' + u.id, searchPh: 'Search username, account or email',
    search: [u => u.username, u => u.name, u => u.email, u => u.code],
    cols: [{ h: 'Username', v: u => u.username }, { h: 'Account code', v: u => u.code }, { h: 'Account name', v: u => u.name }, { h: 'Email address', v: u => u.email },
      { h: 'Client type', v: u => u.clientType, html: u => ctag(u.clientType) }, { h: 'Booking access', v: u => u.perms.venues.join() + u.perms.outdoor, html: access, nosort: true },
      { h: 'Assigned area', v: u => u.perms.area || '', html: u => u.staff ? '' : u.perms.area ? `<span class="small">${esc(u.perms.area)}</span>` : pill('Not assigned', 'orange') },
      { h: 'Staff status', v: u => u.staff, html: u => yesNo(u.staff) }, { h: 'Active', v: u => u.active, html: u => yesNo(u.active) }],
    filters: [{ label: 'client type', k: 'ct', get: u => u.clientType, opts: [['IN', 'Indoor'], ['OU', 'Outdoor']] },
      { label: 'booking access', k: 'acc', opts: [['ou', 'Outdoor', u => u.perms.outdoor], ...D.VENUES.map(v => [v, v, u => u.perms.venues.includes(v)])] },
      { label: 'assigned area', k: 'area', opts: [['none', 'Not assigned', u => !u.staff && !u.perms.area], ...[...D.OUT_AREAS, ...D.VENUES].map(a => [a, a, u => u.perms.area === a])] },
      { label: 'staff status', k: 'staff', opts: yn(u => u.staff) }, { label: 'superuser status', k: 'su', opts: yn(u => u.superuser) }, { label: 'active', k: 'active', opts: yn(u => u.active) }],
    bulk: [['Activate selected users', ids => setUsers(ids, { active: true }, 'Activated')], ['Deactivate selected users', ids => setUsers(ids, { active: false }, 'Deactivated')],
      ['Email login details to selected', ids => toast(`Login details emailed to ${ids.length} users`)], ['Allow outdoor booking', ids => setPerm(ids, 'outdoor', true)]]
  }));
}
function setUsers(ids, patch, verb) { D.users.filter(u => ids.includes(String(u.id))).forEach(u => Object.assign(u, patch)); toast(`${verb} ${ids.length} users`); }
function setPerm(ids, k, v) { D.users.filter(u => ids.includes(String(u.id))).forEach(u => u.perms[k] = v); toast(`Updated booking access for ${ids.length} users`); }

function blankUser() {
  return { id: Math.max(...D.users.map(u => u.id)) + 1, username: '', code: '', name: '', email: '', first: '', last: '', clientType: 'OU', staff: false, superuser: false, active: true, landline: '', accountId: '', ftId: '', stripeId: '', loginExempt: false,
    perms: { outdoor: true, venues: [], corners: false, allCats: true, cats: [], woodbark: true }, company: {}, groups: [], lastLogin: null, isNew: true };
}
function vUser(id) {
  const src = id === 'add' ? null : D.users.find(u => u.id === +id);
  if (id !== 'add' && !src) return notFound('User');
  const u = useDraft('user' + id, () => src ? structuredClone(src) : blankUser());
  const indoor = u.clientType === 'IN';
  const cats = D.CATEGORIES.filter(c => c.area === 'Both' || (u.perms.outdoor && c.area === 'Outdoor') || (u.perms.venues.length && c.area === 'Indoor'));
  const myOrders = D.orders.filter(o => o.userId === u.id);
  const title = u.isNew ? 'Add user' : esc(u.username);
  return shell([['Authentication and Authorization'], ['Users', '#/users'], [u.isNew ? 'Add user' : u.username]], `
    ${head(title, u.isNew ? 'Create a login for an exhibitor, then choose what they can book.' : `${esc(u.name)} · last login ${fdt(u.lastLogin)}`,
      u.isNew ? '' : btn('Email login details', `A.toast('Login details sent to ${esc(u.email)}')`, '', 'mail') + btn('History', 'A.userHistory()', '', 'history'))}
    ${jump([['login', 'Login'], ['booking', 'Booking permissions'], ['perm', 'Permissions'], ['profile', 'Profile'], ['orders', 'Orders'], ['correspondence', 'Correspondence']])}
    <form id="form" onsubmit="return false">
    ${sec('login', 'Login details', fields([F('Username', 'username', u.username, 'text', { help: 'Usually the account code, e.g. ABC001. Exhibitors log in with this.' }),
      u.isNew ? F('Password', 'pw', '', 'password', { help: 'Leave blank to email the exhibitor a set-password link.' }) : F('Password', '', '', 'ro', { html: `<span class="mono">••••••••••</span> &nbsp;<a href="javascript:A.toast('Password reset link sent to ${esc(u.email)}')">Send reset link</a>` }),
      F('Email address', 'email', u.email, 'email'), F('Account name', 'name', u.name, 'text'), F('First name', 'first', u.first), F('Last name', 'last', u.last)]))}
    ${sec('booking', 'Booking permissions', `
      <div style="padding:16px 18px 0"><div class="banner">${ic('info')}<div>This controls what <b>${esc(u.username || 'this exhibitor')}</b> sees in the exhibitor portal. They book space in their <b>assigned area</b> only and never choose a stand; NPA allocates stand numbers after bookings close.</div></div></div>
      ${fields([F('Client type', 'clientType', u.clientType, 'select', { opts: [['OU', 'Outdoor (OU)'], ['IN', 'Indoor (IN)'], ['', '— Staff / none']], on: 'A.userLive()', help: 'Sets which order form they get: IN Form or OU Form.' }),
        F('Assigned area', 'perms.area', u.perms.area || '', 'select', { opts: [['', '— Not assigned yet'], ...(u.clientType === 'IN' ? D.VENUES : D.OUT_AREAS).map(a => [a, a])], help: 'Based on where they exhibited in previous years. This is the only area they can book in.' }),
        F('Previous years', '', '', 'ro', { html: (u.pastYears || []).length ? u.pastYears.map(p => `<div class="small"><b>${p.year}</b> · ${esc(p.area)} · ${esc(u.clientType === 'IN' ? p.block + p.stand : 'Row ' + p.row + ', Stand ' + p.stand)}</div>`).join('') : '<span class="dim small">New exhibitor, no previous stands</span>' }),
        F('Other bookings online', 'perms.extras', u.perms.extras || [], 'multi', { full: true, opts: D.settings.bookingTypes.filter(b => !['outdoor', 'indoor'].includes(b.k)).map(b => [b.k, b.name + (b.online ? '' : ' (online booking off)')]), help: 'Livestock, porch, bar and shop bookings this exhibitor can make from their dashboard.' }),
        F('Can order woodbark', 'perms.woodbark', u.perms.woodbark, 'checkbox', { help: 'Shows the woodbark order form in their portal.' }),
        F('Outdoor exhibition space', 'perms.outdoor', u.perms.outdoor, 'checkbox', { help: 'Can book outdoor frontage. Outdoor corners cannot be booked.', on: 'A.userLive()' }),
        F('Can request a corner stand', 'perms.corners', u.perms.corners, 'checkbox', { help: 'Indoor venues only. Subject to the corners left in Corner allocations.' }),
        F('Indoor venues', 'perms.venues', u.perms.venues, 'multi', { full: true, opts: D.VENUES.map(v => [v, v]), on: 'A.userLive()', help: 'Leave all unticked for outdoor-only exhibitors.' }),
        F('Every category for their area', 'perms.allCats', u.perms.allCats, 'checkbox', { full: true, on: 'A.userLive()', help: 'Untick to limit this exhibitor to the categories below.' }),
        u.perms.allCats ? '' : F(`Allowed categories <span class="dim">(${cats.length} available for their areas)</span>`, 'perms.cats', u.perms.cats, 'multi', { full: true, num: true, opts: cats.map(c => [c.id, c.name]) }),
        F('Login exempt', 'loginExempt', u.loginExempt, 'checkbox', { full: true, help: 'Allow this user to log in even when the exhibition toggle is off and they have not submitted.' })])}`, { note: 'Key area' })}
    ${sec('perm', 'Permissions', fields([F('Active', 'active', u.active, 'checkbox', { help: 'Designates whether this user should be treated as active. Unselect this instead of deleting accounts.' }),
      F('Staff status', 'staff', u.staff, 'checkbox', { help: 'Can log into this admin site.' }), F('Superuser status', 'superuser', u.superuser, 'checkbox', { help: 'Has every permission without assigning them.' }),
      F('Groups', 'groups', u.groups || D.groups.filter(g => g.members.includes(u.username)).map(g => g.name), 'multi', { opts: D.groups.map(g => [g.name, g.name]), help: 'Staff only. Groups decide which admin pages a staff member sees.' })]))}
    ${sec('profile', 'Profile', fields([F('Account code', 'code', u.code), F('Account name', 'name2', u.name, 'ro'), F('Landline', 'landline', u.landline), F('Account id', 'accountId', u.accountId),
      F('FT account id', 'ftId', u.ftId), F('Stripe customer id', 'stripeId', u.stripeId, 'text', { ph: 'cus_…' })], 'three'), { note: u.isNew ? '' : `Profile: ${esc(u.code)}` })}
    ${sec('orders', 'Orders', myOrders.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th class="nosort">Form</th><th class="nosort">Location</th><th class="nosort num">Grand total</th><th class="nosort">Submitted</th><th class="nosort">Insurance</th></tr></thead><tbody>
      ${myOrders.map(o => `<tr><td><a class="lnk" href="#/orders/${o.id}">${formLabel(o)}</a></td><td>${loc(o)}</td><td class="num">${money(o.grandTotal)}</td><td>${yesNo(o.submitted)}</td><td>${pill(o.insuranceStatus)}</td></tr>`).join('')}
      ${D.woodbark.filter(w => w.userId === u.id).map(w => `<tr><td><a class="lnk" href="#/woodbark/${w.id}">Woodbark Order Form # ${w.id}</a></td><td>${esc(w.delivery)}</td><td class="num">${money(w.total)}</td><td>${yesNo(true)}</td><td></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">No orders yet. They appear here once the exhibitor starts a booking.</div>', { right: u.isNew ? '' : link('Add order form', `javascript:A.newOrderFor(${u.id})`, 'sm') })}
    </form>
    ${u.isNew || u.staff ? '' : corrSec(u.id)}
    ${savebar('A.saveUser', u.isNew ? '' : 'A.delUser()')}`);
}
A.userLive = () => { collect(document.getElementById('form'), draft); if (draft.clientType === 'IN' && !draft.perms.venues.length) draft.perms.venues = []; render(); };
A.saveUser = mode => {
  collect(document.getElementById('form'), draft);
  if (!draft.username.trim()) return toast('Username is required');
  const clash = D.users.find(u => u.username.toLowerCase() === draft.username.toLowerCase() && u.id !== draft.id);
  if (clash) return toast('That username is already taken');
  const isNew = draft.isNew; delete draft.isNew; delete draft.pw; delete draft.name2;
  draft.code = draft.code || draft.username;
  D.groups.forEach(g => { g.members = g.members.filter(m => m !== draft.username); if ((draft.groups || []).includes(g.name)) g.members.push(draft.username); });
  const changes = isNew ? [] : diff(D.users.find(u => u.id === draft.id), draft);
  logAudit('User ' + draft.username, '#/users/' + draft.id, isNew ? 'Added' : changes.length ? 'Changed ' + changes.map(c => c[0]).slice(0, 4).join(', ') : 'Saved with no changes', changes);
  if (isNew) D.users.push(draft); else D.users[D.users.findIndex(u => u.id === draft.id)] = draft;
  pushRecent(isNew ? 'add' : 'edit', draft.username, 'User', '#/users/' + draft.id);
  toast(`The user “${draft.username}” was ${isNew ? 'added' : 'changed'} successfully.`);
  const id = draft.id; draftKey = null;
  location.hash = mode === 'done' ? '#/users' : mode === 'add' ? '#/users/add' : '#/users/' + id;
  render();
};
A.delUser = () => confirmBox('Delete user?', `Deleting <b>${esc(draft.username)}</b> removes their login. Consider unticking <b>Active</b> instead so their orders keep their owner.`, 'Yes, delete', () => {
  D.users = D.users.filter(u => u.id !== draft.id); pushRecent('del', draft.username, 'User'); toast('User deleted'); draftKey = null; location.hash = '#/users';
}, true);
A.userHistory = () => modal('History', `<div class="ra"><span class="dot" style="background:var(--amber-50);color:#a47506">${ic('edit', '')}</span><div>Changed booking permissions<small>CRM_ADMIN · ${fdt(D.recent[0].at)}</small></div></div><div class="ra"><span class="dot" style="background:var(--green-50);color:var(--green)">${ic('plus', '')}</span><div>Added<small>CRM_ADMIN · ${fdt(D.recent[1].at)}</small></div></div>`);

// ---------- groups ----------
function vGroups(id) {
  if (id) return A.groupModal(id === 'add' ? null : +id), (location.hash = '#/groups'), '';
  return shell([['Authentication and Authorization'], ['Groups']], head('Groups', 'Staff groups decide which parts of this admin each team member can see.', btn('Add group', 'A.groupModal()', 'pri', 'plus')) + listView({
    key: 'groups', coll: 'groups', noun: 'groups', rows: D.groups, link: g => `javascript:A.groupModal(${g.id})`, search: [g => g.name],
    cols: [{ h: 'Group', v: g => g.name }, { h: 'Can access', v: g => g.perms }, { h: 'Members', v: g => g.members.length, html: g => g.members.length ? g.members.map(m => `<span class="tag">${esc(m)}</span>`).join(' ') : '<span class="dim">None</span>' }]
  }));
}
A.groupModal = id => {
  const g = id ? D.groups.find(x => x.id === id) : { name: '', perms: '', members: [] };
  const areas = ['Users', 'Docs', 'Order forms', 'Insurance reviews', 'Corner allocations', 'Purchase orders', 'Payment logs', 'Woodbark orders', 'Emails', 'Reports', 'Settings'];
  modal(id ? 'Change group' : 'Add group', `<div id="gform" class="grid" style="gap:14px">${F('Name', 'name', g.name)}${F('Can access', 'areas', areas.filter(a => g.perms === 'Full access' || g.perms.toLowerCase().includes(a.toLowerCase().split(' ')[0])), 'multi', { opts: areas.map(a => [a, a]) })}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveGroup(${id || 0})">Save</button>`);
};
A.saveGroup = id => {
  const v = collect(document.getElementById('gform'), {});
  if (!v.name) return toast('Name is required');
  const perms = v.areas.length === 11 ? 'Full access' : v.areas.join(', ');
  if (id) Object.assign(D.groups.find(g => g.id === id), { name: v.name, perms }); else D.groups.push({ id: Math.max(...D.groups.map(g => g.id)) + 1, name: v.name, perms, members: [] });
  A.close(); toast('Group saved'); render();
};

// ---------- docs ----------
function vDocs(id) {
  if (id === 'add') { setTimeout(() => A.docModal()); location.hash = '#/docs'; return ''; }
  return shell([['Docs'], ['Docs']], head('Docs', 'Documents shared with exhibitors in their portal. Target a doc at one venue or area so exhibitors only see what relates to their booking.', btn('Add doc', 'A.docModal()', 'pri', 'upload')) + listView({
    key: 'docs', coll: 'docs', noun: 'docs', rows: D.docs, link: d => `javascript:A.docModal(${d.id})`, search: [d => d.title, d => d.file],
    cols: [{ h: 'Doc', v: d => d.title }, { h: 'Shown to', v: d => d.audience, html: d => d.audience === 'Indoor' || D.VENUES.includes(d.audience) ? `<span class="tag in">${esc(d.audience === 'Indoor' ? 'All indoor' : d.audience + ' only')}</span>` : d.audience === 'Outdoor' || D.OUT_AREAS.includes(d.audience) ? `<span class="tag ou">${esc(d.audience === 'Outdoor' ? 'All outdoor' : d.audience + ' only')}</span>` : '<span class="tag">All exhibitors</span>' },
      { h: 'File', v: d => d.file, html: d => `<a class="mono" href="javascript:A.fakeOpen('${esc(d.file)}')">${esc(d.file)}</a>` }, { h: 'Size', v: d => d.size, html: d => (d.size / 1024).toFixed(1) + ' MB', num: true },
      { h: 'Uploaded', v: d => d.uploaded, html: d => fd(d.uploaded) }, { h: 'Visible in portal', v: d => d.visible, html: d => `<label class="toggle"><input type="checkbox" ${d.visible ? 'checked' : ''} onchange="A.tog('docs',${d.id},'visible')"><span></span></label>` }],
    filters: [{ label: 'shown to', k: 'aud', get: d => d.audience, opts: [['All exhibitors', 'All exhibitors'], ['Indoor', 'All indoor'], ['Outdoor', 'All outdoor'], ...[...D.VENUES, ...D.OUT_AREAS].map(a => [a, a + ' only'])] }, { label: 'visible', k: 'vis', opts: yn(d => d.visible) }],
    bulk: [['Show in portal', ids => D.docs.filter(d => ids.includes(String(d.id))).forEach(d => d.visible = true)], ['Hide from portal', ids => D.docs.filter(d => ids.includes(String(d.id))).forEach(d => d.visible = false)]]
  }));
}
A.tog = (coll, id, k) => { const r = D[coll].find(x => x.id === id); r[k] = !r[k]; toast('Saved'); render(); };
A.docModal = id => {
  const d = id ? D.docs.find(x => x.id === id) : { title: '', audience: 'All exhibitors', file: '', visible: true };
  modal(id ? 'Change doc' : 'Add doc', `<div id="dform" class="grid" style="gap:14px">${F('Title', 'title', d.title)}${F('Shown to', 'audience', d.audience, 'select', { opts: [['All exhibitors', 'All exhibitors'], ['Indoor', 'All indoor exhibitors'], ['Outdoor', 'All outdoor exhibitors'], ...D.VENUES.map(v => [v, v + ' exhibitors only']), ...D.OUT_AREAS.map(v => [v, v + ' exhibitors only'])], help: 'Pick a venue or area to show this only to exhibitors booked there, e.g. Agri Pavilion layout drawings.' })}${F('File', 'file', d.file, 'file')}${F('Visible in exhibitor portal', 'visible', d.visible, 'checkbox')}</div>`,
    `${id ? `<button class="btn ghost-danger" style="margin-right:auto" onclick="A.close();D.docs=D.docs.filter(x=>x.id!==${id});A.toast('Doc deleted');render()">Delete</button>` : ''}<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.saveDoc(${id || 0})">Save</button>`);
};
A.saveDoc = id => {
  const v = collect(document.getElementById('dform'), {});
  if (!v.title || !v.file) return toast('Add a title and choose a file');
  if (id) Object.assign(D.docs.find(d => d.id === id), v); else D.docs.unshift({ id: Math.max(...D.docs.map(d => d.id)) + 1, ...v, size: 640, uploaded: now() });
  pushRecent(id ? 'edit' : 'add', v.title, 'Doc', '#/docs');
  A.close(); toast('Doc saved'); render();
};

// ---------- exhibition spaces ----------
function vSpaces() {
  return shell([['Order'], ['Exhibition spaces']], head('Exhibition spaces', 'The space each order form books, by category. Mostly a back-end view for checking category totals.') + listView({
    key: 'spaces', noun: 'exhibition spaces', rows: D.orders, link: o => '#/orders/' + o.id, search: [o => formLabel(o), o => catName(o.category)], nodelete: true, nobulk: true,
    cols: [{ h: 'Form', v: o => formLabel(o) }, { h: 'Category', v: o => catName(o.category) }, { h: 'Frontage or units', v: o => o.frontage, num: true },
      { h: 'Is 18m or partitions', v: o => o.is18m, html: o => yesNo(o.is18m) }, { h: 'Has corner', v: o => o.hasCorner, html: o => yesNo(o.hasCorner) },
      { h: 'Corner status', v: o => o.cornerStatus, html: o => pill(o.cornerStatus) }, { h: 'Total amount', v: o => o.grandTotal, html: o => o.grandTotal ? money(o.grandTotal) : '–', num: true }],
    filters: [{ label: 'area', k: 'ct', get: o => o.clientType, opts: [['IN', 'Indoor'], ['OU', 'Outdoor']] }, { label: 'category', k: 'cat', get: o => o.category, opts: D.CATEGORIES.map(c => [c.id, c.name]) }],
    foot: rows => `Total frontage/units ${sum(rows, o => o.frontage)} · ${money(sum(rows, o => o.grandTotal))}`
  }));
}

// ---------- insurance reviews ----------
const REASONS = ['Insufficient Monetary Coverage', 'Insufficient Duration Coverage', 'Not Signed by Broker', 'Not Stamped by Broker', 'Not on NPA Official Form', 'Not Fully Completed', "Missing Employers' Liability Insurance", 'Other Reason'];
function vInsurance() {
  const n = pendingIns();
  return shell([['Order'], ['Insurance reviews']], head('Insurance reviews', 'Insurance documents uploaded by exhibitors. Approve them, or reject with a reason and the exhibitor is emailed.',
    btn(`Outstanding reviews <span class="pill p-orange nodot" style="padding:1px 7px">${n}</span>`, "A.f('insurance','status','Pending')", 'soft') + link('Start reviewing', '#/insurance/next', 'pri', 'shield')) + listView({
    key: 'insurance', coll: 'ins', noun: 'insurance reviews', rows: D.ins, link: r => '#/insurance/' + r.id, searchPh: 'Search order, company or account',
    search: [r => r.id, r => r.orderId, r => { const o = orderById(r.orderId); return o ? o.company.name + U(o).username : ''; }],
    cols: [{ h: 'ID', v: r => r.id }, { h: 'Order', v: r => r.orderId, html: r => { const o = orderById(r.orderId); return o ? `<a href="#/orders/${o.id}">Order #${o.id}</a> <span class="dim">${esc(U(o).username)}</span>` : '#' + r.orderId; } },
      { h: 'Company', v: r => orderById(r.orderId)?.company.name }, { h: 'Uploaded', v: r => r.uploadedAt, html: r => fdt(r.uploadedAt) },
      { h: 'Status', v: r => r.status, html: r => pill(r.status) }, { h: 'Rejection reason', v: r => r.reason, html: r => r.reason ? esc(r.reason) : '<span class="dim">–</span>' },
      { h: 'Reviewed at', v: r => r.reviewedAt || '', html: r => r.reviewedAt ? fdt(r.reviewedAt) + ` <span class="dim">${esc(r.reviewer)}</span>` : '<span class="dim">–</span>' },
      { h: '', nosort: true, v: () => '', html: r => `<a class="btn sm ${r.status === 'Pending' ? 'pri' : ''}" href="#/insurance/${r.id}">${r.status === 'Pending' ? 'Review' : 'Open'}</a>` }],
    filters: [{ label: 'status', k: 'status', get: r => r.status, opts: [['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']] },
      { label: 'rejection reason', k: 'reason', get: r => r.reason, opts: REASONS.map(x => [x, x]) }, { label: 'reviewed at', k: 'rev', opts: DATE_OPTS(r => r.reviewedAt) }],
    bulk: [['Approve selected', ids => { D.ins.filter(r => ids.includes(String(r.id))).forEach(r => decide(r, 'Approved', '', '', false)); toast(`Approved ${ids.length} documents`); }]]
  }));
}
function decide(r, status, reason, note, email) {
  Object.assign(r, { status, reason, note, reviewedAt: now(), reviewer: 'CRM_ADMIN' });
  const o = orderById(r.orderId);
  if (o) {
    o.insuranceStatus = status === 'Pending' ? 'Pending Review' : status;
    o.history.push({ at: now(), who: 'CRM_ADMIN', what: `Insurance ${status.toLowerCase()}${reason ? ' — ' + reason : ''}` });
    if (email) D.emailLogs.unshift({ id: D.emailLogs.length + 1, orderId: o.id, kind: 'Notification', type: 'Insurance ' + status, n: null, at: now(), subject: `Your insurance document has been ${status.toLowerCase()}`, to: o.account.email, status: 'Delivered' });
  }
  pushRecent('edit', `Insurance review #${r.id}`, 'Insurance review', '#/insurance/' + r.id);
}
function vInsReview(id) {
  if (id === 'next') {
    const nx = D.ins.find(r => r.status === 'Pending');
    location.replace(nx ? '#/insurance/' + nx.id : '#/insurance');
    if (!nx) toast('No outstanding reviews — all caught up');
    return '';
  }
  const r = D.ins.find(x => x.id === +id);
  if (!r) return notFound('Insurance review');
  const o = orderById(r.orderId);
  const queue = D.ins.filter(x => x.status === 'Pending');
  const qi = queue.indexOf(r);
  const prior = D.ins.filter(x => x.orderId === r.orderId && x.id !== r.id);
  return shell([['Order'], ['Insurance reviews', '#/insurance'], ['#' + r.id]], `
    ${head(`Insurance review #${r.id}`, `${esc(o.company.name)} · ${formLabel(o)} · ${pill(r.status)}`, (queue.length ? `<span class="muted small" style="align-self:center">${qi >= 0 ? `${qi + 1} of ${queue.length} outstanding` : `${queue.length} outstanding`}</span>` : '') +
      (qi > 0 ? link('Previous', '#/insurance/' + queue[qi - 1].id, '', 'left') : '') + (queue.length && queue[qi + 1] ? link('Next', '#/insurance/' + queue[qi + 1].id, '', 'right') : ''))}
    <div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(300px,1fr);gap:16px;align-items:start" id="revgrid">
      <div class="card"><div class="card-h">${ic('file')}<h3 class="mono" style="font-weight:600">${esc(r.file)}</h3><div class="r">${btn('Download', `A.fakeOpen('${esc(r.file)}')`, 'sm', 'download')}</div></div>
        <div class="card-b" style="background:#f6f8fa"><div class="doc">
          <div class="row" style="justify-content:space-between"><div><h4>NPA Exhibitor Insurance Confirmation</h4><span class="dim small">National Ploughing Association official form · 2027</span></div><span class="tag">Page 1 of 2</span></div>
          <table><tr><td>Insured</td><td><b>${esc(o.company.name)}</b></td></tr><tr><td>Address</td><td>${esc(o.company.addr1)}, ${esc(o.company.city)}, Co. ${esc(o.company.county)}</td></tr>
          <tr><td>Insurer</td><td>Midland Mutual Insurance (demo)</td></tr><tr><td>Policy number</td><td>PL-${r.id}77${o.id}</td></tr>
          <tr><td>Public liability</td><td>€${r.reason === 'Insufficient Monetary Coverage' ? '2,600,000' : '6,500,000'} any one event</td></tr>
          <tr><td>Employers' liability</td><td>${r.reason === "Missing Employers' Liability Insurance" ? '<span style="color:var(--red)">— not stated —</span>' : '€13,000,000'}</td></tr>
          <tr><td>Period of cover</td><td>01 Jan 2027 – ${r.reason === 'Insufficient Duration Coverage' ? '31 Aug 2027' : '31 Dec 2027'}</td></tr>
          <tr><td>Indemnity to principal</td><td>National Ploughing Association</td></tr></table>
          <div class="ln" style="width:92%;margin-top:22px"></div><div class="ln" style="width:80%"></div><div class="ln" style="width:86%"></div><div class="ln" style="width:60%"></div>
          <div class="row" style="justify-content:space-between;align-items:flex-end;margin-top:10px">
            <div><div class="dim small">Broker signature</div><div style="font-family:cursive;font-size:20px;color:#2b4a6b;margin-top:6px">${r.reason === 'Not Signed by Broker' ? '' : 'D. Quinlan'}</div></div>
            ${r.reason === 'Not Stamped by Broker' ? '' : '<span class="stamp">QUINLAN BROKERS LTD<br><span style="font-weight:500">Authorised · 2027</span></span>'}</div>
        </div></div></div>
      <div class="grid" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Order</h3><a class="r small" href="#/orders/${o.id}">Open order form →</a></div><div class="card-b grid" style="gap:8px;font-size:13px">
          <div class="row"><span class="muted" style="width:110px">Exhibitor</span><b>${esc(o.company.name)}</b></div>
          <div class="row"><span class="muted" style="width:110px">Account</span>${esc(U(o).username)} ${ctag(o.clientType)}</div>
          <div class="row"><span class="muted" style="width:110px">Contact</span>${esc(o.account.first)} ${esc(o.account.last)} · ${esc(o.account.email)}</div>
          <div class="row"><span class="muted" style="width:110px">Stand</span>${loc(o)}</div>
          <div class="row"><span class="muted" style="width:110px">Declared</span>${[o.employersIns && "Employers' ins.", o.publicProductsIns && 'Public & products', o.specificIndemnity && 'Specific indemnity', o.noEmployees && 'No employees'].filter(Boolean).join(' · ') || '–'}</div>
          <div class="row"><span class="muted" style="width:110px">Uploaded</span>${fdt(r.uploadedAt)}</div>
        </div></div>
        <div class="card"><div class="card-h"><h3>Decision</h3>${r.reviewedAt ? `<span class="r muted small">Last reviewed ${fdt(r.reviewedAt)} by ${esc(r.reviewer)}</span>` : ''}</div><div class="card-b grid" style="gap:12px" id="decide">
          <div><div class="muted small" style="margin-bottom:6px;font-weight:600">Check the document against NPA's criteria</div><div class="crit">${D.settings.insuranceCriteria.map((c, i) => `<label><input type="checkbox" data-reason="${esc(c.reason)}" ${r.status === 'Approved' ? 'checked' : ''} onchange="A.critUI()"> ${esc(c.check)}</label>`).join('')}</div><div class="dim small" style="margin-top:6px">Anything left unticked selects Reject with the matching reason. <a href="#/settings/insurance">Edit criteria</a></div></div>
          <div class="optchips"><label><input type="radio" name="dec" value="Approved" ${r.status !== 'Rejected' ? 'checked' : ''} onchange="A.decUI()"> Approve</label><label><input type="radio" name="dec" value="Rejected" ${r.status === 'Rejected' ? 'checked' : ''} onchange="A.decUI()"> Reject</label></div>
          <div id="rej" style="display:${r.status === 'Rejected' ? 'grid' : 'none'};gap:12px">${F('Rejection reason', 'reason', r.reason || REASONS[0], 'select', { opts: REASONS })}${F('Note to exhibitor', 'note', r.note, 'textarea', { rows: 3, ph: 'Optional. Included in the rejection email.' })}</div>
          ${F('Email the exhibitor the outcome', 'email', true, 'checkbox', { help: `Sends to ${esc(o.account.email)}` })}
          <div class="row"><button class="btn pri" style="flex:1;justify-content:center" onclick="A.decide(${r.id})">${ic('check')}Save decision${queue.filter(x => x !== r).length ? ' and open next' : ''}</button></div>
        </div></div>
        ${prior.length ? `<div class="card"><div class="card-h"><h3>Earlier uploads for this order</h3></div>${prior.map(p => `<div class="ra"><div style="flex:1"><a href="#/insurance/${p.id}">#${p.id}</a> ${pill(p.status)}<small>${esc(p.reason || '')} ${fdt(p.uploadedAt)}</small></div></div>`).join('')}</div>` : ''}
      </div></div>`);
}
A.critUI = () => {
  const miss = [...document.querySelectorAll('.crit input')].filter(x => !x.checked);
  document.querySelector(`input[name=dec][value=${miss.length ? 'Rejected' : 'Approved'}]`).checked = true;
  if (miss.length) document.querySelector('#rej [name=reason]').value = miss[0].dataset.reason;
  A.decUI();
};
A.decUI = () => { const v = document.querySelector('input[name=dec]:checked').value; document.getElementById('rej').style.display = v === 'Rejected' ? 'grid' : 'none'; };
A.decide = id => {
  const r = D.ins.find(x => x.id === id);
  const box = document.getElementById('decide');
  const v = collect(box, {});
  const status = box.querySelector('input[name=dec]:checked').value;
  decide(r, status, status === 'Rejected' ? v.reason : '', status === 'Rejected' ? v.note : '', v.email);
  toast(`Insurance ${status.toLowerCase()}${v.email ? ' · exhibitor emailed' : ''}`);
  const nx = D.ins.find(x => x.status === 'Pending');
  location.hash = nx ? '#/insurance/' + nx.id : '#/insurance';
};
