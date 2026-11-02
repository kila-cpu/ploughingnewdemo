// Order forms, purchase orders, payment logs, corner allocations, woodbark.

function priceOrder(o) {
  const s = D.settings, indoor = o.clientType === 'IN', e = s.electricity;
  const tier = D.tierFor(indoor ? s.indoorDates : s.outdoorDates, o.submittedDate || now());
  const space = (+o.frontage || 0) * tier.price;
  const corner = indoor && o.hasCorner ? s.cornerPremium : 0;
  const elec = o.util.noElec ? 0 : (+o.util.qtyWt || 0) * e.rateWt + (+o.util.qtyAmp || 0) * e.rateAmp;
  const water = o.util.water ? e.waterRate : 0;
  const litter = indoor ? 0 : e.litterRate;
  const net = space + corner + elec + water + litter;
  const vat = net * s.system.vat / 100;
  return { tier, space, corner, elec, water, litter, net, vat, total: +(net + vat).toFixed(2) };
}
const structureText = o => [o.structure.marquee && 'Marquee', o.structure.shed && 'Shed', o.structure.mobile && 'Mobile unit', o.structure.caravan && 'Caravan', o.structure.none && 'No structure'].filter(Boolean).join(', ') || '–';
const elecText = o => o.util.noElec ? 'None' : [o.util.qtyWt && `${o.util.qtyWt} × 6kW`, o.util.qtyAmp && `${o.util.qtyAmp} × 3ph`].filter(Boolean).join(', ') || 'None';

// ---------- order forms ----------
function vOrders() {
  return shell([['Order'], ['Order forms']], head('Order forms', 'Every booking submitted through the exhibitor portal. Open one to view or edit what the exhibitor entered.',
    btn('Export CSV', 'A.exportOrders()', '', 'download') + link('Add order form', '#/orders/add', 'pri', 'plus')) + listView({
    key: 'orders', coll: 'orders', noun: 'order forms', rows: D.orders, link: o => '#/orders/' + o.id, searchPh: 'Search ID, username, company or stand',
    search: [o => o.id, o => U(o).username, o => o.company.name, o => loc(o), o => o.account.email],
    cols: [{ h: 'ID', v: o => o.id }, { h: 'Username', v: o => U(o).username }, { h: 'Company name', v: o => o.company.name },
      { h: 'Client type', v: o => o.clientType, html: o => ctag(o.clientType) }, { h: 'Location', v: o => loc(o), html: o => `<span class="small">${esc(loc(o))}</span>` },
      { h: 'Grand total', v: o => o.grandTotal, html: o => money(o.grandTotal), num: true }, { h: 'Submitted date', v: o => o.submittedDate || '', html: o => fd(o.submittedDate) },
      { h: 'Submitted', v: o => o.submitted, html: o => yesNo(o.submitted) }, { h: 'Completed', v: o => o.completed, html: o => yesNo(o.completed) },
      { h: 'Insurance status', v: o => o.insuranceStatus, html: o => pill(o.insuranceStatus) }, { h: 'Paid via Stripe', v: o => o.paidStripe, html: o => o.paidStripe ? '<b class="yes">Yes</b>' : '<span class="dim">No</span>' }],
    filters: [{ label: 'submitted', k: 'submitted', opts: yn(o => o.submitted) }, { label: 'completed', k: 'completed', opts: yn(o => o.completed) },
      { label: 'insurance status', k: 'ins', get: o => o.insuranceStatus, opts: ['Pending Review', 'Approved', 'Rejected', 'Not uploaded'].map(x => [x, x]) },
      { label: 'client type', k: 'ct', get: o => o.clientType, opts: [['IN', 'Indoor'], ['OU', 'Outdoor']] },
      { label: 'venue', k: 'venue', get: o => o.venue || 'Outdoor', opts: ['Outdoor', ...D.VENUES].map(x => [x, x]) },
      { label: 'paid via Stripe', k: 'paid', opts: yn(o => o.paidStripe) }],
    bulk: [['Mark selected as completed', ids => { D.orders.filter(o => ids.includes(String(o.id))).forEach(o => o.completed = true); toast(`Marked ${ids.length} orders completed`); }],
      ['Email selected exhibitors', ids => { compose.aud = 'selected'; compose.ids = ids.map(Number); location.hash = '#/emails/compose'; }],
      ['Export selected to CSV', ids => exportOrders(D.orders.filter(o => ids.includes(String(o.id))))],
      ['Show stand details to exhibitors', ids => { D.orders.filter(o => ids.includes(String(o.id))).forEach(o => o.showStand = true); toast(`Stand details now visible for ${ids.length} exhibitors`); }]],
    foot: rows => `Total ${money(sum(rows, o => o.grandTotal))}`
  }));
}
function exportOrders(rows) {
  const keys = ['id', 'code', 'company', 'contact', 'email', 'mobile', 'clientType', 'venue', 'category', 'row', 'block', 'stand', 'unit', 'frontage', 'grandTotal', 'submittedDate', 'insurance', 'paid'];
  csv('order-forms.csv', keys.map(k => RF[k][0]), rows.map(o => keys.map(k => RF[k][1](o))));
}
A.exportOrders = () => { listView(lists.orders); exportOrders(D.orders.filter(o => lists.orders.visible.includes(String(o.id)))); };

