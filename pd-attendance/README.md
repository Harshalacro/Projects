# P&D Construction – Attendance & Site Management

Mobile-first PWA (Next.js + Tailwind + Supabase). **Phase 1 – Attendance** is built; Sites (Phase 2) is a placeholder.

## Try it now (demo mode)
```bash
npm install
npm run dev      # http://localhost:3000
```
With no Supabase keys the app runs in demo mode with sample workers; data lives in the browser only.

## Go live with Supabase
1. Create a free project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → Add user: email `<phone digits>@pd-attendance.app` + a password (login screen uses phone + password).
4. Table `users`: insert a row `id` = that auth user's id, `name`, `phone`, `role` = `admin` (supervisors: `supervisor`).
5. Copy `.env.example` to `.env.local`, fill the project URL and anon key. Deploy on Vercel with the same two variables.

## Money rules (`lib/calc.ts`)
- Total = (present days + 0.5 × half days) × wage on that day (old days keep the old wage).
- Balance = total − advances + old balance carried forward; "Mark paid" records what was paid and any remainder carries to next month.
