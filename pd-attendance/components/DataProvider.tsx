"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { getDB } from "@/lib/db";
import type { Advance, DailyReport, Payment, Profile, RowKey, RowOf, Snapshot, Status, Worker } from "@/lib/types";

const EMPTY: Snapshot = { workers: [], wages: [], attendance: [], advances: [], payments: [], sites: [], reports: [], reminders: [], materials: [], stock: [] };
import { newId as uid } from "@/lib/id";

interface Ctx {
  ready: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  mode: "demo" | "supabase";
  snap: Snapshot;
  error: string | null;
  online: boolean;
  pending: number;
  signIn(phone: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  saveWorker(w: Omit<Worker, "id"> & { id?: string }): Promise<void>;
  setAttendance(workerId: string, date: string, status: Status | null): Promise<void>;
  markAll(workerIds: string[], date: string, status: Status): Promise<void>;
  addAdvance(a: Omit<Advance, "id">): Promise<void>;
  deleteAdvance(id: string): Promise<void>;
  savePayment(p: Omit<Payment, "id">): Promise<void>;
  deletePayment(id: string): Promise<void>;
  put<K extends RowKey>(key: K, row: RowOf<K>): Promise<void>;
  del(key: RowKey, id: string): Promise<void>;
  saveReport(r: DailyReport): Promise<void>;
  deleteReport(id: string): Promise<void>;
  resetDemo(): void;
}
const C = createContext<Ctx | null>(null);
export const useData = () => {
  const c = useContext(C);
  if (!c) throw new Error("useData outside DataProvider");
  return c;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const db = useMemo(() => getDB(), []);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const online = useSyncExternalStore(
    (cb) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; },
    () => navigator.onLine,
    () => true,
  );
  const [pending, setPending] = useState(0);

  const reload = useCallback(async () => {
    try {
      setSnap(await db.loadAll());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [db]);

  // Online/offline status + automatic sync of changes saved while offline.
  useEffect(() => {
    const on = () => { reload(); };
    window.addEventListener("online", on);
    const t = setInterval(() => {
      const n = db.pending?.() ?? 0;
      setPending(n);
      if (n > 0 && navigator.onLine) reload();
    }, 4000);
    return () => { window.removeEventListener("online", on); clearInterval(t); };
  }, [db, reload]);

  useEffect(() => {
    (async () => {
      const p = await db.getProfile();
      setProfile(p);
      if (p) await reload();
      setReady(true);
    })();
  }, [db, reload]);

  // Run a write; on failure show the error and re-sync from the database.
  const run = useCallback(async (optimistic: (s: Snapshot) => Snapshot, write: () => Promise<unknown>) => {
    setSnap(optimistic);
    try {
      await write();
      setError(null);
    } catch (e) {
      setError("Could not save: " + (e as Error).message);
      await reload();
    }
  }, [reload]);

  const value: Ctx = {
    ready,
    profile,
    isAdmin: profile?.role === "admin",
    mode: db.mode,
    snap,
    error,
    online,
    pending,
    async signIn(phone, password) {
      const err = await db.signIn(phone, password);
      if (err) return err;
      setProfile(await db.getProfile());
      await reload();
      return null;
    },
    async signOut() {
      await db.signOut();
      setProfile(null);
      setSnap(EMPTY);
    },
    async saveWorker(w) {
      try {
        await db.saveWorker(w);
        await reload();
      } catch (e) {
        setError("Could not save: " + (e as Error).message);
      }
    },
    setAttendance(workerId, date, status) {
      return run(
        (s) => ({
          ...s,
          attendance: [
            ...s.attendance.filter((a) => !(a.worker_id === workerId && a.date === date)),
            ...(status ? [{ id: uid(), worker_id: workerId, date, status, site_id: null }] : []),
          ],
        }),
        () => db.setAttendance(workerId, date, status),
      );
    },
    markAll(ids, date, status) {
      return run(
        (s) => ({
          ...s,
          attendance: [
            ...s.attendance.filter((a) => !(a.date === date && ids.includes(a.worker_id))),
            ...ids.map((id) => ({ id: uid(), worker_id: id, date, status, site_id: null })),
          ],
        }),
        () => db.setAttendanceBulk(ids, date, status),
      );
    },
    async addAdvance(a) { await db.addAdvance(a).catch((e) => setError("Could not save: " + e.message)); await reload(); },
    async deleteAdvance(id) { await db.deleteAdvance(id).catch((e) => setError("Could not delete: " + e.message)); await reload(); },
    async savePayment(p) { await db.savePayment(p).catch((e) => setError("Could not save: " + e.message)); await reload(); },
    async deletePayment(id) { await db.deletePayment(id).catch((e) => setError("Could not delete: " + e.message)); await reload(); },
    put(key, row) {
      return run(
        (s) => {
          const list = s[key] as { id: string }[];
          const next = list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row];
          return { ...s, [key]: next };
        },
        () => db.put(key, row),
      );
    },
    async del(key, id) {
      await run((s) => ({ ...s, [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }), () => db.del(key, id));
      if (key === "sites" || key === "materials") await reload();
    },
    async saveReport(r) {
      try { await db.saveReport(r); setError(null); } catch (e) { setError("Could not save: " + (e as Error).message); }
      await reload();
    },
    async deleteReport(id) {
      await run((s) => ({ ...s, reports: s.reports.filter((r) => r.id !== id) }), () => db.deleteReport(id));
    },
    resetDemo() {
      try { localStorage.removeItem("pd-demo-db-v1"); } catch {}
      location.reload();
    },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
