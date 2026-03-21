// src/app/api/order/[id]/route.ts
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
  }

  try {
    const cleanId = id.replace('#', '').toLowerCase().trim();
    
    let order = null;
    
    // First try finding directly if it's a full UUID
    if (cleanId.length === 36) {
      order = await prisma.order.findUnique({
        where: { id: cleanId },
        include: { items: true }
      });
    }

    // If still no order and the string is shorter, gracefully search by the short 6-character REF 
    if (!order && cleanId.length > 3) {
      order = await prisma.order.findFirst({
        where: { id: { endsWith: cleanId } },
        include: { items: true }
      });
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود، يرجى التأكد من الرمز" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}
