import { ProductForm } from '../product-form';

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Add New Product
      </h1>
      <ProductForm />
    </div>
  );
}

