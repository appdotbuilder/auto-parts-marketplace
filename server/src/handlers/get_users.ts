
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();

    // Return users - no numeric conversion needed for users table
    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
