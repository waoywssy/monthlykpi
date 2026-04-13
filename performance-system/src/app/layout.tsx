import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "研发中心绩效管理系统",
  description: "部门绩效考核、自动算分与提成分配平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        <Navbar />
        <main>{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
