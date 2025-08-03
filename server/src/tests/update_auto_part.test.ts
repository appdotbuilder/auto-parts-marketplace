
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable } from '../db/schema';
import { type CreateUserInput, type CreateAutoPartInput, type UpdateAutoPartInput } from '../schema';
import { updateAutoPart } from '../handlers/update_auto_part';
import { eq } from 'drizzle-orm';

// Test user data
const testUserData: CreateUserInput = {
  email: 'seller@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'Seller',
  user_type: 'seller',
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null
};

// Test auto part data
const testPartData: CreateAutoPartInput = {
  seller_id: 1, // Will be set after creating user
  title: 'Test Engine',
  description: 'A test engine part',
  category: 'engine',
  condition: 'used_good',
  price: 500.00,
  make: 'Toyota',
  model: 'Camry',
  year: 2015,
  part_number: 'ENG123'
};

describe('updateAutoPart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a part with all fields', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserData,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testPartData,
        seller_id: userId,
        price: testPartData.price.toString()
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Update part with all optional fields
    const updateInput: UpdateAutoPartInput = {
      id: partId,
      title: 'Updated Engine',
      description: 'An updated engine description',
      category: 'transmission',
      condition: 'refurbished',
      price: 750.50,
      part_number: 'ENG456',
      is_active: false
    };

    const result = await updateAutoPart(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(partId);
    expect(result.title).toEqual('Updated Engine');
    expect(result.description).toEqual('An updated engine description');
    expect(result.category).toEqual('transmission');
    expect(result.condition).toEqual('refurbished');
    expect(result.price).toEqual(750.50);
    expect(typeof result.price).toBe('number');
    expect(result.part_number).toEqual('ENG456');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields
    expect(result.seller_id).toEqual(userId);
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2015);
  });

  it('should update part with partial fields', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserData,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testPartData,
        seller_id: userId,
        price: testPartData.price.toString()
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Update only title and price
    const updateInput: UpdateAutoPartInput = {
      id: partId,
      title: 'Partially Updated Engine',
      price: 600.00
    };

    const result = await updateAutoPart(updateInput);

    // Verify updated fields
    expect(result.title).toEqual('Partially Updated Engine');
    expect(result.price).toEqual(600.00);

    // Verify unchanged fields
    expect(result.description).toEqual('A test engine part');
    expect(result.category).toEqual('engine');
    expect(result.condition).toEqual('used_good');
    expect(result.part_number).toEqual('ENG123');
    expect(result.is_active).toEqual(true);
  });

  it('should save updated part to database', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserData,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testPartData,
        seller_id: userId,
        price: testPartData.price.toString()
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Update part
    const updateInput: UpdateAutoPartInput = {
      id: partId,
      title: 'Database Updated Engine',
      price: 999.99
    };

    await updateAutoPart(updateInput);

    // Query database to verify changes were saved
    const updatedParts = await db.select()
      .from(autoPartsTable)
      .where(eq(autoPartsTable.id, partId))
      .execute();

    expect(updatedParts).toHaveLength(1);
    expect(updatedParts[0].title).toEqual('Database Updated Engine');
    expect(parseFloat(updatedParts[0].price)).toEqual(999.99);
    expect(updatedParts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent part', async () => {
    const updateInput: UpdateAutoPartInput = {
      id: 99999,
      title: 'Non-existent Part'
    };

    await expect(updateAutoPart(updateInput))
      .rejects.toThrow(/Auto part with id 99999 not found/i);
  });

  it('should handle null part_number correctly', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUserData,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testPartData,
        seller_id: userId,
        price: testPartData.price.toString()
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Update part_number to null
    const updateInput: UpdateAutoPartInput = {
      id: partId,
      part_number: null
    };

    const result = await updateAutoPart(updateInput);

    expect(result.part_number).toBeNull();
  });
});
