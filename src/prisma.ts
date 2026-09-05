import path from 'path';
import dotenv from 'dotenv';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

dotenv.config();

interface CustomNodeJsGlobal {
  prisma: PrismaClient;
}

declare const global: CustomNodeJsGlobal;

const PRISMA_DIR = path.resolve(__dirname, '..', 'prisma');

function resolveDatabaseUrl(databaseUrl: string): string {
  const withoutScheme = databaseUrl.replace(/^file:/, '');
  const [filePath] = withoutScheme.split('?');

  if (filePath === ':memory:' || path.isAbsolute(filePath)) return filePath;

  return path.join(PRISMA_DIR, filePath);
}

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}

const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl(DATABASE_URL) });

const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
