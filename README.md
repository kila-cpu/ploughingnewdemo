# National Ploughing Championships — Event management backend wireframes

Interactive click-through wireframes prepared by DMC Consultancy Ltd for the
National Ploughing Association's staff backend. The layout deliberately mirrors
the current admin site (blue header, breadcrumbs, grouped sidebar with "+ Add",
list pages with a filter panel on the right, long change forms with a save bar)
so staff recognise it straight away. Everything is restyled, and the key areas
from NPA's brief get working screens.

| Area | What it covers |
| --- | --- |
| **Dashboard** | Season KPIs, key areas, a "needs attention" queue, bookings by area, recent actions |
| **Users** ★ | Exhibitor logins, and booking permissions per user: outdoor, which indoor venues, corners, categories, woodbark, login exempt |
| **Stand allocation** | Exhibitors book space in the area they're assigned (based on previous years) and never pick a stand. After bookings close NPA allocates stand numbers per area: reuse last year's stands, clash checks, assign areas to new exhibitors, then publish and email stand numbers |
| **Order forms** ★ | Bookings list with filters and bulk actions; the full IN/OU form (stand location, structure, utilities, payment, invoices), live pricing, duplicate, history |
| **Insurance reviews** ★ | Review queue with a document preview and approve/reject with reason. The exhibitor is emailed and the next review opens |
| **Corner allocations** ★ | Corner totals per indoor venue, what's left, allocate/decline requests. Outdoor corners can't be booked |
| **Reports** ★ | One-click Contractors / Print / Website / Site map reports, the saved report list, and a builder with a live preview. Downloads are real CSVs |
| **Woodbark** ★ | Orders, delivery sheet export, order form with live totals |
| **Emails** ★ | Compose to an audience with merge tags and a preview, plus reminder configurations, schedules ("Run now") and logs |
| Docs, groups, purchase orders, payment logs, exhibition spaces | Kept from the current system, simplified |
| **Settings** | Categories, corner inventories, counties, countries, electricity & litter, indoor/outdoor date-based pricing, system toggles, text blocks, woodbark rates |

★ = flagged as essential in NPA's email.

### Exhibitor booking portal (`/portal.html`)

The exhibitor side, redesigned from the current Trade Booking Portal (Outdoor
Exhibition) with the same wording, moved to the 2027 season the admin data uses:

1. Login and forgot password
2. Welcome information, pre-booking documents, terms and conditions (must be
   agreed before the booking form opens)
3. Step 1 – Contact Details (company, address, contact person, VAT, trade arena)
4. Step 2 – Account Contact Details ("same as contact details", invoice email,
   payment information)
5. Step 3 – Exhibition Space: the exhibitor's assigned area and past stands,
   category, frontage (min 5m), 9m or 18m depth, rate information, and the
   typical outdoor stand layout guide. The stand number is "to be allocated".
6. Step 4 – Payment: pay in full or a 50% deposit, by Stripe link, bank
   transfer, card or PO number, then a confirmation with what happens next

Outdoor rates (per metre, 9m and 18m) match Settings → Outdoor dates in the
admin. Any username and password logs in, no card is charged, and the logo is a
placeholder for NPA's artwork.

## Running it

```bash
npm start          # http://localhost:3000
```

or, without Node:

```bash
python3 -m http.server 3000 --directory public
```

## Known limits of a wireframe

- File uploads record the filename only; "opening" a file shows a toast.
- Emails are written to the Email logs, not sent.
- Payments are mocked: the card form is a placeholder for Stripe's, and portal bookings don't appear in the admin's order list.
