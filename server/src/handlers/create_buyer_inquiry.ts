
import { db } from '../db';
import { buyerInquiriesTable, autoPartsTable } from '../db/schema';
import { type CreateBuyerInquiryInput, type BuyerInquiry } from '../schema';
import { eq } from 'drizzle-orm';

export const createBuyerInquiry = async (input: CreateBuyerInquiryInput): Promise<BuyerInquiry> => {
  try {
    // First, get the seller_id from the auto part
    const autoParts = await db.select({ seller_id: autoPartsTable.seller_id })
      .from(autoPartsTable)
      .where(eq(autoPartsTable.id, input.part_id))
      .execute();

    if (autoParts.length === 0) {
      throw new Error(`Auto part with id ${input.part_id} not found`);
    }

    const seller_id = autoParts[0].seller_id;

    // Insert buyer inquiry record
    const result = await db.insert(buyerInquiriesTable)
      .values({
        buyer_id: input.buyer_id,
        seller_id: seller_id,
        part_id: input.part_id,
        message: input.message,
        status: 'pending' // Default status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Buyer inquiry creation failed:', error);
    throw error;
  }
};
