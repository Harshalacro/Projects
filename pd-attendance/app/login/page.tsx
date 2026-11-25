"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { btnPrimary, inputCls } from "@/components/Modal";
import { T } from "@/components/T";

export default function Login() {
  const { ready, profile, signIn } = useData();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace("/attendance");
  }, [ready, profile, router]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 p-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-extrabold">P&amp;D</div>
        <h1 className="text-2xl font-bold">P&amp;D Construction</h1>
        <p className="text-slate-600">Private Limited – Attendance System</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(await signIn(phone, password));
          setBusy(false);
        }}
      >
        <label className="block font-semibold"><T k="phone" hi />
          <input className={inputCls} inputMode="tel" autoComplete="username" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block font-semibold"><T k="password" />
          <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err && <p className="rounded-lg bg-red-100 p-3 font-semibold text-red-700">{err}</p>}
        <button className={btnPrimary} disabled={busy || !phone || !password}><T k="login" /></button>
      </form>
    </div>
  );
}
