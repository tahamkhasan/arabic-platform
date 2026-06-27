import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مِداد — تعلّم بذكاء",
  description:
    "منصة مِداد التعليمية — شرح ذكي، اختبارات تفاعلية، بطاقات حفظ، ومتابعة أداء للمعلم والطالب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${inter.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: 'var(--font-cairo), var(--font-inter), system-ui, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}