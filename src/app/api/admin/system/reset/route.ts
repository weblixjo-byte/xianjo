import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/security/auth";

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }
  try {
    const { action, supportPassword } = await request.json();
    const serverSupportPassword = process.env.SUPPORT_PASSWORD || 'support99';

    if (supportPassword !== serverSupportPassword) {
      return NextResponse.json({ error: "كلمة مرور الدعم غير صحيحة" }, { status: 403 });
    }

    if (action === 'RESET_ALL_DATA') {
      await prisma.$transaction([
        prisma.orderItem.deleteMany(),
        prisma.order.deleteMany(),
        prisma.user.deleteMany(), // Using User model correctly
        prisma.pushSubscription.deleteMany(),
      ]);
      return NextResponse.json({ success: true, message: "تم تصفير جميع بيانات البيع والزبائن" });
    }

    if (action === 'RESET_MENU') {
      await prisma.$transaction([
        prisma.product.deleteMany(),
        prisma.storeSettings.updateMany({
          data: { categoryOrder: null }
        })
      ]);
      return NextResponse.json({ success: true, message: "تم مسح المنيو والأقسام بالكامل" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("System API Error:", error);
    return NextResponse.json({ error: "Failed to perform system action" }, { status: 500 });
  }
}
