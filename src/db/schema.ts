// db/schema.ts
import { pgTable, serial, text, doublePrecision, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// جدول الأقسام (نودلز، سوشي، إلخ)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
});

// جدول المنتجات
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  price: doublePrecision('price').notNull(),
  description: text('description'),
  image: text('image'), // رابط الصورة
  isAvailable: boolean('is_available').default(true),
});

// جدول الطلبات
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  status: text('status').default('pending'), // pending, preparing, completed, cancelled
  createdAt: timestamp('created_at').defaultNow(),
});