function blankOrder(userId) {
  const u = D.users.find(x => x.id === userId) || D.users.find(x => !x.staff);
  const t = structuredClone(D.orders[0]);
  const indoor = u.clientType === 'IN';
  Object.assign(t, { id: Math.max(...D.orders.map(o => o.id)) + 1, userId: u.id, clientType: u.clientType || 'OU', venue: indoor ? (u.perms.venues[0] || D.VENUES[0]) : '', submitted: false, submittedDate: '', completed: false, acceptedTC: false,
    insuranceStatus: 'Not uploaded', paidStripe: false, sharingWith: '', particulars: '', otherInfo: '', marquee: '', row: '', block: '', stand: '', unit: '', showStand: false, comments: '',
    frontage: indoor ? 1 : 6, is18m: false, hasCorner: false, cornerStatus: 'No Corner', grandTotal: 0, pdf: '', invoice: '', insuranceFile: '', history: [], isNew: true,
    account: { first: u.first, last: u.last, landline: u.landline, email: u.email }, company: { ...t.company, name: u.name, signage: u.name.toUpperCase() } });
  t.pay = { card: false, full: false, submitted: false, bank: false, cheque: false, po: false, poNumber: '', terms: false, marketing: false, confirmed: false, txn: '' };
  t.util = { qtyWt: 0, qtyAmp: 0, noElec: true, water: false, amount: 0, vat: 0, total: 0, litter: 0 };
  return t;
}
A.newOrderFor = uid => { draftKey = 'order:add'; draftPath = 'orders/add'; draft = blankOrder(uid); location.hash = '#/orders/add'; };

