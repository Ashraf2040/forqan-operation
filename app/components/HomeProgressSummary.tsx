"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Target } from "lucide-react";

type Summary = { total: number; completed: number; incomplete: number };

export default function HomeProgressSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/progress-summary", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Summary) => setSummary(data))
      .catch(() => {});
  }, []);

  return <section className="container pb-4">
    <div className="rounded-[24px] border border-[#e6ece5] bg-gradient-to-l from-[#f1f8f2] via-white to-[#fffaf0] p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e2f1e7] text-[#397c68]"><Target size={21}/></span><div><h2 className="text-xl font-bold text-[#304b3e]">إنجاز أهداف الخطة</h2><p className="mt-1 text-sm text-[#7c8983]">يُعد الهدف مكتملًا عند رفع شاهد واحد على الأقل في كل سجل من سجلات المتابعة الخمسة.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e8eee7] bg-white px-5 py-4"><div className="text-xs font-semibold text-[#84918a]">إجمالي الأهداف في المراحل الثلاث</div><div className="mt-2 text-3xl font-bold text-[#344d42]">{summary?.total ?? "—"}</div></div>
        <div className="rounded-2xl border border-[#dcece0] bg-white px-5 py-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#4b8067]"><CheckCircle2 size={15}/> أهداف مكتملة</div><div className="mt-2 text-3xl font-bold text-[#28745e]">{summary?.completed ?? "—"}</div></div>
        <div className="rounded-2xl border border-[#eee8dc] bg-white px-5 py-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#9a7b48]"><CircleDashed size={15}/> أهداف غير مكتملة</div><div className="mt-2 text-3xl font-bold text-[#806338]">{summary?.incomplete ?? "—"}</div></div>
      </div>
    </div>
  </section>;
}
