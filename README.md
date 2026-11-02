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
| **Order forms** ★ | Bookings list with filters and bulk actions; the full IN/OU form (stand location, structure, utilities, payment, invoices), live pricing, duplicate, history |
| **Insurance reviews** ★ | Review queue with a document preview and approve/reject with reason. The exhibitor is emailed and the next review opens |
| **Corner allocations** ★ | Corner totals per indoor venue, what's left, allocate/decline requests. Outdoor corners can't be booked |
| **Reports** ★ | One-click Contractors / Print / Website / Site map reports, the saved report list, and a builder with a live preview. Downloads are real CSVs |
| **Woodbark** ★ | Orders, delivery sheet export, order form with live totals |
| **Emails** ★ | Compose to an audience with merge tags and a preview, plus reminder configurations, schedules ("Run now") and logs |
| Docs, groups, purchase orders, payment logs, exhibition spaces | Kept from the current system, simplified |
| **Settings** | Categories, corner inventories, counties, countries, electricity & litter, indoor/outdoor date-based pricing, system toggles, text blocks, woodbark rates |

★ = flagged as essential in NPA's email.

All exhibitor names, account codes and figures are invented. Nothing from NPA's
screenshots or live system is in this repository. Data lives in the browser
tab and reseeds on reload.

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
- Payments, Stripe and the exhibitor portal itself are out of scope.
