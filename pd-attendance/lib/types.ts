export type Status = "P" | "A" | "H";
export type Role = "admin" | "supervisor";

export interface Worker {
  id: string;
  name: string;
  type: string; // Mason / Labour / Helper (editable free text)
  daily_wage: number; // current wage
  phone: string;
  active: boolean;
  default_site_id: string | null;
}
export interface WageHistory {
  id: string;
  worker_id: string;
  wage: number;
  from_date: string; // YYYY-MM-DD
}
export interface Attendance {
  id: string;
  worker_id: string;
  date: string;
  status: Status;
  site_id: string | null;
}
export interface Advance {
  id: string;
  worker_id: string;
  date: string;
  amount: number;
  note: string;
}
export interface Payment {
  id: string;
  worker_id: string;
  month: string; // YYYY-MM
  amount_paid: number;
  paid_date: string;
}
export type SiteStatus = "Running" | "On hold" | "Finished";
export interface Site {
  id: string;
  name: string;
  address: string;
  start_date: string;
  status: SiteStatus;
}
export interface DailyReport {
  id: string;
  site_id: string;
  date: string;
  notes: string;
  workers_count: number;
  created_by: string;
  photos: string[]; // URLs (or data: URLs for newly added, not yet uploaded photos)
}
export interface Reminder {
  id: string;
  site_id: string;
  text: string;
  due_date: string;
  done: boolean;
}
export interface Material {
  id: string;
  site_id: string;
  name: string;
  unit: string;
  low_stock_limit: number;
}
export interface StockEntry {
  id: string;
  material_id: string;
  date: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string;
}
export interface Snapshot {
  workers: Worker[];
  wages: WageHistory[];
  attendance: Attendance[];
  advances: Advance[];
  payments: Payment[];
  sites: Site[];
  reports: DailyReport[];
  reminders: Reminder[];
  materials: Material[];
  stock: StockEntry[];
}
/** Simple tables that share the generic put/del actions. */
export type RowKey = "sites" | "reminders" | "materials" | "stock";
export type RowOf<K extends RowKey> = Snapshot[K][number];
export interface Profile {
  name: string;
  role: Role;
}
