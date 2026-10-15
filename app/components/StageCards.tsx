"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpLeft } from "lucide-react";

type Stage = { id: string; title: string; en: string; grades: string; color: string; icon: string; count: string };
type StageProgress = { percentage: number };

export default function StageCards({ stages }: { stages: Stage[] }) {
  const [progress, setProgress] = useState<Record<string, StageProgress>>({});

  useEffect(() => {
    fetch("/api/progress-summary", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProgress(data.stageProgress ?? {}))
      .catch(() => {});
  }, []);

  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {stages.map((stage, index) => {
      const percentage = progress[stage.id]?.percentage ?? 0;
      return <Link key={stage.id} href={`/stage/${stage.id}`} className="stage-card card-shadow group relative overflow-hidden rounded-[22px] border border-[#e9ece6] bg-white p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_45px_#143a2b14] md:p-8">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-[#52645a]">تقدم الشواهد</span><span className="rounded-full bg-[#e8f3eb] px-2.5 py-1 font-bold text-[#246b55]">{percentage}%</span></div>
          <div role="progressbar" aria-label={`تقدم الشواهد في ${stage.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-3 overflow-hidden rounded-full bg-[#e3eae3]"><div className="h-full rounded-full bg-gradient-to-l from-[#25765d] to-[#64ad7e] transition-all duration-500" style={{ width: `${percentage}%` }} /></div>
        </div>
        <div className="mb-6 flex items-start justify-between"><span style={{ background: stage.color }} className="grid h-[62px] w-[62px] place-items-center rounded-[18px] text-3xl">{stage.icon}</span><span className="serif rounded-full bg-[#f6f7f2] px-3 py-1.5 text-xs tracking-[.14em] text-[#87918b]">0{index + 1}</span></div>
        <span className="serif text-xs font-bold tracking-[.19em] text-[#91a097]">{stage.en}</span><h3 className="mb-1 mt-2 text-xl font-bold">{stage.title}</h3><p className="text-sm text-[#7a8983]">{stage.grades}</p>
        <div className="mt-5 flex items-center justify-between border-t border-[#eef0ea] pt-4"><span className="text-xs text-[#819088]">{stage.count}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-[#edf6f0] text-[#397c68] transition group-hover:bg-[#176d60] group-hover:text-white"><ArrowUpLeft size={17}/></span></div>
      </Link>;
    })}
  </div>;
}
