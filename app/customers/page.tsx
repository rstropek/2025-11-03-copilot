import { Suspense } from 'react';
import { getCustomers } from '@/lib/customer-actions';
import Link from 'next/link';
import { CustomerList } from './customer-list';
import { CustomerSearch } from './customer-search';
import { CustomerImport } from './customer-import';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.search || '';
  const customers = await getCustomers(searchTerm);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Customers
          </h1>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <CustomerImport />
            <Link
              href="/customers/new"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add Customer
            </Link>
          </div>
        </div>

        <CustomerSearch initialSearch={searchTerm} />

        <Suspense fallback={<div className="text-zinc-600">Loading...</div>}>
          <CustomerList customers={customers} searchTerm={searchTerm} />
        </Suspense>
      </div>
    </div>
  );
}
