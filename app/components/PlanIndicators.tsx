"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Target } from "lucide-react";
import source from "@/app/data/plan-indicators.json";

type KPI = { code: string; name: string; dir: string; mode: string; baseD: string; bn: number | null; tn: number | null; targetD: string; freq: string; tool: string; owner: string; prog: string };
type Objective = { n: number; title: string; story: string; time: string; owner: string; refs: string; kpis: KPI[] };
type Stage = "primary" | "middle" | "high";
type Entry = { value: string; updated: number };
const stageNames: Record<Stage, string> = { primary: "المرحلة الابتدائية", middle: "المرحلة المتوسطة", high: "المرحلة الثانوية" };
const objectives = source as Record<Stage, Objective[]>;
const stateLabels: Record<string, string> = { done: "تحقق المستهدف", track: "في المسار", slow: "يحتاج تدخل", watch: "رصد (بلا مستهدف رقمي)", none: "لم يُسجل" };
const stateClasses: Record<string, string> = { done: "pi-status-done", track: "pi-status-track", slow: "pi-status-slow", watch: "pi-status-watch", none: "pi-status-none" };

function progress(k: KPI, raw: string) {
  if (raw.trim() === "" || k.mode === "monitor") return null;
  const current = Number(raw);
  if (!Number.isFinite(current)) return null;
  if (k.mode === "maintain") return k.bn && k.bn > 0 ? Math.max(0, Math.min(100, current / k.bn * 100)) : null;
  if (k.mode === "attain") return k.tn && k.tn > 0 ? Math.max(0, Math.min(100, current / k.tn * 100)) : null;
  if (k.bn === null || k.tn === null || k.bn === k.tn) return null;
  const value = k.dir === "down" ? (k.bn - current) / (k.bn - k.tn) * 100 : (current - k.bn) / (k.tn - k.bn) * 100;
  return Math.max(0, Math.min(100, value));
}
function state(k: KPI, raw: string) {
  if (raw.trim() === "") return "none";
  if (k.mode === "monitor") return "watch";
  const value = progress(k, raw);
  if (value === null) return "watch";
  if (k.mode === "maintain") return value >= 100 ? "done" : "slow";
  return value >= 100 ? "done" : value >= 50 ? "track" : "slow";
}

