"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ArrowRight, BookOpenCheck, LockKeyhole } from "lucide-react";

function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
      return;
    }
    window.location.assign("/");
  }

  return <form onSubmit={handleSubmit} className="mt-8 space-y-5">
    <label className="block text-sm font-semibold">اسم المستخدم<input name="username" autoComplete="username" required className="login-input mt-2" /></label>
    <label className="block text-sm font-semibold">كلمة المرور<input name="password" type="password" autoComplete="current-password" required className="login-input mt-2" /></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="btn btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-70">{busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}<ArrowRight size={17}/></button>
  </form>;
}

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top_left,#e4f3e9,transparent_45%),#fbfcf8] px-5 py-12">
    <section className="w-full max-w-[440px] rounded-[28px] border border-[#e7ece5] bg-white p-8 shadow-[0_24px_70px_#173f3010] sm:p-10" dir="rtl">
      <Link href="/" className="mb-10 inline-flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e0f1e9] text-[#146b5d]"><BookOpenCheck size={24}/></span><span><b className="block">مدارس الفرقان الدولية</b><small className="text-[#7c8986]">القسم الأمريكي</small></span></Link>
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#f3f6f0] text-[#397c68]"><LockKeyhole size={22}/></div>
      <h1 className="text-3xl font-bold">مرحبًا بعودتك</h1>
      <p className="mt-2 text-sm leading-7 text-[#778581]">سجّل الدخول لمتابعة برامج الخطة التشغيلية وشواهد التنفيذ.</p>
      <LoginForm/>
      <Link href="/" className="mt-7 block text-center text-sm text-[#74827c] hover:text-[#176d60]">العودة إلى الصفحة الرئيسية</Link>
    </section>
  </main>;
}