function vOrder(id) {
  const src = id === 'add' ? null : orderById(id);
  if (id !== 'add' && !src) return notFound('Order form');
  const o = useDraft('order:' + id, () => src ? structuredClone(src) : blankOrder());
  const indoor = o.clientType === 'IN';
  const p = priceOrder(o);
  const u = U(o);
  const cs = cornerStats().find(c => c.venue === o.venue);
  const insRows = D.ins.filter(r => r.orderId === o.id);
  const poRows = D.pos.filter(x => x.orderId === o.id);
  const logRows = D.payLogs.filter(l => l.orderId === o.id);
  const exhibitors = D.users.filter(x => !x.staff).map(x => [x.id, `${x.username} — ${x.name}`]);
  const title = o.isNew ? 'Add order form' : `${o.clientType} Form # ${o.id}, User: ${esc(u.username)}`;
  const priceRow = (l, v, b) => `<tr><td${b ? ' style="font-weight:700"' : ''}>${l}</td><td class="num"${b ? ' style="font-weight:700"' : ''}>${money(v)}</td></tr>`;
  const t = (head_, rows, empty) => rows.length ? `<div class="tbl-wrap"><table class="t"><thead><tr>${head_.map(h => `<th class="nosort">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<div class="empty" style="padding:22px">${empty}</div>`;
  return shell([['Order'], ['Order forms', '#/orders'], [o.isNew ? 'Add order form' : `${o.clientType} Form # ${o.id}`]], `
    ${head(title, o.isNew ? 'Create a booking on behalf of an exhibitor.' : `Started ${fdt(o.history[0]?.at)} via the exhibitor portal`,
      o.isNew ? '' : btn('Duplicate order', 'A.dupOrder()', '', 'copy') + btn('History', 'A.orderHistory()', '', 'history'))}
    <div class="card" style="margin-bottom:6px"><div class="form-top">
      <div><div class="muted small">Exhibitor</div><b style="font-size:16px">${esc(o.company.name || u.name)}</b> <span class="muted">${esc(u.username)}</span> ${ctag(o.clientType)}</div>
      <div class="row wrap" style="gap:6px">${o.submitted ? pill('Submitted', 'green') : pill('Not submitted', 'grey')}${o.completed ? pill('Completed', 'green') : ''}${pill('Insurance: ' + o.insuranceStatus, PILL[o.insuranceStatus])}${o.pay.confirmed ? pill('Paid', 'green') : o.pay.po ? pill('Paying by PO', 'blue') : o.submitted ? pill('Unpaid', 'orange') : ''}</div>
      <div style="margin-left:auto;text-align:right"><div class="muted small">Grand total</div><div class="big">${money(o.isNew ? p.total : o.grandTotal)}</div></div>
    </div></div>
    ${jump([['booking', 'Booking'], ['stand', 'Stand location'], ['status', 'Status & insurance'], ['account', 'Account'], ['company', 'Company'], ['space', 'Exhibition space'], ['structure', 'Structure'], ['utilities', 'Utilities'], ['payment', 'Payment'], ['invoice', 'Invoices'], ['related', 'Reviews, POs & logs']])}
    <form id="form" onsubmit="return false">
    ${sec('booking', 'Booking', fields([
      F('User', 'userId', o.userId, 'select', { num: true, opts: exhibitors, on: 'A.orderLive()' }), F('Client type', 'clientType', o.clientType, 'select', { opts: [['OU', 'Outdoor (OU Form)'], ['IN', 'Indoor (IN Form)']], on: 'A.orderLive()' }),
      F('Grand total', '', '', 'ro', { html: `${money(p.total)} <span class="dim small" style="font-weight:500">calculated · ${esc(p.tier.label)} rate</span>` }),
      F('Submitted date', 'submittedDate', (o.submittedDate || '').slice(0, 10), 'date', { help: 'Decides which date-based rate applies. See Settings → Indoor/Outdoor dates.', on: 'A.orderLive()' }),
      `<div class="f full"><div class="chkgrid">${[F('Is manufacturer', 'manufacturer', o.manufacturer, 'checkbox'), F('Is exporter', 'exporter', o.exporter, 'checkbox'), F("Employers' ins", 'employersIns', o.employersIns, 'checkbox'),
        F('Public products ins', 'publicProductsIns', o.publicProductsIns, 'checkbox'), F('Specific indemnity', 'specificIndemnity', o.specificIndemnity, 'checkbox'), F('No employees', 'noEmployees', o.noEmployees, 'checkbox')].join('')}</div></div>`,
      F('Sharing with', 'sharingWith', o.sharingWith, 'textarea', { rows: 2, ph: 'Other companies sharing this stand' }), F('Particulars', 'particulars', o.particulars, 'textarea', { rows: 2 }),
      F('Other information', 'otherInfo', o.otherInfo, 'textarea', { rows: 2 }), F('Marquee', 'marquee', o.marquee, 'textarea', { rows: 2 })]))}
    ${sec('stand', 'Stand location', fields([
      indoor ? F('Venue', 'venue', o.venue, 'select', { opts: D.VENUES, on: 'A.orderLive()' }) : F('Row', 'row', o.row),
      F('Block', 'block', o.block), F('Stand', 'stand', o.stand), indoor ? F('Unit number', 'unit', o.unit) : '',
      F('Show stand details to exhibitor', 'showStand', o.showStand, 'checkbox', { full: true, help: 'When enabled, exhibitors can see their stand, row, and block numbers on their dashboard.' }),
      F('Comments', 'comments', o.comments, 'textarea', { full: true, rows: 2, ph: 'Internal notes, not shown to the exhibitor' })], 'three'))}
    ${sec('status', 'Status & insurance', fields([
      `<div class="f full"><div class="chkgrid">${[F('Submitted', 'submitted', o.submitted, 'checkbox'), F('Completed', 'completed', o.completed, 'checkbox'), F('Accepted T&C', 'acceptedTC', o.acceptedTC, 'checkbox')].join('')}</div></div>`,
      F('PDF', '', '', 'ro', { html: o.pdf ? `<a href="javascript:A.fakeOpen('${o.pdf}')">${o.pdf}</a>` : '<span class="dim">Generated when submitted</span>' }),
      F('Paid via Stripe', '', '', 'ro', { html: o.paidStripe ? '<span class="yes">Yes</span>' : 'No' }),
      F('Insurance form', 'insuranceFile', o.insuranceFile, 'file'),
      F('Insurance status', 'insuranceStatus', o.insuranceStatus, 'select', { opts: ['Not uploaded', 'Pending Review', 'Approved', 'Rejected'], help: insRows.length ? `<a href="#/insurance/${insRows[0].id}">Open insurance review #${insRows[0].id} →</a>` : '' }),
      F('Categories', 'categories', o.categories, 'multi', { full: true, num: true, opts: D.CATEGORIES.filter(c => c.area === 'Both' || c.area === (indoor ? 'Indoor' : 'Outdoor')).map(c => [c.id, c.name]) })]))}
    ${sec('account', 'Account', fields([F('Firstname', 'account.first', o.account.first), F('Lastname', 'account.last', o.account.last), F('Landline', 'account.landline', o.account.landline), F('Email', 'account.email', o.account.email, 'email')]), { note: `Account: ${esc(o.account.first)} ${esc(o.account.last)}` })}
    ${sec('company', 'Company', fields([
      F('Company name', 'company.name', o.company.name), F('Website', 'company.website', o.company.website), F('Address line 1', 'company.addr1', o.company.addr1), F('Address line 2', 'company.addr2', o.company.addr2),
      F('City', 'company.city', o.company.city), F('County', 'company.county', o.company.county, 'select', { opts: D.COUNTIES }), F('Country', 'company.country', o.company.country, 'select', { opts: D.COUNTRIES }),
      F('Postcode', 'company.postcode', o.company.postcode), F('Landline', 'company.landline', o.company.landline), F('Mobile', 'company.mobile', o.company.mobile), F('Email', 'company.email', o.company.email, 'email'),
      F('Site contact name', 'company.siteName', o.company.siteName), F('Site contact number', 'company.siteNumber', o.company.siteNumber),
      F('VAT registration country', 'company.vatCountry', o.company.vatCountry, 'select', { opts: D.COUNTRIES }), F('VAT registration number', 'company.vatNumber', o.company.vatNumber),
      F('VAT percentage', 'company.vatPct', o.company.vatPct, 'number'), F('VAT exemption number', 'company.vatExemptNo', o.company.vatExemptNo),
      `<div class="f"><div class="chkgrid">${F('No VAT', 'company.noVat', o.company.noVat, 'checkbox')}${F('VAT exempt', 'company.vatExempt', o.company.vatExempt, 'checkbox')}</div></div>`,
      F('Form 56B', 'company.form56b', o.company.form56b || '', 'file'), F('Signatory firstname', 'company.signFirst', o.company.signFirst), F('Signatory lastname', 'company.signLast', o.company.signLast),
      F('Trade arena signage', 'company.signage', o.company.signage, 'text', { help: 'Printed on the stand fascia board.' })], 'three'), { note: `Company: ${esc(o.company.name)}` })}
    ${sec('space', 'Exhibition space', fields([
      F('Category', 'category', o.category, 'select', { num: true, opts: D.CATEGORIES.map(c => [c.id, c.name]), help: 'Category this exhibition space belongs to' }),
      F(indoor ? 'Units (3x3m stands)' : 'Frontage (metres)', 'frontage', o.frontage, 'number', { on: 'A.orderLiveSoft()' }), F('Admin depth', 'adminDepth', o.adminDepth, 'number'),
      indoor ? '' : F('Is 18m or partitions', 'is18m', o.is18m, 'checkbox'),
      `<div class="f full"><label class="l">Corner information</label>${indoor ? `<div class="row wrap" style="gap:14px">${F('Has corner', 'hasCorner', o.hasCorner, 'checkbox', { on: 'A.orderLive()' })}
         <div style="min-width:220px">${F('Corner status', 'cornerStatus', o.cornerStatus, 'select', { opts: ['No Corner', 'Requested', 'Allocated'] })}</div>
         <span class="muted small">${cs ? `${esc(o.venue)}: <b>${cs.left}</b> of ${cs.total} corners left · <a href="#/corners">Corner allocations</a>` : ''}</span></div>`
        : `<div class="banner" style="margin:0">${ic('info')} Outdoor stands can't book corners.</div>`}</div>`,
      `<div class="f full"><label class="l">Pricing</label><div class="card" style="box-shadow:none"><table class="t"><tbody>
        <tr><td>Space — ${o.frontage} × ${money(p.tier.price)} <span class="dim">(${esc(p.tier.label)}, ${esc(p.tier.unit)})</span></td><td class="num">${money(p.space)}</td></tr>
        ${p.corner ? priceRow('Corner premium', p.corner) : ''}${priceRow('Electricity', p.elec)}${p.water ? priceRow('Water', p.water) : ''}${p.litter ? priceRow('Litter', p.litter) : ''}
        ${priceRow('Net', p.net)}${priceRow(`VAT ${D.settings.system.vat}%`, p.vat)}${priceRow('Grand total', p.total, true)}</tbody></table></div></div>`]), { note: `Exhibition space: ${esc(catName(o.category))}` })}
    ${sec('structure', 'Type of structure', fields([
      `<div class="f full"><div class="chkgrid">${[F('No structure', 'structure.none', o.structure.none, 'checkbox'), F('Marquee', 'structure.marquee', o.structure.marquee, 'checkbox'), F('Shed', 'structure.shed', o.structure.shed, 'checkbox'),
        F('Mobile unit', 'structure.mobile', o.structure.mobile, 'checkbox'), F('Caravan mobile', 'structure.caravan', o.structure.caravan, 'checkbox'), F('Has security', 'structure.security', o.structure.security, 'checkbox', { help: 'Do you intend on having security on exhibition?' })].join('')}</div></div>`,
      F('External dimensions', 'structure.dims', o.structure.dims), F('Frontage', 'structure.frontage', o.structure.frontage, 'number'), F('Depth', 'structure.depth', o.structure.depth, 'number'),
      F('Other', 'structure.other', o.structure.other), F('Marquee supplier', 'structure.supplier', o.structure.supplier), F('Marquee supplier address', 'structure.supplierAddr', o.structure.supplierAddr), F('Marquee supplier phone', 'structure.supplierPhone', o.structure.supplierPhone)], 'three'))}
    ${sec('utilities', 'Utilities', fields([
      F('Quantity WT / 6kW', 'util.qtyWt', o.util.qtyWt, 'number', { help: money(D.settings.electricity.rateWt) + ' each', on: 'A.orderLiveSoft()' }), F('Quantity Amp / 3ph', 'util.qtyAmp', o.util.qtyAmp, 'number', { help: money(D.settings.electricity.rateAmp) + ' each', on: 'A.orderLiveSoft()' }),
      F('No electricity', 'util.noElec', o.util.noElec, 'checkbox'), F('Water', 'util.water', o.util.water, 'checkbox', { help: money(D.settings.electricity.waterRate) + ' + VAT' }),
      F('Amount', '', '', 'ro', { html: money(p.elec + p.water) }), F('VAT', '', '', 'ro', { html: money((p.elec + p.water) * .23) }), F('Total amount', '', '', 'ro', { html: money((p.elec + p.water) * 1.23) }), F('Litter rate', '', '', 'ro', { html: money(p.litter) })], 'three'))}
    ${sec('payment', 'Payment', fields([
      `<div class="f full"><div class="chkgrid">${[F('By card', 'pay.card', o.pay.card, 'checkbox'), F('By bank', 'pay.bank', o.pay.bank, 'checkbox'), F('By cheque', 'pay.cheque', o.pay.cheque, 'checkbox'), F('By PO', 'pay.po', o.pay.po, 'checkbox'),
        F('Is full amount', 'pay.full', o.pay.full, 'checkbox'), F('Is payment submitted', 'pay.submitted', o.pay.submitted, 'checkbox'), F('Payment confirmed', 'pay.confirmed', o.pay.confirmed, 'checkbox'),
        F('Terms accepted', 'pay.terms', o.pay.terms, 'checkbox'), F('Marketing consent', 'pay.marketing', o.pay.marketing, 'checkbox')].join('')}</div></div>`,
      F('PO number', 'pay.poNumber', o.pay.poNumber), F('Transaction id', 'pay.txn', o.pay.txn, 'text', { ph: 'pi_…' }), F('Proof of payment', 'pay.proof', o.pay.proof || '', 'file')], 'three'))}
    ${sec('invoice', 'Invoices & receipt', fields([
      F('Exhibition invoice', '', '', 'ro', { html: o.invoice ? `<a href="javascript:A.fakeOpen('${o.invoice}')">${o.invoice}</a>` : '<span class="dim">–</span>' }),
      F('Litter invoice', '', '', 'ro', { html: '<span class="dim">–</span>' }), F('Water invoice', '', '', 'ro', { html: o.util.water && o.invoice ? `<a href="javascript:A.fakeOpen('water')">invoices/water_${o.id}.pdf</a>` : '<span class="dim">–</span>' }),
      F('Receipt file', '', '', 'ro', { html: o.pay.confirmed ? `<a href="javascript:A.fakeOpen('receipt')">receipts/receipt_${o.id}.pdf</a>` : '<span class="dim">–</span>' })]))}
    <section class="card sec" id="s-related"><div class="card-h"><h3>Insurance reviews</h3><div class="r">${o.isNew ? '' : btn('Add insurance review', `A.addInsReview(${o.id})`, 'sm', 'plus')}</div></div>
      ${t(['ID', 'Status', 'Reason', 'Uploaded', 'Reviewed'], insRows.map(r => `<tr><td><a class="lnk" href="#/insurance/${r.id}">#${r.id}</a></td><td>${pill(r.status)}</td><td>${esc(r.reason) || '–'}</td><td>${fdt(r.uploadedAt)}</td><td>${fdt(r.reviewedAt)}</td></tr>`), 'No insurance uploaded yet')}
      <div class="card-h" style="border-top:1px solid var(--line-2);background:var(--brand-50)"><h3 style="color:var(--brand-800);text-transform:uppercase;font-size:12px;letter-spacing:.7px">Purchase orders</h3><div class="r">${o.isNew ? '' : btn('Add purchase order', `A.poModal(${o.id})`, 'sm', 'plus')}</div></div>
      ${t(['PO number', 'Amount', 'Created at', 'Status', 'Notes'], poRows.map(x => `<tr><td>${esc(x.number)}</td><td class="num">${money(x.amount)}</td><td>${fdt(x.createdAt)}</td><td>${pill(x.status)}</td><td>${esc(x.notes) || '–'}</td></tr>`), 'No purchase orders')}
      <div class="card-h" style="border-top:1px solid var(--line-2);background:var(--brand-50)"><h3 style="color:var(--brand-800);text-transform:uppercase;font-size:12px;letter-spacing:.7px">Payment processing log</h3></div>
      ${t(['Created at', 'Level', 'Step', 'Message'], logRows.map(l => `<tr><td>${fdt(l.at)}</td><td>${pill(l.level)}</td><td class="mono">${esc(l.step)}</td><td>${esc(l.msg)}</td></tr>`), 'No card payments for this order')}
    </section>
    </form>
    ${savebar('A.saveOrder', o.isNew ? '' : 'A.delOrder()')}`);
}
A.orderLive = () => { collect(document.getElementById('form'), draft); if (draft.clientType === 'OU') { draft.venue = ''; draft.hasCorner = false; draft.cornerStatus = 'No Corner'; } else if (!draft.venue) draft.venue = D.VENUES[0]; if (!draft.hasCorner) draft.cornerStatus = 'No Corner'; const y = scrollY; render(); scrollTo(0, y); };
A.orderLiveSoft = () => { clearTimeout(A._t); A._t = setTimeout(() => { const a = document.activeElement?.name; A.orderLive(); if (a) { const el = document.querySelector(`[name="${a}"]`); el?.focus(); } }, 450); };
A.saveOrder = mode => {
  collect(document.getElementById('form'), draft);
  const isNew = draft.isNew; delete draft.isNew;
  const u = D.users.find(x => x.id === draft.userId);
  draft.grandTotal = priceOrder(draft).total;
  if (draft.submittedDate && draft.submittedDate.length === 10) draft.submittedDate = new Date(draft.submittedDate + 'T12:00:00').toISOString();
  draft.history.push({ at: now(), who: 'CRM_ADMIN', what: isNew ? 'Added via admin' : 'Changed via admin' });
  if (isNew) D.orders.unshift(draft); else D.orders[D.orders.findIndex(o => o.id === draft.id)] = draft;
  const r = D.ins.find(x => x.orderId === draft.id);
  if (r && draft.insuranceStatus !== 'Not uploaded') r.status = draft.insuranceStatus === 'Pending Review' ? 'Pending' : draft.insuranceStatus;
  pushRecent(isNew ? 'add' : 'edit', `${draft.clientType} Form # ${draft.id}, User: ${u.username}`, 'Order form', '#/orders/' + draft.id);
  toast(`The order form “${draft.clientType} Form # ${draft.id}” was ${isNew ? 'added' : 'changed'} successfully.`);
  const id = draft.id; draftKey = null;
  location.hash = mode === 'done' ? '#/orders' : mode === 'add' ? '#/orders/add' : '#/orders/' + id;
  render();
};
A.delOrder = () => confirmBox('Delete order form?', `Delete <b>${draft.clientType} Form # ${draft.id}</b>? Its insurance reviews, purchase orders and logs go with it.`, 'Yes, delete', () => {
  D.orders = D.orders.filter(o => o.id !== draft.id); D.ins = D.ins.filter(r => r.orderId !== draft.id); D.pos = D.pos.filter(p => p.orderId !== draft.id);
  pushRecent('del', `${draft.clientType} Form # ${draft.id}`, 'Order form'); toast('Order form deleted'); draftKey = null; location.hash = '#/orders';
}, true);
A.dupOrder = () => {
  const c = structuredClone(draft);
  Object.assign(c, { id: Math.max(...D.orders.map(o => o.id)) + 1, submitted: false, completed: false, submittedDate: '', paidStripe: false, insuranceStatus: 'Not uploaded', insuranceFile: '', pdf: '', invoice: '', stand: '', unit: '', hasCorner: false, cornerStatus: 'No Corner', history: [{ at: now(), who: 'CRM_ADMIN', what: `Duplicated from # ${draft.id}` }] });
  c.pay = { ...c.pay, confirmed: false, submitted: false, txn: '' };
  D.orders.unshift(c); pushRecent('add', `${c.clientType} Form # ${c.id}`, 'Order form', '#/orders/' + c.id);
  toast(`Duplicated as # ${c.id}. Stand and payment details were cleared.`); location.hash = '#/orders/' + c.id;
};
A.orderHistory = () => modal('History · ' + draft.clientType + ' Form # ' + draft.id, draft.history.slice().reverse().map(h => `<div class="ra" style="padding:10px 0"><span class="dot" style="background:var(--amber-50);color:#a47506">${ic('edit', '')}</span><div>${esc(h.what)}<small>${esc(h.who)} · ${fdt(h.at)}</small></div></div>`).join(''));
A.addInsReview = oid => {
  const o = orderById(oid);
  const r = { id: Math.max(...D.ins.map(x => x.id)) + 1, orderId: oid, status: 'Pending', reason: '', note: '', uploadedAt: now(), reviewedAt: null, reviewer: '', file: o.insuranceFile || `insurance_${U(o).code.toLowerCase()}_2027.pdf` };
  D.ins.unshift(r); o.insuranceStatus = 'Pending Review'; draftKey = null; location.hash = '#/insurance/' + r.id;
};

