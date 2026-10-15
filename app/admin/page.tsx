import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UserNavButton from "../components/UserNavButton";
import UserManagement from "./users/UserManagement";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin");
  if (session.user.role !== "admin") redirect("/");

  return <main className="min-h-screen bg-[#fafbf8] pb-16" dir="rtl">
    <nav className="border-b border-[#e9ece7] bg-white"><div className="mx-auto flex h-[82px] max-w-6xl items-center justify-between px-5"><Link href="/" className="text-lg font-bold text-[#294b3d]">مدارس الفرقان</Link><div className="flex items-center gap-2"><UserNavButton/><Link href="/" className="btn btn-light !rounded-full !px-4 !py-2.5 text-sm">العودة للخطة</Link></div></div></nav>
    <div className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8"><p className="text-sm font-semibold text-[#b28a4b]">إدارة المنصة</p><h1 className="mt-2 text-3xl font-bold text-[#263f34]">إدارة المستخدمين</h1><p className="mt-2 text-sm leading-7 text-[#77847e]">أنشئ حسابات تتيح الاطلاع على الخطة والشواهد دون صلاحية رفع شواهد جديدة.</p></div><UserManagement/></div>
  </main>;
}
