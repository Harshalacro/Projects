const p = (n: number) => String(n).padStart(2, "0");

export const ymd = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const today = () => ymd(new Date());
export const monthOf = (date: string) => date.slice(0, 7);
export const thisMonth = () => monthOf(today());

export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
export function dateIn(month: string, day: number) {
  return `${month}-${p(day)}`;
}
export function addMonths(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
}
export function addDays(date: string, delta: number) {
  const [y, m, d] = date.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + delta));
}
/** 0 = Sunday */
export function weekdayOfFirst(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthName = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1];
export const monthLabel = (month: string) => `${monthName(month)} ${month.slice(0, 4)}`;
export function dateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
