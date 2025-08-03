
import { db } from '../db';
import { financingOptionsTable } from '../db/schema';
import { type FinancingOption } from '../schema';
import { eq } from 'drizzle-orm';

export const getFinancingOptions = async (): Promise<FinancingOption[]> => {
  try {
    // Fetch all active financing options
    const results = await db.select()
      .from(financingOptionsTable)
      .where(eq(financingOptionsTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(option => ({
      ...option,
      min_amount: parseFloat(option.min_amount),
      max_amount: parseFloat(option.max_amount),
      interest_rate: parseFloat(option.interest_rate)
    }));
  } catch (error) {
    console.error('Fetching financing options failed:', error);
    throw error;
  }
};
