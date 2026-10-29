import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ClipboardCheck, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import UserNavButton from "./components/UserNavButton";
import HomeProgressSummary from "./components/HomeProgressSummary";
import PlanIndicators from "./components/PlanIndicators";
import StageCards from "./components/StageCards";

const stages = [
  { id:"primary", title:"المرحلة الابتدائية", en:"ELEMENTARY", grades:"الصفوف 1 – 6", color:"#dff2e9", icon:"🌱", count:"6 صفوف دراسية" },
  { id:"middle", title:"المرحلة المتوسطة", en:"MIDDLE SCHOOL", grades:"الصفوف 7 – 9", color:"#e8eafd", icon:"🧭", count:"3 صفوف دراسية" },
  { id:"high", title:"المرحلة الثانوية", en:"HIGH SCHOOL", grades:"الصفوف 10 – 12", color:"#fae9d8", icon:"🎓", count:"3 صفوف دراسية" },
  { id:"development", title:"تطوير الخطة التشغيلية", en:"PLAN DEVELOPMENT", grades:"أهداف ومتابعة يدوية", color:"#e7f3ec", icon:"📝", count:"أضف أهداف الخطة ومتابعتها" },
];

export default function Home() {
  return <main className="min-h-screen overflow-hidden">
    <nav className="container flex h-[82px] items-center justify-between border-b border-[#e9ece7]">
      <Link href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e0f1e9] text-[#146b5d]"><BookOpenCheck size={23}/></span><span><b className="block text-[15px]">مدارس الفرقان الأهلية</b><small className="text-[13px] text-[#7c8986]">القسم الأمريكي</small></span></Link>
      <span className="hidden items-center gap-2 rounded-full border border-[#e8ebe5] bg-white px-4 py-2 text-xs text-[#697876] sm:flex"><span className="h-2 w-2 rounded-full bg-[#54a57d]"/> العام الدراسي 2026 – 2027</span>
      <div className="flex items-center gap-2"><UserNavButton/><a href="#stages" className="btn btn-primary !rounded-full !px-4 !py-2.5 text-sm">استكشف الخطة <ArrowLeft size={16}/></a></div>
    </nav>
    <section className="grid-bg relative">
      <div className="hero-orb left-[8%] top-16 h-52 w-52 bg-[#e4f3e9]/70"/><div className="hero-orb right-[10%] top-40 h-32 w-32 bg-[#f7ead1]/60"/>
      <div className="container relative grid min-h-[480px] items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr]">
        <div className="max-w-[620px]"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce9df] bg-white/80 px-4 py-2 text-xs font-semibold text-[#557468]"><Sparkles size={14} className="text-[#b18a45}"/> رؤية واضحة، وأثر يصنع الفرق</div>
          <h1 className="mb-3 text-[clamp(2rem,2.9vw,2.65rem)] font-bold leading-[1.35] tracking-[-.035em]">الخطة التشغيلية <span>لمدارس الفرقان الأهلية</span> <span className="bg-gradient-to-l from-[#12836d] via-[#16836a] to-[#38a66c] bg-clip-text text-transparent">- القسم الأمريكي</span></h1>
          <p className="mb-7 text-base leading-8 text-[#71807d]">العام الدراسي 2026–2027م<br/>منصة واحدة لمتابعة البرامج، وقياس التقدم، وتوثيق الشواهد.</p>
          <div className="flex flex-wrap gap-3"><a href="#stages" className="btn btn-primary">ابدأ استكشاف الخطة <ArrowLeft size={18}/></a><span className="flex items-center gap-2 px-3 text-sm text-[#798783]"><ClipboardCheck size={17}/> متابعة منظمة خطوة بخطوة</span></div>
          <div className="mt-12 flex items-center gap-8 border-t border-[#e4e9e1] pt-6"><div><b className="serif text-2xl">٣</b><span className="mr-2 text-sm text-[#72817d]">مراحل دراسية</span></div><div className="h-8 w-px bg-[#e3e9e2]"/><div><b className="serif text-2xl">٢٠٢٧</b><span className="mr-2 text-sm text-[#72817d]">عام الإنجاز</span></div></div>
        </div>
        <div className="relative mx-auto flex h-[350px] w-full max-w-[460px] items-center justify-center">
          <div className="absolute h-[300px] w-[300px] rounded-full border border-[#d9e9dc]"/><div className="absolute h-[230px] w-[230px] rounded-full border border-dashed border-[#cfdfd3]"/>
          <div className="float relative grid h-48 w-48 place-items-center rounded-[42%_58%_55%_45%/45%_43%_57%_55%] bg-gradient-to-br from-[#e2f3e9] to-[#bdddcf] shadow-[0_28px_70px_#225e4420]"><span className="text-[82px]">📚</span></div>
          <div className="absolute right-2 top-10 rounded-2xl border border-[#edf0e9] bg-white p-4 shadow-lg"><div className="mb-1 flex items-center gap-2 text-xs text-[#7b8983]"><TrendingUp size={15} className="text-[#499477]"/> تقدّم مستمر</div><b className="text-sm">خطوة نحو التميّز</b></div>
          <div className="absolute bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-[#edf0e9] bg-white p-3.5 shadow-lg"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fbf1dc] text-xl">✦</span><span><b className="block text-sm">شواهد موثّقة</b><small className="text-xs text-[#87918c]">كل إنجاز له أثر</small></span></div>
          <div className="absolute left-8 top-12 text-[#b18a45]"><Sparkles size={24}/></div><div className="absolute bottom-14 right-8 text-[#73a991]"><GraduationCap size={26}/></div>
        </div>
      </div>
    </section>
    <section id="stages" className="stage-cards-container pb-16 pt-16">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-xs font-bold tracking-[.16em] text-[#b28a4b]">اختر المرحلة</div><h2 className="text-3xl font-bold">رحلتكم تبدأ من هنا</h2><p className="mt-2 text-sm text-[#778581]">اختر المرحلة لعرض برامجها ومتابعة تنفيذها.</p></div><span className="rounded-full bg-[#f3f6f0] px-4 py-2 text-xs text-[#6d7d73]">ثلاث مراحل · خطة متكاملة</span></div>
      <StageCards stages={stages}/>
      <div className="mt-8 rounded-2xl border border-[#e8eee7] bg-[#f7f9f4] px-5 py-4 text-sm leading-7 text-[#77827b]">تصفح برامج المراحل الدراسية، أو افتح «تطوير الخطة التشغيلية» لإضافة الأهداف وسجلات المتابعة يدويًا.</div>
    </section>
    <PlanIndicators/>
    <HomeProgressSummary/>
    <footer className="border-t border-[#e9ece7] py-6"><div className="container flex flex-wrap justify-between gap-2 text-xs text-[#8b9690]"><span>مدارس الفرقان الأهلية · القسم الأمريكي</span><span>الخطة التشغيلية 2026–2027م</span></div></footer>
  </main>;
}
