import { getCustomerById } from '@/lib/customer-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(parseInt(id));

  if (!customer) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Customer Details
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/customers/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Edit
          </Link>
          <Link
            href="/customers"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Name
          </label>
          <p className="text-lg text-zinc-900 dark:text-zinc-50">
            {customer.first_name} {customer.last_name}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Email
          </label>
          <p className="text-lg text-zinc-900 dark:text-zinc-50">
            {customer.email}
          </p>
        </div>

        {customer.phone && (
          <div>
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Phone
            </label>
            <p className="text-lg text-zinc-900 dark:text-zinc-50">
              {customer.phone}
            </p>
          </div>
        )}

        {customer.company && (
          <div>
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Company
            </label>
            <p className="text-lg text-zinc-900 dark:text-zinc-50">
              {customer.company}
            </p>
          </div>
        )}

        {customer.address && (
          <div>
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Address
            </label>
            <p className="text-lg text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">
              {customer.address}
            </p>
          </div>
        )}

        {customer.notes && (
          <div>
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Notes
            </label>
            <p className="text-lg text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">
              {customer.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
