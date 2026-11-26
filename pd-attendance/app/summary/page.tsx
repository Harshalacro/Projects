"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { Icon } from "@/components/Icon";
import { T } from "@/components/T";
import { btnGhost } from "@/components/Modal";
import { rupees } from "@/lib/calc";
import { exportExcel, exportPdf, summaryRows } from "@/lib/export";
import { addMonths, monthLabel, thisMonth } from "@/lib/dates";

export default function SummaryPage() {
  const { snap, isAdmin } = useData();
  const [month, setMonth] = useState(thisMonth());
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const rows = useMemo(() => summaryRows(snap, month), [snap, month]);
  const sum = (f: (r: (typeof rows)[number]["r"]) => number) => rows.reduce((s, x) => s + f(x.r), 0);

  async function run(kind: "pdf" | "xlsx") {
    setBusy(kind);
    try {
      if (kind === "pdf") await exportPdf(rows, month, isAdmin);
      else await exportExcel(rows, month, snap, isAdmin);
    } catch (e) {
      alert("Could not create the file: " + (e as Error).message);
    }
    setBusy(null);
  }

  return (
    <Shell title={<T k="summary" />}>
      <div className="card mb-4 flex items-center justify-between p-2 print:hidden">
        <button className="rounded-xl p-3 hover:bg-slate-100" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month"><Icon name="left" className="h-6 w-6" /></button>
        <div className="text-lg font-bold">{monthLabel(month)}</div>
        <button className="rounded-xl p-3 hover:bg-slate-100 disabled:opacity-30" onClick={() => setMonth(addMonths(month, 1))} disabled={month >= thisMonth()} aria-label="Next month"><Icon name="right" className="h-6 w-6" /></button>
      </div>
      <h2 className="mb-2 hidden text-xl font-bold print:block">P&amp;D Construction Private Limited – {monthLabel(month)}</h2>

      {isAdmin && rows.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 print:hidden">
          <Tile label="Total earned" value={rupees(sum((r) => r.earned))} />
          <Tile label="Advances" value={rupees(sum((r) => r.advance))} />
          <Tile label="To pay" value={rupees(sum((r) => r.closing))} strong />
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full whitespace-nowrap text-xs sm:text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-2 sm:p-3">Name</th>
              <th className="p-2 text-right text-green-700">P</th>
              <th className="p-2 text-right text-red-700">A</th>
              <th className="p-2 text-right text-orange-600">½</th>
              <th className="hidden p-2 text-right sm:table-cell">%</th>
              {isAdmin && <><th className="p-2 text-right">Total</th><th className="p-2 text-right">Adv.</th><th className="p-2 text-right">Old</th><th className="p-2 pr-3 text-right">Balance</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ id, name, type, r }) => {
              return (
                <tr key={id} className="border-t border-slate-100 hover:bg-amber-50/40">
                  <td className="p-2 font-semibold sm:p-3"><Link href={`/workers/${id}`}>{r.isPaid && r.closing <= 0 && <span className="mr-1 text-green-600" title="Paid">✔</span>}{name}<div className="text-xs font-normal text-slate-500">{type}</div></Link></td>
                  <td className="p-2 text-right text-green-700">{r.present}</td>
                  <td className="p-2 text-right text-red-700">{r.absent}</td>
                  <td className="p-2 text-right text-orange-600">{r.half}</td>
                  <td className="hidden p-2 text-right sm:table-cell">{r.pct}%</td>
                  {isAdmin && (
                    <>
                      <td className="p-2 text-right">{rupees(r.earned)}</td>
                      <td className="p-2 text-right">{r.advance ? rupees(r.advance) : "–"}</td>
                      <td className={`p-2 text-right ${r.opening < 0 ? "text-red-600" : ""}`}>{r.opening ? (r.opening > 0 ? "+" : "−") + rupees(Math.abs(r.opening)) : "–"}</td>
                      <td className="p-2 pr-3 text-right font-bold">{rupees(r.closing)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          {isAdmin && rows.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 bg-amber-50 font-extrabold">
              <tr>
                <td className="p-2 sm:p-3" colSpan={4}><T k="grandTotal" hi={false} /></td>
                <td className="hidden sm:table-cell" />
                <td className="p-2 text-right">{rupees(sum((r) => r.earned))}</td>
                <td className="p-2 text-right">{rupees(sum((r) => r.advance))}</td>
                <td className="p-2 text-right">{rupees(sum((r) => r.opening))}</td>
                <td className="p-2 pr-3 text-right">{rupees(sum((r) => r.closing))}</td>
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-slate-500">No workers yet.</p>}
      </div>

      {rows.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 print:hidden">
          <button className={btnGhost} onClick={() => run("pdf")} disabled={!!busy}><Icon name="file" className="h-5 w-5 text-red-600" /> {busy === "pdf" ? "…" : "PDF"}</button>
          <button className={btnGhost} onClick={() => run("xlsx")} disabled={!!busy}><Icon name="sheet" className="h-5 w-5 text-green-700" /> {busy === "xlsx" ? "…" : "Excel"}</button>
          <button className={btnGhost} onClick={() => window.print()}><Icon name="printer" className="h-5 w-5" /> <T k="print" hi={false} /></button>
        </div>
      )}
    </Shell>
  );
}

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ring-1 ${strong ? "bg-slate-900 text-white ring-slate-900" : "bg-white ring-slate-200"}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${strong ? "text-slate-300" : "text-slate-500"}`}>{label}</div>
      <div className="mt-1 text-lg font-extrabold leading-tight sm:text-xl">{value}</div>
    </div>
  );
}
