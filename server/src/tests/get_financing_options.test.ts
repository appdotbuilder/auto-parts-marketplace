
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, financingOptionsTable } from '../db/schema';
import { type CreateUserInput, type CreateFinancingOptionInput } from '../schema';
import { getFinancingOptions } from '../handlers/get_financing_options';
import { eq } from 'drizzle-orm';

// Test user data for financing provider
const testProvider: CreateUserInput = {
  email: 'provider@test.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'Provider',
  user_type: 'financing_provider',
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null
};

describe('getFinancingOptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no financing options exist', async () => {
    const result = await getFinancingOptions();
    expect(result).toEqual([]);
  });

  it('should return active financing options', async () => {
    // Create a financing provider user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testProvider.email,
        password_hash: 'hashed_password',
        first_name: testProvider.first_name,
        last_name: testProvider.last_name,
        user_type: testProvider.user_type,
        phone: testProvider.phone,
        address: testProvider.address,
        city: testProvider.city,
        state: testProvider.state,
        zip_code: testProvider.zip_code
      })
      .returning()
      .execute();

    const provider = userResult[0];

    // Create test financing option
    const testOption: CreateFinancingOptionInput = {
      provider_id: provider.id,
      name: 'Auto Loan Standard',
      description: 'Standard auto parts financing',
      min_amount: 100.00,
      max_amount: 10000.00,
      interest_rate: 5.99,
      term_months: 12
    };

    await db.insert(financingOptionsTable)
      .values({
        provider_id: testOption.provider_id,
        name: testOption.name,
        description: testOption.description,
        min_amount: testOption.min_amount.toString(),
        max_amount: testOption.max_amount.toString(),
        interest_rate: testOption.interest_rate.toString(),
        term_months: testOption.term_months,
        is_active: true
      })
      .execute();

    const result = await getFinancingOptions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Auto Loan Standard');
    expect(result[0].description).toEqual('Standard auto parts financing');
    expect(result[0].min_amount).toEqual(100.00);
    expect(result[0].max_amount).toEqual(10000.00);
    expect(result[0].interest_rate).toEqual(5.99);
    expect(result[0].term_months).toEqual(12);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should not return inactive financing options', async () => {
    // Create a financing provider user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testProvider.email,
        password_hash: 'hashed_password',
        first_name: testProvider.first_name,
        last_name: testProvider.last_name,
        user_type: testProvider.user_type,
        phone: testProvider.phone,
        address: testProvider.address,
        city: testProvider.city,
        state: testProvider.state,
        zip_code: testProvider.zip_code
      })
      .returning()
      .execute();

    const provider = userResult[0];

    // Create inactive financing option
    await db.insert(financingOptionsTable)
      .values({
        provider_id: provider.id,
        name: 'Inactive Option',
        description: 'This should not be returned',
        min_amount: '500.00',
        max_amount: '5000.00',
        interest_rate: '8.50',
        term_months: 24,
        is_active: false
      })
      .execute();

    const result = await getFinancingOptions();
    expect(result).toHaveLength(0);
  });

  it('should return multiple active financing options', async () => {
    // Create a financing provider user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testProvider.email,
        password_hash: 'hashed_password',
        first_name: testProvider.first_name,
        last_name: testProvider.last_name,
        user_type: testProvider.user_type,
        phone: testProvider.phone,
        address: testProvider.address,
        city: testProvider.city,
        state: testProvider.state,
        zip_code: testProvider.zip_code
      })
      .returning()
      .execute();

    const provider = userResult[0];

    // Create multiple financing options
    await db.insert(financingOptionsTable)
      .values([
        {
          provider_id: provider.id,
          name: 'Standard Loan',
          description: 'Standard financing option',
          min_amount: '100.00',
          max_amount: '5000.00',
          interest_rate: '5.99',
          term_months: 12,
          is_active: true
        },
        {
          provider_id: provider.id,
          name: 'Premium Loan',
          description: 'Premium financing option',
          min_amount: '1000.00',
          max_amount: '20000.00',
          interest_rate: '4.99',
          term_months: 24,
          is_active: true
        }
      ])
      .execute();

    const result = await getFinancingOptions();

    expect(result).toHaveLength(2);
    
    // Check that numeric conversions work correctly
    result.forEach(option => {
      expect(typeof option.min_amount).toBe('number');
      expect(typeof option.max_amount).toBe('number');
      expect(typeof option.interest_rate).toBe('number');
      expect(option.is_active).toBe(true);
    });
  });

  it('should save financing options correctly to database', async () => {
    // Create a financing provider user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testProvider.email,
        password_hash: 'hashed_password',
        first_name: testProvider.first_name,
        last_name: testProvider.last_name,
        user_type: testProvider.user_type,
        phone: testProvider.phone,
        address: testProvider.address,
        city: testProvider.city,
        state: testProvider.state,
        zip_code: testProvider.zip_code
      })
      .returning()
      .execute();

    const provider = userResult[0];

    // Create financing option
    await db.insert(financingOptionsTable)
      .values({
        provider_id: provider.id,
        name: 'Test Option',
        description: 'Test financing option',
        min_amount: '250.50',
        max_amount: '7500.75',
        interest_rate: '6.25',
        term_months: 18,
        is_active: true
      })
      .execute();

    const result = await getFinancingOptions();
    const option = result[0];

    // Verify data was saved and retrieved correctly
    const dbOption = await db.select()
      .from(financingOptionsTable)
      .where(eq(financingOptionsTable.id, option.id))
      .execute();

    expect(dbOption).toHaveLength(1);
    expect(dbOption[0].name).toEqual('Test Option');
    expect(parseFloat(dbOption[0].min_amount)).toEqual(250.50);
    expect(parseFloat(dbOption[0].max_amount)).toEqual(7500.75);
    expect(parseFloat(dbOption[0].interest_rate)).toEqual(6.25);
    expect(dbOption[0].term_months).toEqual(18);
    expect(dbOption[0].is_active).toBe(true);
  });
});
