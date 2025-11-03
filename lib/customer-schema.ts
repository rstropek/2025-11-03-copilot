import { z } from 'zod';

export const customerSchema = z.object({
  id: z.number().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  deleted_at: z.number().nullable().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
});

export const customerFormSchema = customerSchema.omit({
  id: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerFormData = z.infer<typeof customerFormSchema>;
