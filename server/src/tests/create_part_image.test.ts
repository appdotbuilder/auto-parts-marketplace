
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partImagesTable, autoPartsTable, usersTable } from '../db/schema';
import { type CreatePartImageInput } from '../schema';
import { createPartImage } from '../handlers/create_part_image';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'seller@test.com',
  password_hash: 'hashedpassword',
  first_name: 'John',
  last_name: 'Seller',
  user_type: 'seller' as const
};

const testAutoPart = {
  seller_id: 1, // Will be set after user creation
  title: 'Test Auto Part',
  description: 'A test auto part',
  category: 'engine' as const,
  condition: 'used_good' as const,
  price: '199.99',
  make: 'Toyota',
  model: 'Camry',
  year: 2015,
  part_number: 'ABC123'
};

const testInput: CreatePartImageInput = {
  part_id: 1, // Will be set after part creation
  image_url: 'https://example.com/image.jpg',
  is_primary: true
};

describe('createPartImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a part image', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testAutoPart,
        seller_id: userId
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    // Create part image
    const result = await createPartImage({
      ...testInput,
      part_id: partId
    });

    // Basic field validation
    expect(result.part_id).toEqual(partId);
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.is_primary).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save part image to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testAutoPart,
        seller_id: userId
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    // Create part image
    const result = await createPartImage({
      ...testInput,
      part_id: partId
    });

    // Query using proper drizzle syntax
    const partImages = await db.select()
      .from(partImagesTable)
      .where(eq(partImagesTable.id, result.id))
      .execute();

    expect(partImages).toHaveLength(1);
    expect(partImages[0].part_id).toEqual(partId);
    expect(partImages[0].image_url).toEqual('https://example.com/image.jpg');
    expect(partImages[0].is_primary).toEqual(true);
    expect(partImages[0].created_at).toBeInstanceOf(Date);
  });

  it('should create non-primary image', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite auto part
    const partResult = await db.insert(autoPartsTable)
      .values({
        ...testAutoPart,
        seller_id: userId
      })
      .returning()
      .execute();
    const partId = partResult[0].id;

    // Create non-primary part image
    const result = await createPartImage({
      part_id: partId,
      image_url: 'https://example.com/secondary-image.jpg',
      is_primary: false
    });

    expect(result.part_id).toEqual(partId);
    expect(result.image_url).toEqual('https://example.com/secondary-image.jpg');
    expect(result.is_primary).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should fail with invalid part_id', async () => {
    // Try to create part image with non-existent part_id
    await expect(createPartImage({
      part_id: 999,
      image_url: 'https://example.com/image.jpg',
      is_primary: true
    })).rejects.toThrow(/foreign key constraint/i);
  });
});
