"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Advance, Attendance, DailyReport, Material, Payment, Profile, RowKey, RowOf, Site, Snapshot, Status, StockEntry, WageHistory, Worker, Reminder } from "./types";
import { addDays, monthOf, today } from "./dates";
import { offlineDB } from "./offline";

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
  addAdvance(a: Omit<Advance, "id"> & { id?: string }): Promise<Advance>;
  deleteAdvance(id: string): Promise<void>;
  savePayment(p: Omit<Payment, "id"> & { id?: string }): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
  put<K extends RowKey>(key: K, row: RowOf<K>): Promise<void>;
  del(key: RowKey, id: string): Promise<void>;
  saveReport(r: DailyReport): Promise<void>;
  deleteReport(id: string): Promise<void>;
  /** Number of changes saved on this phone that are still waiting to reach the server. */
  pending?(): number;
}

const TABLE: Record<RowKey, string> = { sites: "sites", reminders: "reminders", materials: "materials", stock: "stock_entries" };

import { newId as uid } from "./id";
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
  return { workers, wages, attendance, advances, payments: [], ...seedSites() };
}

function seedSites() {
  const t = today();
  const sites: Site[] = [
    { id: uid(), name: "Balaji Colony", address: "Plot 12, Balaji Colony", start_date: addDays(t, -60), status: "Running" },
    { id: uid(), name: "Shivaji Nagar House", address: "Lane 4, Shivaji Nagar", start_date: addDays(t, -20), status: "Running" },
  ];
  const mat = (site: number, name: string, unit: string, low: number): Material => ({ id: uid(), site_id: sites[site].id, name, unit, low_stock_limit: low });
  const materials = [mat(0, "Cement", "bags", 20), mat(0, "Sand", "trucks", 1), mat(0, "Bricks", "pcs", 500), mat(1, "Steel", "kg", 100)];
  const e = (m: number, type: "IN" | "OUT", quantity: number, d: number, note = ""): StockEntry => ({ id: uid(), material_id: materials[m].id, date: addDays(t, d), type, quantity, note });
  const stock = [e(0, "IN", 100, -10), e(0, "OUT", 85, -2, "slab"), e(1, "IN", 3, -8), e(1, "OUT", 1, -3), e(2, "IN", 2000, -9), e(2, "OUT", 1200, -4), e(3, "IN", 500, -5)];
  const reminders: Reminder[] = [
    { id: uid(), site_id: sites[0].id, text: "Buy 50 bags cement", due_date: addDays(t, -1), done: false },
    { id: uid(), site_id: sites[0].id, text: "Pay the electrician", due_date: addDays(t, 3), done: false },
    { id: uid(), site_id: sites[1].id, text: "Order bricks", due_date: addDays(t, 1), done: false },
  ];
  const reports: DailyReport[] = [
    { id: uid(), site_id: sites[0].id, date: addDays(t, -1), notes: "Slab shuttering finished. Plastering started on ground floor.", workers_count: 4, created_by: "Demo Owner", photos: [] },
  ];
  return { sites, reports, reminders, materials, stock };
}

export interface LocalDB extends DB {
  replaceAll(s: Snapshot): void;
}

