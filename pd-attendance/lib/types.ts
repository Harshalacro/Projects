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
export interface Snapshot {
  workers: Worker[];
  wages: WageHistory[];
  attendance: Attendance[];
  advances: Advance[];
  payments: Payment[];
}
export interface Profile {
  name: string;
  role: Role;
}
