
import { db } from '../db';
import { financingOptionsTable } from '../db/schema';
import { type CreateFinancingOptionInput, type FinancingOption } from '../schema';

export const createFinancingOption = async (input: CreateFinancingOptionInput): Promise<FinancingOption> => {
  try {
    // Insert financing option record
    const result = await db.insert(financingOptionsTable)
      .values({
        provider_id: input.provider_id,
        name: input.name,
        description: input.description,
        min_amount: input.min_amount.toString(), // Convert number to string for numeric column
        max_amount: input.max_amount.toString(), // Convert number to string for numeric column
        interest_rate: input.interest_rate.toString(), // Convert number to string for numeric column
        term_months: input.term_months // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const financingOption = result[0];
    return {
      ...financingOption,
      min_amount: parseFloat(financingOption.min_amount), // Convert string back to number
      max_amount: parseFloat(financingOption.max_amount), // Convert string back to number
      interest_rate: parseFloat(financingOption.interest_rate) // Convert string back to number
    };
  } catch (error) {
    console.error('Financing option creation failed:', error);
    throw error;
  }
};
