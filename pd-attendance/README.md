# P&D Construction – Attendance & Site Management

Mobile-first PWA (Next.js + Tailwind + Supabase). **Phase 1 (Attendance)** and **Phase 2 (Site Management)** are built. Phase 3 (PDF/Excel, offline mode) is next.

## Try it now (demo mode)
```bash
npm install
npm run dev      # http://localhost:3000
```
With no Supabase keys the app runs in demo mode with sample workers; data lives in the browser only.

## Go live with Supabase
1. Create a free project at supabase.com.
2. SQL Editor → paste all of `supabase/schema.sql` → Run (includes the sites tables and the `report-photos` storage bucket). Already ran the Phase 1 part? Run just the Phase 2 section at the bottom.
3. Authentication → Add user: email `<phone digits>@pd-attendance.app` + a password (login screen uses phone + password).
4. Table `users`: insert a row `id` = that auth user's id, `name`, `phone`, `role` = `admin` (supervisors: `supervisor`).
5. Copy `.env.example` to `.env.local`, fill the project URL and anon key. Deploy on Vercel with the same two variables.

## Money rules (`lib/calc.ts`)
- Total = (present days + 0.5 × half days) × wage on that day (old days keep the old wage).
- Balance = total − advances + old balance carried forward; "Mark paid" records what was paid and any remainder carries to next month.

## Sites (Phase 2)
Each site has four tabs: **Daily report** (notes, worker count prefilled from attendance, camera photos), **Reminders** (overdue show red), **Stock** (Stock IN / OUT, current quantity, low-stock warning) and **Workers** (assign workers to the site, mark today's attendance). Site cards show overdue reminders and low-stock counts at a glance.
