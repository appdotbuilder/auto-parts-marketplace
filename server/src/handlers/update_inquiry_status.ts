
import { db } from '../db';
import { buyerInquiriesTable } from '../db/schema';
import { type UpdateInquiryStatusInput, type BuyerInquiry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInquiryStatus = async (input: UpdateInquiryStatusInput): Promise<BuyerInquiry> => {
  try {
    // Update the inquiry status
    const result = await db.update(buyerInquiriesTable)
      .set({ 
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(buyerInquiriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Inquiry with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Inquiry status update failed:', error);
    throw error;
  }
};
