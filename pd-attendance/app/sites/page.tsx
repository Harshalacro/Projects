"use client";
import { Shell } from "@/components/Shell";
import { T } from "@/components/T";

export default function SitesPage() {
  return (
    <Shell title={<T k="sites" />}>
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <div className="mb-2 text-4xl">🏗</div>
        <p className="text-lg font-semibold">Site Management is coming in Phase 2</p>
        <p className="mt-1 text-slate-600">Sites, daily reports with photos, reminders and stock in/out.</p>
      </div>
    </Shell>
  );
}
