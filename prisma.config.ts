import { defineConfig } from '@prisma/config';
import fs from 'fs';
import path from 'path';

// Force read the exact DIRECT_URL dynamically using native 'fs' because the Prisma compiler
// drops 'process.env' async variables during strict 'db push' executions.
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const urlMatch = envContent.match(/DIRECT_URL="?([^"\n]+)"?/);
const targetUrl = urlMatch ? urlMatch[1] : '';

export default defineConfig({
  datasource: { 
    url: process.env.DIRECT_URL || targetUrl || "postgresql://postgres:postgres@localhost:5432/postgres",
  }
});
