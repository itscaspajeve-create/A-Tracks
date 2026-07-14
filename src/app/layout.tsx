import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Peso Tracker",
    template: "%s · Peso Tracker",
  },
  description: "Personal finance tracker — accounts, loans, budgets and reports",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peso Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#047857",
};

const themeInit = `
try {
  var t = localStorage.getItem("theme");
  if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <div className="min-h-dvh">
          <Sidebar />
          <main className="pb-24 pt-4 md:ml-60 md:pb-10 md:pt-8">
            <div className="container max-w-6xl">{children}</div>
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
