import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // مسار الملف الذي يحتوي على الجداول (Schema)
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // انسخ رابط قاعدة البيانات من ملف .env.local وضعه هنا مباشرة للتأكد من نجاح العملية
    url: "رابط_قاعدة_البيانات_هنا", 
  },
});