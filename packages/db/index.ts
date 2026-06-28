// Re-export everything from @prisma/client including PrismaClient and Prisma namespace
export { PrismaClient, Prisma } from '@prisma/client';
export type { PrismaClient as PrismaClientType } from '@prisma/client';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
