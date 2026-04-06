import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { orderId, rating, comment, customerName } = await request.json();

    if (!orderId || !rating || !customerName) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // Verify order exists and doesn't already have a review
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true }
    });

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (order.review) {
      return NextResponse.json({ error: "لقد قمت بتقييم هذا الطلب مسبقاً" }, { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        orderId,
        rating,
        comment,
        customerName,
        isPublic: false, // Default to hidden until admin approves
      }
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json({ error: "فشل إرسال التقييم" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch only approved public reviews for the front-end
    const reviews = await prisma.review.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "فشل جلب التقييمات" }, { status: 500 });
  }
}
