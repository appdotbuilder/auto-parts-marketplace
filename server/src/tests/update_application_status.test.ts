
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, financingOptionsTable, financingApplicationsTable } from '../db/schema';
import { type UpdateApplicationStatusInput } from '../schema';
import { updateApplicationStatus } from '../handlers/update_application_status';
import { eq } from 'drizzle-orm';

describe('updateApplicationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update application status', async () => {
    // Create prerequisite data
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

    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerResult[0].id,
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

    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: providerResult[0].id,
        name: 'Test Financing',
        description: 'Test financing option',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.5',
        term_months: 24
      })
      .returning()
      .execute();

    const applicationResult = await db.insert(financingApplicationsTable)
      .values({
        buyer_id: buyerResult[0].id,
        provider_id: providerResult[0].id,
        part_id: partResult[0].id,
        financing_option_id: optionResult[0].id,
        requested_amount: '5000.00',
        status: 'pending',
        application_data: '{"income": 50000}'
      })
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'approved'
    };

    const result = await updateApplicationStatus(input);

    // Verify the returned data
    expect(result.id).toEqual(applicationResult[0].id);
    expect(result.status).toEqual('approved');
    expect(result.buyer_id).toEqual(buyerResult[0].id);
    expect(result.provider_id).toEqual(providerResult[0].id);
    expect(result.part_id).toEqual(partResult[0].id);
    expect(result.financing_option_id).toEqual(optionResult[0].id);
    expect(result.requested_amount).toEqual(5000);
    expect(typeof result.requested_amount).toEqual('number');
    expect(result.application_data).toEqual('{"income": 50000}');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
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

    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerResult[0].id,
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

    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: providerResult[0].id,
        name: 'Test Financing',
        description: 'Test financing option',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.5',
        term_months: 24
      })
      .returning()
      .execute();

    const applicationResult = await db.insert(financingApplicationsTable)
      .values({
        buyer_id: buyerResult[0].id,
        provider_id: providerResult[0].id,
        part_id: partResult[0].id,
        financing_option_id: optionResult[0].id,
        requested_amount: '5000.00',
        status: 'pending',
        application_data: '{"income": 50000}'
      })
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'rejected'
    };

    const result = await updateApplicationStatus(input);

    // Query the database to verify the update
    const applications = await db.select()
      .from(financingApplicationsTable)
      .where(eq(financingApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].status).toEqual('rejected');
    expect(applications[0].updated_at).toBeInstanceOf(Date);
    expect(applications[0].updated_at.getTime()).toBeGreaterThan(applications[0].created_at.getTime());
  });

  it('should throw error for non-existent application', async () => {
    const input: UpdateApplicationStatusInput = {
      id: 999,
      status: 'approved'
    };

    await expect(updateApplicationStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should update to different status values', async () => {
    // Create prerequisite data
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

    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerResult[0].id,
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

    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: providerResult[0].id,
        name: 'Test Financing',
        description: 'Test financing option',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.5',
        term_months: 24
      })
      .returning()
      .execute();

    const applicationResult = await db.insert(financingApplicationsTable)
      .values({
        buyer_id: buyerResult[0].id,
        provider_id: providerResult[0].id,
        part_id: partResult[0].id,
        financing_option_id: optionResult[0].id,
        requested_amount: '5000.00',
        status: 'pending',
        application_data: '{"income": 50000}'
      })
      .returning()
      .execute();

    // Test updating to 'withdrawn' status
    const withdrawnInput: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'withdrawn'
    };

    const withdrawnResult = await updateApplicationStatus(withdrawnInput);
    expect(withdrawnResult.status).toEqual('withdrawn');

    // Test updating to 'approved' status
    const approvedInput: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'approved'
    };

    const approvedResult = await updateApplicationStatus(approvedInput);
    expect(approvedResult.status).toEqual('approved');
  });
});
