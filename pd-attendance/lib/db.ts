"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Advance, Attendance, Payment, Profile, Snapshot, Status, WageHistory, Worker } from "./types";
import { addDays, monthOf, today } from "./dates";

/**
 * Two interchangeable backends:
 *  - Supabase  (when NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set)
 *  - Demo/local (browser localStorage) so the app works instantly with no setup.
 */
export interface DB {
  mode: "supabase" | "demo";
  getProfile(): Promise<Profile | null>;
  signIn(phone: string, password: string): Promise<string | null>; // returns error message
  signOut(): Promise<void>;
  loadAll(): Promise<Snapshot>;
  saveWorker(w: Omit<Worker, "id"> & { id?: string }): Promise<Worker>;
  setAttendance(workerId: string, date: string, status: Status | null, siteId?: string | null): Promise<void>;
  setAttendanceBulk(workerIds: string[], date: string, status: Status): Promise<void>;
  addAdvance(a: Omit<Advance, "id">): Promise<Advance>;
  deleteAdvance(id: string): Promise<void>;
  savePayment(p: Omit<Payment, "id">): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());
const EPOCH = "2000-01-01";

// ---------------------------------------------------------------- demo (localStorage)
const KEY = "pd-demo-db-v1";

function seed(): Snapshot {
  const mk = (name: string, type: string, wage: number, phone = ""): Worker => ({
    id: uid(), name, type, daily_wage: wage, phone, active: true, default_site_id: null,
  });
  const workers = [mk("Ramesh", "Mason", 850), mk("Sunil", "Labour", 450), mk("Geeta", "Helper", 600), mk("Mohan", "Labour", 450)];
  const wages: WageHistory[] = workers.map((w) => ({ id: uid(), worker_id: w.id, wage: w.daily_wage, from_date: EPOCH }));
  const attendance: Attendance[] = [];
  const advances: Advance[] = [];
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pm = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const pad = (n: number) => String(n).padStart(2, "0");
  workers.forEach((w, wi) => {
    for (let d = 1; d <= 25; d++) {
      if ((d + wi) % 7 === 0) continue; // weekly off => no record
      const s: Status = (d * (wi + 3)) % 11 === 0 ? "A" : (d * (wi + 2)) % 9 === 0 ? "H" : "P";
      attendance.push({ id: uid(), worker_id: w.id, date: `${pm}-${pad(d)}`, status: s, site_id: null });
    }
  });
  advances.push({ id: uid(), worker_id: workers[1].id, date: `${pm}-10`, amount: 2000, note: "paiseli" });
  return { workers, wages, attendance, advances, payments: [] };
}

function demoDB(): DB {
  const read = (): Snapshot => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const s = seed();
    write(s);
    return s;
  };
  const write = (s: Snapshot) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  };
  return {
    mode: "demo",
    async getProfile() { return { name: "Demo Owner", role: "admin" }; },
    async signIn() { return null; },
    async signOut() {},
    async loadAll() { return read(); },
    async saveWorker(w) {
      const s = read();
      const id = w.id ?? uid();
      const rec: Worker = { ...w, id } as Worker;
      const i = s.workers.findIndex((x) => x.id === id);
      const prev = i >= 0 ? s.workers[i] : null;
      if (i >= 0) s.workers[i] = rec; else s.workers.push(rec);
      if (!prev) s.wages.push({ id: uid(), worker_id: id, wage: rec.daily_wage, from_date: EPOCH });
      else if (prev.daily_wage !== rec.daily_wage) s.wages.push({ id: uid(), worker_id: id, wage: rec.daily_wage, from_date: today() });
      write(s);
      return rec;
    },
    async setAttendance(workerId, date, status, siteId = null) {
      const s = read();
      s.attendance = s.attendance.filter((a) => !(a.worker_id === workerId && a.date === date));
      if (status) s.attendance.push({ id: uid(), worker_id: workerId, date, status, site_id: siteId });
      write(s);
    },
    async setAttendanceBulk(ids, date, status) {
      const s = read();
      s.attendance = s.attendance.filter((a) => !(a.date === date && ids.includes(a.worker_id)));
      ids.forEach((id) => s.attendance.push({ id: uid(), worker_id: id, date, status, site_id: null }));
      write(s);
    },
    async addAdvance(a) { const s = read(); const r = { ...a, id: uid() }; s.advances.push(r); write(s); return r; },
    async deleteAdvance(id) { const s = read(); s.advances = s.advances.filter((x) => x.id !== id); write(s); },
    async savePayment(p) {
      const s = read();
      const r = { ...p, id: uid() };
      s.payments.push(r);
      write(s);
      return r;
    },
    async deletePayment(id) { const s = read(); s.payments = s.payments.filter((x) => x.id !== id); write(s); },
  };
}

