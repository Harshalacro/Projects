"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { StatusButtons } from "@/components/StatusButtons";
import { T } from "@/components/T";
import { btnGhost } from "@/components/Modal";
import { addDays, dateLabel, today } from "@/lib/dates";
import type { Status } from "@/lib/types";

export default function AttendancePage() {
  const { snap, setAttendance, markAll } = useData();
  const [date, setDate] = useState(today());
  const workers = useMemo(() => snap.workers.filter((w) => w.active).sort((a, b) => a.name.localeCompare(b.name)), [snap.workers]);
  const byWorker = useMemo(() => {
    const m = new Map<string, Status>();
    snap.attendance.forEach((a) => a.date === date && m.set(a.worker_id, a.status));
    return m;
  }, [snap.attendance, date]);

  const count = (s: Status) => workers.filter((w) => byWorker.get(w.id) === s).length;
  const unmarked = workers.filter((w) => !byWorker.has(w.id)).length;

  return (
    <Shell title={<T k="attendance" />}>
      <div className="mb-3 flex items-center gap-2">
        <button className={btnGhost} onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">‹</button>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-center text-lg font-semibold"
        />
        <button className={btnGhost} onClick={() => setDate(addDays(date, 1))} disabled={date >= today()} aria-label="Next day">›</button>
      </div>
      <p className="mb-3 text-center font-semibold text-slate-700">
        {dateLabel(date)} {date === today() && <span className="rounded bg-amber-200 px-2 text-sm"><T k="today" hi={false} /></span>}
      </p>

      {workers.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center">
          <p className="mb-4 text-lg">No workers yet.</p>
          <Link href="/workers" className="inline-block rounded-xl bg-amber-500 px-5 py-4 text-lg font-bold"><T k="addWorker" /></Link>
        </div>
      ) : (
        <>
          <button
            onClick={() => markAll(workers.map((w) => w.id), date, "P")}
            className="mb-3 w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-bold text-white active:bg-green-700"
          >
            ✔ <T k="markAll" />
          </button>
          <div className="mb-3 flex justify-around rounded-xl bg-white py-2 text-center text-sm font-semibold shadow-sm">
            <span className="text-green-700">P {count("P")}</span>
            <span className="text-red-700">A {count("A")}</span>
            <span className="text-orange-600">½ {count("H")}</span>
            <span className="text-slate-500"><T k="unmarked" hi={false} /> {unmarked}</span>
          </div>
          <ul className="space-y-2">
            {workers.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
                <Link href={`/workers/${w.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-lg font-bold">{w.name}</div>
                  <div className="text-sm text-slate-500">{w.type}</div>
                </Link>
                <StatusButtons value={byWorker.get(w.id)} onChange={(s) => setAttendance(w.id, date, s)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  );
}
