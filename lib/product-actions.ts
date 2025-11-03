'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from './db';
import { Product, ProductFormData, productFormSchema } from './product-schema';

export async function getProducts(searchTerm?: string): Promise<Product[]> {
  const db = getDb();

  let query = 'SELECT * FROM products WHERE deleted_at IS NULL';
  const params: string[] = [];

  if (searchTerm && searchTerm.trim()) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchPattern = `%${searchTerm.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ' ORDER BY name';

  const stmt = db.prepare(query);
  const products = stmt.all(...params) as Product[];

  return products;
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL');
  const product = stmt.get(id) as Product | undefined;

  return product || null;
}

export async function createProduct(
  data: ProductFormData,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const validatedData = productFormSchema.parse(data);
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO products (name, description, unit_price)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      validatedData.name,
      validatedData.description || null,
      validatedData.unit_price,
    );

    revalidatePath('/products');
    return { success: true, id: Number(result.lastInsertRowid) };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(
  id: number,
  data: ProductFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedData = productFormSchema.parse(data);
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, description = ?, unit_price = ?,
          updated_at = strftime('%s', 'now')
      WHERE id = ? AND deleted_at IS NULL
    `);

    const result = stmt.run(
      validatedData.name,
      validatedData.description || null,
      validatedData.unit_price,
      id,
    );

    if (result.changes === 0) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath('/products');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE products
      SET deleted_at = strftime('%s', 'now')
      WHERE id = ? AND deleted_at IS NULL
    `);

    const result = stmt.run(id);

    if (result.changes === 0) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath('/products');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function restoreProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE products
      SET deleted_at = NULL
      WHERE id = ?
    `);

    const result = stmt.run(id);

    if (result.changes === 0) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath('/products');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to restore product' };
  }
}

