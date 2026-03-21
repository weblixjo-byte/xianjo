import { prisma } from "@/db";
import { NextResponse } from "next/server";

export const runtime = 'experimental-edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
       orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET Coupons Error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { code, discountPercent } = await req.json();
    
    if (!code || !discountPercent) {
       return NextResponse.json({ error: "Missing properties" }, { status: 400 });
    }

    const uppercaseCode = code.toUpperCase().trim();
    
    // Check if duplicate
    const existing = await prisma.coupon.findUnique({ where: { code: uppercaseCode } });
    if (existing || uppercaseCode === 'WELCOME30') {
      return NextResponse.json({ error: "هذا الكوبون موجود مسبقاً أو محجوز للنظام" }, { status: 400 });
    }

    const discount = Math.min(100, Math.max(1, parseInt(discountPercent.toString())));
    
    const coupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        discountPercent: discount
      }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("POST Coupon Error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
