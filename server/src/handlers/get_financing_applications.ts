
import { db } from '../db';
import { financingApplicationsTable } from '../db/schema';
import { type FinancingApplication } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFinancingApplications(userId: number, userType: 'buyer' | 'financing_provider'): Promise<FinancingApplication[]> {
  try {
    const baseQuery = db.select().from(financingApplicationsTable);

    // Filter based on user type
    const query = userType === 'buyer'
      ? baseQuery.where(eq(financingApplicationsTable.buyer_id, userId))
      : baseQuery.where(eq(financingApplicationsTable.provider_id, userId));

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(application => ({
      ...application,
      requested_amount: parseFloat(application.requested_amount)
    }));
  } catch (error) {
    console.error('Get financing applications failed:', error);
    throw error;
  }
}
