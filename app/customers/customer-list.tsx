'use client';

import { Customer } from '@/lib/customer-schema';
import { deleteCustomer } from '@/lib/customer-actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
}

export function CustomerList({ customers, searchTerm }: CustomerListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    setDeletingId(id);
    const result = await deleteCustomer(id);
    setDeletingId(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete customer');
    }
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
        {searchTerm ? (
          <p>No customers found matching &quot;{searchTerm}&quot;</p>
        ) : (
          <p>No customers yet. Add your first customer to get started.</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg shadow">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {customer.first_name} {customer.last_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {customer.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {customer.phone || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {customer.company || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View
                  </Link>
                  <Link
                    href={`/customers/${customer.id}/edit`}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(customer.id!, `${customer.first_name} ${customer.last_name}`)}
                    disabled={deletingId === customer.id}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === customer.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
