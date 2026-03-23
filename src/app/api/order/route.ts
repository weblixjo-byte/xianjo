// src/app/api/order/route.ts
import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedRequest, extractIP } from "@/lib/security/rateLimiter";

const orderSchema = z.object({
  customerName: z.string().min(2, "Name is too short").max(100),
  phone: z.string().min(8, "Invalid phone number").max(30),
  address: z.string().nullable().optional(),
  deliveryArea: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  orderType: z.enum(['DELIVERY', 'PICKUP']),
  pickupTime: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  paymentMethod: z.enum(['CASH', 'CLIQ', 'APPLE_PAY', 'CARD']).default('CASH'),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().int().min(1, "Invalid quantity"),
    // price from frontend is explicitly untrusted and ignored here
  })).min(1, "Cart is empty")
});

export async function POST(request: Request) {
  const clientIp = extractIP(request);
  if (!isAllowedRequest(clientIp, 10, 15 * 60 * 1000)) {
     return NextResponse.json({ success: false, error: "Request limit exceeded. Please wait a moment!" }, { status: 429 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "Database not connected (Missing DATABASE_URL)" }, { status: 500 });
  }

  try {
    const jsonBody = await request.json();
    
    // Zod Payload Sanitization
    const parseResult = orderSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid order data", details: parseResult.error.format() }, { status: 400 });
    }
    
    const data = parseResult.data;

    // Check if the store is open
    const storeSettings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
    if (storeSettings && !storeSettings.isStoreOpen) {
      return NextResponse.json({ success: false, error: "Sorry, the store is currently closed and we cannot accept new orders." }, { status: 403 });
    }

    // Zero-Trust Cost Recalculation
    const productIds = data.items.map(item => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    
    const realPriceMap = new Map(dbProducts.map((p: { id: string; price: number }) => [p.id, p.price]));
    
    let calculatedTotal = 0;
    const itemsToCreate = [];

    for (const item of data.items) {
      const dbPrice = realPriceMap.get(item.productId);
      if (dbPrice === undefined || dbPrice === null) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.name}` }, { status: 400 });
      }
      calculatedTotal += Number(dbPrice) * item.quantity;
      itemsToCreate.push({
        productId: item.productId,
        name: item.name,
        price: Number(dbPrice),
        quantity: item.quantity
      });
    }

    const upperCoupon = data.couponCode ? data.couponCode.trim().toUpperCase() : null;
    let finalTotalPrice = calculatedTotal;

    // Server-side validation for coupons
    if (upperCoupon === 'WELCOME30') {
       if (!data.userId) {
          return NextResponse.json({ success: false, error: "You must sign in to use the welcome coupon" }, { status: 401 });
       }
       const user = await prisma.user.findUnique({ where: { id: data.userId } });
       if (!user || user.hasUsedWelcomeDiscount) {
          return NextResponse.json({ success: false, error: "Invalid coupon or already used" }, { status: 400 });
       }
       // Apply 30% discount
       finalTotalPrice = calculatedTotal * 0.70;
    } else if (upperCoupon) {
       // Validate Dynamic Custom Coupon
       const dynamicCoupon = await prisma.coupon.findUnique({ where: { code: upperCoupon } });
       if (!dynamicCoupon || !dynamicCoupon.isActive) {
          return NextResponse.json({ success: false, error: "Invalid or deactivated coupon" }, { status: 400 });
       }
       // Apply custom discount percentage
       finalTotalPrice = calculatedTotal * (1 - (dynamicCoupon.discountPercent / 100));
    }

    // Prisma: Create the validated deeply nested order 
    const isPaidMethod = ['CLIQ', 'APPLE_PAY', 'CARD'].includes(data.paymentMethod);
    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerName,
        phoneNumber: data.phone,
        address: data.address || null,
        deliveryArea: data.deliveryArea || null,
        pickupTime: data.pickupTime || null,
        orderType: data.orderType,
        notes: data.notes || null,
        totalPrice: parseFloat(finalTotalPrice.toFixed(2)),
        userId: data.userId || null,
        couponCode: data.couponCode || null,
        paymentMethod: data.paymentMethod,
        paymentStatus: isPaidMethod ? 'PENDING' : 'COMPLETED',
        items: {
          create: itemsToCreate
        }
      }
    });

    // Mark discount as used securely
    if (data.userId && upperCoupon === 'WELCOME30') {
       await prisma.user.update({
         where: { id: data.userId },
         data: { hasUsedWelcomeDiscount: true }
       });
    }

    // 🔥 Background Push Notification Trigger
    try {
      const subscriptions = await prisma.pushSubscription.findMany();
      if (subscriptions.length > 0) {
        // Dynamic import to avoid issues in non-browser environments during build
        const { sendOrderNotification } = await import('@/lib/push');
        
        // Send to all registered devices (iPad, mobiles, etc.)
        await Promise.allSettled(
          subscriptions.map((sub) => 
            sendOrderNotification(sub, newOrder.id, newOrder.totalPrice)
          )
        );
      }

      // 📲 External Pushover App Alert (Dedicated Device Notification)
      const { sendPushoverNotification } = await import('@/lib/pushover');
      await sendPushoverNotification(newOrder.id, newOrder.totalPrice, newOrder.customerName);

    } catch (pushErr) {
      console.error("Failed to send notifications:", pushErr);
    }

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (error) {
    console.error("====== PRISMA CATCH BLOCK ERROR ======");
    console.dir(error, { depth: null });
    
    return NextResponse.json(
      { success: false, error: "Failed to submit order to database", rawError: String(error) }, 
      { status: 500 }
    );
  }
}
