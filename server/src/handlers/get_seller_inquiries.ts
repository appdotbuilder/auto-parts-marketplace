
import { db } from '../db';
import { buyerInquiriesTable } from '../db/schema';
import { type BuyerInquiry } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSellerInquiries(sellerId: number): Promise<BuyerInquiry[]> {
  try {
    const results = await db.select()
      .from(buyerInquiriesTable)
      .where(eq(buyerInquiriesTable.seller_id, sellerId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch seller inquiries:', error);
    throw error;
  }
}