// ---------------------------------------------------------------- Supabase
const phoneToEmail = (phone: string) => `${phone.replace(/\D/g, "")}@pd-attendance.app`;

async function fetchAll<T>(sb: SupabaseClient, table: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select("*").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}
const must = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

function supabaseDB(url: string, key: string): DB {
  const sb = createClient(url, key);
  return {
    mode: "supabase",
    async getProfile() {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return null;
      const { data } = await sb.from("users").select("name, role").eq("id", u.user.id).maybeSingle();
      return { name: data?.name ?? "User", role: (data?.role as Profile["role"]) ?? "supervisor" };
    },
    async signIn(phone, password) {
      const { error } = await sb.auth.signInWithPassword({ email: phoneToEmail(phone), password });
      return error ? "Wrong phone number or password" : null;
    },
    async signOut() { await sb.auth.signOut(); },
    async loadAll() {
      const [workers, wages, attendance, advances, payments] = await Promise.all([
        fetchAll<Worker>(sb, "workers"),
        fetchAll<WageHistory>(sb, "wage_history"),
        fetchAll<Attendance>(sb, "attendance"),
        fetchAll<Advance>(sb, "advances"),
        fetchAll<Payment>(sb, "payments"),
      ]);
      return { workers, wages, attendance, advances, payments };
    },
    async saveWorker(w) {
      const isNew = !w.id;
      let prevWage: number | null = null;
      if (!isNew) {
        const { data } = await sb.from("workers").select("daily_wage").eq("id", w.id!).maybeSingle();
        prevWage = data?.daily_wage ?? null;
      }
      const row = must(await sb.from("workers").upsert(w).select().single()) as Worker;
      // wage_history is admin-only; supervisors (who cannot set wages) simply skip it.
      if (isNew) await sb.from("wage_history").insert({ worker_id: row.id, wage: row.daily_wage, from_date: EPOCH });
      else if (prevWage !== row.daily_wage) await sb.from("wage_history").insert({ worker_id: row.id, wage: row.daily_wage, from_date: today() });
      return row;
    },
    async setAttendance(workerId, date, status, siteId = null) {
      if (!status) {
        const { error } = await sb.from("attendance").delete().eq("worker_id", workerId).eq("date", date);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await sb.from("attendance").upsert({ worker_id: workerId, date, status, site_id: siteId }, { onConflict: "worker_id,date" });
      if (error) throw new Error(error.message);
    },
    async setAttendanceBulk(ids, date, status) {
      const { error } = await sb.from("attendance").upsert(ids.map((worker_id) => ({ worker_id, date, status })), { onConflict: "worker_id,date" });
      if (error) throw new Error(error.message);
    },
    async addAdvance(a) { return must(await sb.from("advances").insert(a).select().single()) as Advance; },
    async deleteAdvance(id) { const { error } = await sb.from("advances").delete().eq("id", id); if (error) throw new Error(error.message); },
    async savePayment(p) { return must(await sb.from("payments").insert(p).select().single()) as Payment; },
    async deletePayment(id) { const { error } = await sb.from("payments").delete().eq("id", id); if (error) throw new Error(error.message); },
  };
}

let instance: DB | null = null;
export function getDB(): DB {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? supabaseDB(url, key) : demoDB();
  return instance;
}

export { addDays, monthOf };
