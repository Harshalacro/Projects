import type { DB, LocalDB } from "./db";
import type { Profile } from "./types";

/**
 * Offline-first wrapper around the Supabase DB.
 *  - Every write is applied to a local copy first (so the screen updates instantly, even with no signal).
 *  - If the network is down, the change goes into a queue stored on the phone and is sent later, in order.
 *  - Reads fall back to the local copy when offline.
 */
const WRITES = [
  "saveWorker", "setAttendance", "setAttendanceBulk", "addAdvance", "deleteAdvance",
  "savePayment", "deletePayment", "put", "del", "saveReport", "deleteReport",
] as const;
type WriteMethod = (typeof WRITES)[number];
interface Op { m: WriteMethod; args: unknown[] }

const QKEY = "pd-queue-v1";
const PKEY = "pd-profile-v1";

export const isNetworkError = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  return (typeof navigator !== "undefined" && navigator.onLine === false) || /failed to fetch|fetch failed|network|offline|timeout|load failed|aborted/i.test(msg);
};

export function offlineDB(inner: DB, local: LocalDB, store: Pick<Storage, "getItem" | "setItem" | "removeItem"> = globalThis.localStorage): DB {
  const load = (): Op[] => { try { return JSON.parse(store.getItem(QKEY) ?? "[]"); } catch { return []; } };
  let queue: Op[] | null = null;
  const q = () => (queue ??= load());
  const save = () => { try { store.setItem(QKEY, JSON.stringify(q())); } catch {} };
  const online = () => typeof navigator === "undefined" || navigator.onLine !== false;

  function enqueue(op: Op) {
    // Marking the same worker/day again replaces the earlier queued tap.
    if (op.m === "setAttendance") {
      queue = q().filter((o) => !(o.m === "setAttendance" && o.args[0] === op.args[0] && o.args[1] === op.args[1]));
    }
    q().push(op);
    save();
  }

  let flushing: Promise<boolean> | null = null;
  function flush(): Promise<boolean> {
    return (flushing ??= (async () => {
      try {
        while (q().length) {
          const op = q()[0];
          try {
            await (inner[op.m] as (...a: unknown[]) => Promise<unknown>)(...op.args);
          } catch (e) {
            if (isNetworkError(e)) return false;
            console.warn("Dropping change the server refused:", op.m, e);
          }
          q().shift();
          save();
        }
        return true;
      } finally {
        flushing = null;
      }
    })());
  }

  async function write(m: WriteMethod, args: unknown[]) {
    const res = await (local[m] as (...a: unknown[]) => Promise<unknown>)(...args);
    // saveWorker / addAdvance / savePayment create ids locally; send that same record so ids match everywhere.
    const sendArgs = m === "saveWorker" || m === "addAdvance" || m === "savePayment" ? [res] : args;
    if (q().length === 0 && online()) {
      try {
        await (inner[m] as (...a: unknown[]) => Promise<unknown>)(...sendArgs);
        return res;
      } catch (e) {
        if (!isNetworkError(e)) throw e;
      }
    }
    enqueue({ m, args: sendArgs });
    return res;
  }

  const db = {
    mode: "supabase" as const,
    pending: () => q().length,
    async getProfile(): Promise<Profile | null> {
      try {
        const p = await inner.getProfile();
        if (p) store.setItem(PKEY, JSON.stringify(p));
        else store.removeItem(PKEY);
        return p;
      } catch {
        try { return JSON.parse(store.getItem(PKEY) ?? "null"); } catch { return null; }
      }
    },
    signIn: (phone: string, password: string) => inner.signIn(phone, password),
    async signOut() {
      await flush().catch(() => false);
      await inner.signOut();
      store.removeItem(PKEY);
      if (q().length === 0) local.replaceAll({ workers: [], wages: [], attendance: [], advances: [], payments: [], sites: [], reports: [], reminders: [], materials: [], stock: [] });
    },
    async loadAll() {
      if (online() && (await flush())) {
        try {
          const s = await inner.loadAll();
          local.replaceAll(s);
          return s;
        } catch (e) {
          if (!isNetworkError(e)) throw e;
        }
      }
      return local.loadAll();
    },
  } as Record<string, unknown>;

  for (const m of WRITES) db[m] = (...args: unknown[]) => write(m, args);
  return db as unknown as DB;
}
