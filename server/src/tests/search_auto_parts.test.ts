
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable } from '../db/schema';
import { type CreateUserInput, type CreateAutoPartInput, searchPartsInputSchema } from '../schema';
import { searchAutoParts } from '../handlers/search_auto_parts';
import { eq } from 'drizzle-orm';

// Create test user data
const testSeller: CreateUserInput = {
  email: 'seller@test.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Seller',
  user_type: 'seller',
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null
};

// Create test auto parts data
const testParts: CreateAutoPartInput[] = [
  {
    seller_id: 1, // Will be set after user creation
    title: 'BMW Engine Block',
    description: 'Used engine block in excellent condition',
    category: 'engine',
    condition: 'used_excellent',
    price: 2500.00,
    make: 'BMW',
    model: 'X5',
    year: 2018,
    part_number: 'BMW-ENG-001'
  },
  {
    seller_id: 1,
    title: 'Honda Transmission',
    description: 'Manual transmission for Honda Civic',
    category: 'transmission',
    condition: 'used_good',
    price: 1200.50,
    make: 'Honda',
    model: 'Civic',
    year: 2016,
    part_number: 'HON-TRA-002'
  },
  {
    seller_id: 1,
    title: 'Toyota Brake Pads',
    description: 'New brake pads for Toyota Camry',
    category: 'brakes',
    condition: 'new',
    price: 89.99,
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    part_number: null
  },
  {
    seller_id: 1,
    title: 'Ford Suspension Kit',
    description: 'Complete suspension kit for Ford F-150',
    category: 'suspension',
    condition: 'refurbished',
    price: 800.00,
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    part_number: 'FORD-SUS-003'
  }
];

describe('searchAutoParts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test seller
    await db.insert(usersTable)
      .values({
        ...testSeller,
        password_hash: 'hashed_password'
      })
      .execute();

    // Create test parts
    await db.insert(autoPartsTable)
      .values(testParts.map(part => ({
        ...part,
        price: part.price.toString()
      })))
      .execute();
  });

  it('should return all active parts with default pagination', async () => {
    const input = searchPartsInputSchema.parse({});
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(4);
    results.forEach(part => {
      expect(part.is_active).toBe(true);
      expect(typeof part.price).toBe('number');
    });
  });

  it('should filter by text query in title', async () => {
    const input = searchPartsInputSchema.parse({
      query: 'BMW'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('BMW');
    expect(results[0].make).toBe('BMW');
  });

  it('should filter by category', async () => {
    const input = searchPartsInputSchema.parse({
      category: 'engine'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].category).toBe('engine');
    expect(results[0].title).toContain('BMW Engine Block');
  });

  it('should filter by condition', async () => {
    const input = searchPartsInputSchema.parse({
      condition: 'new'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].condition).toBe('new');
    expect(results[0].title).toContain('Toyota Brake Pads');
  });

  it('should filter by make', async () => {
    const input = searchPartsInputSchema.parse({
      make: 'Honda'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].make).toBe('Honda');
    expect(results[0].model).toBe('Civic');
  });

  it('should filter by model', async () => {
    const input = searchPartsInputSchema.parse({
      model: 'X5'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].model).toBe('X5');
    expect(results[0].make).toBe('BMW');
  });

  it('should filter by year', async () => {
    const input = searchPartsInputSchema.parse({
      year: 2018
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].year).toBe(2018);
    expect(results[0].make).toBe('BMW');
  });

  it('should filter by price range', async () => {
    const input = searchPartsInputSchema.parse({
      min_price: 100,
      max_price: 1000
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].price).toBeGreaterThanOrEqual(100);
    expect(results[0].price).toBeLessThanOrEqual(1000);
    expect(results[0].title).toContain('Ford Suspension Kit');
  });

  it('should combine multiple filters', async () => {
    const input = searchPartsInputSchema.parse({
      category: 'transmission',
      condition: 'used_good',
      make: 'Honda'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].category).toBe('transmission');
    expect(results[0].condition).toBe('used_good');
    expect(results[0].make).toBe('Honda');
  });

  it('should respect pagination limits', async () => {
    const input = searchPartsInputSchema.parse({
      limit: 2,
      offset: 0
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(2);
  });

  it('should handle pagination offset', async () => {
    const input = searchPartsInputSchema.parse({
      limit: 2,
      offset: 2
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(2);
  });

  it('should exclude inactive parts', async () => {
    // Deactivate one part
    await db.update(autoPartsTable)
      .set({ is_active: false })
      .where(eq(autoPartsTable.id, 1))
      .execute();

    const input = searchPartsInputSchema.parse({});
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(3);
    results.forEach(part => {
      expect(part.is_active).toBe(true);
    });
  });

  it('should return empty array when no matches found', async () => {
    const input = searchPartsInputSchema.parse({
      make: 'Nonexistent'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(0);
  });

  it('should handle case-insensitive text searches', async () => {
    const input = searchPartsInputSchema.parse({
      query: 'bmw'
    });
    const results = await searchAutoParts(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('BMW');
  });
});
