
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { autoPartsTable, usersTable } from '../db/schema';
import { type CreateAutoPartInput, type CreateUserInput } from '../schema';
import { createAutoPart } from '../handlers/create_auto_part';
import { eq } from 'drizzle-orm';

describe('createAutoPart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let sellerId: number;

  beforeEach(async () => {
    // Create a seller user for testing
    const sellerInput: CreateUserInput = {
      email: 'seller@test.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      user_type: 'seller',
      phone: null,
      address: null,
      city: null,
      state: null,
      zip_code: null
    };

    const sellerResult = await db.insert(usersTable)
      .values({
        ...sellerInput,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    sellerId = sellerResult[0].id;
  });

  const testInput: CreateAutoPartInput = {
    seller_id: 0, // Will be set in beforeEach
    title: 'Used Engine Block',
    description: 'High quality used engine block in excellent condition',
    category: 'engine',
    condition: 'used_excellent',
    price: 1500.99,
    make: 'Toyota',
    model: 'Camry',
    year: 2015,
    part_number: 'ENG-12345'
  };

  it('should create an auto part', async () => {
    const input = { ...testInput, seller_id: sellerId };
    const result = await createAutoPart(input);

    // Basic field validation
    expect(result.seller_id).toEqual(sellerId);
    expect(result.title).toEqual('Used Engine Block');
    expect(result.description).toEqual(testInput.description);
    expect(result.category).toEqual('engine');
    expect(result.condition).toEqual('used_excellent');
    expect(result.price).toEqual(1500.99);
    expect(typeof result.price).toBe('number');
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2015);
    expect(result.part_number).toEqual('ENG-12345');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save auto part to database', async () => {
    const input = { ...testInput, seller_id: sellerId };
    const result = await createAutoPart(input);

    // Query using proper drizzle syntax
    const autoParts = await db.select()
      .from(autoPartsTable)
      .where(eq(autoPartsTable.id, result.id))
      .execute();

    expect(autoParts).toHaveLength(1);
    expect(autoParts[0].title).toEqual('Used Engine Block');
    expect(autoParts[0].seller_id).toEqual(sellerId);
    expect(parseFloat(autoParts[0].price)).toEqual(1500.99);
    expect(autoParts[0].make).toEqual('Toyota');
    expect(autoParts[0].model).toEqual('Camry');
    expect(autoParts[0].year).toEqual(2015);
    expect(autoParts[0].is_active).toBe(true);
    expect(autoParts[0].created_at).toBeInstanceOf(Date);
  });

  it('should create auto part with null part_number', async () => {
    const input = { ...testInput, seller_id: sellerId, part_number: null };
    const result = await createAutoPart(input);

    expect(result.part_number).toBeNull();

    const autoParts = await db.select()
      .from(autoPartsTable)
      .where(eq(autoPartsTable.id, result.id))
      .execute();

    expect(autoParts[0].part_number).toBeNull();
  });

  it('should reject invalid seller_id', async () => {
    const input = { ...testInput, seller_id: 99999 };
    
    await expect(createAutoPart(input)).rejects.toThrow(/seller not found/i);
  });

  it('should reject non-seller user', async () => {
    // Create a buyer user
    const buyerInput: CreateUserInput = {
      email: 'buyer@test.com',
      password: 'password123',
      first_name: 'Jane',
      last_name: 'Smith',
      user_type: 'buyer',
      phone: null,
      address: null,
      city: null,
      state: null,
      zip_code: null
    };

    const buyerResult = await db.insert(usersTable)
      .values({
        ...buyerInput,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const input = { ...testInput, seller_id: buyerResult[0].id };
    
    await expect(createAutoPart(input)).rejects.toThrow(/user is not a seller/i);
  });
});
