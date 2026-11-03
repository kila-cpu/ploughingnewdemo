// Seed data for the NPA Administration wireframes.
// Every name, code and figure here is invented. The client asked that what they
// shared stays confidential, so nothing is lifted from their screenshots beyond
// the shape of the records.
(function () {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const chance = p => rnd() < p;
  const iso = (y, m, d, h = 9, mi = 0) => new Date(y, m - 1, d, h, mi).toISOString();
  const daysAfter = (start, n, h) => { const d = new Date(start); d.setDate(d.getDate() + n); d.setHours(h ?? ri(8, 17), ri(0, 59)); return d.toISOString(); };
  const hex = n => Array.from({ length: n }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[ri(0, 61)]).join('');

  const VENUES = ['The Hub', 'The Dome', 'Agri Pavilion', 'Arcades'];
  // Outdoor exhibitors are placed in an area based on where they were in previous
  // years. They book space in that area; NPA allocates the stand number after close.
  const OUT_AREAS = ['Block 1 – Main Avenue', 'Block 2 – Machinery', 'Block 3 – Machinery', 'Block 4 – Farm Buildings', 'Block 5 – Livestock',
    'Block 6 – Forestry & Energy', 'Block 7 – Motor & Trucks', 'Block 8 – Trade Village'];
  const blockOf = area => (area.match(/^Block (\d+)/) || [])[1] || '';

  const CATEGORIES = [
    ['Tyres', 'Outdoor'], ['Tools', 'Both'], ['Renewable Energy - House & Home', 'Both'], ['Government Depts., State Bodies, Political Bodies', 'Both'],
    ['Health, Lifestyle, Tourism', 'Indoor'], ['Horticulture, Garden Equip, Garden Furniture', 'Outdoor'], ['Livestock - breeds', 'Outdoor'],
    ['Livestock - animal health', 'Both'], ['Livestock - equipment', 'Outdoor'], ['Machinery - plant', 'Outdoor'], ['Machinery - trailers', 'Outdoor'],
    ['Machinery - atvs', 'Outdoor'], ['Machinery - transporters', 'Outdoor'], ['Machinery', 'Outdoor'], ['Renewable Energy', 'Outdoor'],
    ['Retail - crafts', 'Indoor'], ['Retail - equine', 'Both'], ['Retail - canine', 'Both'], ['Rural Org, Religious, Charitable, NGO', 'Both'],
    ['Pumps and Allied Equipment', 'Outdoor'], ['Motor and Trucks', 'Outdoor'], ['House and Home', 'Indoor'], ['Forestry and Related Industries', 'Outdoor'],
    ['Food and Beverages', 'Indoor'], ['Buildings House and Home', 'Outdoor'], ['Buildings Farm', 'Outdoor'], ['Concrete', 'Outdoor'],
    ['Financial Services', 'Both'], ['Dairy', 'Outdoor'], ['Media, education, training', 'Indoor'], ['Infrastructure', 'Outdoor']
  ].map(([name, area], i) => ({ id: i + 1, name, area, active: true }));
  const catsFor = area => CATEGORIES.filter(c => c.area === area || c.area === 'Both');

  const COMPANIES = ['Barrow Valley Trailers', 'Slieve Bloom Tyres', 'Midland Agri Sales', 'Ballyfin Machinery', 'Nore Renewables', 'Castlecomer Sheds',
    'Portarlington Farm Supplies', 'Erkina Livestock Care', 'Heywood Garden Centre', 'Rathdowney Crafts', 'Killeshin Forestry', 'Abbeyleix Dairy Systems',
    'Stradbally Pumps', 'Mountmellick Motors', 'Durrow Concrete Products', 'Ballacolla Feeds', 'Timahoe Tools', 'Vicarstown Equine',
    'Ballinakill Home & Hearth', 'Clonaslee Solar', 'Emo Financial Services', 'Graiguecullen Tractors', 'Shanahoe Fencing', 'Ballybrittas Buildings',
    'Coolrain Canine Supplies', 'Errill Farm Safety', 'Cullahill Media', 'Aghaboe Food Co.', 'Raheen Rural Cover', 'Camross Health & Wellness',
    'Rosenallis Steel', 'Ballyroan ATVs', 'Borris Transporters', 'Kilcavan Horticulture', 'Arless Agri Tech', 'Luggacurren Feed Systems',
    'Clonad Engineering', 'Ballickmoyler Hardware', 'Cromoge Water Solutions', 'Wolfhill Agri Contracting', 'Coolkerry Crafts', 'Oughaval Organics',
    'Spink Steel Frames', 'Mayo Road Motors'];
  const FIRST = ['Seán', 'Aoife', 'Ciarán', 'Niamh', 'Pádraig', 'Siobhán', 'Declan', 'Gráinne', 'Tomás', 'Orla', 'Eoin', 'Máire', 'Liam', 'Clodagh', 'Darragh', 'Róisín', 'Colm', 'Deirdre'];
  const LAST = ['Brennan', 'Fitzgerald', 'Kavanagh', 'Delaney', 'Hennessy', 'Moran', 'Quinlan', 'Tierney', 'Mulcahy', 'Dunphy', 'Lalor', 'Phelan', 'Bergin', 'Fennelly'];
  const COUNTIES = ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford',
    'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
    'Antrim', 'Armagh', 'Derry', 'Down', 'Fermanagh', 'Tyrone'];
  const TOWNS = { Laois: 'Portlaoise', Kilkenny: 'Castlecomer', Offaly: 'Tullamore', Carlow: 'Bagenalstown', Tipperary: 'Thurles', Kildare: 'Athy', Wexford: 'Enniscorthy', Cork: 'Mallow', Galway: 'Ballinasloe', Westmeath: 'Mullingar', Meath: 'Navan', Tyrone: 'Dungannon' };
  const COUNTRIES = ['Ireland', 'Northern Ireland', 'United Kingdom', 'France', 'Germany', 'Netherlands', 'Italy', 'Denmark', 'Poland', 'United States'];

  const settings = {
    system: { eventName: 'National Ploughing Championships 2027', eventDates: '21 – 23 September 2027', bookingOpen: true, indoorOpen: true, outdoorOpen: true,
      vat: 23, adminEmail: 'bookings@npa.example', invoicePrefix: 'NPC27-', depositPct: 50, balanceDue: '2027-06-30',
      bookingClose: '2027-02-28', standsPublished: false },
    electricity: { rateWt: 165, rateAmp: 420, waterRate: 95, waterVat: 13.5, litterRate: 40, vatRate: 23 },
    indoorDates: [
      { id: 1, label: 'Early bird', until: '2026-09-30', price: 1150, unit: 'per 3x3m stand' },
      { id: 2, label: 'Standard', until: '2027-02-28', price: 1295, unit: 'per 3x3m stand' },
      { id: 3, label: 'Late booking', until: '2027-09-20', price: 1450, unit: 'per 3x3m stand' }],
    outdoorDates: [
      { id: 1, label: 'Early bird', until: '2026-09-30', price: 145, unit: 'per metre frontage' },
      { id: 2, label: 'Standard', until: '2027-02-28', price: 165, unit: 'per metre frontage' },
      { id: 3, label: 'Late booking', until: '2027-09-20', price: 185, unit: 'per metre frontage' }],
    cornerPremium: 150,
    corners: [
      { venue: 'The Hub', total: 24, held: 2 }, { venue: 'The Dome', total: 16, held: 0 },
      { venue: 'Agri Pavilion', total: 12, held: 1 }, { venue: 'Arcades', total: 8, held: 0 }],
    textBlocks: [
      { id: 1, key: 'portal_welcome', title: 'Exhibitor portal welcome', body: 'Welcome to the National Ploughing Championships 2027 exhibitor portal. Complete each step of your booking and upload your insurance before 30 June 2027.' },
      { id: 2, key: 'booking_closed', title: 'Bookings closed message', body: 'Online bookings are currently closed. Please contact the exhibitor team on 057 000 0000.' },
      { id: 3, key: 'insurance_instructions', title: 'Insurance upload instructions', body: 'Upload a completed NPA insurance form stamped and signed by your broker. Public liability cover must be at least €6.5m and run until 30 September 2027.' },
      { id: 4, key: 'corner_info', title: 'Corner stand information', body: 'Corner stands are available in indoor venues only and carry a premium. Allocation is first come, first served.' },
      { id: 5, key: 'woodbark_info', title: 'Woodbark ordering', body: 'Woodbark is delivered to your stand on the Monday before the event. Orders close 1 September 2027.' }],
    woodbarkRates: [
      { id: 1, product: 'Woodbark - bulk bag (1m³)', price: 85, vat: 13.5 },
      { id: 2, product: 'Woodbark - half bag (0.5m³)', price: 48, vat: 13.5 },
      { id: 3, product: 'Spreading on stand', price: 35, vat: 23 }],
    counties: COUNTIES.map((n, i) => ({ id: i + 1, name: n, province: i < 26 ? 'ROI' : 'NI' })),
    countries: COUNTRIES.map((n, i) => ({ id: i + 1, name: n, vatPrefix: ['IE', 'XI', 'GB', 'FR', 'DE', 'NL', 'IT', 'DK', 'PL', ''][i] }))
  };

  const tierFor = (tiers, when) => tiers.find(t => (when || '9999') .slice(0, 10) <= t.until) || tiers[tiers.length - 1];

  // ---------- users ----------
  const users = [];
  const usedCodes = new Set();
  COMPANIES.forEach((co, i) => {
    let base = co.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), code, n = ri(1, 30);
    do { code = base + String(n++).padStart(3, '0'); } while (usedCodes.has(code));
    usedCodes.add(code);
    const indoor = chance(0.32);
    const area = indoor ? 'Indoor' : 'Outdoor';
    const fn = pick(FIRST), ln = pick(LAST);
    const county = pick(Object.keys(TOWNS));
    const allowedCats = catsFor(area).filter(() => chance(0.25)).map(c => c.id);
    users.push({
      id: i + 1, username: code, code, name: co, email: (fn + '.' + ln).toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@' + co.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + '.ie',
      first: fn, last: ln, clientType: indoor ? 'IN' : 'OU', staff: false, superuser: false, active: chance(0.93),
      landline: '05' + ri(1, 9) + ' ' + ri(100, 999) + ' ' + ri(1000, 9999), accountId: String(ri(20000, 49999)), ftId: chance(.6) ? 'FT' + ri(10000, 99999) : '',
      stripeId: chance(.7) ? 'cus_' + hex(14) : '', loginExempt: chance(.05),
      perms: { outdoor: !indoor, venues: indoor ? [pick(VENUES)].concat(chance(.3) ? [pick(VENUES)] : []).filter((v, j, a) => a.indexOf(v) === j) : [],
        corners: indoor && chance(.6), allCats: allowedCats.length === 0, cats: allowedCats, woodbark: !indoor || chance(.2) },
      pastYears: [],
      company: { county, town: TOWNS[county], country: 'Ireland', mobile: '08' + ri(3, 7) + ' ' + ri(100, 999) + ' ' + ri(1000, 9999) },
      lastLogin: daysAfter(iso(2026, 9, 1), ri(0, 60))
    });
  });
  // Areas and stands from previous years. About one in eight is new and still needs an area.
  users.forEach(u => {
    const indoor = u.clientType === 'IN';
    const isNew = chance(0.12);
    u.perms.area = isNew ? '' : indoor ? u.perms.venues[0] : pick(OUT_AREAS);
    if (isNew) return;
    const years = ri(1, 4);
    for (let y = 2026; y > 2026 - years; y--) {
      const area = y === 2026 || chance(.8) ? u.perms.area : indoor ? pick(VENUES) : pick(OUT_AREAS);
      u.pastYears.push(indoor ? { year: y, area, block: String.fromCharCode(65 + ri(0, 5)), stand: String(ri(1, 60)), unit: String(ri(10, 40)) }
        : { year: y, area, row: String(ri(1, 32)), block: blockOf(area), stand: String(ri(100, 499)) });
    }
  });
  const staff = [['CRM_ADMIN', 'NPA', 'Admin'], ['amoran', 'Anna', 'Moran'], ['jdelaney', 'John', 'Delaney'], ['accounts', 'Accounts', 'Office']];
  staff.forEach(([u, f, l], i) => users.push({ id: 900 + i, username: u, code: '', name: 'National Ploughing Association', email: u.toLowerCase() + '@npa.example', first: f, last: l, clientType: '', staff: true, superuser: i === 0, active: true, perms: { outdoor: false, venues: [], corners: false, allCats: true, cats: [], woodbark: false, area: '' }, pastYears: [], company: {}, lastLogin: iso(2026, 11, 2, 9, 12) }));

  const groups = [
    { id: 1, name: 'Administrators', perms: 'Full access', members: ['CRM_ADMIN'] },
    { id: 2, name: 'Bookings team', perms: 'Users, order forms, insurance, corners, emails', members: ['amoran', 'jdelaney'] },
    { id: 3, name: 'Accounts', perms: 'Order forms (view), purchase orders, payment logs, reports', members: ['accounts'] },
    { id: 4, name: 'Site & mapping', perms: 'Reports, stand locations (view)', members: [] }];

  // ---------- order forms ----------
  const orders = [];
  const ins = [];
  const payLogs = [];
  const pos = [];
  let oid = 12356;
  users.filter(u => !u.staff).forEach((u, idx) => {
    if (idx > 39) return;
    const indoor = u.clientType === 'IN';
    const submitted = chance(0.82);
    const subDate = submitted ? daysAfter(iso(2026, 8, 18), ri(0, 72)) : null;
    const venue = indoor ? (u.perms.venues[0] || 'The Hub') : '';
    const cat = pick(indoor ? catsFor('Indoor') : catsFor('Outdoor'));
    const units = indoor ? ri(1, 2) : ri(5, 15);
    const hasCorner = indoor && u.perms.corners && chance(0.45);
    const elecWt = chance(.55) ? ri(1, 2) : 0, elecAmp = !indoor && chance(.15) ? 1 : 0;
    const water = !indoor && chance(.25);
    const o = {
      id: oid--, userId: u.id, clientType: u.clientType, venue, area: u.perms.area,
      submitted, submittedDate: subDate, completed: submitted && chance(.45), acceptedTC: submitted,
      insuranceStatus: !submitted ? 'Not uploaded' : pick(['Pending Review', 'Pending Review', 'Approved', 'Approved', 'Approved', 'Rejected']),
      paidStripe: submitted && chance(.35), manufacturer: chance(.3), exporter: chance(.15), employersIns: chance(.8), publicProductsIns: chance(.75), specificIndemnity: chance(.5), noEmployees: chance(.1),
      sharingWith: chance(.2) ? pick(COMPANIES) : '', particulars: indoor ? pick(['Display of crafts and gifts', 'Information stand', 'Product demonstration and sampling', 'Health checks and leaflets']) : pick(['Displaying 2 x trailers', 'Tractors and loaders on display', 'Fencing demonstration', 'Shed and steel frame on display', 'Range of ATVs']),
      otherInfo: '', marquee: '',
      // Bookings are still open, so no stand has been allocated yet.
      row: '', block: indoor ? '' : blockOf(u.perms.area), stand: '', unit: '',
      showStand: submitted && chance(.6), comments: '',
      categories: [cat.id], category: cat.id, frontage: units, is18m: !indoor && chance(.4), adminDepth: indoor ? 3 : pick([10, 12, 15, 18]),
      hasCorner, cornerStatus: hasCorner ? pick(['Allocated', 'Allocated', 'Requested']) : 'No Corner',
      structure: { none: false, marquee: !indoor && chance(.3), shed: !indoor && chance(.2), mobile: !indoor && chance(.15), caravan: !indoor && chance(.1), security: chance(.2),
        dims: '', frontage: 0, depth: 0, other: !indoor ? pick(['Trailers', 'Machinery', '', 'Display units']) : '', supplier: '', supplierAddr: '', supplierPhone: '' },
      util: { qtyWt: elecWt, qtyAmp: elecAmp, noElec: !elecWt && !elecAmp, water },
      pay: { card: false, full: false, submitted: false, bank: false, cheque: false, po: false, poNumber: '', terms: submitted, marketing: chance(.5), confirmed: false, txn: '' },
      account: { first: u.first, last: u.last, landline: u.landline, email: u.email },
      company: { name: u.name, addr1: ri(1, 40) + ' Main Street', addr2: '', city: u.company.town, county: u.company.county, country: 'Ireland', postcode: 'R32 ' + hex(4).toUpperCase(),
        landline: u.landline, mobile: u.company.mobile, email: 'info@' + u.email.split('@')[1], website: 'www.' + u.email.split('@')[1], siteName: u.first + ' ' + u.last, siteNumber: u.company.mobile,
        vatCountry: 'Ireland', vatNumber: 'IE' + ri(1000000, 9999999) + 'T', noVat: false, vatExempt: false, vatExemptNo: '', vatPct: 23, signFirst: u.first, signLast: u.last, signage: u.name.toUpperCase() },
      history: []
    };
    // pricing
    const tiers = indoor ? settings.indoorDates : settings.outdoorDates;
    const tier = tierFor(tiers, subDate || '2026-11-02');
    const e = settings.electricity;
    const space = units * tier.price + (hasCorner ? settings.cornerPremium : 0);
    const utilAmt = elecWt * e.rateWt + elecAmp * e.rateAmp + (water ? e.waterRate : 0);
    const litter = indoor ? 0 : e.litterRate;
    o.util.amount = utilAmt; o.util.vat = +(utilAmt * .23).toFixed(2); o.util.total = +(utilAmt * 1.23).toFixed(2); o.util.litter = litter;
    o.grandTotal = submitted ? +((space + utilAmt + litter) * 1.23).toFixed(2) : 0;
    o.tier = tier.label;
    if (o.paidStripe) { o.pay.card = true; o.pay.full = chance(.5); o.pay.submitted = true; o.pay.confirmed = true; o.pay.txn = 'pi_' + hex(24); }
    else if (submitted && chance(.3)) { o.pay.po = true; o.pay.poNumber = pick(['PO-', '', 'NP']) + ri(10000, 99999); }
    else if (submitted && chance(.3)) { o.pay.bank = true; }
    o.invoice = submitted ? 'invoices/invoice_' + ri(592700000, 592799999) + '.pdf' : '';
    o.pdf = submitted ? 'orders/order_' + o.id + '.pdf' : '';
    o.insuranceFile = o.insuranceStatus !== 'Not uploaded' ? 'insurance_' + u.code.toLowerCase() + '_2027.pdf' : '';
    o.history.push({ at: subDate || daysAfter(iso(2026, 9, 1), ri(0, 50)), who: u.username, what: submitted ? 'Submitted order form via exhibitor portal' : 'Started order form via exhibitor portal' });
    orders.push(o);

    if (o.insuranceFile) {
      const rev = { id: 0, orderId: o.id, status: o.insuranceStatus === 'Pending Review' ? 'Pending' : o.insuranceStatus, reason: '', note: '',
        uploadedAt: daysAfter(subDate, ri(0, 6)), reviewedAt: null, reviewer: '', file: o.insuranceFile };
      if (rev.status !== 'Pending') { rev.reviewedAt = daysAfter(rev.uploadedAt, ri(0, 3)); rev.reviewer = pick(['amoran', 'jdelaney']); }
      if (rev.status === 'Rejected') rev.reason = pick(['Insufficient Monetary Coverage', 'Insufficient Duration Coverage', 'Not Signed by Broker', 'Not Stamped by Broker', 'Not on NPA Official Form', 'Missing Employers\' Liability Insurance']);
      ins.push(rev);
    }
    if (o.paidStripe) {
      const at = daysAfter(subDate, 0, new Date(subDate).getHours()), pi = 'pi_3' + hex(20);
      [['INFO', 'start', 'Processing payment for order ' + o.id], ['SUCCESS', 'brc_receipt', 'Receipt created, BRC ID: ' + ri(593500000, 610499999)],
       ['SUCCESS', 'brc_invoice', 'Booking fee invoice created, BRC ID: ' + ri(593500000, 610499999)], ['SUCCESS', 'email', 'Confirmation email sent with receipt and booking fee invoice'],
       ['SUCCESS', 'complete', 'Payment processing completed successfully']].forEach(([level, step, msg], k) =>
        payLogs.push({ id: payLogs.length + 1, at: new Date(new Date(at).getTime() + k * 1000).toISOString(), level, orderId: o.id, step, msg, pi }));
    }
    if (o.pay.po) {
      pos.push({ id: 0, orderId: o.id, number: o.pay.poNumber || 'To follow', amount: o.grandTotal, createdAt: daysAfter(subDate, ri(0, 4)), status: pick(['Pending', 'Pending', 'Approved']), notes: '' });
    }
  });
  payLogs.push({ id: payLogs.length + 1, at: iso(2026, 9, 10, 22, 17), level: 'INFO', orderId: 11676, step: 'start', msg: 'Processing payment for order 11676', pi: 'pi_3UDFL9' + hex(14) });
  payLogs.push({ id: payLogs.length + 1, at: iso(2026, 9, 10, 22, 17), level: 'ERROR', orderId: 11676, step: 'exception', msg: 'Payment matching query does not exist.', pi: 'pi_3UDFL9' + hex(14) });
  payLogs.push({ id: payLogs.length + 1, at: iso(2026, 10, 21, 14, 3), level: 'WARNING', orderId: orders[3].id, step: 'email', msg: 'Confirmation email deferred, retrying in 5 minutes', pi: 'pi_3' + hex(20) });
  payLogs.sort((a, b) => b.at.localeCompare(a.at));
  ins.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).forEach((r, i, a) => r.id = 2371 - i);
  pos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).forEach((p, i) => p.id = 100 - i);

  // ---------- woodbark ----------
  const woodbark = [];
  users.filter(u => !u.staff && u.perms.woodbark).slice(0, 22).forEach((u, i) => {
    const bags = ri(1, 6), half = chance(.3) ? ri(1, 2) : 0, spread = chance(.4);
    const r = settings.woodbarkRates;
    const net = bags * r[0].price + half * r[1].price + (spread ? r[2].price : 0);
    const o = orders.find(x => x.userId === u.id);
    woodbark.push({ id: 1770 - i, userId: u.id, bags, half, spread, total: +(net * 1.135).toFixed(2), submittedDate: daysAfter(iso(2026, 9, 25), ri(0, 35)),
      delivery: o && o.area ? o.area + ' · stand TBC' : 'TBC',
      status: pick(['New', 'New', 'Confirmed', 'Confirmed', 'Delivered']), notes: '' });
  });

  // ---------- docs ----------
  const docNames = [['Indoor Plans: The Hub', 'Indoor'], ['Indoor Plans: The Dome', 'Indoor'], ['Indoor Plans: Agri Pavilion', 'Indoor'], ['Outdoor - Fire Safety Checklist', 'Outdoor'],
    ['Indoor - The Hub Blank', 'Indoor'], ['Indoor - The Dome Blank', 'Indoor'], ['Indoor - Agri Pavilion Blank', 'Indoor'], ['Brochure Map', 'All exhibitors'], ['Catering Solutions', 'All exhibitors'],
    ['Indoor Electrical Order Form', 'Indoor'], ['Indoor Exhibitor Manual', 'Indoor'], ['Outdoor Exhibitors - Porch Manual', 'Outdoor'], ['Outdoor Exhibitors Manual', 'Outdoor'],
    ['Indoor 3x3 Stand Info', 'Indoor'], ['Indoor Arcades Exhibitor Manual', 'Indoor'], ['Deposit Return Scheme Guidelines', 'All exhibitors'], ['Food Waste Guidelines', 'All exhibitors'],
    ['Outdoor Regional Broadband', 'Outdoor'], ['Indoor Regional Broadband', 'Indoor'], ['Exhibition Map', 'All exhibitors'], ['Exhibitor FAQ', 'All exhibitors']];
  const docs = docNames.map(([title, audience], i) => ({ id: i + 1, title, audience, file: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf', size: ri(180, 4200), uploaded: daysAfter(iso(2026, 6, 1), ri(0, 120)), visible: chance(.9) }));

  // ---------- emails ----------
  const emailConfigs = [
    { id: 1, name: 'Unpaid Deposits reminder', type: 'Unpaid Deposits', subject: 'Ploughing 2027 - Payment Reminder - Deposit Due', body: 'Dear {first_name},\n\nOur records show the deposit for order #{order_number} ({company}) is still outstanding. The balance due is {balance_due}.\n\nYou can pay online through your exhibitor portal.\n\nKind regards,\nNPA Exhibitor Team', days: 5, max: 4, account: true, contact: true, ccAdmin: false, enabled: true, updated: iso(2026, 3, 24, 13, 43) },
    { id: 2, name: 'Insurance Documents Reminder', type: 'Insurance Documents', subject: 'Insurance Documents Required', body: 'Dear {first_name},\n\nWe have not yet received a valid insurance document for order #{order_number}. Please upload it through your exhibitor portal.\n\nKind regards,\nNPA Exhibitor Team', days: 6, max: 4, account: true, contact: true, ccAdmin: false, enabled: true, updated: iso(2026, 3, 24, 13, 43) },
    { id: 3, name: 'Incomplete Bookings Reminder', type: 'Incomplete Bookings', subject: 'Looks like you forgot something', body: 'Dear {first_name},\n\nYou started a booking for Ploughing 2027 but have not submitted it yet. Log back in to finish it and secure your space.\n\nKind regards,\nNPA Exhibitor Team', days: 6, max: 4, account: true, contact: true, ccAdmin: false, enabled: true, updated: iso(2026, 3, 24, 13, 44) },
    { id: 4, name: 'Final Payment Deadline', type: 'Final Payment Deadlines', subject: 'Final payment due by 30 June 2027', body: 'Dear {first_name},\n\nA reminder that the final balance of {balance_due} for order #{order_number} is due by 30 June 2027.\n\nKind regards,\nNPA Exhibitor Team', days: 7, max: 3, account: true, contact: false, ccAdmin: true, enabled: false, updated: iso(2026, 4, 23, 21, 1) }];
  const schedules = [
    { id: 1, configId: 1, day: 'Wednesday', time: '07:32', enabled: true, lastRun: iso(2026, 10, 28, 7, 32), nextRun: iso(2026, 11, 4, 7, 32) },
    { id: 2, configId: 2, day: 'Wednesday', time: '09:20', enabled: true, lastRun: iso(2026, 10, 28, 9, 20), nextRun: iso(2026, 11, 4, 9, 20) },
    { id: 3, configId: 3, day: 'Wednesday', time: '09:10', enabled: true, lastRun: iso(2026, 10, 28, 9, 10), nextRun: iso(2026, 11, 4, 9, 10) }];
  const emailLogs = [];
  orders.filter(o => !o.paidStripe && o.submitted).slice(0, 14).forEach((o, i) => emailLogs.push({ id: emailLogs.length + 1, orderId: o.id, kind: 'Reminder', type: 'Unpaid Deposits', configId: 1, n: i % 4 ? 1 : 2, at: iso(2026, 10, 28, 8, 38), subject: emailConfigs[0].subject, to: o.account.email, status: 'Delivered' }));
  orders.filter(o => o.insuranceStatus === 'Rejected').forEach(o => emailLogs.push({ id: emailLogs.length + 1, orderId: o.id, kind: 'Reminder', type: 'Insurance Documents', configId: 2, n: 1, at: iso(2026, 10, 28, 9, 20), subject: emailConfigs[1].subject, to: o.account.email, status: 'Delivered' }));
  orders.filter(o => !o.submitted).forEach(o => emailLogs.push({ id: emailLogs.length + 1, orderId: o.id, kind: 'Reminder', type: 'Incomplete Bookings', configId: 3, n: 2, at: iso(2026, 10, 28, 9, 10), subject: emailConfigs[2].subject, to: o.account.email, status: chance(.9) ? 'Delivered' : 'Bounced' }));
  emailLogs.push({ id: emailLogs.length + 1, orderId: null, kind: 'Broadcast', type: 'All exhibitors', configId: null, n: null, at: iso(2026, 10, 14, 11, 2), subject: 'Ploughing 2027 - indoor floor plans now available', to: '38 recipients', status: 'Delivered' });

  // ---------- reports ----------
  const reports = [
    { id: 1, name: 'Bookings so Far', desc: 'Every account with a submitted booking this season', root: 'accounts | company', created: iso(2026, 3, 13), modified: iso(2026, 3, 13), by: 'crm_admin', starred: true, fields: ['code', 'company', 'contact', 'email', 'clientType', 'grandTotal', 'submittedDate'], filters: { submitted: 'yes' } },
    { id: 2, name: 'Outdoor - Structure Report', desc: 'Structures, dimensions and suppliers for site contractors', root: 'order | order form', created: iso(2022, 6, 19), modified: iso(2026, 3, 4), by: 'crm_admin', starred: true, fields: ['id', 'company', 'row', 'block', 'stand', 'frontage', 'depth', 'structure', 'other'], filters: { clientType: 'OU', submitted: 'yes' } },
    { id: 3, name: 'Woodbark Orders', desc: 'Bags and delivery locations for the woodbark supplier', root: 'woodbark | woodbark order', created: iso(2022, 4, 12), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: [], filters: {} },
    { id: 4, name: 'All Details - All Years', desc: '', root: 'order | order form', created: iso(2020, 12, 3), modified: iso(2025, 7, 6), by: 'crm_admin', starred: false, fields: ['id', 'code', 'company', 'contact', 'email', 'mobile', 'clientType', 'venue', 'category', 'row', 'block', 'stand', 'unit', 'grandTotal', 'submittedDate', 'insurance'], filters: {} },
    { id: 5, name: 'Indoor - All Details with Sharing', desc: 'Includes who each indoor stand is shared with', root: 'order | order form', created: iso(2018, 8, 16), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: ['id', 'company', 'venue', 'block', 'stand', 'unit', 'sharing', 'contact', 'email'], filters: { clientType: 'IN' } },
    { id: 6, name: 'Indoor - All Details with Unit Numbers', desc: '', root: 'order | order form', created: iso(2018, 8, 15), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: ['id', 'company', 'venue', 'block', 'stand', 'unit', 'corner', 'electricity'], filters: { clientType: 'IN' } },
    { id: 7, name: 'Indoor - All Details', desc: '', root: 'order | order form', created: iso(2018, 5, 27), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: ['id', 'code', 'company', 'contact', 'email', 'mobile', 'venue', 'block', 'stand', 'grandTotal', 'insurance'], filters: { clientType: 'IN' } },
    { id: 8, name: 'Outdoor - All Details', desc: '', root: 'order | order form', created: iso(2018, 5, 14), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: ['id', 'code', 'company', 'contact', 'email', 'mobile', 'category', 'row', 'block', 'stand', 'frontage', 'grandTotal', 'insurance'], filters: { clientType: 'OU' } },
    { id: 9, name: 'All Details', desc: '', root: 'order | order form', created: iso(2018, 5, 12), modified: iso(2026, 3, 4), by: 'crm_admin', starred: false, fields: ['id', 'code', 'company', 'contact', 'email', 'mobile', 'clientType', 'venue', 'category', 'row', 'block', 'stand', 'unit', 'grandTotal', 'submittedDate', 'insurance'], filters: {} }];
  const formats = [{ id: 1, name: 'CSV', ext: '.csv', desc: 'Comma separated, opens in Excel' }, { id: 2, name: 'Excel', ext: '.xlsx', desc: 'Formatted workbook' }, { id: 3, name: 'PDF', ext: '.pdf', desc: 'Printable table, A4 landscape' }];

  const recent = [
    { at: iso(2026, 11, 2, 9, 41), icon: 'edit', what: users[0].username, kind: 'User', href: '#/users/1' },
    { at: iso(2026, 11, 2, 9, 33), icon: 'add', what: users[0].username, kind: 'User', href: '#/users/1' },
    { at: iso(2026, 11, 1, 16, 5), icon: 'edit', what: 'OU Form # ' + orders[1].id, kind: 'Order form', href: '#/orders/' + orders[1].id },
    { at: iso(2026, 11, 1, 15, 20), icon: 'edit', what: 'OU Form # ' + orders[5].id, kind: 'Order form', href: '#/orders/' + orders[5].id },
    { at: iso(2026, 10, 31, 12, 2), icon: 'edit', what: 'IN Form # ' + orders[2].id, kind: 'Order form', href: '#/orders/' + orders[2].id },
    { at: iso(2026, 10, 30, 10, 44), icon: 'add', what: 'Woodbark Order Form # 1770', kind: 'Woodbark order', href: '#/woodbark/1770' },
    { at: iso(2026, 10, 30, 10, 12), icon: 'add', what: 'Woodbark Order Form # 1769', kind: 'Woodbark order', href: '#/woodbark/1769' }];

  window.SEED = { VENUES, OUT_AREAS, blockOf, CATEGORIES, COUNTIES, COUNTRIES, settings, users, groups, orders, ins, payLogs, pos, woodbark, docs, emailConfigs, schedules, emailLogs, reports, formats, recent, tierFor };
})();
