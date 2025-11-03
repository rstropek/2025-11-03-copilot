import { getProductById } from '@/lib/product-actions';
import { notFound } from 'next/navigation';
import { ProductForm } from '../../product-form';

export default async function EditProductPage({
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
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}

