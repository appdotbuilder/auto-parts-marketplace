
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, autoPartsTable, buyerInquiriesTable } from '../db/schema';
import { type UpdateInquiryStatusInput } from '../schema';
import { updateInquiryStatus } from '../handlers/update_inquiry_status';
import { eq } from 'drizzle-orm';

describe('updateInquiryStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update inquiry status', async () => {
    // Create test users
    const [buyer, seller] = await db.insert(usersTable)
      .values([
        {
          email: 'buyer@test.com',
          password_hash: 'hashed_password',
          first_name: 'John',
          last_name: 'Buyer',
          user_type: 'buyer'
        },
        {
          email: 'seller@test.com',
          password_hash: 'hashed_password',
          first_name: 'Jane',
          last_name: 'Seller',
          user_type: 'seller'
        }
      ])
      .returning()
      .execute();

    // Create test auto part
    const [autoPart] = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Engine',
        description: 'A test engine part',
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

    // Create test inquiry
    const [inquiry] = await db.insert(buyerInquiriesTable)
      .values({
        buyer_id: buyer.id,
        seller_id: seller.id,
        part_id: autoPart.id,
        message: 'Is this part still available?',
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateInquiryStatusInput = {
      id: inquiry.id,
      status: 'responded'
    };

    const result = await updateInquiryStatus(input);

    // Verify the status was updated
    expect(result.id).toEqual(inquiry.id);
    expect(result.status).toEqual('responded');
    expect(result.buyer_id).toEqual(buyer.id);
    expect(result.seller_id).toEqual(seller.id);
    expect(result.part_id).toEqual(autoPart.id);
    expect(result.message).toEqual('Is this part still available?');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create test users
    const [buyer, seller] = await db.insert(usersTable)
      .values([
        {
          email: 'buyer@test.com',
          password_hash: 'hashed_password',
          first_name: 'John',
          last_name: 'Buyer',
          user_type: 'buyer'
        },
        {
          email: 'seller@test.com',
          password_hash: 'hashed_password',
          first_name: 'Jane',
          last_name: 'Seller',
          user_type: 'seller'
        }
      ])
      .returning()
      .execute();

    // Create test auto part
    const [autoPart] = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Engine',
        description: 'A test engine part',
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

    // Create test inquiry
    const [inquiry] = await db.insert(buyerInquiriesTable)
      .values({
        buyer_id: buyer.id,
        seller_id: seller.id,
        part_id: autoPart.id,
        message: 'Is this part still available?',
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateInquiryStatusInput = {
      id: inquiry.id,
      status: 'closed'
    };

    await updateInquiryStatus(input);

    // Verify the change was persisted to database
    const updatedInquiry = await db.select()
      .from(buyerInquiriesTable)
      .where(eq(buyerInquiriesTable.id, inquiry.id))
      .execute();

    expect(updatedInquiry).toHaveLength(1);
    expect(updatedInquiry[0].status).toEqual('closed');
    expect(updatedInquiry[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when inquiry not found', async () => {
    const input: UpdateInquiryStatusInput = {
      id: 99999,
      status: 'responded'
    };

    await expect(updateInquiryStatus(input)).rejects.toThrow(/inquiry with id 99999 not found/i);
  });

  it('should update status to all valid enum values', async () => {
    // Create test users
    const [buyer, seller] = await db.insert(usersTable)
      .values([
        {
          email: 'buyer@test.com',
          password_hash: 'hashed_password',
          first_name: 'John',
          last_name: 'Buyer',
          user_type: 'buyer'
        },
        {
          email: 'seller@test.com',
          password_hash: 'hashed_password',
          first_name: 'Jane',
          last_name: 'Seller',
          user_type: 'seller'
        }
      ])
      .returning()
      .execute();

    // Create test auto part
    const [autoPart] = await db.insert(autoPartsTable)
      .values({
        seller_id: seller.id,
        title: 'Test Engine',
        description: 'A test engine part',
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

    // Create test inquiry
    const [inquiry] = await db.insert(buyerInquiriesTable)
      .values({
        buyer_id: buyer.id,
        seller_id: seller.id,
        part_id: autoPart.id,
        message: 'Is this part still available?',
        status: 'pending'
      })
      .returning()
      .execute();

    // Test each valid status
    const statuses = ['pending', 'responded', 'closed'] as const;
    
    for (const status of statuses) {
      const input: UpdateInquiryStatusInput = {
        id: inquiry.id,
        status: status
      };

      const result = await updateInquiryStatus(input);
      expect(result.status).toEqual(status);
    }
  });
});
