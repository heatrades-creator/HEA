# HEA Group — hea-group.com.au

Solar, battery storage & EV charging installer based in Bendigo, Victoria.

## Stack

| Layer | Tech |
|---|---|
| Website | Next.js 16 App Router · Tailwind CSS |
| CMS | Sanity (content at `/studio`) |
| Intake form | `/intake` — Next.js multi-step form, PDF generation via pdf-lib |
| Email | Resend |
| Database | Prisma + Turso (libSQL) |
| GAS scripts | Google Apps Script, auto-deployed via clasp + GitHub Actions |
| Hosting | Vercel (auto-deploys on push to `main`) |

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy

Push to `main`:
- **Vercel** builds and deploys the Next.js app automatically
- **GitHub Actions** runs clasp to push any changed GAS scripts (`HEA INTAKE/` or `GAS/`)

See `CLASP_SETUP.md` for one-time GAS credential setup.

## Lead Flow

All "Get a Quote" buttons on the site point to `/intake` with a service pre-selected:

| Page | URL |
|---|---|
| Solar installer | `/intake?service=solar` |
| Battery installer | `/intake?service=battery` |
| EV charger | `/intake?service=ev` |
| All other pages | `/intake` |

On submission, the form generates a NMI Consent PDF + Job Card PDF and emails both to
Jesse (HEA.Trades@gmail.com) and the client.

## For Claude Code

See `CLAUDE.md` — full architecture, pipeline details, known issues, and conventions.
