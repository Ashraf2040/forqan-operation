"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";

export default function UserNavButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <button type="button" disabled aria-label="جارٍ تحميل المستخدم" title="جارٍ تحميل المستخدم" className="btn btn-light !rounded-full !px-4 !py-2.5 text-sm opacity-80"><UserRound size={18}/><span className="hidden sm:inline">حسابي</span></button>;
  }

  if (!session?.user) {
    return <Link href="/login" aria-label="تسجيل الدخول" title="تسجيل الدخول" className="btn btn-light !rounded-full !px-4 !py-2.5 text-sm"><UserRound size={18}/><span className="hidden sm:inline">تسجيل الدخول</span></Link>;
  }

  return <div className="relative">
    <button type="button" aria-label="قائمة المستخدم" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="btn btn-light !rounded-full !px-3 !py-2 text-sm">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e5f2ea] text-[#28745e]"><UserRound size={16}/></span>
      <span className="max-w-28 truncate">{session.user.name || "المستخدم"}</span>
    </button>
    {open && <div className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-48 rounded-2xl border border-[#e7ece5] bg-white p-2 shadow-[0_16px_40px_#173f3020]">
      <div className="border-b border-[#eef1eb] px-3 py-2 text-xs text-[#7c8983]">مسجل الدخول باسم <b className="mt-1 block text-sm text-[#344d42]">{session.user.name || "المستخدم"}</b></div>
      <button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#8a514a] transition hover:bg-[#fbf2f0]"><LogOut size={16}/> تسجيل الخروج</button>
    </div>}
  </div>;
}
