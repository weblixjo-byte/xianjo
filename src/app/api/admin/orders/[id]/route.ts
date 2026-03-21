export const runtime = 'experimental-edge';
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, paymentStatus } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "معرف الطلب مفقود" }, { status: 400 });
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return NextResponse.json({ error: "فشل تحديث حالة الطلب" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Standard Next.js 15+ Promise-based params pattern
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "معرف الطلب مفقود" }, { status: 400 });
  }

  try {
    await prisma.order.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Order Error:", error);
    return NextResponse.json({ error: "فشل حذف الطلب من قاعدة البيانات" }, { status: 500 });
  }
}
