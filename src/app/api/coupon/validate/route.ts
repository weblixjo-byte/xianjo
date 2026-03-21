import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";
import { isAllowedRequest, extractIP } from "@/lib/security/rateLimiter";

export async function POST(request: Request) {
  const clientIp = extractIP(request);
  if (!isAllowedRequest(clientIp, 10, 5 * 60 * 1000)) {
     return NextResponse.json({ valid: false, error: "محاولات كثيرة جداً، يرجى الانتظار." }, { status: 429 });
  }

  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ valid: false, error: "يجب تسجيل الدخول لاستخدام الكوبون" }, { status: 401 });
    }

    const { code } = await request.json();

    const upperCode = code?.trim().toUpperCase();

    if (!upperCode) {
      return NextResponse.json({ valid: false, error: "كوبون غير صحيح" }, { status: 400 });
    }

    if (upperCode === 'WELCOME30') {
      // Check if the user has already used the discount
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hasUsedWelcomeDiscount: true }
      });

      if (!user) {
        return NextResponse.json({ valid: false, error: "حساب المستخدم غير موجود" }, { status: 404 });
      }

      if (user.hasUsedWelcomeDiscount) {
        return NextResponse.json({ valid: false, error: "لقد استخدمت كوبون الترحيب مسبقاً، لا يمكن استخدامه مرة أخرى" }, { status: 400 });
      }

      // Valid Welcome Coupon
      return NextResponse.json({ 
        valid: true, 
        discountPercent: 0.30, 
        message: "تم تفعيل خصم الترحيب (30%) بنجاح!" 
      });
    } else {
      // Dynamic Admin Coupon Check
      const dynamicCoupon = await prisma.coupon.findUnique({ where: { code: upperCode } });
      
      if (dynamicCoupon && dynamicCoupon.isActive) {
        return NextResponse.json({ 
          valid: true, 
          discountPercent: dynamicCoupon.discountPercent / 100, 
          message: `تم تفعيل خصم ${dynamicCoupon.discountPercent}% بنجاح!` 
        });
      }

      return NextResponse.json({ valid: false, error: "الكوبون غير صالح أو غير مفعل" }, { status: 400 });
    }

  } catch (error) {
    console.error("Coupon Validate Error:", error);
    return NextResponse.json({ valid: false, error: "حدث خطأ أثناء التحقق من الكوبون" }, { status: 500 });
  }
}
