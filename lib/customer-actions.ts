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
