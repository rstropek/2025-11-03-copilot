import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to CRM NG
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          A modern Customer Relationship Management system built with Next.js, React, and TypeScript.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/customers"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Manage Customers
          </Link>
        </div>
      </div>
    </div>
  );
}
