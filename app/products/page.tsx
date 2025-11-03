import { Suspense } from 'react';
import { getProducts } from '@/lib/product-actions';
import { ProductList } from './product-list';
import { ProductSearch } from './product-search';
import Link from 'next/link';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.search || '';
  const products = await getProducts(searchTerm);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Products
          </h1>
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Add Product
          </Link>
        </div>

        <ProductSearch initialSearch={searchTerm} />

        <Suspense fallback={<div className="text-zinc-600">Loading...</div>}>
          <ProductList products={products} searchTerm={searchTerm} />
        </Suspense>
      </div>
    </div>
  );
}

