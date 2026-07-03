import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F-Lunch | Campus Food Receiving Platform",
  description: "Secure and timely campus food receiving and storage platform for FPT students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-100 min-h-full font-sans antialiased`}>
        <AppLayout>{children}</AppLayout>
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
