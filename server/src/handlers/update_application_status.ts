
import { db } from '../db';
import { financingApplicationsTable } from '../db/schema';
import { type UpdateApplicationStatusInput, type FinancingApplication } from '../schema';
import { eq } from 'drizzle-orm';

export const updateApplicationStatus = async (input: UpdateApplicationStatusInput): Promise<FinancingApplication> => {
  try {
    // Update the application status and updated_at timestamp
    const result = await db.update(financingApplicationsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(financingApplicationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Financing application with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const application = result[0];
    return {
      ...application,
      requested_amount: parseFloat(application.requested_amount)
    };
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
};