// ---------- purchase orders ----------
function vPOs(id) {
  if (id === 'add') { setTimeout(() => A.poModal()); location.hash = '#/pos'; return ''; }
  return shell([['Order'], ['Purchase orders']], head('Purchase orders', 'Exhibitors paying by PO. Approve once accounts have matched the PO.', btn('Add purchase order', 'A.poModal()', 'pri', 'plus')) + listView({
    key: 'pos', coll: 'pos', noun: 'purchase orders', rows: D.pos, link: x => '#/orders/' + x.orderId, search: [x => x.number, x => x.orderId, x => orderById(x.orderId)?.company.name],
    cols: [{ h: 'ID', v: x => x.id }, { h: 'Order', v: x => x.orderId, html: x => { const o = orderById(x.orderId); return o ? esc(formLabel(o)) : '#' + x.orderId; } }, { h: 'Company', v: x => orderById(x.orderId)?.company.name },
      { h: 'PO number', v: x => x.number }, { h: 'Amount', v: x => x.amount, html: x => money(x.amount), num: true }, { h: 'Created at', v: x => x.createdAt, html: x => fdt(x.createdAt) }, { h: 'Status', v: x => x.status, html: x => pill(x.status) }],
    filters: [{ label: 'status', k: 'status', get: x => x.status, opts: [['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']] }, { label: 'created at', k: 'c', opts: DATE_OPTS(x => x.createdAt) }],
    bulk: [['Approve selected', ids => { D.pos.filter(x => ids.includes(String(x.id))).forEach(x => x.status = 'Approved'); toast(`Approved ${ids.length} purchase orders`); }],
      ['Reject selected', ids => { D.pos.filter(x => ids.includes(String(x.id))).forEach(x => x.status = 'Rejected'); toast(`Rejected ${ids.length} purchase orders`); }]],
    foot: rows => 'Total ' + money(sum(rows, x => x.amount))
  }));
}
A.poModal = oid => {
  modal('Add purchase order', `<div id="poform" class="grid" style="gap:14px">${F('Order', 'orderId', oid || D.orders[0].id, 'select', { num: true, opts: D.orders.filter(o => o.submitted).map(o => [o.id, formLabel(o) + ' — ' + o.company.name]) })}
    ${F('PO number', 'number', '')}${F('Amount', 'amount', oid ? orderById(oid).grandTotal : '', 'number', { step: '0.01' })}${F('Status', 'status', 'Pending', 'select', { opts: ['Pending', 'Approved', 'Rejected'] })}${F('Notes', 'notes', '', 'textarea', { rows: 2 })}</div>`,
    `<button class="btn" onclick="A.close()">Cancel</button><button class="btn pri" onclick="A.savePO()">Save</button>`);
};
A.savePO = () => {
  const v = collect(document.getElementById('poform'), {});
  if (!v.number) return toast('PO number is required');
  D.pos.unshift({ id: Math.max(...D.pos.map(x => x.id), 0) + 1, createdAt: now(), ...v });
  const o = orderById(v.orderId); if (o) { o.pay.po = true; o.pay.poNumber = v.number; }
  A.close(); toast('Purchase order added'); draftKey = null; render();
};