/** A complete DB living in localStorage. Used for demo mode, and as the offline cache under Supabase. */
export function localDB(key = KEY, mode: DB["mode"] = "demo", seedIfEmpty = true): LocalDB {
  const empty = (): Snapshot => ({ workers: [], wages: [], attendance: [], advances: [], payments: [], sites: [], reports: [], reminders: [], materials: [], stock: [] });
  const read = (): Snapshot => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.sites) { const m = { ...parsed, ...(seedIfEmpty ? seedSites() : { sites: [], reports: [], reminders: [], materials: [], stock: [] }) }; write(m); return m; }
        return parsed;
      }
    } catch {}
    const s = seedIfEmpty ? seed() : empty();
    if (seedIfEmpty) write(s);
    return s;
  };
  const write = (s: Snapshot) => {
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {
      throw new Error("Phone storage is full. Delete some old photos or reports.");
    }
  };
  return {
    mode,
    replaceAll(s) { write(s); },
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
    async addAdvance(a) { const s = read(); const r = { ...a, id: a.id ?? uid() }; s.advances.push(r); write(s); return r; },
    async deleteAdvance(id) { const s = read(); s.advances = s.advances.filter((x) => x.id !== id); write(s); },
    async savePayment(p) {
      const s = read();
      const r = { ...p, id: p.id ?? uid() };
      s.payments.push(r);
      write(s);
      return r;
    },
    async deletePayment(id) { const s = read(); s.payments = s.payments.filter((x) => x.id !== id); write(s); },
    async put(key, row) {
      const s = read();
      const list = s[key] as { id: string }[];
      const i = list.findIndex((x) => x.id === row.id);
      if (i >= 0) list[i] = row; else list.push(row);
      write(s);
    },
    async del(key, id) {
      const s = read();
      (s[key] as { id: string }[]) = (s[key] as { id: string }[]).filter((x) => x.id !== id);
      if (key === "materials") s.stock = s.stock.filter((e) => e.material_id !== id);
      if (key === "sites") {
        const mats = s.materials.filter((m) => m.site_id === id).map((m) => m.id);
        s.materials = s.materials.filter((m) => m.site_id !== id);
        s.stock = s.stock.filter((e) => !mats.includes(e.material_id));
        s.reports = s.reports.filter((r) => r.site_id !== id);
        s.reminders = s.reminders.filter((r) => r.site_id !== id);
        s.workers = s.workers.map((w) => (w.default_site_id === id ? { ...w, default_site_id: null } : w));
      }
      write(s);
    },
    async saveReport(r) {
      const s = read();
      const i = s.reports.findIndex((x) => x.id === r.id);
      if (i >= 0) s.reports[i] = r; else s.reports.push(r);
      write(s);
    },
    async deleteReport(id) { const s = read(); s.reports = s.reports.filter((x) => x.id !== id); write(s); },
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
      // getSession reads the saved login from the phone, so it also works with no signal.
      const { data: sess } = await sb.auth.getSession();
      const user = sess.session?.user;
      if (!user) return null;
      const { data, error } = await sb.from("users").select("name, role").eq("id", user.id).maybeSingle();
      if (error) throw new Error(error.message);
      return { name: data?.name ?? "User", role: (data?.role as Profile["role"]) ?? "supervisor" };
    },
    async signIn(phone, password) {
      const { error } = await sb.auth.signInWithPassword({ email: phoneToEmail(phone), password });
      return error ? "Wrong phone number or password" : null;
    },
    async signOut() { await sb.auth.signOut(); },
    async loadAll() {
      const [workers, wages, attendance, advances, payments, sites, reps, photos, reminders, materials, stock] = await Promise.all([
        fetchAll<Worker>(sb, "workers"),
        fetchAll<WageHistory>(sb, "wage_history"),
        fetchAll<Attendance>(sb, "attendance"),
        fetchAll<Advance>(sb, "advances"),
        fetchAll<Payment>(sb, "payments"),
        fetchAll<Site>(sb, "sites"),
        fetchAll<Omit<DailyReport, "photos">>(sb, "daily_reports"),
        fetchAll<{ report_id: string; photo_url: string }>(sb, "report_photos"),
        fetchAll<Reminder>(sb, "reminders"),
        fetchAll<Material>(sb, "materials"),
        fetchAll<StockEntry>(sb, "stock_entries"),
      ]);
      const reports = reps.map((r) => ({ ...r, photos: photos.filter((p) => p.report_id === r.id).map((p) => p.photo_url) }));
      return { workers, wages, attendance, advances, payments, sites, reports, reminders, materials, stock };
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
    async put(key, row) {
      const { error } = await sb.from(TABLE[key]).upsert(row);
      if (error) throw new Error(error.message);
    },
    async del(key, id) {
      const { error } = await sb.from(TABLE[key]).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    async saveReport(r) {
      const { photos, ...row } = r;
      must(await sb.from("daily_reports").upsert(row).select().single());
      const { data: existing } = await sb.from("report_photos").select("id, photo_url").eq("report_id", r.id);
      const keep = new Set(photos.filter((p) => !p.startsWith("data:")));
      const gone = (existing ?? []).filter((e) => !keep.has(e.photo_url)).map((e) => e.id);
      if (gone.length) await sb.from("report_photos").delete().in("id", gone);
      for (const p of photos.filter((p) => p.startsWith("data:"))) {
        const blob = await (await fetch(p)).blob();
        const path = `${r.id}/${uid()}.jpg`;
        const up = await sb.storage.from("report-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        const url = sb.storage.from("report-photos").getPublicUrl(path).data.publicUrl;
        must(await sb.from("report_photos").insert({ report_id: r.id, photo_url: url }).select());
      }
    },
    async deleteReport(id) { const { error } = await sb.from("daily_reports").delete().eq("id", id); if (error) throw new Error(error.message); },
  };
}

let instance: DB | null = null;
export function getDB(): DB {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? offlineDB(supabaseDB(url, key), localDB("pd-cache-v1", "supabase", false)) : localDB();
  return instance;
}

export { addDays, monthOf };
