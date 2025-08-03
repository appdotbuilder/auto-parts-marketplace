
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    const password_hash = 'hashed_password_123';
    
    await db.insert(usersTable)
      .values([
        {
          email: 'buyer@test.com',
          password_hash,
          first_name: 'John',
          last_name: 'Buyer',
          user_type: 'buyer',
          phone: '555-0101',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip_code: '12345'
        },
        {
          email: 'seller@test.com',
          password_hash,
          first_name: 'Jane',
          last_name: 'Seller',
          user_type: 'seller',
          phone: null,
          address: null,
          city: null,
          state: null,
          zip_code: null
        },
        {
          email: 'finance@test.com',
          password_hash,
          first_name: 'Bob',
          last_name: 'Finance',
          user_type: 'financing_provider',
          phone: '555-0103',
          address: '789 Oak Ave',
          city: 'Finance City',
          state: 'NY',
          zip_code: '67890'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);

    // Check first user (buyer)
    const buyer = result.find(u => u.email === 'buyer@test.com');
    expect(buyer).toBeDefined();
    expect(buyer!.first_name).toEqual('John');
    expect(buyer!.last_name).toEqual('Buyer');
    expect(buyer!.user_type).toEqual('buyer');
    expect(buyer!.phone).toEqual('555-0101');
    expect(buyer!.address).toEqual('123 Main St');
    expect(buyer!.city).toEqual('Anytown');
    expect(buyer!.state).toEqual('CA');
    expect(buyer!.zip_code).toEqual('12345');
    expect(buyer!.id).toBeDefined();
    expect(buyer!.created_at).toBeInstanceOf(Date);
    expect(buyer!.updated_at).toBeInstanceOf(Date);

    // Check second user (seller with null fields)
    const seller = result.find(u => u.email === 'seller@test.com');
    expect(seller).toBeDefined();
    expect(seller!.first_name).toEqual('Jane');
    expect(seller!.last_name).toEqual('Seller');
    expect(seller!.user_type).toEqual('seller');
    expect(seller!.phone).toBeNull();
    expect(seller!.address).toBeNull();
    expect(seller!.city).toBeNull();
    expect(seller!.state).toBeNull();
    expect(seller!.zip_code).toBeNull();

    // Check third user (financing provider)
    const financeProvider = result.find(u => u.email === 'finance@test.com');
    expect(financeProvider).toBeDefined();
    expect(financeProvider!.first_name).toEqual('Bob');
    expect(financeProvider!.last_name).toEqual('Finance');
    expect(financeProvider!.user_type).toEqual('financing_provider');
    expect(financeProvider!.phone).toEqual('555-0103');
  });

  it('should return users with correct data types', async () => {
    const password_hash = 'hashed_password_456';
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash,
        first_name: 'Test',
        last_name: 'User',
        user_type: 'buyer',
        phone: '555-0001',
        address: '123 Test St',
        city: 'Test City',
        state: 'TX',
        zip_code: '12345'
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify data types
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(typeof user.user_type).toBe('string');
    expect(typeof user.phone).toBe('string');
    expect(typeof user.address).toBe('string');
    expect(typeof user.city).toBe('string');
    expect(typeof user.state).toBe('string');
    expect(typeof user.zip_code).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
