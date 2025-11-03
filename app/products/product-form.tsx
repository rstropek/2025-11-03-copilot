'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductFormData } from '@/lib/product-schema';
import { createProduct, updateProduct } from '@/lib/product-actions';

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const unitPriceRaw = (formData.get('unit_price') as string) ?? '';
    const unitPrice = parseFloat(unitPriceRaw);

    if (!Number.isFinite(unitPrice)) {
      setError('Unit price must be a valid number');
      return;
    }

    if (unitPrice < 0) {
      setError('Unit price must be zero or greater');
      return;
    }

    const descriptionValue = (formData.get('description') as string) ?? '';

    const data: ProductFormData = {
      name: formData.get('name') as string,
      description: descriptionValue.trim() ? descriptionValue : undefined,
      unit_price: unitPrice,
    };

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id!, data)
        : await createProduct(data);

      if (result.success) {
        router.push('/products');
        router.refresh();
      } else {
        setError(result.error || 'An error occurred');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={product?.name}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description || ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div>
        <label htmlFor="unit_price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Unit Price *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          id="unit_price"
          name="unit_price"
          defaultValue={product ? product.unit_price.toString() : ''}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

