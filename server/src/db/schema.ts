
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userTypeEnum = pgEnum('user_type', ['buyer', 'seller', 'financing_provider']);
export const partCategoryEnum = pgEnum('part_category', [
  'engine',
  'transmission',
  'brakes',
  'suspension',
  'electrical',
  'exhaust',
  'interior',
  'exterior',
  'tires_wheels',
  'other'
]);
export const partConditionEnum = pgEnum('part_condition', ['new', 'used_excellent', 'used_good', 'used_fair', 'refurbished']);
export const inquiryStatusEnum = pgEnum('inquiry_status', ['pending', 'responded', 'closed']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected', 'withdrawn']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  user_type: userTypeEnum('user_type').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip_code: text('zip_code'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Auto parts table
export const autoPartsTable = pgTable('auto_parts', {
  id: serial('id').primaryKey(),
  seller_id: integer('seller_id').notNull().references(() => usersTable.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: partCategoryEnum('category').notNull(),
  condition: partConditionEnum('condition').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  part_number: text('part_number'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Part images table
export const partImagesTable = pgTable('part_images', {
  id: serial('id').primaryKey(),
  part_id: integer('part_id').notNull().references(() => autoPartsTable.id),
  image_url: text('image_url').notNull(),
  is_primary: boolean('is_primary').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Buyer inquiries table
export const buyerInquiriesTable = pgTable('buyer_inquiries', {
  id: serial('id').primaryKey(),
  buyer_id: integer('buyer_id').notNull().references(() => usersTable.id),
  seller_id: integer('seller_id').notNull().references(() => usersTable.id),
  part_id: integer('part_id').notNull().references(() => autoPartsTable.id),
  message: text('message').notNull(),
  status: inquiryStatusEnum('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Financing options table
export const financingOptionsTable = pgTable('financing_options', {
  id: serial('id').primaryKey(),
  provider_id: integer('provider_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  min_amount: numeric('min_amount', { precision: 10, scale: 2 }).notNull(),
  max_amount: numeric('max_amount', { precision: 10, scale: 2 }).notNull(),
  interest_rate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
  term_months: integer('term_months').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Financing applications table
export const financingApplicationsTable = pgTable('financing_applications', {
  id: serial('id').primaryKey(),
  buyer_id: integer('buyer_id').notNull().references(() => usersTable.id),
  provider_id: integer('provider_id').notNull().references(() => usersTable.id),
  part_id: integer('part_id').notNull().references(() => autoPartsTable.id),
  financing_option_id: integer('financing_option_id').notNull().references(() => financingOptionsTable.id),
  requested_amount: numeric('requested_amount', { precision: 10, scale: 2 }).notNull(),
  status: applicationStatusEnum('status').default('pending').notNull(),
  application_data: text('application_data').notNull(), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  autoPartsSold: many(autoPartsTable),
  buyerInquiries: many(buyerInquiriesTable, { relationName: 'buyer_inquiries' }),
  sellerInquiries: many(buyerInquiriesTable, { relationName: 'seller_inquiries' }),
  financingOptions: many(financingOptionsTable),
  financingApplicationsAsBuyer: many(financingApplicationsTable, { relationName: 'buyer_applications' }),
  financingApplicationsAsProvider: many(financingApplicationsTable, { relationName: 'provider_applications' }),
}));

export const autoPartsRelations = relations(autoPartsTable, ({ one, many }) => ({
  seller: one(usersTable, {
    fields: [autoPartsTable.seller_id],
    references: [usersTable.id],
  }),
  images: many(partImagesTable),
  inquiries: many(buyerInquiriesTable),
  financingApplications: many(financingApplicationsTable),
}));

export const partImagesRelations = relations(partImagesTable, ({ one }) => ({
  autoPart: one(autoPartsTable, {
    fields: [partImagesTable.part_id],
    references: [autoPartsTable.id],
  }),
}));

export const buyerInquiriesRelations = relations(buyerInquiriesTable, ({ one }) => ({
  buyer: one(usersTable, {
    fields: [buyerInquiriesTable.buyer_id],
    references: [usersTable.id],
    relationName: 'buyer_inquiries',
  }),
  seller: one(usersTable, {
    fields: [buyerInquiriesTable.seller_id],
    references: [usersTable.id],
    relationName: 'seller_inquiries',
  }),
  autoPart: one(autoPartsTable, {
    fields: [buyerInquiriesTable.part_id],
    references: [autoPartsTable.id],
  }),
}));

export const financingOptionsRelations = relations(financingOptionsTable, ({ one, many }) => ({
  provider: one(usersTable, {
    fields: [financingOptionsTable.provider_id],
    references: [usersTable.id],
  }),
  applications: many(financingApplicationsTable),
}));

export const financingApplicationsRelations = relations(financingApplicationsTable, ({ one }) => ({
  buyer: one(usersTable, {
    fields: [financingApplicationsTable.buyer_id],
    references: [usersTable.id],
    relationName: 'buyer_applications',
  }),
  provider: one(usersTable, {
    fields: [financingApplicationsTable.provider_id],
    references: [usersTable.id],
    relationName: 'provider_applications',
  }),
  autoPart: one(autoPartsTable, {
    fields: [financingApplicationsTable.part_id],
    references: [autoPartsTable.id],
  }),
  financingOption: one(financingOptionsTable, {
    fields: [financingApplicationsTable.financing_option_id],
    references: [financingOptionsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  autoParts: autoPartsTable,
  partImages: partImagesTable,
  buyerInquiries: buyerInquiriesTable,
  financingOptions: financingOptionsTable,
  financingApplications: financingApplicationsTable,
};

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type AutoPart = typeof autoPartsTable.$inferSelect;
export type NewAutoPart = typeof autoPartsTable.$inferInsert;
export type PartImage = typeof partImagesTable.$inferSelect;
export type NewPartImage = typeof partImagesTable.$inferInsert;
export type BuyerInquiry = typeof buyerInquiriesTable.$inferSelect;
export type NewBuyerInquiry = typeof buyerInquiriesTable.$inferInsert;
export type FinancingOption = typeof financingOptionsTable.$inferSelect;
export type NewFinancingOption = typeof financingOptionsTable.$inferInsert;
export type FinancingApplication = typeof financingApplicationsTable.$inferSelect;
export type NewFinancingApplication = typeof financingApplicationsTable.$inferInsert;
