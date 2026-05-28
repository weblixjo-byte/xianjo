import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/security/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }
  const { id } = await params;
  const { status, paymentStatus, isArchived, captainPhone } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "معرف الطلب مفقود" }, { status: 400 });
  }

  const updateData: { status?: string; paymentStatus?: string; isArchived?: boolean; captainPhone?: string | null } = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (typeof isArchived === 'boolean') updateData.isArchived = isArchived;
  if (captainPhone !== undefined) {
    updateData.captainPhone = captainPhone === "" ? null : captainPhone;
  }

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
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }
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
