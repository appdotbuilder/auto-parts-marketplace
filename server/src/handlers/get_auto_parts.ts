
import { db } from '../db';
import { autoPartsTable } from '../db/schema';
import { type AutoPart } from '../schema';
import { eq } from 'drizzle-orm';

export const getAutoParts = async (): Promise<AutoPart[]> => {
  try {
    // Fetch all active auto parts from the database
    const results = await db.select()
      .from(autoPartsTable)
      .where(eq(autoPartsTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(part => ({
      ...part,
      price: parseFloat(part.price)
    }));
  } catch (error) {
    console.error('Failed to fetch auto parts:', error);
    throw error;
  }
};