// ---------- payment processing logs ----------
function vPayLogs() {
  const months = [...new Set(D.payLogs.map(l => l.at.slice(0, 7)))].sort();
  return shell([['Order'], ['Payment processing logs']], head('Payment processing logs', 'What happened at each step of a card payment. Back-end view, useful when an exhibitor says a payment failed.') + listView({
    key: 'paylogs', coll: 'payLogs', noun: 'log entries', rows: D.payLogs, nobulk: true, search: [l => l.orderId, l => l.msg, l => l.pi],
    chips: months.map(m => [m, new Date(m + '-01').toLocaleDateString('en-IE', { month: 'long', year: 'numeric' }), l => l.at.startsWith(m)]),
    cols: [{ h: 'Created at', v: l => l.at, html: l => fdt(l.at) }, { h: 'Level', v: l => l.level, html: l => pill(l.level) },
      { h: 'Order', v: l => l.orderId, html: l => orderById(l.orderId) ? `<a href="#/orders/${l.orderId}">Order #${l.orderId}</a>` : '<span class="dim">Order #' + l.orderId + '</span>' },
      { h: 'Step', v: l => l.step, html: l => `<span class="mono">${esc(l.step)}</span>` }, { h: 'Message', v: l => l.msg }, { h: 'Payment intent ID', v: l => l.pi, html: l => `<span class="mono dim">${esc(l.pi)}</span>` }],
    filters: [{ label: 'level', k: 'level', get: l => l.level, opts: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'].map(x => [x, x[0] + x.slice(1).toLowerCase()]) },
      { label: 'step', k: 'step', get: l => l.step, opts: ['start', 'brc_invoice', 'brc_receipt', 'email', 'complete', 'exception'].map(x => [x, x]) }, { label: 'created at', k: 'c', opts: DATE_OPTS(l => l.at) }]
  }));
}

// ---------- corner allocations ----------
function vCorners() {
  const cs = cornerStats();
  const rows = D.orders.filter(o => o.hasCorner);
  return shell([['Order'], ['Corner allocations']], `
    ${head('Corner allocations', 'How many corner stands each indoor venue has, and who has them. Exhibitors can only request a corner while some are left.', btn('Save inventories', 'A.saveCorners()', 'pri', 'check'))}
    <div class="banner warn">${ic('alert')}<div>Corners are <b>indoor only</b>. Outdoor exhibitors can't book a corner, so outdoor venues don't appear here.</div></div>
    <div class="grid g4" style="margin-bottom:16px" id="cinv">${cs.map((c, i) => {
      const used = c.alloc + c.held, pct = c.total ? Math.min(100, used / c.total * 100) : 100;
      return `<div class="card kpi"><div class="k">${ic('corner')}${esc(c.venue)}</div><div class="v">${c.left}<span class="dim" style="font-size:15px;font-weight:600"> left</span></div>
        <div class="bar ${pct >= 100 ? 'full' : pct > 75 ? 'warn' : ''}" style="margin:10px 0 8px"><i style="width:${pct}%"></i></div>
        <div class="s">${c.alloc} allocated · ${c.held} held by NPA · ${c.req} requested</div>
        <div class="grid g2" style="gap:8px;margin-top:12px">${F('Total corners', `c${i}.total`, c.total, 'number')}${F('Held back', `c${i}.held`, c.held, 'number')}</div></div>`;
    }).join('')}</div>
    <div class="card"><div class="card-h"><h3>Corner bookings</h3><span class="r muted small">${rows.length} order forms with a corner</span></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th class="nosort">Form</th><th class="nosort">Company</th><th class="nosort">Venue</th><th class="nosort">Stand</th><th class="nosort">Submitted</th><th class="nosort">Corner status</th><th class="nosort"></th></tr></thead><tbody>
      ${rows.map(o => `<tr><td><a class="lnk" href="#/orders/${o.id}">${esc(formLabel(o))}</a></td><td>${esc(o.company.name)}</td><td>${esc(o.venue)}</td><td>${esc(o.block + o.stand)}</td><td>${fd(o.submittedDate)}</td><td>${pill(o.cornerStatus)}</td>
        <td style="text-align:right">${o.cornerStatus === 'Requested' ? btn('Allocate', `A.corner(${o.id},'Allocated')`, 'sm ok', 'check') + ' ' + btn('Decline', `A.corner(${o.id},'No Corner')`, 'sm') : btn('Release', `A.corner(${o.id},'No Corner')`, 'sm')}</td></tr>`).join('')}
      </tbody></table></div></div>`);
}
A.saveCorners = () => { const v = collect(document.getElementById('cinv'), {}); D.settings.corners.forEach((c, i) => { c.total = v['c' + i].total; c.held = v['c' + i].held; }); toast('Corner inventories saved'); render(); };
A.corner = (id, st) => {
  const o = orderById(id);
  if (st === 'Allocated' && cornerStats().find(c => c.venue === o.venue).left <= 0) return toast(`No corners left in ${o.venue}. Raise the total first.`);
  o.cornerStatus = st; if (st === 'No Corner') o.hasCorner = false;
  o.grandTotal = priceOrder(o).total; o.history.push({ at: now(), who: 'CRM_ADMIN', what: 'Corner ' + (st === 'Allocated' ? 'allocated' : 'released') });
  toast(st === 'Allocated' ? `Corner allocated to ${o.company.name}` : 'Corner released'); render();
};

// ---------- woodbark ----------
const wbUser = w => D.users.find(u => u.id === w.userId) || {};
function wbTotal(w) { const r = D.settings.woodbarkRates; const lines = [[w.bags, r[0]], [w.half, r[1]], [w.spread ? 1 : 0, r[2]]]; return +sum(lines, ([q, x]) => q * x.price * (1 + x.vat / 100)).toFixed(2); }
function vWoodbark() {
  return shell([['Woodbark'], ['Woodbark orders']], head('Woodbark orders', 'Woodbark ordered by exhibitors for their stands. Delivered the Monday before the event.',
    btn('Delivery sheet', 'A.wbSheet()', '', 'download') + link('Add woodbark order', '#/woodbark/add', 'pri', 'plus')) + listView({
    key: 'woodbark', coll: 'woodbark', noun: 'woodbark orders', rows: D.woodbark, link: w => '#/woodbark/' + w.id, search: [w => w.id, w => wbUser(w).username, w => wbUser(w).name, w => w.delivery],
    cols: [{ h: 'ID', v: w => w.id }, { h: 'User', v: w => wbUser(w).username }, { h: 'Company name', v: w => wbUser(w).name }, { h: 'Bulk bags', v: w => w.bags, num: true }, { h: 'Half bags', v: w => w.half, num: true },
      { h: 'Spreading', v: w => w.spread, html: w => yesNo(w.spread) }, { h: 'Deliver to', v: w => w.delivery, html: w => `<span class="small">${esc(w.delivery)}</span>` },
      { h: 'Grand total', v: w => w.total, html: w => money(w.total), num: true }, { h: 'Submitted date', v: w => w.submittedDate, html: w => fd(w.submittedDate) }, { h: 'Status', v: w => w.status, html: w => pill(w.status) }],
    filters: [{ label: 'status', k: 'status', get: w => w.status, opts: ['New', 'Confirmed', 'Delivered'].map(x => [x, x]) }, { label: 'submitted date', k: 'd', opts: DATE_OPTS(w => w.submittedDate) }],
    bulk: [['Mark selected as confirmed', ids => setWb(ids, 'Confirmed')], ['Mark selected as delivered', ids => setWb(ids, 'Delivered')]],
    foot: rows => `${sum(rows, w => w.bags)} bulk bags · ${sum(rows, w => w.half)} half bags · ${money(sum(rows, w => w.total))}`
  }));
}
function setWb(ids, st) { D.woodbark.filter(w => ids.includes(String(w.id))).forEach(w => w.status = st); toast(`${ids.length} woodbark orders marked ${st.toLowerCase()}`); }
A.wbSheet = () => csv('woodbark-delivery-sheet.csv', ['Order', 'Account', 'Company', 'Deliver to', 'Bulk bags', 'Half bags', 'Spreading', 'Status'],
  D.woodbark.map(w => [w.id, wbUser(w).username, wbUser(w).name, w.delivery, w.bags, w.half, w.spread ? 'Yes' : 'No', w.status]));
function vWb(id) {
  const src = id === 'add' ? null : D.woodbark.find(w => w.id === +id);
  if (id !== 'add' && !src) return notFound('Woodbark order');
  const w = useDraft('wb' + id, () => src ? structuredClone(src) : { id: Math.max(...D.woodbark.map(x => x.id)) + 1, userId: D.users[0].id, bags: 1, half: 0, spread: false, delivery: '', status: 'New', notes: '', submittedDate: now(), isNew: true });
  const r = D.settings.woodbarkRates;
  return shell([['Woodbark'], ['Woodbark orders', '#/woodbark'], [w.isNew ? 'Add woodbark order' : 'Woodbark Order Form # ' + w.id]], `
    ${head(w.isNew ? 'Add woodbark order' : 'Woodbark Order Form # ' + w.id, w.isNew ? '' : `${esc(wbUser(w).name)} · submitted ${fdt(w.submittedDate)}`)}
    <form id="form" onsubmit="return false">
    ${sec('wb', 'Woodbark order', fields([F('User', 'userId', w.userId, 'select', { num: true, opts: D.users.filter(u => !u.staff).map(u => [u.id, u.username + ' — ' + u.name]) }),
      F('Status', 'status', w.status, 'select', { opts: ['New', 'Confirmed', 'Delivered'] }),
      F(r[0].product, 'bags', w.bags, 'number', { help: money(r[0].price) + ' + ' + r[0].vat + '% VAT each', on: 'A.wbLive()' }), F(r[1].product, 'half', w.half, 'number', { help: money(r[1].price) + ' + ' + r[1].vat + '% VAT each', on: 'A.wbLive()' }),
      F(r[2].product, 'spread', w.spread, 'checkbox', { help: money(r[2].price) + ' + VAT', on: 'A.wbLive()' }), F('Grand total', '', '', 'ro', { html: `<span id="wbtot">${money(wbTotal(w))}</span>` }),
      F('Deliver to', 'delivery', w.delivery, 'text', { ph: 'Row, block and stand', help: 'Filled from the exhibitor’s stand location when they order.' }), F('Notes', 'notes', w.notes, 'textarea', { rows: 2 })]))}
    </form>${savebar('A.saveWb', w.isNew ? '' : 'A.delWb()')}`);
}
A.wbLive = () => { const v = collect(document.getElementById('form'), structuredClone(draft)); document.getElementById('wbtot').textContent = money(wbTotal(v)); };
A.saveWb = mode => {
  collect(document.getElementById('form'), draft);
  const isNew = draft.isNew; delete draft.isNew;
  draft.total = wbTotal(draft);
  if (isNew) D.woodbark.unshift(draft); else D.woodbark[D.woodbark.findIndex(w => w.id === draft.id)] = draft;
  pushRecent(isNew ? 'add' : 'edit', 'Woodbark Order Form # ' + draft.id, 'Woodbark order', '#/woodbark/' + draft.id);
  toast(`Woodbark order # ${draft.id} saved`);
  const id = draft.id; draftKey = null;
  location.hash = mode === 'done' ? '#/woodbark' : mode === 'add' ? '#/woodbark/add' : '#/woodbark/' + id; render();
};
A.delWb = () => confirmBox('Delete woodbark order?', `Delete Woodbark Order Form # ${draft.id}?`, 'Yes, delete', () => { D.woodbark = D.woodbark.filter(w => w.id !== draft.id); toast('Woodbark order deleted'); draftKey = null; location.hash = '#/woodbark'; }, true);
