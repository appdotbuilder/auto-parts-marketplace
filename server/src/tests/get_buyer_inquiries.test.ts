
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, buyerInquiriesTable } from '../db/schema';
import { getBuyerInquiries } from '../handlers/get_buyer_inquiries';

describe('getBuyerInquiries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return inquiries for a specific buyer', async () => {
    // Create test users
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

    const sellerResult = await db.insert(usersTable)
      .values({
        email: 'seller@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Seller',
        user_type: 'seller'
      })
      .returning()
      .execute();

    const buyerId = buyerResult[0].id;
    const sellerId = sellerResult[0].id;

    // Create test auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Engine Block',
        description: 'Used engine block',
        category: 'engine',
        condition: 'used_good',
        price: '1500.00',
        make: 'Toyota',
        model: 'Camry',
        year: 2015,
        part_number: 'ENG123'
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Create test inquiries
    await db.insert(buyerInquiriesTable)
      .values([
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          part_id: partId,
          message: 'Is this part still available?',
          status: 'pending'
        },
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          part_id: partId,
          message: 'What is the condition of this part?',
          status: 'responded'
        }
      ])
      .execute();

    const result = await getBuyerInquiries(buyerId);

    expect(result).toHaveLength(2);
    expect(result[0].buyer_id).toEqual(buyerId);
    expect(result[0].seller_id).toEqual(sellerId);
    expect(result[0].part_id).toEqual(partId);
    expect(result[0].message).toEqual('Is this part still available?');
    expect(result[0].status).toEqual('pending');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].message).toEqual('What is the condition of this part?');
    expect(result[1].status).toEqual('responded');
  });

  it('should return empty array when buyer has no inquiries', async () => {
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

    const result = await getBuyerInquiries(buyerResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should only return inquiries for the specified buyer', async () => {
    // Create test users
    const buyer1Result = await db.insert(usersTable)
      .values({
        email: 'buyer1@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Buyer1',
        user_type: 'buyer'
      })
      .returning()
      .execute();

    const buyer2Result = await db.insert(usersTable)
      .values({
        email: 'buyer2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Buyer2',
        user_type: 'buyer'
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

    const buyer1Id = buyer1Result[0].id;
    const buyer2Id = buyer2Result[0].id;
    const sellerId = sellerResult[0].id;

    // Create test auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        seller_id: sellerId,
        title: 'Brake Pads',
        description: 'New brake pads',
        category: 'brakes',
        condition: 'new',
        price: '150.00',
        make: 'Honda',
        model: 'Accord',
        year: 2018
      })
      .returning()
      .execute();

    const partId = partResult[0].id;

    // Create inquiries for both buyers
    await db.insert(buyerInquiriesTable)
      .values([
        {
          buyer_id: buyer1Id,
          seller_id: sellerId,
          part_id: partId,
          message: 'Inquiry from buyer 1',
          status: 'pending'
        },
        {
          buyer_id: buyer2Id,
          seller_id: sellerId,
          part_id: partId,
          message: 'Inquiry from buyer 2',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getBuyerInquiries(buyer1Id);

    expect(result).toHaveLength(1);
    expect(result[0].buyer_id).toEqual(buyer1Id);
    expect(result[0].message).toEqual('Inquiry from buyer 1');
  });
});
