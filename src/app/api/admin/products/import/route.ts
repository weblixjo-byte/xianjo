import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/security/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const products = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "لا يوجد منتجات في الملف أو التنسيق غير صحيح" }, { status: 400 });
    }

    // Since we don't have a unique constraint on nameAr or nameEn, we will process them sequentially or in a transaction.
    // To implement "upsert" by nameAr (Arabic Name as the primary identifier for restaurant owners in JS/Excel)
    
    // 1. Fetch all current products
    const existingProducts = await prisma.product.findMany();
    const existingMap = new Map();
    existingProducts.forEach(p => {
      existingMap.set(p.nameAr.trim().toLowerCase(), p.id);
    });

    const operations = [];

    for (const p of products) {
      if (!p.nameAr || p.price === undefined || p.price === null || !p.category) {
        continue; // skip invalid rows, nameEn is optional
      }

      const normalizedNameAr = String(p.nameAr).trim().toLowerCase();
      const existingId = existingMap.get(normalizedNameAr);

      const price = parseFloat(p.price) || 0;
      const isAvailable = p.isAvailable === undefined ? true : Boolean(p.isAvailable);

      if (existingId) {
        // Update existing
        operations.push(
          prisma.product.update({
            where: { id: existingId },
            data: {
              nameEn: String(p.nameEn).trim(),
              nameAr: String(p.nameAr).trim(),
              descriptionEn: p.descriptionEn ? String(p.descriptionEn).trim() : null,
              descriptionAr: p.descriptionAr ? String(p.descriptionAr).trim() : null,
              category: String(p.category).trim(),
              price: price,
              isAvailable: isAvailable,
              imageUrl: p.imageUrl ? String(p.imageUrl).trim() : null,
            }
          })
        );
      } else {
        // Create new
        operations.push(
          prisma.product.create({
            data: {
              nameEn: String(p.nameEn).trim(),
              nameAr: String(p.nameAr).trim(),
              descriptionEn: p.descriptionEn ? String(p.descriptionEn).trim() : null,
              descriptionAr: p.descriptionAr ? String(p.descriptionAr).trim() : null,
              category: String(p.category).trim(),
              price: price,
              isAvailable: isAvailable,
              imageUrl: p.imageUrl ? String(p.imageUrl).trim() : null,
            }
          })
        );
      }
    }

    await prisma.$transaction(operations);

    revalidatePath("/");
    return NextResponse.json({ success: true, imported: operations.length });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ error: "فشل استيراد المنتجات، يرجى التأكد من تنسيق الملف" }, { status: 500 });
  }
}
