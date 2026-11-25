import type { Material, Snapshot } from "./types";

export function stockOf(m: Material, snap: Snapshot) {
  let q = 0;
  for (const e of snap.stock) if (e.material_id === m.id) q += e.type === "IN" ? e.quantity : -e.quantity;
  return q;
}
export const isLow = (m: Material, snap: Snapshot) => m.low_stock_limit > 0 && stockOf(m, snap) <= m.low_stock_limit;
