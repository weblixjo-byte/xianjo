// src/app/api/admin/orders/route.ts
import { prisma } from "../../../../db"; 
import { NextResponse } from "next/server";

// هذا السطر يمنع التخزين المؤقت لضمان رؤية الطلبات الجديدة فوراً
export const runtime = 'experimental-edge';
export const dynamic = 'force-dynamic'; 

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "قاعدة البيانات غير متصلة (DATABASE_URL مفقود)" }, 
      { status: 500 }
    );
  }

  try {
    // جلب الطلبات مع الأصناف التابعة لها وبيانات المستخدم إن وجدت
    const allOrders = await prisma.order.findMany({
      include: {
        items: true,
        user: true // إضافة بيانات المستخدم (الاسم، الإيميل، الصورة)
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(allOrders);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "فشل الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}