import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL
// The 'pg' module bypasses the Next.js edge compiler mismatches natively!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)

export const prisma =
  globalForPrisma.prisma ||
  // Explicitly providing the exact "adapter" the strict engine type demands:
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma