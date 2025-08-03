
import { db } from '../db';
import { financingApplicationsTable, financingOptionsTable } from '../db/schema';
import { type CreateFinancingApplicationInput, type FinancingApplication } from '../schema';
import { eq } from 'drizzle-orm';

export async function createFinancingApplication(input: CreateFinancingApplicationInput): Promise<FinancingApplication> {
  try {
    // First, get the provider_id from the financing option
    const financingOptions = await db.select()
      .from(financingOptionsTable)
      .where(eq(financingOptionsTable.id, input.financing_option_id))
      .execute();

    if (financingOptions.length === 0) {
      throw new Error('Financing option not found');
    }

    const providerId = financingOptions[0].provider_id;

    // Insert financing application record
    const result = await db.insert(financingApplicationsTable)
      .values({
        buyer_id: input.buyer_id,
        provider_id: providerId,
        part_id: input.part_id,
        financing_option_id: input.financing_option_id,
        requested_amount: input.requested_amount.toString(), // Convert number to string for numeric column
        status: 'pending',
        application_data: input.application_data
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const application = result[0];
    return {
      ...application,
      requested_amount: parseFloat(application.requested_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Financing application creation failed:', error);
    throw error;
  }
}
