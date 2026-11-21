import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ConsentBanner } from "@/components/consent-banner";
import { PageViewTracker } from "@/components/page-view-tracker";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deimiantask",
  description: "Lista de tareas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-950 text-stone-100">
        <AuthProvider>
          <PageViewTracker />
          <ConsentBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
