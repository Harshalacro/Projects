"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { StatusButtons } from "@/components/StatusButtons";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/components/T";
import { addDays, dateLabel, today } from "@/lib/dates";
import type { Status } from "@/lib/types";

export default function AttendancePage() {
  const { snap, setAttendance, markAll } = useData();
  const [date, setDate] = useState(today());
  const [site, setSite] = useState<string>("all");
  const workers = useMemo(
    () => snap.workers.filter((w) => w.active && (site === "all" || w.default_site_id === site)).sort((a, b) => a.name.localeCompare(b.name)),
    [snap.workers, site],
  );
  const byWorker = useMemo(() => {
    const m = new Map<string, Status>();
    snap.attendance.forEach((a) => a.date === date && m.set(a.worker_id, a.status));
    return m;
  }, [snap.attendance, date]);

  const count = (s: Status) => workers.filter((w) => byWorker.get(w.id) === s).length;
  const marked = workers.filter((w) => byWorker.has(w.id)).length;
  const unmarked = workers.length - marked;
  const activeSites = snap.sites.filter((s) => s.status !== "Finished");
  const isToday = date === today();

  return (
    <Shell title={<T k="attendance" />}>
      {/* Date bar */}
      <div className="card mb-3 flex items-center gap-2 p-2">
        <button className="rounded-xl p-3 text-slate-700 hover:bg-slate-100" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><Icon name="left" className="h-6 w-6" /></button>
        <label className="relative flex-1 cursor-pointer text-center">
          <div className="text-lg font-bold leading-tight">{dateLabel(date).replace(/,\s\d{4}$/, "")}</div>
          <div className="text-xs font-medium text-slate-500">{date.slice(0, 4)} · {isToday ? <span className="font-bold text-amber-700"><T k="today" hi={false} /></span> : "tap to change date"}</div>
          <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Pick date" />
        </label>
        <button className="rounded-xl p-3 text-slate-700 hover:bg-slate-100 disabled:opacity-30" onClick={() => setDate(addDays(date, 1))} disabled={isToday} aria-label="Next day"><Icon name="right" className="h-6 w-6" /></button>
      </div>

      {activeSites.length > 0 && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ id: "all", name: "All sites" }, ...activeSites].map((s) => (
            <button key={s.id} onClick={() => setSite(s.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${site === s.id ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-300"}`}>{s.name}</button>
          ))}
        </div>
      )}

      {workers.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Icon name="users" className="h-7 w-7" /></div>
          <p className="mb-1 text-lg font-bold">{site === "all" ? "No workers yet" : "No workers on this site"}</p>
          <p className="mb-4 text-sm text-slate-500">{site === "all" ? "Add your first worker to start marking attendance." : "Assign workers from the site’s Workers tab."}</p>
          <Link href="/workers" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold"><Icon name="plus" /> <T k="addWorker" hi={false} /></Link>
        </div>
      ) : (
        <>
          <div className="card mb-3 p-4">
            <div className="mb-3 grid grid-cols-4 gap-2 text-center">
              <Stat n={count("P")} label="Present" color="text-green-700" />
              <Stat n={count("A")} label="Absent" color="text-red-700" />
              <Stat n={count("H")} label="Half day" color="text-orange-600" />
              <Stat n={unmarked} label="Not marked" color="text-slate-500" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${marked} of ${workers.length} marked`}>
              <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${(marked / workers.length) * 100}%` }} />
            </div>
          </div>
          <button
            onClick={() => markAll(workers.map((w) => w.id), date, "P")}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-base font-bold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
          >
            <Icon name="check" className="h-5 w-5" strokeWidth={3} /> <T k="markAll" />
          </button>
          <ul className="space-y-2">
            {workers.map((w) => (
              <li key={w.id} className="card flex items-center gap-3 p-3">
                <Link href={`/workers/${w.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={w.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold">{w.name}</span>
                    <span className="block truncate text-sm text-slate-500">{w.type}</span>
                  </span>
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

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div>
      <div className={`text-2xl font-extrabold leading-none ${color}`}>{n}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
