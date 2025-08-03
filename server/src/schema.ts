
import { z } from 'zod';

// User type enum
export const userTypeSchema = z.enum(['buyer', 'seller', 'financing_provider']);
export type UserType = z.infer<typeof userTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  user_type: userTypeSchema,
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Auto part category enum
export const partCategorySchema = z.enum([
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
export type PartCategory = z.infer<typeof partCategorySchema>;

// Part condition enum
export const partConditionSchema = z.enum(['new', 'used_excellent', 'used_good', 'used_fair', 'refurbished']);
export type PartCondition = z.infer<typeof partConditionSchema>;

// Auto part schema
export const autoPartSchema = z.object({
  id: z.number(),
  seller_id: z.number(),
  title: z.string(),
  description: z.string(),
  category: partCategorySchema,
  condition: partConditionSchema,
  price: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  part_number: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AutoPart = z.infer<typeof autoPartSchema>;

// Part image schema
export const partImageSchema = z.object({
  id: z.number(),
  part_id: z.number(),
  image_url: z.string().url(),
  is_primary: z.boolean(),
  created_at: z.coerce.date()
});

export type PartImage = z.infer<typeof partImageSchema>;

// Inquiry status enum
export const inquiryStatusSchema = z.enum(['pending', 'responded', 'closed']);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

// Buyer inquiry schema
export const buyerInquirySchema = z.object({
  id: z.number(),
  buyer_id: z.number(),
  seller_id: z.number(),
  part_id: z.number(),
  message: z.string(),
  status: inquiryStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BuyerInquiry = z.infer<typeof buyerInquirySchema>;

// Financing option schema
export const financingOptionSchema = z.object({
  id: z.number(),
  provider_id: z.number(),
  name: z.string(),
  description: z.string(),
  min_amount: z.number(),
  max_amount: z.number(),
  interest_rate: z.number(),
  term_months: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FinancingOption = z.infer<typeof financingOptionSchema>;

// Financing application status enum
export const applicationStatusSchema = z.enum(['pending', 'approved', 'rejected', 'withdrawn']);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

// Financing application schema
export const financingApplicationSchema = z.object({
  id: z.number(),
  buyer_id: z.number(),
  provider_id: z.number(),
  part_id: z.number(),
  financing_option_id: z.number(),
  requested_amount: z.number(),
  status: applicationStatusSchema,
  application_data: z.string(), // JSON string containing application details
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FinancingApplication = z.infer<typeof financingApplicationSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  user_type: userTypeSchema,
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createAutoPartInputSchema = z.object({
  seller_id: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: partCategorySchema,
  condition: partConditionSchema,
  price: z.number().positive(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  part_number: z.string().nullable()
});

export type CreateAutoPartInput = z.infer<typeof createAutoPartInputSchema>;

export const createPartImageInputSchema = z.object({
  part_id: z.number(),
  image_url: z.string().url(),
  is_primary: z.boolean()
});

export type CreatePartImageInput = z.infer<typeof createPartImageInputSchema>;

export const createBuyerInquiryInputSchema = z.object({
  buyer_id: z.number(),
  part_id: z.number(),
  message: z.string().min(1)
});

export type CreateBuyerInquiryInput = z.infer<typeof createBuyerInquiryInputSchema>;

export const createFinancingOptionInputSchema = z.object({
  provider_id: z.number(),
  name: z.string().min(1),
  description: z.string().min(1),
  min_amount: z.number().positive(),
  max_amount: z.number().positive(),
  interest_rate: z.number().min(0).max(100),
  term_months: z.number().int().positive()
});

export type CreateFinancingOptionInput = z.infer<typeof createFinancingOptionInputSchema>;

export const createFinancingApplicationInputSchema = z.object({
  buyer_id: z.number(),
  part_id: z.number(),
  financing_option_id: z.number(),
  requested_amount: z.number().positive(),
  application_data: z.string()
});

export type CreateFinancingApplicationInput = z.infer<typeof createFinancingApplicationInputSchema>;

// Search and filter schemas
export const searchPartsInputSchema = z.object({
  query: z.string().optional(),
  category: partCategorySchema.optional(),
  condition: partConditionSchema.optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchPartsInput = z.infer<typeof searchPartsInputSchema>;

// Update schemas
export const updateAutoPartInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: partCategorySchema.optional(),
  condition: partConditionSchema.optional(),
  price: z.number().positive().optional(),
  part_number: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateAutoPartInput = z.infer<typeof updateAutoPartInputSchema>;

export const updateInquiryStatusInputSchema = z.object({
  id: z.number(),
  status: inquiryStatusSchema
});

export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusInputSchema>;

export const updateApplicationStatusInputSchema = z.object({
  id: z.number(),
  status: applicationStatusSchema
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusInputSchema>;
