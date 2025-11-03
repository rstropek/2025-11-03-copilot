import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM NG",
  description: "Customer Relationship Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                CRM NG
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/customers"
                  className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 font-medium transition-colors"
                >
                  Customers
                </Link>
                <Link
                  href="/products"
                  className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 font-medium transition-colors"
                >
                  Products
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-zinc-50 dark:bg-black">
          {children}
        </main>
      </body>
    </html>
  );
}
