
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, buyerInquiriesTable } from '../db/schema';
import { type CreateBuyerInquiryInput } from '../schema';
import { createBuyerInquiry } from '../handlers/create_buyer_inquiry';
import { eq } from 'drizzle-orm';

describe('createBuyerInquiry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a buyer inquiry', async () => {
    // Create prerequisite data - buyer user
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();

    const buyer_id = buyerResult[0].id;

    // Create prerequisite data - seller user
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@example.com',
        password_hash: 'hashed_password_456',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const seller_id = sellerResult[0].id;

    // Create prerequisite data - auto part
    const autoPartResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller_id,
        title: 'Test Engine',
        description: 'A test engine for sale',
        category: 'engine',
        condition: 'used_good',
        price: '1500.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        part_number: 'ENG-12345'
      })
      .returning()
      .execute();

    const part_id = autoPartResult[0].id;

    const testInput: CreateBuyerInquiryInput = {
      buyer_id: buyer_id,
      part_id: part_id,
      message: 'I am interested in this engine. Is it still available?'
    };

    const result = await createBuyerInquiry(testInput);

    // Basic field validation
    expect(result.buyer_id).toEqual(buyer_id);
    expect(result.seller_id).toEqual(seller_id);
    expect(result.part_id).toEqual(part_id);
    expect(result.message).toEqual(testInput.message);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save buyer inquiry to database', async () => {
    // Create prerequisite data - buyer user
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();

    const buyer_id = buyerResult[0].id;

    // Create prerequisite data - seller user
    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@example.com',
        password_hash: 'hashed_password_456',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const seller_id = sellerResult[0].id;

    // Create prerequisite data - auto part
    const autoPartResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller_id,
        title: 'Test Transmission',
        description: 'A test transmission for sale',
        category: 'transmission',
        condition: 'refurbished',
        price: '2500.00',
        make: 'Honda',
        model: 'Accord',
        year: 2020,
        part_number: 'TRANS-67890'
      })
      .returning()
      .execute();

    const part_id = autoPartResult[0].id;

    const testInput: CreateBuyerInquiryInput = {
      buyer_id: buyer_id,
      part_id: part_id,
      message: 'What is the condition of this transmission?'
    };

    const result = await createBuyerInquiry(testInput);

    // Query database to verify the inquiry was saved
    const inquiries = await db.select()
      .from(buyerInquiriesTable)
      .where(eq(buyerInquiriesTable.id, result.id))
      .execute();

    expect(inquiries).toHaveLength(1);
    expect(inquiries[0].buyer_id).toEqual(buyer_id);
    expect(inquiries[0].seller_id).toEqual(seller_id);
    expect(inquiries[0].part_id).toEqual(part_id);
    expect(inquiries[0].message).toEqual(testInput.message);
    expect(inquiries[0].status).toEqual('pending');
    expect(inquiries[0].created_at).toBeInstanceOf(Date);
    expect(inquiries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when part does not exist', async () => {
    // Create prerequisite data - buyer user
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();

    const buyer_id = buyerResult[0].id;

    const testInput: CreateBuyerInquiryInput = {
      buyer_id: buyer_id,
      part_id: 99999, // Non-existent part ID
      message: 'This should fail'
    };

    await expect(createBuyerInquiry(testInput)).rejects.toThrow(/auto part.*not found/i);
  });

  it('should correctly determine seller_id from part', async () => {
    // Create two sellers
    const seller1Result = await db.insert(usersTable)
      .values({
        email: 'seller1@example.com',
        password_hash: 'hashed_password_111',
        first_name: 'Jane',
        last_name: 'Seller1',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const seller2Result = await db.insert(usersTable)
      .values({
        email: 'seller2@example.com',
        password_hash: 'hashed_password_222',
        first_name: 'Bob',
        last_name: 'Seller2',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const seller1_id = seller1Result[0].id;
    const seller2_id = seller2Result[0].id;

    // Create buyer
    const buyerResult = await db.insert(usersTable)
      .values({
        email: 'buyer@example.com',
        password_hash: 'hashed_password_333',
        first_name: 'John',
        last_name: 'Buyer',
        user_type: 'buyer'
      })
      .returning()
      .execute();

    const buyer_id = buyerResult[0].id;

    // Create auto part for seller2
    const autoPartResult = await db.insert(autoPartsTable)
      .values({
        seller_id: seller2_id, // Part belongs to seller2
        title: 'Test Brakes',
        description: 'A test brake system',
        category: 'brakes',
        condition: 'new',
        price: '800.00',
        make: 'Ford',
        model: 'Focus',
        year: 2019,
        part_number: 'BRAKE-111'
      })
      .returning()
      .execute();

    const part_id = autoPartResult[0].id;

    const testInput: CreateBuyerInquiryInput = {
      buyer_id: buyer_id,
      part_id: part_id,
      message: 'Are these brakes compatible with my vehicle?'
    };

    const result = await createBuyerInquiry(testInput);

    // Should correctly identify seller2 as the seller, not seller1
    expect(result.seller_id).toEqual(seller2_id);
    expect(result.seller_id).not.toEqual(seller1_id);
  });
});
