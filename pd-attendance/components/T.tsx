import { LABELS, type LabelKey } from "@/lib/i18n";

/** English label with a smaller Hindi label next to it. */
export function T({ k, hi = true }: { k: LabelKey; hi?: boolean }) {
  const [en, h] = LABELS[k];
  return (
    <span>
      {en}
      {hi && <span className="ml-1 text-[0.8em] font-normal opacity-70">{h}</span>}
    </span>
  );
}
