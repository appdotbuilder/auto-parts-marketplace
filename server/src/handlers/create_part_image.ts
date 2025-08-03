
import { db } from '../db';
import { partImagesTable } from '../db/schema';
import { type CreatePartImageInput, type PartImage } from '../schema';

export const createPartImage = async (input: CreatePartImageInput): Promise<PartImage> => {
  try {
    // Insert part image record
    const result = await db.insert(partImagesTable)
      .values({
        part_id: input.part_id,
        image_url: input.image_url,
        is_primary: input.is_primary
      })
      .returning()
      .execute();

    // Return the created part image
    const partImage = result[0];
    return partImage;
  } catch (error) {
    console.error('Part image creation failed:', error);
    throw error;
  }
};
