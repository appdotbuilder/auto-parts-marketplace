
import { db } from '../db';
import { autoPartsTable } from '../db/schema';
import { type UpdateAutoPartInput, type AutoPart } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAutoPart = async (input: UpdateAutoPartInput): Promise<AutoPart> => {
  try {
    // First, verify the part exists
    const existingPart = await db.select()
      .from(autoPartsTable)
      .where(eq(autoPartsTable.id, input.id))
      .execute();

    if (existingPart.length === 0) {
      throw new Error(`Auto part with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.condition !== undefined) {
      updateData.condition = input.condition;
    }
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    if (input.part_number !== undefined) {
      updateData.part_number = input.part_number;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the part record
    const result = await db.update(autoPartsTable)
      .set(updateData)
      .where(eq(autoPartsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedPart = result[0];
    return {
      ...updatedPart,
      price: parseFloat(updatedPart.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Auto part update failed:', error);
    throw error;
  }
};
