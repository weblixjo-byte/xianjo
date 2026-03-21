export const runtime = 'experimental-edge';
import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";
import { isAllowedRequest, extractIP } from "@/lib/security/rateLimiter";

export async function POST(request: Request) {
  const clientIp = extractIP(request);
  if (!isAllowedRequest(clientIp, 10, 5 * 60 * 1000)) {
     return NextResponse.json({ valid: false, error: "Too many requests, please wait." }, { status: 429 });
  }

  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ valid: false, error: "You must sign in to use a coupon" }, { status: 401 });
    }

    const { code } = await request.json();

    const upperCode = code?.trim().toUpperCase();

    if (!upperCode) {
      return NextResponse.json({ valid: false, error: "Invalid coupon" }, { status: 400 });
    }

    if (upperCode === 'WELCOME30') {
      // Check if the user has already used the discount
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hasUsedWelcomeDiscount: true }
      });

      if (!user) {
        return NextResponse.json({ valid: false, error: "User account not found" }, { status: 404 });
      }

      if (user.hasUsedWelcomeDiscount) {
        return NextResponse.json({ valid: false, error: "You have already used the welcome coupon, it cannot be used again" }, { status: 400 });
      }

      // Valid Welcome Coupon
      return NextResponse.json({ 
        valid: true, 
        discountPercent: 0.30, 
        message: "Welcome discount (30%) applied successfully!" 
      });
    } else {
      // Dynamic Admin Coupon Check
      const dynamicCoupon = await prisma.coupon.findUnique({ where: { code: upperCode } });
      
      if (dynamicCoupon && dynamicCoupon.isActive) {
        return NextResponse.json({ 
          valid: true, 
          discountPercent: dynamicCoupon.discountPercent / 100, 
          message: `Discount ${dynamicCoupon.discountPercent}% applied successfully!` 
        });
      }

      return NextResponse.json({ valid: false, error: "Coupon is invalid or deactivated" }, { status: 400 });
    }

  } catch (error) {
    console.error("Coupon Validate Error:", error);
    return NextResponse.json({ valid: false, error: "An error occurred while validating the coupon" }, { status: 500 });
  }
}
