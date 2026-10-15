"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRecord = { id: string; username: string; name: string; role: string; isActive: boolean; createdAt: string };

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل المستخدمين.");
      setUsers(data.users);
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "تعذر تحميل المستخدمين.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    setError(false);
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), username: form.get("username"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إنشاء الحساب.");
      formElement.reset();
      setMessage("تم إنشاء حساب المستخدم بنجاح.");
      setUsers((current) => [data.user, ...current]);
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "تعذر إنشاء الحساب.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <section className="rounded-2xl border border-[#e6ebe5] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#344d42]">إضافة مستخدم</h2>
      <p className="mt-2 text-sm leading-6 text-[#7c8983]">سيتمكن الحساب من مشاهدة كل محتوى الخطة والشواهد فقط.</p>
      <form onSubmit={createUser} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-[#52645a]">اسم المستخدم<input name="name" required maxLength={100} className="login-input mt-2" /></label>
        <label className="block text-sm font-semibold text-[#52645a]">اسم الدخول<input name="username" required minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" autoComplete="off" className="login-input mt-2" /><span className="mt-1 block text-xs font-normal text-[#929d96]">استخدم أحرفًا إنجليزية أو أرقامًا أو . _ -</span></label>
        <label className="block text-sm font-semibold text-[#52645a]">كلمة المرور<input name="password" type="password" required minLength={12} autoComplete="new-password" className="login-input mt-2" /><span className="mt-1 block text-xs font-normal text-[#929d96]">12 حرفًا على الأقل</span></label>
        {message && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-[#edf6ef] text-[#28745e]"}`}>{message}</p>}
        <button disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">{busy ? "جارٍ إنشاء الحساب…" : "إنشاء حساب مستخدم"}</button>
      </form>
    </section>
    <section className="rounded-2xl border border-[#e6ebe5] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#344d42]">الحسابات المسجلة</h2><span className="rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-semibold text-[#4b8067]">{users.length}</span></div>
      {loading ? <p className="py-10 text-center text-sm text-[#89958d]">جارٍ تحميل الحسابات…</p> : users.length === 0 ? <p className="py-10 text-center text-sm text-[#89958d]">لا توجد حسابات.</p> : <div className="mt-5 divide-y divide-[#edf0eb]">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-semibold text-[#40554a]">{user.name}</p><p className="mt-1 text-xs text-[#89958d]">{user.username}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-[#f7f0e5] text-[#916c30]" : "bg-[#edf5ef] text-[#4b8067]"}`}>{user.role === "admin" ? "مشرف" : "مستخدم للعرض"}{!user.isActive && " · موقوف"}</span></div>)}</div>}
    </section>
  </div>;
}
