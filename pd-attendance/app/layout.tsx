import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { LangProvider } from "@/components/Lang";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "P&D Construction – Attendance",
  description: "Attendance & site management for P&D Construction Private Limited",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "P&D Attendance" },
};
export const viewport: Viewport = { themeColor: "#0f172a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LangProvider>
          <DataProvider>{children}</DataProvider>
        </LangProvider>
        <SwRegister />
      </body>
    </html>
  );
}
