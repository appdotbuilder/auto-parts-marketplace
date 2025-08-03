
import { db } from '../db';
import { autoPartsTable, usersTable } from '../db/schema';
import { type CreateAutoPartInput, type AutoPart } from '../schema';
import { eq } from 'drizzle-orm';

export const createAutoPart = async (input: CreateAutoPartInput): Promise<AutoPart> => {
  try {
    // Verify seller exists and is a seller
    const seller = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.seller_id))
      .execute();

    if (seller.length === 0) {
      throw new Error('Seller not found');
    }

    if (seller[0].user_type !== 'seller') {
      throw new Error('User is not a seller');
    }

    // Insert auto part record
    const result = await db.insert(autoPartsTable)
      .values({
        seller_id: input.seller_id,
        title: input.title,
        description: input.description,
        category: input.category,
        condition: input.condition,
        price: input.price.toString(), // Convert number to string for numeric column
        make: input.make,
        model: input.model,
        year: input.year,
        part_number: input.part_number
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const autoPart = result[0];
    return {
      ...autoPart,
      price: parseFloat(autoPart.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Auto part creation failed:', error);
    throw error;
  }
};
