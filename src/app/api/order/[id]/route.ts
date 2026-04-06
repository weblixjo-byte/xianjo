import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { isAllowedRequest, extractIP } from "@/lib/security/rateLimiter";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientIp = extractIP(request);

  // Rate Limit: 15 attempts per 5 minutes to prevent DDoS and Brute Force Invoice lookups
  if (!isAllowedRequest(clientIp, 15, 5 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "تم تجاوز الحد المسموح. يرجى الانتظار." }, { status: 429 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
  }

  try {
    const cleanId = id.replace('#', '').toLowerCase().trim();
    
    // SECURITY PATCH: Prevent IDOR / Brute Force by enforcing strict 36-char UUID matching.
    // Removed insecure .endsWith() substring partial matching that leaks data.
    if (cleanId.length !== 36) {
       return NextResponse.json({ success: false, error: "الطلب غير موجود، يرجى التأكد من الرمز (يجب أن يكون المعرف كاملاً)" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id: cleanId },
      include: { 
        items: true,
        review: true 
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود، يرجى التأكد من الرمز" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}
