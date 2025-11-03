import { getCustomerById } from '@/lib/customer-actions';
import { notFound } from 'next/navigation';
import { CustomerForm } from '../../customer-form';

export default async function EditCustomerPage({
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
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Edit Customer
      </h1>
      <CustomerForm customer={customer} />
    </div>
  );
}
