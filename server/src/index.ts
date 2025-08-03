
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createAutoPartInputSchema,
  searchPartsInputSchema,
  updateAutoPartInputSchema,
  createPartImageInputSchema,
  createBuyerInquiryInputSchema,
  updateInquiryStatusInputSchema,
  createFinancingOptionInputSchema,
  createFinancingApplicationInputSchema,
  updateApplicationStatusInputSchema,
  userTypeSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createAutoPart } from './handlers/create_auto_part';
import { getAutoParts } from './handlers/get_auto_parts';
import { searchAutoParts } from './handlers/search_auto_parts';
import { updateAutoPart } from './handlers/update_auto_part';
import { createPartImage } from './handlers/create_part_image';
import { createBuyerInquiry } from './handlers/create_buyer_inquiry';
import { getBuyerInquiries } from './handlers/get_buyer_inquiries';
import { getSellerInquiries } from './handlers/get_seller_inquiries';
import { updateInquiryStatus } from './handlers/update_inquiry_status';
import { createFinancingOption } from './handlers/create_financing_option';
import { getFinancingOptions } from './handlers/get_financing_options';
import { createFinancingApplication } from './handlers/create_financing_application';
import { getFinancingApplications } from './handlers/get_financing_applications';
import { updateApplicationStatus } from './handlers/update_application_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Auto parts management
  createAutoPart: publicProcedure
    .input(createAutoPartInputSchema)
    .mutation(({ input }) => createAutoPart(input)),
  
  getAutoParts: publicProcedure
    .query(() => getAutoParts()),
  
  searchAutoParts: publicProcedure
    .input(searchPartsInputSchema)
    .query(({ input }) => searchAutoParts(input)),
  
  updateAutoPart: publicProcedure
    .input(updateAutoPartInputSchema)
    .mutation(({ input }) => updateAutoPart(input)),

  // Part images
  createPartImage: publicProcedure
    .input(createPartImageInputSchema)
    .mutation(({ input }) => createPartImage(input)),

  // Buyer inquiries
  createBuyerInquiry: publicProcedure
    .input(createBuyerInquiryInputSchema)
    .mutation(({ input }) => createBuyerInquiry(input)),
  
  getBuyerInquiries: publicProcedure
    .input(z.number())
    .query(({ input }) => getBuyerInquiries(input)),
  
  getSellerInquiries: publicProcedure
    .input(z.number())
    .query(({ input }) => getSellerInquiries(input)),
  
  updateInquiryStatus: publicProcedure
    .input(updateInquiryStatusInputSchema)
    .mutation(({ input }) => updateInquiryStatus(input)),

  // Financing options
  createFinancingOption: publicProcedure
    .input(createFinancingOptionInputSchema)
    .mutation(({ input }) => createFinancingOption(input)),
  
  getFinancingOptions: publicProcedure
    .query(() => getFinancingOptions()),

  // Financing applications
  createFinancingApplication: publicProcedure
    .input(createFinancingApplicationInputSchema)
    .mutation(({ input }) => createFinancingApplication(input)),
  
  getFinancingApplications: publicProcedure
    .input(z.object({
      userId: z.number(),
      userType: z.enum(['buyer', 'financing_provider'])
    }))
    .query(({ input }) => getFinancingApplications(input.userId, input.userType)),
  
  updateApplicationStatus: publicProcedure
    .input(updateApplicationStatusInputSchema)
    .mutation(({ input }) => updateApplicationStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
