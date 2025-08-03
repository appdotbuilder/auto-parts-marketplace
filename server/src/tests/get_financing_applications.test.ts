
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, financingOptionsTable, financingApplicationsTable } from '../db/schema';
import { getFinancingApplications } from '../handlers/get_financing_applications';

describe('getFinancingApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return applications for buyer', async () => {
    // Create test buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyer = buyerResult[0];

    // Create test seller
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const seller = sellerResult[0];

    // Create financing provider
    const providerResult = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Finance',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    const provider = providerResult[0];

    // Create auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Engine',
        description: 'A test engine',
        category: 'engine',
        condition: 'used_good',
        price: '5000.00',
        make: 'Honda',
        model: 'Civic',
        year: 2020
      })
      .returning()
      .execute();
    const part = partResult[0];

    // Create financing option
    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: provider.id,
        name: 'Test Financing',
        description: 'Test financing option',
        min_amount: '1000.00',
        max_amount: '10000.00',
        interest_rate: '5.50',
        term_months: 24
      })
      .returning()
      .execute();
    const option = optionResult[0];

    // Create financing applications
    await db.insert(financingApplicationsTable)
      .values([
        {
          buyer_id: buyer.id,
          provider_id: provider.id,
          part_id: part.id,
          financing_option_id: option.id,
          requested_amount: '4500.00',
          application_data: JSON.stringify({ income: 50000 })
        },
        {
          buyer_id: buyer.id,
          provider_id: provider.id,
          part_id: part.id,
          financing_option_id: option.id,
          requested_amount: '3000.00',
          application_data: JSON.stringify({ income: 45000 })
        }
      ])
      .execute();

    const results = await getFinancingApplications(buyer.id, 'buyer');

    expect(results).toHaveLength(2);
    expect(results[0].buyer_id).toEqual(buyer.id);
    expect(results[0].provider_id).toEqual(provider.id);
    expect(results[0].part_id).toEqual(part.id);
    expect(results[0].requested_amount).toEqual(4500);
    expect(typeof results[0].requested_amount).toBe('number');
    expect(results[0].status).toEqual('pending');
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should return applications for financing provider', async () => {
    // Create test buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyer = buyerResult[0];

    // Create test seller
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const seller = sellerResult[0];

    // Create financing provider
    const providerResult = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Finance',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    const provider = providerResult[0];

    // Create auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Transmission',
        description: 'A test transmission',
        category: 'transmission',
        condition: 'refurbished',
        price: '3500.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2019
      })
      .returning()
      .execute();
    const part = partResult[0];

    // Create financing option
    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: provider.id,
        name: 'Provider Financing',
        description: 'Provider financing option',
        min_amount: '500.00',
        max_amount: '8000.00',
        interest_rate: '6.25',
        term_months: 36
      })
      .returning()
      .execute();
    const option = optionResult[0];

    // Create financing applications
    await db.insert(financingApplicationsTable)
      .values([
        {
          buyer_id: buyer.id,
          provider_id: provider.id,
          part_id: part.id,
          financing_option_id: option.id,
          requested_amount: '3200.00',
          application_data: JSON.stringify({ income: 60000 })
        }
      ])
      .execute();

    const results = await getFinancingApplications(provider.id, 'financing_provider');

    expect(results).toHaveLength(1);
    expect(results[0].buyer_id).toEqual(buyer.id);
    expect(results[0].provider_id).toEqual(provider.id);
    expect(results[0].part_id).toEqual(part.id);
    expect(results[0].requested_amount).toEqual(3200);
    expect(typeof results[0].requested_amount).toBe('number');
    expect(results[0].status).toEqual('pending');
    expect(results[0].application_data).toEqual(JSON.stringify({ income: 60000 }));
  });

  it('should return empty array when no applications exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const results = await getFinancingApplications(user.id, 'buyer');

    expect(results).toHaveLength(0);
  });

  it('should filter correctly by user type', async () => {
    // Create test users
    const buyer1Result = await db.insert(usersTable)
      .values({
        email: 'buyer1@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Buyer',
        last_name: 'One',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyer1 = buyer1Result[0];

    const buyer2Result = await db.insert(usersTable)
      .values({
        email: 'buyer2@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Buyer',
        last_name: 'Two',
        user_type: 'buyer'
      })
      .returning()
      .execute();
    const buyer2 = buyer2Result[0];

    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();
    const seller = sellerResult[0];

    const providerResult = await db.insert(usersTable)
      .values({
        email: 'provider@test.com',
        password_hash: 'hashedpassword123',
        first_name: 'Finance',
        last_name: 'Provider',
        user_type: 'financing_provider'
      })
      .returning()
      .execute();
    const provider = providerResult[0];

    // Create auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Part',
        description: 'A test part',
        category: 'brakes',
        condition: 'new',
        price: '800.00',
        make: 'Ford',
        model: 'F150',
        year: 2021
      })
      .returning()
      .execute();
    const part = partResult[0];

    // Create financing option
    const optionResult = await db.insert(financingOptionsTable)
      .values({
        provider_id: provider.id,
        name: 'Test Option',
        description: 'Test option',
        min_amount: '100.00',
        max_amount: '2000.00',
        interest_rate: '4.50',
        term_months: 12
      })
      .returning()
      .execute();
    const option = optionResult[0];

    // Create applications for both buyers
    await db.insert(financingApplicationsTable)
      .values([
        {
          buyer_id: buyer1.id,
          provider_id: provider.id,
          part_id: part.id,
          financing_option_id: option.id,
          requested_amount: '750.00',
          application_data: JSON.stringify({ income: 40000 })
        },
        {
          buyer_id: buyer2.id,
          provider_id: provider.id,
          part_id: part.id,
          financing_option_id: option.id,
          requested_amount: '800.00',
          application_data: JSON.stringify({ income: 45000 })
        }
      ])
      .execute();

    // Get applications for buyer1 only
    const buyer1Results = await getFinancingApplications(buyer1.id, 'buyer');
    expect(buyer1Results).toHaveLength(1);
    expect(buyer1Results[0].buyer_id).toEqual(buyer1.id);
    expect(buyer1Results[0].requested_amount).toEqual(750);

    // Get applications for provider (should see both)
    const providerResults = await getFinancingApplications(provider.id, 'financing_provider');
    expect(providerResults).toHaveLength(2);
    expect(providerResults.map(app => app.buyer_id)).toContain(buyer1.id);
    expect(providerResults.map(app => app.buyer_id)).toContain(buyer2.id);
  });
});
