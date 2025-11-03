'use client';

import { Product } from '@/lib/product-schema';
import { deleteProduct } from '@/lib/product-actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface ProductListProps {
  products: Product[];
  searchTerm: string;
}

export function ProductList({ products, searchTerm }: ProductListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    setDeletingId(id);
    const result = await deleteProduct(id);
    setDeletingId(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete product');
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
        {searchTerm ? (
          <p>No products found matching &quot;{searchTerm}&quot;</p>
        ) : (
          <p>No products yet. Add your first product to get started.</p>
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
              Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{product.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 break-words">
                  {product.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-zinc-900 dark:text-zinc-50">
                  {formatter.format(product.unit_price)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/products/${product.id}`}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View
                  </Link>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id!, product.name)}
                    disabled={deletingId === product.id}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === product.id ? 'Deleting...' : 'Delete'}
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

