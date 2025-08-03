
import { db } from '../db';
import { autoPartsTable } from '../db/schema';
import { type SearchPartsInput, type AutoPart } from '../schema';
import { and, eq, gte, lte, ilike, desc, type SQL } from 'drizzle-orm';

export async function searchAutoParts(input: SearchPartsInput): Promise<AutoPart[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Only show active parts
    conditions.push(eq(autoPartsTable.is_active, true));

    // Text search in title and description
    if (input.query) {
      conditions.push(ilike(autoPartsTable.title, `%${input.query}%`));
    }

    // Category filter
    if (input.category) {
      conditions.push(eq(autoPartsTable.category, input.category));
    }

    // Condition filter
    if (input.condition) {
      conditions.push(eq(autoPartsTable.condition, input.condition));
    }

    // Make filter
    if (input.make) {
      conditions.push(ilike(autoPartsTable.make, `%${input.make}%`));
    }

    // Model filter
    if (input.model) {
      conditions.push(ilike(autoPartsTable.model, `%${input.model}%`));
    }

    // Year filter
    if (input.year) {
      conditions.push(eq(autoPartsTable.year, input.year));
    }

    // Price range filters
    if (input.min_price !== undefined) {
      conditions.push(gte(autoPartsTable.price, input.min_price.toString()));
    }

    if (input.max_price !== undefined) {
      conditions.push(lte(autoPartsTable.price, input.max_price.toString()));
    }

    // Build the final query
    const results = await db.select()
      .from(autoPartsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(autoPartsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(part => ({
      ...part,
      price: parseFloat(part.price)
    }));
  } catch (error) {
    console.error('Auto parts search failed:', error);
    throw error;
  }
}
