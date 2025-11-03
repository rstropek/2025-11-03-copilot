import { getProductById } from '@/lib/product-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(parseInt(id, 10));

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Product Details
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/products/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Edit
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Name</label>
          <p className="text-lg text-zinc-900 dark:text-zinc-50">{product.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Unit Price</label>
          <p className="text-lg text-zinc-900 dark:text-zinc-50">
            {new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: 'USD',
              currencyDisplay: 'symbol',
              minimumFractionDigits: 2,
            }).format(product.unit_price)}
          </p>
        </div>

        {product.description && (
          <div>
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</label>
            <p className="text-lg text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

