import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "الخطة التشغيلية | مدارس الفرقان",
  description: "منصة متابعة الخطة التشغيلية للقسم الأمريكي بمدارس الفرقان",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><Providers>{children}</Providers></body></html>;
}