export default function PlanIndicators() {
  const [stage, setStage] = useState<Stage>("primary");
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem("plan-indicators-values-v2") || "{}")); } catch { setEntries({}); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("plan-indicators-values-v2", JSON.stringify(entries)); }, [entries, ready]);
  const rows = useMemo(() => objectives[stage].flatMap((objective) => objective.kpis.map((kpi) => ({ objective, kpi, key: `${stage}:${kpi.code}` }))), [stage]);
  const totals = rows.reduce<Record<string, number>>((result, row) => { const st = state(row.kpi, entries[row.key]?.value || ""); result[st] = (result[st] || 0) + 1; return result; }, {});
  const setValue = (key: string, value: string) => setEntries((current) => ({ ...current, [key]: { value, updated: Date.now() } }));
  const printDate = new Date().toLocaleDateString("ar-SA");

  return <section id="plan-indicators" className="container pb-8">
    <button type="button" aria-expanded={expanded} aria-controls="plan-indicators-content" onClick={() => setExpanded((value) => !value)} className="mb-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e6ece5] bg-white p-5 text-right shadow-sm transition hover:border-[#bfd6c7] hover:shadow-md print:hidden">
      <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e2f1e7] text-[#397c68]"><Target size={21}/></span><span><b className="block text-xl text-[#304b3e]">مؤشرات الخطة التشغيلية</b><small className="mt-1 block text-sm font-normal text-[#7c8983]">{expanded ? "اضغط لإخفاء مؤشرات المراحل" : "اضغط لعرض مؤشرات المراحل ومتابعة حالتها"}</small></span></span>
      <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-full bg-[#edf6f0] text-xl font-semibold text-[#397c68] transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
    </button>
    {expanded && <div id="plan-indicators-content">
    <div className="mb-5 flex flex-wrap items-center justify-end gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="indicator-stage">المرحلة</label><select id="indicator-stage" value={stage} onChange={(event) => setStage(event.target.value as Stage)} className="rounded-full border border-[#DDE6DF] bg-white px-4 py-2 text-sm">{Object.entries(stageNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><button type="button" onClick={() => window.print()} className="btn btn-primary !rounded-full !px-4 !py-2 text-sm"><Printer size={16}/> طباعة تقرير المرحلة</button></div>
    </div>
    <div className="hidden print:block"><h2 className="mb-2 text-2xl font-bold">تقرير مؤشرات الخطة التشغيلية — {stageNames[stage]}</h2><p className="mb-4 text-sm">العام الدراسي 1447–1448هـ · تاريخ الطباعة: {printDate}</p></div>
    <div className="mb-4 flex flex-wrap gap-2 print:hidden">{Object.entries(stateLabels).map(([key, label]) => <span key={key} className={`rounded-full px-3 py-1 text-xs ${stateClasses[key]}`}>{label} <b>({totals[key] || 0})</b></span>)}</div>
    {objectives[stage].map((objective) => {
      const objectiveRows = objective.kpis.map((kpi) => {
        const key = `${stage}:${kpi.code}`;
        const entry = entries[key];
        const raw = entry?.value || "";
        const currentState = state(kpi, raw);
        const pct = progress(kpi, raw);
        return <div className="pi-row" key={key}>
          <div className="pi-code">{kpi.code}</div>
          <div className="pi-name"><b>{kpi.name}</b><span>الأداة: {kpi.tool} · الدورية: {kpi.freq} · المسؤول: {kpi.owner} · مرتبط بـ: {kpi.prog}</span></div>
          <div className="pi-base" data-label="خط الأساس">{kpi.baseD}</div>
          <div className="pi-target" data-label="المستهدف">{kpi.targetD}</div>
          <div className="pi-now"><input type="number" step="any" inputMode="decimal" value={raw} onChange={(event) => setValue(key, event.target.value)} placeholder="—" aria-label={`القيمة الحالية للمؤشر ${kpi.name}`}/><span>{entry?.updated ? `آخر تحديث: ${new Date(entry.updated).toLocaleDateString("ar-SA")}` : ""}</span></div>
          <div className="pi-progress"><div className="pi-bar"><i className={`pi-fill ${stateClasses[currentState]}`} style={{ width: `${pct ?? 0}%` }}/></div><span className="pi-pct">{pct === null ? "—" : `${pct.toFixed(0)}% من الطريق للمستهدف`}</span><span className={`pi-pill ${stateClasses[currentState]}`}>{stateLabels[currentState]}</span></div>
        </div>;
      });
      const values = objective.kpis.map((kpi) => progress(kpi, entries[`${stage}:${kpi.code}`]?.value || "")).filter((value): value is number => value !== null);
      const average = values.length ? `${Math.round(values.reduce((a, b) => a + b, 0) / values.length)}%` : "—";
      return <article className="pi-goal" key={`${stage}-${objective.n}`}>
        <header className="pi-goal-head"><div className="pi-title-row"><span className="pi-seal">{objective.n}</span><h3>{objective.title}</h3><div className="pi-average"><b>{average}</b><span>{values.length ? "متوسط تقدم مؤشرات الهدف" : "لم يبدأ القياس بعد"}</span></div></div>
          <div className="pi-story"><b>قصة الهدف:</b> <span dangerouslySetInnerHTML={{ __html: objective.story }}/></div>
          <div className="pi-meta"><span className="pi-tag pi-tag-gold">◷ {objective.time}</span><span className="pi-tag">♟ المسؤول: {objective.owner}</span><span className="pi-tag">{objective.refs}</span></div>
        </header>
        <div className="pi-head"><span>الكود</span><span>المؤشر وشواهد القياس</span><span>خط الأساس</span><span>المستهدف</span><span>الآن (أدخل)</span><span>التقدم والحالة</span></div>
        {objectiveRows}
      </article>;
    })}
    </div>}
    <style jsx global>{`#plan-indicators { --pi-ink:#14251F; --pi-muted:#6E7D76; --pi-line:#DDE6DF; --pi-soft:#E9F0EA; --pi-green:#14524B; --pi-gold:#8F6A1F; --pi-gold-soft:#F7EFDB; }
      .pi-goal{background:#fff;border:1px solid var(--pi-line);border-radius:14px;box-shadow:0 1px 2px #14251f0d,0 10px 28px -14px #14251f24;margin-bottom:22px;overflow:hidden}
      .pi-goal-head{padding:18px 20px 14px;border-bottom:1px solid var(--pi-soft);background:linear-gradient(180deg,#FBFDFB,#fff)}
      .pi-title-row{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}.pi-title-row h3{font-size:17.5px;font-weight:700;color:#0B332E;line-height:1.55;flex:1;min-width:240px}
      .pi-seal{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none;background:#B98A2F;color:#fff;font-weight:700;box-shadow:inset 0 0 0 2px #ffffff66}
      .pi-average{text-align:left;min-width:150px;flex:none}.pi-average b{display:block;font-size:22px;color:var(--pi-green);line-height:1.2}.pi-average span{font-size:11px;color:var(--pi-muted)}
      .pi-story{margin-top:10px;border-right:3px solid #B98A2F;background:var(--pi-gold-soft);border-radius:0 9px 9px 0;padding:9px 13px;font-size:13px;color:#5C4A1E}.pi-story b{color:var(--pi-gold)}
      .pi-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.pi-tag{font-size:11px;font-weight:600;color:#41504A;background:#E2EDE8;border-radius:999px;padding:3px 10px}.pi-tag-gold{background:var(--pi-gold-soft);color:var(--pi-gold)}
      .pi-head,.pi-row{display:grid;grid-template-columns:62px minmax(240px,1fr) 96px 96px 108px 148px;gap:12px;align-items:center}.pi-head{padding:9px 20px;font-size:11px;font-weight:700;color:var(--pi-muted);background:#F7FAF7;border-bottom:1px solid var(--pi-soft)}
      .pi-row{padding:13px 20px;border-bottom:1px solid var(--pi-soft);transition:background .15s}.pi-row:last-child{border-bottom:0}.pi-row:hover{background:#FAFCFA}.pi-code{font-weight:700;color:var(--pi-gold);font-size:13px}.pi-name b{display:block;font-size:13.5px;font-weight:600;line-height:1.55}.pi-name span{display:block;font-size:11px;color:var(--pi-muted);line-height:1.7;margin-top:2px}.pi-base,.pi-target{font-size:12.5px;font-weight:600;color:#41504A}.pi-target{color:var(--pi-green)}
      .pi-now input{width:100%;font-family:inherit;font-size:14px;font-weight:700;color:var(--pi-ink);text-align:center;padding:7px 6px;border:1.5px solid var(--pi-line);border-radius:9px;background:#fff}.pi-now input:focus{border-color:#B98A2F;outline:none}.pi-now span{display:block;min-height:12px;margin-top:3px;font-size:9.5px;text-align:center;color:var(--pi-muted)}
      .pi-bar{height:9px;background:var(--pi-soft);border-radius:99px;overflow:hidden}.pi-fill{display:block;height:100%;border-radius:99px;transition:width .3s}.pi-pct{display:block;margin-top:3px;font-size:11px;font-weight:700;color:#41504A}.pi-pill{display:inline-block;margin-top:4px;border-radius:999px;padding:3px 10px;font-size:10.5px;font-weight:700}.pi-status-done{background:#E3F3EA;color:#1E8E5A}.pi-status-track{background:#E2EDE8;color:#14524B}.pi-fill.pi-status-track{background:#2E7A6B}.pi-status-slow{background:#F9E4E2;color:#B3261E}.pi-fill.pi-status-slow{background:#B3261E}.pi-status-none{background:#E9F0EA;color:#6E7D76}.pi-fill.pi-status-none{background:#DDE6DF}.pi-status-watch{background:#F7EFDB;color:#8A6D1B}.pi-fill.pi-status-watch{background:#B98A2F}
      @media(max-width:940px){.pi-head{display:none}.pi-row{grid-template-columns:56px minmax(0,1fr);row-gap:9px}.pi-code{grid-column:1;grid-row:1;align-self:start}.pi-name{grid-column:2}.pi-base,.pi-target,.pi-now,.pi-progress{grid-column:2}.pi-base,.pi-target{border-radius:9px;padding:6px 10px}.pi-base{background:var(--pi-soft)}.pi-target{background:#E2EDE8}.pi-base:before,.pi-target:before{content:attr(data-label) ": ";color:var(--pi-muted);font-weight:500}.pi-now{display:flex;align-items:center;gap:10px}.pi-now input{flex:1}.pi-now span{text-align:right;margin:0}}
      @media print{body *{visibility:hidden!important}#plan-indicators,#plan-indicators *{visibility:visible!important}#plan-indicators{position:absolute;inset:0;width:100%;padding:0}#plan-indicators .print\\:hidden{display:none!important}#plan-indicators .pi-goal{break-inside:avoid;box-shadow:none;margin-bottom:10px}#plan-indicators .pi-now input{border:0;padding:0;appearance:none}#plan-indicators .pi-head,#plan-indicators .pi-row{grid-template-columns:45px minmax(200px,1fr) 75px 75px 70px 115px;gap:8px;padding-left:10px;padding-right:10px}}`}</style>
  </section>;
}
