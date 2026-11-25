"use client";
import { use, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { MonthGrid } from "@/components/Calendar";
import { StatusButtons } from "@/components/StatusButtons";
import { WorkerForm } from "@/components/WorkerForm";
import { Modal, btnGhost, btnPrimary, inputCls } from "@/components/Modal";
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

  return (
    <Shell title={worker.name} back="/workers">
      <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="text-slate-600">{worker.type}{worker.phone && ` · ${worker.phone}`}{!worker.active && " · (left)"}</div>
      </div>

      <div className="mb-3 flex gap-2">
        <button className={`${btnGhost} flex-1 ${view === "month" ? "!border-amber-500 !bg-amber-100" : ""}`} onClick={() => setView("month")}><T k="month" hi={false} /></button>
        <button className={`${btnGhost} flex-1 ${view === "year" ? "!border-amber-500 !bg-amber-100" : ""}`} onClick={() => setView("year")}><T k="year" hi={false} /></button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button className={btnGhost} onClick={() => setMonth(addMonths(month, view === "year" ? -12 : -1))} aria-label="Previous">‹</button>
        <div className="text-lg font-bold">{view === "year" ? year : monthLabel(month)}</div>
        <button className={btnGhost} onClick={() => setMonth(addMonths(month, view === "year" ? 12 : 1))} aria-label="Next">›</button>
      </div>

      {view === "month" ? (
        <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
          <MonthGrid month={month} statusByDay={r.statusByDay} big onDay={(d) => setDayModal(d)} />
        </div>
      ) : (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {yearMonths.map((m) => (
            <button key={m.month} onClick={() => { setMonth(m.month); setView("month"); }} className="rounded-xl bg-white p-2 text-left shadow-sm">
              <div className="mb-1 text-xs font-bold">{monthName(m.month).slice(0, 3)} <span className="font-normal text-slate-500">{m.pct}%</span></div>
              <MonthGrid month={m.month} statusByDay={m.statusByDay} />
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 flex justify-around rounded-xl bg-white p-3 text-center shadow-sm">
        <div><div className="text-2xl font-extrabold text-green-700">{r.present}</div><div className="text-xs text-slate-500"><T k="present" hi={false} /></div></div>
        <div><div className="text-2xl font-extrabold text-red-700">{r.absent}</div><div className="text-xs text-slate-500"><T k="absent" hi={false} /></div></div>
        <div><div className="text-2xl font-extrabold text-orange-600">{r.half}</div><div className="text-xs text-slate-500"><T k="half" hi={false} /></div></div>
      </div>
      <div className="mb-3 rounded-xl bg-white p-3 text-center shadow-sm">
        <div className="text-lg font-bold">Present {r.daysWorked} of {r.days} days = {r.pct}%</div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-green-600" style={{ width: `${Math.min(100, r.pct)}%` }} /></div>
      </div>

      {isAdmin && (
        <div className="mb-3 rounded-xl bg-white p-4 shadow-sm">
          <Row label={<T k="wage" hi={false} />} value={rupees(worker.daily_wage)} />
          {r.opening !== 0 && <Row label={<T k="oldBalance" hi={false} />} value={(r.opening > 0 ? "+" : "−") + rupees(Math.abs(r.opening))} />}
          <Row label={<T k="total" hi={false} />} value={rupees(r.earned)} />
          <Row label={<T k="advance" hi={false} />} value={"− " + rupees(r.advance)} />
          <div className="my-2 border-t-2 border-slate-300" />
          <Row big label={<T k="balance" hi={false} />} value={rupees(r.payable)} />
          {r.paid > 0 && <Row label={`Paid on ${dateLabel(r.paidDate!)}`} value={"− " + rupees(r.paid)} />}
          {r.paid > 0 && <Row big label="Still due" value={rupees(r.closing)} />}
          {r.isPaid && <div className="mt-2 rounded-lg bg-green-100 p-2 text-center font-bold text-green-800">✔ <T k="paid" /></div>}

          {monthAdvances.length > 0 && (
            <div className="mt-3 border-t pt-2 text-sm">
              <div className="mb-1 font-semibold text-slate-600"><T k="advance" hi={false} /></div>
              {monthAdvances.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <span>{dateLabel(a.date)}{a.note && ` · ${a.note}`}</span>
                  <span className="flex items-center gap-2 font-semibold">{rupees(a.amount)}
                    <button className="text-red-600" onClick={() => confirm("Delete this advance?") && deleteAdvance(a.id)} aria-label="Delete advance">✕</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {isAdmin && (
          <div className="grid grid-cols-2 gap-2">
            <button className={btnPrimary} onClick={() => { setAmount(""); setNote(""); setModal("advance"); }}><T k="addAdvance" hi={false} /></button>
            <button className={`${btnPrimary} !bg-green-600 !text-white`} onClick={() => { setAmount(String(Math.max(0, Math.round(r.closing)))); setModal("paid"); }}><T k="markPaid" hi={false} /></button>
          </div>
        )}
        <button className={btnGhost} onClick={() => setModal("edit")}><T k="editWorker" hi={false} /></button>
      </div>

      {modal === "edit" && <WorkerForm worker={worker} onClose={() => setModal(null)} />}

      {modal === "advance" && (
        <Modal title={<T k="addAdvance" />} onClose={() => setModal(null)}>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            await addAdvance({ worker_id: id, date: month === thisMonth() ? today() : dateIn(month, 1), amount: Number(amount), note: note.trim() });
            setModal(null);
          }}>
            <label className="block text-sm font-semibold">Amount (₹)
              <input className={inputCls} inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <label className="block text-sm font-semibold">Note (optional)
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button className={btnPrimary} disabled={!(Number(amount) > 0)}><T k="save" /></button>
          </form>
        </Modal>
      )}

      {modal === "paid" && (
        <Modal title={<T k="markPaid" />} onClose={() => setModal(null)}>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            await savePayment({ worker_id: id, month, amount_paid: Number(amount), paid_date: today() });
            setModal(null);
          }}>
            <p className="text-slate-600">Balance for {monthLabel(month)}: <b>{rupees(r.closing)}</b>. Change the amount if you are paying only part.</p>
            <label className="block text-sm font-semibold">Amount paid (₹)
              <input className={inputCls} inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <button className={btnPrimary} disabled={!(Number(amount) > 0)}><T k="save" /></button>
          </form>
          {payments.length > 0 && (
            <div className="mt-4 border-t pt-2 text-sm">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <span>Paid {dateLabel(p.paid_date)}</span>
                  <span className="font-semibold">{rupees(p.amount_paid)} <button className="ml-2 text-red-600" onClick={() => confirm("Undo this payment?") && deletePayment(p.id)}>Undo</button></span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {dayModal !== null && (
        <Modal title={dateLabel(dateIn(month, dayModal))} onClose={() => setDayModal(null)}>
          <div className="flex justify-center py-4">
            <StatusButtons value={dayStatus} onChange={(s) => { setAttendance(id, dateIn(month, dayModal), s); setDayModal(null); }} />
          </div>
          <p className="text-center text-sm text-slate-500">Tap the selected one again to clear the day.</p>
        </Modal>
      )}
    </Shell>
  );
}

function Row({ label, value, big }: { label: React.ReactNode; value: string; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${big ? "text-xl font-extrabold" : "text-base"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
