
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  first_name: 'John',
  last_name: 'Doe',
  user_type: 'buyer',
  phone: '555-1234',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip_code: '12345'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.user_type).toEqual('buyer');
    expect(result.phone).toEqual('555-1234');
    expect(result.address).toEqual('123 Main St');
    expect(result.city).toEqual('Anytown');
    expect(result.state).toEqual('CA');
    expect(result.zip_code).toEqual('12345');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toEqual('hashed_testpassword123');
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].user_type).toEqual('buyer');
    expect(users[0].password_hash).toEqual('hashed_testpassword123');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle user with nullable fields', async () => {
    const minimalInput: CreateUserInput = {
      email: 'minimal@example.com',
      password: 'password123',
      first_name: 'Jane',
      last_name: 'Smith',
      user_type: 'seller',
      phone: null,
      address: null,
      city: null,
      state: null,
      zip_code: null
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.user_type).toEqual('seller');
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.zip_code).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.password_hash).toEqual('hashed_password123');
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create second user with same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      first_name: 'Different',
      last_name: 'Person'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
