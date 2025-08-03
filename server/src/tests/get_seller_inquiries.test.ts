
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, buyerInquiriesTable } from '../db/schema';
import { getSellerInquiries } from '../handlers/get_seller_inquiries';

const testSeller = {
  email: 'seller@test.com',
  password_hash: 'hashed_password',
  first_name: 'John',
  last_name: 'Seller',
  user_type: 'seller' as const,
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null
};

const testBuyer = {
  email: 'buyer@test.com',
  password_hash: 'hashed_password',
  first_name: 'Jane',
  last_name: 'Buyer',
  user_type: 'buyer' as const,
  phone: null,
  address: null,
  city: null,
  state: null,
  zip_code: null
};

const testPart = {
  title: 'Test Engine Part',
  description: 'A test engine part',
  category: 'engine' as const,
  condition: 'used_good' as const,
  price: '299.99',
  make: 'Toyota',
  model: 'Camry',
  year: 2015,
  part_number: 'ENG123'
};

describe('getSellerInquiries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch inquiries for a seller', async () => {
    // Create seller
    const sellers = await db.insert(usersTable)
      .values(testSeller)
      .returning()
      .execute();
    const sellerId = sellers[0].id;

    // Create buyer
    const buyers = await db.insert(usersTable)
      .values(testBuyer)
      .returning()
      .execute();
    const buyerId = buyers[0].id;

    // Create auto part
    const parts = await db.insert(autoPartsTable)
      .values({
        ...testPart,
        seller_id: sellerId
      })
      .returning()
      .execute();
    const partId = parts[0].id;

    // Create inquiry
    const inquiries = await db.insert(buyerInquiriesTable)
      .values({
        buyer_id: buyerId,
        seller_id: sellerId,
        part_id: partId,
        message: 'Is this part still available?'
      })
      .returning()
      .execute();

    const result = await getSellerInquiries(sellerId);

    expect(result).toHaveLength(1);
    expect(result[0].buyer_id).toEqual(buyerId);
    expect(result[0].seller_id).toEqual(sellerId);
    expect(result[0].part_id).toEqual(partId);
    expect(result[0].message).toEqual('Is this part still available?');
    expect(result[0].status).toEqual('pending');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple inquiries for the same seller', async () => {
    // Create seller
    const sellers = await db.insert(usersTable)
      .values(testSeller)
      .returning()
      .execute();
    const sellerId = sellers[0].id;

    // Create buyer
    const buyers = await db.insert(usersTable)
      .values(testBuyer)
      .returning()
      .execute();
    const buyerId = buyers[0].id;

    // Create auto part
    const parts = await db.insert(autoPartsTable)
      .values({
        ...testPart,
        seller_id: sellerId
      })
      .returning()
      .execute();
    const partId = parts[0].id;

    // Create multiple inquiries
    await db.insert(buyerInquiriesTable)
      .values([
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          part_id: partId,
          message: 'First inquiry'
        },
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          part_id: partId,
          message: 'Second inquiry'
        }
      ])
      .execute();

    const result = await getSellerInquiries(sellerId);

    expect(result).toHaveLength(2);
    expect(result[0].seller_id).toEqual(sellerId);
    expect(result[1].seller_id).toEqual(sellerId);
    expect(result[0].message).toEqual('First inquiry');
    expect(result[1].message).toEqual('Second inquiry');
  });

  it('should return empty array when seller has no inquiries', async () => {
    // Create seller
    const sellers = await db.insert(usersTable)
      .values(testSeller)
      .returning()
      .execute();
    const sellerId = sellers[0].id;

    const result = await getSellerInquiries(sellerId);

    expect(result).toHaveLength(0);
  });

  it('should only return inquiries for the specified seller', async () => {
    // Create two sellers
    const seller1 = await db.insert(usersTable)
      .values(testSeller)
      .returning()
      .execute();
    const sellerId1 = seller1[0].id;

    const seller2 = await db.insert(usersTable)
      .values({
        ...testSeller,
        email: 'seller2@test.com'
      })
      .returning()
      .execute();
    const sellerId2 = seller2[0].id;

    // Create buyer
    const buyers = await db.insert(usersTable)
      .values(testBuyer)
      .returning()
      .execute();
    const buyerId = buyers[0].id;

    // Create parts for both sellers
    const part1 = await db.insert(autoPartsTable)
      .values({
        ...testPart,
        seller_id: sellerId1
      })
      .returning()
      .execute();

    const part2 = await db.insert(autoPartsTable)
      .values({
        ...testPart,
        seller_id: sellerId2,
        title: 'Different Part'
      })
      .returning()
      .execute();

    // Create inquiries for both sellers
    await db.insert(buyerInquiriesTable)
      .values([
        {
          buyer_id: buyerId,
          seller_id: sellerId1,
          part_id: part1[0].id,
          message: 'Inquiry for seller 1'
        },
        {
          buyer_id: buyerId,
          seller_id: sellerId2,
          part_id: part2[0].id,
          message: 'Inquiry for seller 2'
        }
      ])
      .execute();

    const result = await getSellerInquiries(sellerId1);

    expect(result).toHaveLength(1);
    expect(result[0].seller_id).toEqual(sellerId1);
    expect(result[0].message).toEqual('Inquiry for seller 1');
  });
});
