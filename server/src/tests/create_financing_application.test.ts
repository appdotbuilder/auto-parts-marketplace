
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, financingOptionsTable, financingApplicationsTable } from '../db/schema';
import { type CreateFinancingApplicationInput } from '../schema';
import { createFinancingApplication } from '../handlers/create_financing_application';
import { eq } from 'drizzle-orm';

describe('createFinancingApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a financing application', async () => {
    // Create test buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyerId = buyerResult[0].id;

    // Create test provider
    const providerResult = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    const providerId = providerResult[0].id;

    // Create test seller
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'Bob',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const sellerId = sellerResult[0].id;

    // Create test auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Test Engine',
        description: 'A test engine part',
        category: 'engine',
        condition: 'used_good',
        price: '5000.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        part_number: 'ENG123'
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    // Create test financing option
    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: providerId,
        name: 'Auto Financing',
        description: 'Financing for auto parts',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.50',
        term_months: 24
      })
      .returning()
      .execute();
    const optionId = optionResult[0].id;

    const testInput: CreateFinancingApplicationInput = {
      buyer_id: buyerId,
      part_id: partId,
      financing_option_id: optionId,
      requested_amount: 4500.00,
      application_data: '{"income": 50000, "employment": "full-time"}'
    };

    const result = await createFinancingApplication(testInput);

    // Basic field validation
    expect(result.buyer_id).toEqual(buyerId);
    expect(result.provider_id).toEqual(providerId);
    expect(result.part_id).toEqual(partId);
    expect(result.financing_option_id).toEqual(optionId);
    expect(result.requested_amount).toEqual(4500.00);
    expect(typeof result.requested_amount).toBe('number');
    expect(result.status).toEqual('pending');
    expect(result.application_data).toEqual('{"income": 50000, "employment": "full-time"}');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save financing application to database', async () => {
    // Create test buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyerId = buyerResult[0].id;

    // Create test provider
    const providerResult = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    const providerId = providerResult[0].id;

    // Create test seller
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'Bob',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const sellerId = sellerResult[0].id;

    // Create test auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Test Engine',
        description: 'A test engine part',
        category: 'engine',
        condition: 'used_good',
        price: '5000.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        part_number: 'ENG123'
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    // Create test financing option
    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: providerId,
        name: 'Auto Financing',
        description: 'Financing for auto parts',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.50',
        term_months: 24
      })
      .returning()
      .execute();
    const optionId = optionResult[0].id;

    const testInput: CreateFinancingApplicationInput = {
      buyer_id: buyerId,
      part_id: partId,
      financing_option_id: optionId,
      requested_amount: 3200.50,
      application_data: '{"credit_score": 750}'
    };

    const result = await createFinancingApplication(testInput);

    // Query using proper drizzle syntax
    const applications = await db.select()
      .from(financingApplicationsTable)
      .where(eq(financingApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].buyer_id).toEqual(buyerId);
    expect(applications[0].provider_id).toEqual(providerId);
    expect(applications[0].part_id).toEqual(partId);
    expect(applications[0].financing_option_id).toEqual(optionId);
    expect(parseFloat(applications[0].requested_amount)).toEqual(3200.50);
    expect(applications[0].status).toEqual('pending');
    expect(applications[0].application_data).toEqual('{"credit_score": 750}');
    expect(applications[0].created_at).toBeInstanceOf(Date);
    expect(applications[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent financing option', async () => {
    // Create test buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyerId = buyerResult[0].id;

    // Create test seller
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'Bob',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const sellerId = sellerResult[0].id;

    // Create test auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Test Engine',
        description: 'A test engine part',
        category: 'engine',
        condition: 'used_good',
        price: '5000.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        part_number: 'ENG123'
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    const testInput: CreateFinancingApplicationInput = {
      buyer_id: buyerId,
      part_id: partId,
      financing_option_id: 999, // Non-existent financing option
      requested_amount: 2500.00,
      application_data: '{"income": 40000}'
    };

    await expect(createFinancingApplication(testInput)).rejects.toThrow(/financing option not found/i);
  });
});
