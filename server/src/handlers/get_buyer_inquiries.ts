
import { db } from '../db';
import { buyerInquiriesTable } from '../db/schema';
import { type BuyerInquiry } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBuyerInquiries(userId: number): Promise<BuyerInquiry[]> {
  try {
    const results = await db.select()
      .from(buyerInquiriesTable)
      .where(eq(buyerInquiriesTable.buyer_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Getting buyer inquiries failed:', error);
    throw error;
  }
}
