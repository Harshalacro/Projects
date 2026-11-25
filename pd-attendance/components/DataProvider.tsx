"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getDB } from "@/lib/db";
import type { Advance, Payment, Profile, Snapshot, Status, Worker } from "@/lib/types";

const EMPTY: Snapshot = { workers: [], wages: [], attendance: [], advances: [], payments: [] };
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface Ctx {
  ready: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  mode: "demo" | "supabase";
  snap: Snapshot;
  error: string | null;
  signIn(phone: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  saveWorker(w: Omit<Worker, "id"> & { id?: string }): Promise<void>;
  setAttendance(workerId: string, date: string, status: Status | null): Promise<void>;
  markAll(workerIds: string[], date: string, status: Status): Promise<void>;
  addAdvance(a: Omit<Advance, "id">): Promise<void>;
  deleteAdvance(id: string): Promise<void>;
  savePayment(p: Omit<Payment, "id">): Promise<void>;
  deletePayment(id: string): Promise<void>;
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

  const reload = useCallback(async () => {
    try {
      setSnap(await db.loadAll());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [db]);

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
    resetDemo() {
      try { localStorage.removeItem("pd-demo-db-v1"); } catch {}
      location.reload();
    },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
