
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, financingOptionsTable } from '../db/schema';
import { type CreateFinancingOptionInput } from '../schema';
import { createFinancingOption } from '../handlers/create_financing_option';
import { eq } from 'drizzle-orm';

describe('createFinancingOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let providerId: number;

  beforeEach(async () => {
    // Create a financing provider user first
    const provider = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Finance',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    
    providerId = provider[0].id;
  });

  const testInput: CreateFinancingOptionInput = {
    provider_id: 0, // Will be set in tests
    name: 'Auto Parts Loan',
    description: 'Flexible financing for auto parts purchases',
    min_amount: 500.00,
    max_amount: 10000.00,
    interest_rate: 8.5,
    term_months: 24
  };

  it('should create a financing option', async () => {
    const input = { ...testInput, provider_id: providerId };
    const result = await createFinancingOption(input);

    // Basic field validation
    expect(result.name).toEqual('Auto Parts Loan');
    expect(result.description).toEqual(testInput.description);
    expect(result.provider_id).toEqual(providerId);
    expect(result.min_amount).toEqual(500.00);
    expect(result.max_amount).toEqual(10000.00);
    expect(result.interest_rate).toEqual(8.5);
    expect(result.term_months).toEqual(24);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.min_amount).toBe('number');
    expect(typeof result.max_amount).toBe('number');
    expect(typeof result.interest_rate).toBe('number');
  });

  it('should save financing option to database', async () => {
    const input = { ...testInput, provider_id: providerId };
    const result = await createFinancingOption(input);

    // Query using proper drizzle syntax
    const financingOptions = await db.select()
      .from(financingOptionsTable)
      .where(eq(financingOptionsTable.id, result.id))
      .execute();

    expect(financingOptions).toHaveLength(1);
    const saved = financingOptions[0];
    expect(saved.name).toEqual('Auto Parts Loan');
    expect(saved.description).toEqual(testInput.description);
    expect(saved.provider_id).toEqual(providerId);
    expect(parseFloat(saved.min_amount)).toEqual(500.00);
    expect(parseFloat(saved.max_amount)).toEqual(10000.00);
    expect(parseFloat(saved.interest_rate)).toEqual(8.5);
    expect(saved.term_months).toEqual(24);
    expect(saved.is_active).toBe(true);
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different interest rates correctly', async () => {
    const input = { 
      ...testInput, 
      provider_id: providerId,
      interest_rate: 12.75 // Test decimal precision
    };
    const result = await createFinancingOption(input);

    expect(result.interest_rate).toEqual(12.75);
    expect(typeof result.interest_rate).toBe('number');

    // Verify in database
    const saved = await db.select()
      .from(financingOptionsTable)
      .where(eq(financingOptionsTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].interest_rate)).toEqual(12.75);
  });

  it('should throw error for non-existent provider', async () => {
    const input = { 
      ...testInput, 
      provider_id: 99999 // Non-existent provider ID
    };

    await expect(createFinancingOption(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
