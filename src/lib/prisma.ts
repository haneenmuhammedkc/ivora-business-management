// Placeholder stub for PrismaClient until backend/database phase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientStub = any;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientStub | undefined;
};

export const prisma = globalForPrisma.prisma ?? (null as unknown as PrismaClientStub);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
