export const runtime = 'experimental-edge';
import { prisma } from "@/db";
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive }
    });
    return NextResponse.json(coupon);
  } catch (error) {
    console.error("PATCH Coupon Error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.coupon.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Coupon Error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
