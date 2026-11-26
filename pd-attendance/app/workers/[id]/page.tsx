"use client";
import { use, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { MonthGrid } from "@/components/Calendar";
import { StatusButtons } from "@/components/StatusButtons";
import { WorkerForm } from "@/components/WorkerForm";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Modal, btnPrimary, inputCls } from "@/components/Modal";
import { T } from "@/components/T";
import { rupees, workerMonth } from "@/lib/calc";
import { addMonths, dateIn, dateLabel, monthLabel, monthName, thisMonth, today } from "@/lib/dates";

export default function WorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snap, isAdmin, setAttendance, addAdvance, deleteAdvance, savePayment, deletePayment } = useData();
  const worker = snap.workers.find((w) => w.id === id);
  const [month, setMonth] = useState(thisMonth());
  const [view, setView] = useState<"month" | "year">("month");
  const [dayModal, setDayModal] = useState<number | null>(null);
  const [modal, setModal] = useState<"advance" | "paid" | "edit" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const r = useMemo(() => (worker ? workerMonth(worker, month, snap) : null), [worker, month, snap]);
  const year = month.slice(0, 4);
  const yearMonths = useMemo(
    () => (worker ? Array.from({ length: 12 }, (_, i) => workerMonth(worker, `${year}-${String(i + 1).padStart(2, "0")}`, snap)) : []),
    [worker, year, snap],
  );

  if (!worker || !r) {
    return <Shell title="Worker" back="/workers"><p className="p-6 text-center text-slate-500">{snap.workers.length ? "Worker not found." : "Loading…"}</p></Shell>;
  }
  const monthAdvances = snap.advances.filter((a) => a.worker_id === id && a.date.slice(0, 7) === month).sort((a, b) => a.date.localeCompare(b.date));
  const payments = snap.payments.filter((p) => p.worker_id === id && p.month === month);
  const dayStatus = dayModal ? r.statusByDay[dayModal] : undefined;
  const siteName = snap.sites.find((s) => s.id === worker.default_site_id)?.name;

  return (
    <Shell title={worker.name} back="/workers" action={<button onClick={() => setModal("edit")} aria-label="Edit worker" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700"><Icon name="edit" /></button>}>
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <div>
          <div className="card mb-3 flex items-center gap-3 p-4">
            <Avatar name={worker.name} size="h-14 w-14 text-xl" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{worker.name}</div>
              <div className="truncate text-sm text-slate-500">{worker.type}{siteName && ` · ${siteName}`}{worker.phone && ` · ${worker.phone}`}</div>
            </div>
            {!worker.active && <span className="rounded bg-slate-200 px-2 py-1 text-xs font-bold uppercase text-slate-600">Left</span>}
          </div>

          <div className="card mb-3 p-3">
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(["month", "year"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-lg py-2.5 text-sm font-bold ${view === v ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}><T k={v} hi={false} /></button>
              ))}
            </div>
            <div className="mb-3 flex items-center justify-between">
              <button className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100" onClick={() => setMonth(addMonths(month, view === "year" ? -12 : -1))} aria-label="Previous"><Icon name="left" className="h-6 w-6" /></button>
              <div className="text-base font-bold">{view === "year" ? year : monthLabel(month)}</div>
              <button className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100" onClick={() => setMonth(addMonths(month, view === "year" ? 12 : 1))} aria-label="Next"><Icon name="right" className="h-6 w-6" /></button>
            </div>
            {view === "month" ? (
              <MonthGrid month={month} statusByDay={r.statusByDay} big onDay={(d) => setDayModal(d)} />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {yearMonths.map((m) => (
                  <button key={m.month} onClick={() => { setMonth(m.month); setView("month"); }} className="rounded-xl bg-slate-50 p-2 text-left ring-1 ring-slate-200 hover:ring-amber-400">
                    <div className="mb-1 flex justify-between text-xs font-bold">{monthName(m.month).slice(0, 3)} <span className="font-semibold text-slate-500">{m.pct}%</span></div>
                    <MonthGrid month={m.month} statusByDay={m.statusByDay} />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-center gap-4 text-xs font-medium text-slate-500">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />Present</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />Absent</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" />Half day</span>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-3 p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Num n={r.present} label="Present" color="text-green-700" />
              <Num n={r.absent} label="Absent" color="text-red-700" />
              <Num n={r.half} label="Half day" color="text-orange-600" />
            </div>
            <div className="mt-4 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-slate-600">Present {r.daysWorked} of {r.days} days</span>
              <span className="text-xl font-extrabold">{r.pct}%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, r.pct)}%` }} /></div>
          </div>

          {isAdmin && (
            <div className="card mb-3 p-4">
              <div className="section-title">Money · {monthLabel(month)}</div>
              <Row label={<T k="wage" hi={false} />} value={rupees(worker.daily_wage) + " / day"} />
              {r.opening !== 0 && <Row label={<T k="oldBalance" hi={false} />} value={(r.opening > 0 ? "+ " : "− ") + rupees(Math.abs(r.opening))} />}
              <Row label={<T k="total" hi={false} />} value={rupees(r.earned)} />
              <Row label={<T k="advance" hi={false} />} value={"− " + rupees(r.advance)} />
              <div className="my-2 border-t border-dashed border-slate-300" />
              <Row big label={<T k="balance" hi={false} />} value={rupees(r.payable)} />
              {r.paid > 0 && <Row label={`Paid on ${dateLabel(r.paidDate!)}`} value={"− " + rupees(r.paid)} />}
              {r.paid > 0 && <Row big label={<T k="stillDue" hi={false} />} value={rupees(r.closing)} />}
              {r.isPaid && r.closing <= 0 && <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-2.5 font-bold text-green-800 ring-1 ring-green-200"><Icon name="check" strokeWidth={3} /> <T k="paid" /></div>}

              {monthAdvances.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
                  <div className="section-title"><T k="advance" hi={false} /></div>
                  {monthAdvances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-600">{dateLabel(a.date)}{a.note && ` · ${a.note}`}</span>
                      <span className="flex items-center gap-2 font-bold">{rupees(a.amount)}
                        <button className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => confirm("Delete this advance?") && deleteAdvance(a.id)} aria-label="Delete advance"><Icon name="trash" className="h-4 w-4" /></button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="grid grid-cols-2 gap-2">
              <button className={btnPrimary} onClick={() => { setAmount(""); setNote(""); setModal("advance"); }}><Icon name="plus" /> <T k="addAdvance" hi={false} /></button>
              <button className={`${btnPrimary} !bg-green-600 !text-white hover:!bg-green-700`} onClick={() => { setAmount(String(Math.max(0, Math.round(r.closing)))); setModal("paid"); }}><Icon name="check" strokeWidth={3} /> <T k="markPaid" hi={false} /></button>
            </div>
          )}
        </div>
      </div>

      {modal === "edit" && <WorkerForm worker={worker} onClose={() => setModal(null)} />}

      {modal === "advance" && (
        <Modal title={<T k="addAdvance" />} onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            await addAdvance({ worker_id: id, date: month === thisMonth() ? today() : dateIn(month, 1), amount: Number(amount), note: note.trim() });
            setModal(null);
          }}>
            <label className="label">Amount (₹)
              <input className={`${inputCls} text-2xl font-bold`} inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <label className="label">Note (optional)
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button className={btnPrimary} disabled={!(Number(amount) > 0)}><T k="save" /></button>
          </form>
        </Modal>
      )}

      {modal === "paid" && (
        <Modal title={<T k="markPaid" />} onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            await savePayment({ worker_id: id, month, amount_paid: Number(amount), paid_date: today() });
            setModal(null);
          }}>
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Balance for {monthLabel(month)}: <b className="text-slate-900">{rupees(r.closing)}</b>. Change the amount if you are paying only part — the rest carries to next month.</p>
            <label className="label">Amount paid (₹)
              <input className={`${inputCls} text-2xl font-bold`} inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <button className={btnPrimary} disabled={!(Number(amount) > 0)}><T k="save" /></button>
          </form>
          {payments.length > 0 && (
            <div className="mt-4 border-t pt-3 text-sm">
              <div className="section-title">Payments this month</div>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600">{dateLabel(p.paid_date)}</span>
                  <span className="font-bold">{rupees(p.amount_paid)} <button className="ml-2 text-xs font-semibold text-red-600 underline" onClick={() => confirm("Undo this payment?") && deletePayment(p.id)}>Undo</button></span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {dayModal !== null && (
        <Modal title={dateLabel(dateIn(month, dayModal))} onClose={() => setDayModal(null)}>
          <div className="flex justify-center py-4">
            <div className="scale-125"><StatusButtons value={dayStatus} onChange={(s) => { setAttendance(id, dateIn(month, dayModal), s); setDayModal(null); }} /></div>
          </div>
          <p className="text-center text-sm text-slate-500">Tap the selected one again to clear the day.</p>
        </Modal>
      )}
    </Shell>
  );
}

function Num({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-50 py-3">
      <div className={`text-3xl font-extrabold leading-none ${color}`}>{n}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function Row({ label, value, big }: { label: React.ReactNode; value: string; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${big ? "text-lg font-extrabold text-slate-900" : "text-[15px] text-slate-700"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
