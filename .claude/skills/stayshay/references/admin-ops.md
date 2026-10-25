# Running Stayshay from /admin

Sign in at https://stayshay.com/admin with the shared password (in server `apps/web/.env`) or Google as an `ADMIN_EMAILS` account (mzah5143@gmail.com).

| Tab | Daily use |
| --- | --- |
| **Inbox** | Every viewing request, room request, owner submission, roommate profile, AI chat. Reply (WhatsApp prefilled), Call, Email, status, notes. Owner leads link to their pending listing. |
| **Listings** | Opens on **Pending review** when there are submissions → *Approve & publish* / *Reject* / *Ask lister*. Any listing: Available / Reserved / Rented / Hidden, **Assign tenant**, edit/delete own. *+ New listing*: paste a lister's WhatsApp message to prefill. |
| **Tenancies** | Days left (amber ≤30, red ≤14), **Renewal reminder** (WhatsApp), Renew +1/3/6/12 months, End tenancy (frees beds). |
| **Roommates** | Public board queue (Approve/Hide), then match any profile → ranked scores with reasons → Introduce both on WhatsApp → Mark matched. |
| **People** | All accounts with email/phone/provider. |
| **Announcements** | One live banner on site + app; WhatsApp broadcast by audience (one tap per contact); copy numbers for a WhatsApp Business broadcast list. |

Add an admin: append the email to `ADMIN_EMAILS` (comma-separated) and restart pm2 (see deploy.md).
WhatsApp line for everything: `BRAND.whatsapp` in `packages/core/src/brand.ts` (+971 56 904 8493).
