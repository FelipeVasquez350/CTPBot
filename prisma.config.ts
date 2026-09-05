import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./db.sqlite3';
const [filePath] = databaseUrl.replace(/^file:/, '').split('?');
const absolutePath = path.isAbsolute(filePath)
  ? filePath
  : path.join(__dirname, 'prisma', filePath);

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: `file:${absolutePath}`,
  },
});
