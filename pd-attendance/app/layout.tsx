import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";

export const metadata: Metadata = {
  title: "P&D Construction – Attendance",
  description: "Attendance & site management for P&D Construction Private Limited",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "P&D Attendance" },
};
export const viewport: Viewport = { themeColor: "#f59e0b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-200 text-slate-900 antialiased">
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
