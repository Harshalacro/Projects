import { daysInMonth, dateIn } from "./dates";
import type { Snapshot, Status, Worker } from "./types";

export const DAY_VALUE: Record<Status, number> = { P: 1, H: 0.5, A: 0 };

/** Wage that applied on `date`: latest wage_history row on/before that date. Old days keep the old wage. */
export function wageOn(worker: Worker, date: string, snap: Snapshot): number {
  let best: { from: string; wage: number } | null = null;
  for (const w of snap.wages) {
    if (w.worker_id !== worker.id || w.from_date > date) continue;
    if (!best || w.from_date >= best.from) best = { from: w.from_date, wage: w.wage };
  }
  return best ? best.wage : worker.daily_wage;
}

export interface MonthResult {
  month: string;
  days: number; // days in month
  present: number;
  half: number;
  absent: number;
  daysWorked: number; // present + 0.5*half
  pct: number; // daysWorked / days in month
  earned: number; // total amount
  advance: number;
  opening: number; // old balance carried forward
  payable: number; // earned - advance + opening
  paid: number;
  closing: number; // carried to next month
  isPaid: boolean;
  paidDate: string | null;
  statusByDay: Record<number, Status>;
}

export function workerMonth(worker: Worker, month: string, snap: Snapshot): MonthResult {
  const start = dateIn(month, 1);
  let opening = 0;
  let earned = 0;
  let present = 0;
  let half = 0;
  let absent = 0;
  const statusByDay: Record<number, Status> = {};

  for (const a of snap.attendance) {
    if (a.worker_id !== worker.id) continue;
    const amount = DAY_VALUE[a.status] * wageOn(worker, a.date, snap);
    if (a.date < start) opening += amount;
    else if (a.date.slice(0, 7) === month) {
      earned += amount;
      statusByDay[Number(a.date.slice(8, 10))] = a.status;
      if (a.status === "P") present++;
      else if (a.status === "H") half++;
      else absent++;
    }
  }
  let advance = 0;
  for (const a of snap.advances) {
    if (a.worker_id !== worker.id) continue;
    if (a.date < start) opening -= a.amount;
    else if (a.date.slice(0, 7) === month) advance += a.amount;
  }
  let paid = 0;
  let paidDate: string | null = null;
  for (const p of snap.payments) {
    if (p.worker_id !== worker.id) continue;
    if (p.month < month) opening -= p.amount_paid;
    else if (p.month === month) {
      paid += p.amount_paid;
      paidDate = p.paid_date;
    }
  }
  const payable = opening + earned - advance;
  const days = daysInMonth(month);
  const daysWorked = present + 0.5 * half;
  return {
    month,
    days,
    present,
    half,
    absent,
    daysWorked,
    pct: days ? Math.round((daysWorked / days) * 100) : 0,
    earned,
    advance,
    opening,
    payable,
    paid,
    closing: payable - paid,
    isPaid: paid > 0,
    paidDate,
    statusByDay,
  };
}

export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
