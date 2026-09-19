# ZelQ Internal CRM

Internal work-management system for ZelQ Solutions. Google Drive remains the file store.

## Stack

- Next.js 16, TypeScript, Tailwind, shadcn/ui
- Prisma + Postgres (Supabase)
- Session cookies, bcrypt password hashing, role checks on every action

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@zelq.com | ZelqAdmin!26 |
| Manager | manager@zelq.com | ZelqManager!26 |
| Employee | umar@zelq.com | ZelqEmployee!26 |
| Employee | fatima@zelq.com | ZelqEmployee!26 |

## Local setup

```bash
cd zelq-crm
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env`.

- `DATABASE_URL` — pooled Postgres URL
- `DIRECT_URL` — direct Postgres URL
- `AUTH_SECRET` — session signing secret
- `CRON_SECRET` — daily deadline notifications at `/api/cron/deadlines`
