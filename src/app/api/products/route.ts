// src/app/api/products/route.ts
import { prisma } from "../../../db"; 
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // جلب المنتجات المتاحة فقط للواجهة الأمامية
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { category: 'asc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Public Products Error:", error);
    return NextResponse.json({ error: "فشل جلب قائمة الطعام" }, { status: 500 });
  }
}
