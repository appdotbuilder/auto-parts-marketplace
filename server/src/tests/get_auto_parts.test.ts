
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable } from '../db/schema';
import { getAutoParts } from '../handlers/get_auto_parts';

describe('getAutoParts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no parts exist', async () => {
    const result = await getAutoParts();
    expect(result).toEqual([]);
  });

  it('should return active auto parts', async () => {
    // Create a seller user first
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const sellerId = sellerResult[0].id;

    // Create active auto part
    await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Test Engine',
        description: 'A test engine part',
        category: 'engine',
        condition: 'used_good',
        price: '1999.99',
        make: 'Toyota',
        model: 'Camry',
        year: 2015,
        part_number: 'ENG-123',
        is_active: true
      })
      .execute();

    const result = await getAutoParts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Engine');
    expect(result[0].description).toEqual('A test engine part');
    expect(result[0].category).toEqual('engine');
    expect(result[0].condition).toEqual('used_good');
    expect(result[0].price).toEqual(1999.99);
    expect(typeof result[0].price).toEqual('number');
    expect(result[0].make).toEqual('Toyota');
    expect(result[0].model).toEqual('Camry');
    expect(result[0].year).toEqual(2015);
    expect(result[0].part_number).toEqual('ENG-123');
    expect(result[0].is_active).toEqual(true);
    expect(result[0].seller_id).toEqual(sellerId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only return active parts, not inactive ones', async () => {
    // Create a seller user first
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const sellerId = sellerResult[0].id;

    // Create active part
    await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Active Part',
        description: 'An active part',
        category: 'engine',
        condition: 'new',
        price: '500.00',
        make: 'Honda',
        model: 'Civic',
        year: 2020,
        is_active: true
      })
      .execute();

    // Create inactive part
    await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Inactive Part',
        description: 'An inactive part',
        category: 'brakes',
        condition: 'used_fair',
        price: '200.00',
        make: 'Ford',
        model: 'F150',
        year: 2018,
        is_active: false
      })
      .execute();

    const result = await getAutoParts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Active Part');
    expect(result[0].is_active).toEqual(true);
  });

  it('should return multiple active parts', async () => {
    // Create a seller user first
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const sellerId = sellerResult[0].id;

    // Create multiple active parts
    await db.insert(autoPartsTable)
      .values([
        {
          seller_id: sellerId,
          title: 'Engine Part',
          description: 'Engine description',
          category: 'engine',
          condition: 'new',
          price: '1000.00',
          make: 'Toyota',
          model: 'Prius',
          year: 2019,
          is_active: true
        },
        {
          seller_id: sellerId,
          title: 'Brake Part',
          description: 'Brake description',
          category: 'brakes',
          condition: 'used_excellent',
          price: '150.50',
          make: 'Honda',
          model: 'Accord',
          year: 2017,
          is_active: true
        }
      ])
      .execute();

    const result = await getAutoParts();

    expect(result).toHaveLength(2);
    
    const enginePart = result.find(part => part.title === 'Engine Part');
    const brakePart = result.find(part => part.title === 'Brake Part');
    
    expect(enginePart).toBeDefined();
    expect(brakePart).toBeDefined();
    expect(enginePart!.price).toEqual(1000.00);
    expect(brakePart!.price).toEqual(150.50);
    expect(typeof enginePart!.price).toEqual('number');
    expect(typeof brakePart!.price).toEqual('number');
  });
});
