"use client";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { T } from "@/components/T";
import { btnGhost } from "@/components/Modal";
import { rupees, workerMonth } from "@/lib/calc";
import { addMonths, monthLabel, thisMonth } from "@/lib/dates";
import Link from "next/link";

export default function SummaryPage() {
  const { snap, isAdmin } = useData();
  const [month, setMonth] = useState(thisMonth());
  const rows = useMemo(
    () =>
      snap.workers
        .map((w) => ({ w, r: workerMonth(w, month, snap) }))
        // hide workers who left and have nothing going on this month
        .filter(({ w, r }) => w.active || r.daysWorked > 0 || r.advance > 0 || r.closing !== 0)
        .sort((a, b) => a.w.name.localeCompare(b.w.name)),
    [snap, month],
  );
  const sum = (f: (r: ReturnType<typeof workerMonth>) => number) => rows.reduce((s, x) => s + f(x.r), 0);

  return (
    <Shell title={<T k="summary" />}>
      <div className="mb-3 flex items-center justify-between print:hidden">
        <button className={btnGhost} onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">‹</button>
        <div className="text-lg font-bold">{monthLabel(month)}</div>
        <button className={btnGhost} onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">›</button>
      </div>
      <h2 className="mb-2 hidden text-xl font-bold print:block">P&amp;D Construction Private Limited – {monthLabel(month)}</h2>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full whitespace-nowrap text-xs sm:text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="p-1.5 sm:p-2">Name</th>
              <th className="p-1.5 sm:p-2 text-right">P</th>
              <th className="p-1.5 sm:p-2 text-right">A</th>
              <th className="p-1.5 sm:p-2 text-right">½</th>
              <th className="hidden p-2 text-right sm:table-cell">%</th>
              {isAdmin && <><th className="p-1.5 sm:p-2 text-right">Total</th><th className="p-1.5 sm:p-2 text-right">Adv.</th><th className="p-1.5 sm:p-2 text-right">Old</th><th className="p-1.5 sm:p-2 text-right">Balance</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ w, r }) => (
              <tr key={w.id} className="border-t">
                <td className="p-1.5 sm:p-2 font-semibold"><Link href={`/workers/${w.id}`}>{r.isPaid && <span className="text-green-700">✔ </span>}{w.name}<div className="text-xs font-normal text-slate-500">{w.type}</div></Link></td>
                <td className="p-1.5 sm:p-2 text-right text-green-700">{r.present}</td>
                <td className="p-1.5 sm:p-2 text-right text-red-700">{r.absent}</td>
                <td className="p-1.5 sm:p-2 text-right text-orange-600">{r.half}</td>
                <td className="hidden p-2 text-right sm:table-cell">{r.pct}%</td>
                {isAdmin && (
                  <>
                    <td className="p-1.5 sm:p-2 text-right">{rupees(r.earned)}</td>
                    <td className="p-1.5 sm:p-2 text-right">{r.advance ? rupees(r.advance) : "–"}</td>
                    <td className="p-1.5 sm:p-2 text-right">{r.opening ? (r.opening > 0 ? "+" : "−") + rupees(Math.abs(r.opening)) : "–"}</td>
                    <td className="p-1.5 sm:p-2 text-right font-bold">{rupees(r.closing)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {isAdmin && rows.length > 0 && (
            <tfoot className="border-t-2 border-slate-400 bg-amber-50 font-extrabold">
              <tr>
                <td className="p-1.5 sm:p-2" colSpan={4}><T k="grandTotal" hi={false} /></td>
                <td className="hidden sm:table-cell" />
                <td className="p-1.5 sm:p-2 text-right">{rupees(sum((r) => r.earned))}</td>
                <td className="p-1.5 sm:p-2 text-right">{rupees(sum((r) => r.advance))}</td>
                <td className="p-1.5 sm:p-2 text-right">{rupees(sum((r) => r.opening))}</td>
                <td className="p-1.5 sm:p-2 text-right">{rupees(sum((r) => r.closing))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {rows.length === 0 && <p className="p-6 text-center text-slate-500">No workers yet.</p>}
      <button className={`${btnGhost} mt-3 w-full print:hidden`} onClick={() => window.print()}>🖨 Print</button>
      <p className="mt-2 text-center text-xs text-slate-500 print:hidden">PDF / Excel download comes in Phase 3.</p>
    </Shell>
  );
}
