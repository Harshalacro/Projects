"use client";
import { LABELS, type LabelKey } from "@/lib/i18n";
import { useLang } from "./Lang";

/** A label in English, Hindi, or both (small Hindi next to English) depending on the Language setting. */
export function T({ k, hi = true }: { k: LabelKey; hi?: boolean }) {
  const { lang } = useLang();
  const [en, h] = LABELS[k];
  if (lang === "hi") return <span>{h}</span>;
  if (lang === "en" || !hi) return <span>{en}</span>;
  return (
    <span>
      {en}
      <span className="ml-1 text-[0.8em] font-normal opacity-70">{h}</span>
    </span>
  );
}

/** Hook for plain-string needs (placeholders, aria labels). */
export function useT() {
  const { lang } = useLang();
  return (k: LabelKey) => {
    const [en, h] = LABELS[k];
    return lang === "hi" ? h : lang === "en" ? en : `${en} / ${h}`;
  };
}
