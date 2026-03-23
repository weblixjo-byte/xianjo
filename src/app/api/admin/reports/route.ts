import { prisma } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily'; // daily, weekly, monthly, custom, all
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    let startDate = new Date();
    const endDate = new Date();

    if (type === 'daily') {
      startDate.setHours(endDate.getHours() - 24);
    } else if (type === 'weekly') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (type === 'monthly') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (type === 'custom' && start && end) {
      startDate = new Date(start);
      const endParsed = new Date(end);
      endParsed.setHours(23, 59, 59, 999);
      
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endParsed,
          },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      
      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
        orders: orders,
      };
      return NextResponse.json(summary);
    } else if (type === 'all') {
      const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
        orders: orders,
      };
      return NextResponse.json(summary);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
      orders: orders,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports", details: String(error) }, { status: 500 });
  }
}
