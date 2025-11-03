import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit_price: z.coerce.number().min(0, 'Unit price must be zero or greater'),
  deleted_at: z.number().nullable().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
});

export const productFormSchema = productSchema.omit({
  id: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
});

export type Product = z.infer<typeof productSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;

