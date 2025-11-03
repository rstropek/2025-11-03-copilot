'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from './db';
import { Customer, CustomerFormData, customerFormSchema } from './customer-schema';

export async function getCustomers(searchTerm?: string): Promise<Customer[]> {
  const db = getDb();
  
  let query = 'SELECT * FROM customers WHERE deleted_at IS NULL';
  const params: string[] = [];
  
  if (searchTerm && searchTerm.trim()) {
    query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
    const searchPattern = `%${searchTerm.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  query += ' ORDER BY last_name, first_name';
  
  const stmt = db.prepare(query);
  const customers = stmt.all(...params) as Customer[];
  
  return customers;
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL');
  const customer = stmt.get(id) as Customer | undefined;
  
  return customer || null;
}

export async function createCustomer(data: CustomerFormData): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const validatedData = customerFormSchema.parse(data);
    const db = getDb();
    
    const stmt = db.prepare(`
      INSERT INTO customers (first_name, last_name, email, phone, address, company, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validatedData.first_name,
      validatedData.last_name,
      validatedData.email,
      validatedData.phone || null,
      validatedData.address || null,
      validatedData.company || null,
      validatedData.notes || null
    );
    
    revalidatePath('/customers');
    return { success: true, id: Number(result.lastInsertRowid) };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Failed to create customer' };
  }
}

export async function updateCustomer(id: number, data: CustomerFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedData = customerFormSchema.parse(data);
    const db = getDb();
    
    const stmt = db.prepare(`
      UPDATE customers
      SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, company = ?, notes = ?,
          updated_at = strftime('%s', 'now')
      WHERE id = ? AND deleted_at IS NULL
    `);
    
    const result = stmt.run(
      validatedData.first_name,
      validatedData.last_name,
      validatedData.email,
      validatedData.phone || null,
      validatedData.address || null,
      validatedData.company || null,
      validatedData.notes || null,
      id
    );
    
    if (result.changes === 0) {
      return { success: false, error: 'Customer not found' };
    }
    
    revalidatePath('/customers');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Failed to update customer' };
  }
}

export async function deleteCustomer(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    
    // Soft delete by setting deleted_at timestamp
    const stmt = db.prepare(`
      UPDATE customers
      SET deleted_at = strftime('%s', 'now')
      WHERE id = ? AND deleted_at IS NULL
    `);
    
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Customer not found' };
    }
    
    revalidatePath('/customers');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete customer' };
  }
}

export async function restoreCustomer(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    
    // Restore by setting deleted_at to NULL
    const stmt = db.prepare(`
      UPDATE customers
      SET deleted_at = NULL
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Customer not found' };
    }
    
    revalidatePath('/customers');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to restore customer' };
  }
}

export interface ImportCustomersState {
  success: boolean | null;
  message: string | null;
  importedCount: number;
}

export async function importCustomers(
  _prevState: ImportCustomersState,
  formData: FormData
): Promise<ImportCustomersState> {
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
  const requiredColumns = ['first_name', 'last_name', 'email'];
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

  const customersToImport: CustomerFormData[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (row.length === 0 || row.every((value) => value.trim() === '')) {
      continue;
    }

    const record: CustomerFormData = {
      first_name: getRequiredField(row, headerIndex, 'first_name'),
      last_name: getRequiredField(row, headerIndex, 'last_name'),
      email: getRequiredField(row, headerIndex, 'email'),
      phone: getOptionalField(row, headerIndex, 'phone'),
      address: getOptionalField(row, headerIndex, 'address'),
      company: getOptionalField(row, headerIndex, 'company'),
      notes: getOptionalField(row, headerIndex, 'notes'),
    };

    try {
      const validated = customerFormSchema.parse(record);
      customersToImport.push(validated);
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

  if (customersToImport.length === 0) {
    return {
      success: false,
      message: 'No customers to import were found in the CSV file.',
      importedCount: 0,
    };
  }

  const db = getDb();
  const insertStatement = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, address, company, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((records: CustomerFormData[]) => {
    for (const customer of records) {
      insertStatement.run(
        customer.first_name,
        customer.last_name,
        customer.email,
        customer.phone || null,
        customer.address || null,
        customer.company || null,
        customer.notes || null
      );
    }
  });

  try {
    transaction(customersToImport);
  } catch {
    return {
      success: false,
      message: 'Failed to import customers. All changes have been rolled back.',
      importedCount: 0,
    };
  }

  revalidatePath('/customers');

  return {
    success: true,
    message: `Successfully imported ${customersToImport.length} customer${customersToImport.length === 1 ? '' : 's'}.`,
    importedCount: customersToImport.length,
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
