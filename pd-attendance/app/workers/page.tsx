"use client";
import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { WorkerForm } from "@/components/WorkerForm";
import { T } from "@/components/T";
import { btnPrimary } from "@/components/Modal";
import { rupees } from "@/lib/calc";

export default function WorkersPage() {
  const { snap, isAdmin } = useData();
  const [adding, setAdding] = useState(false);
  const list = [...snap.workers].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  return (
    <Shell title={<T k="workers" />}>
      <button className={`${btnPrimary} mb-3`} onClick={() => setAdding(true)}>＋ <T k="addWorker" /></button>
      <ul className="space-y-2">
        {list.map((w) => (
          <li key={w.id}>
            <Link href={`/workers/${w.id}`} className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ${w.active ? "" : "opacity-50"}`}>
              <div>
                <div className="text-lg font-bold">{w.name} {!w.active && <span className="text-xs font-normal">(left)</span>}</div>
                <div className="text-sm text-slate-500">{w.type}{w.phone && ` · ${w.phone}`}</div>
              </div>
              {isAdmin && <div className="text-lg font-semibold">{rupees(w.daily_wage)}<span className="text-xs text-slate-500">/day</span></div>}
            </Link>
          </li>
        ))}
      </ul>
      {adding && <WorkerForm onClose={() => setAdding(false)} />}
    </Shell>
  );
}
