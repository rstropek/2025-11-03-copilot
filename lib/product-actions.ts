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

export interface ImportProductsState {
  success: boolean | null;
  message: string | null;
  importedCount: number;
}

export async function importProducts(
  _prevState: ImportProductsState,
  formData: FormData
): Promise<ImportProductsState> {
  const file = formData.get('file');

  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: 'Please select a CSV file to import.',
      importedCount: 0,
    };
  }

  let csvText = '';

  try {
    csvText = await file.text();
  } catch {
    return {
      success: false,
      message: 'Unable to read the uploaded file.',
      importedCount: 0,
    };
  }

  let rows: string[][];

  try {
    rows = parseCsv(csvText);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse CSV file.',
      importedCount: 0,
    };
  }

  if (rows.length === 0) {
    return {
      success: false,
      message: 'The CSV file is empty.',
      importedCount: 0,
    };
  }

  const header = rows[0].map((column) => column.trim().toLowerCase());
  const requiredColumns = ['name', 'unit_price'];
  const missingColumns = requiredColumns.filter((column) => !header.includes(column));

  if (missingColumns.length > 0) {
    return {
      success: false,
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      importedCount: 0,
    };
  }

  const headerIndex = new Map<string, number>();
  header.forEach((key, index) => {
    if (!headerIndex.has(key)) {
      headerIndex.set(key, index);
    }
  });

  const productsToImport: ProductFormData[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (row.length === 0 || row.every((value) => value.trim() === '')) {
      continue;
    }

    const record: ProductFormData = {
      name: getRequiredField(row, headerIndex, 'name'),
      description: getOptionalField(row, headerIndex, 'description'),
      unit_price: getRequiredField(row, headerIndex, 'unit_price'),
    };

    try {
      const validated = productFormSchema.parse(record);
      productsToImport.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => issue.message).join('; ');
        return {
          success: false,
          message: `Row ${rowIndex + 1}: ${issues}`,
          importedCount: 0,
        };
      }

      return {
        success: false,
        message: `Row ${rowIndex + 1}: failed to validate data.`,
        importedCount: 0,
      };
    }
  }

  if (productsToImport.length === 0) {
    return {
      success: false,
      message: 'No products to import were found in the CSV file.',
      importedCount: 0,
    };
  }

  const db = getDb();
  const insertStatement = db.prepare(`
    INSERT INTO products (name, description, unit_price)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction((records: ProductFormData[]) => {
    for (const product of records) {
      insertStatement.run(
        product.name,
        product.description || null,
        product.unit_price,
      );
    }
  });

  try {
    transaction(productsToImport);
  } catch {
    return {
      success: false,
      message: 'Failed to import products. All changes have been rolled back.',
      importedCount: 0,
    };
  }

  revalidatePath('/products');

  return {
    success: true,
    message: `Successfully imported ${productsToImport.length} product${productsToImport.length === 1 ? '' : 's'}.`,
    importedCount: productsToImport.length,
  };
}

function getRequiredField(row: string[], headerIndex: Map<string, number>, key: string): string {
  const index = headerIndex.get(key);

  if (index === undefined) {
    return '';
  }

  return (row[index] ?? '').trim();
}

function getOptionalField(row: string[], headerIndex: Map<string, number>, key: string): string | undefined {
  const index = headerIndex.get(key);

  if (index === undefined) {
    return undefined;
  }

  const value = (row[index] ?? '').trim();

  return value === '' ? undefined : value;
}

function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }

      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.map((columns) => columns.map((column) => column.trim()));
}

