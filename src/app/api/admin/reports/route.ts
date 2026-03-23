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

    const calculateItemBreakdown = (orders: { items: { name: string; quantity: number }[] }[]) => {
      const breakdown = new Map<string, number>();
      orders.forEach(order => {
        order.items.forEach((item: { name: string, quantity: number }) => {
          const current = breakdown.get(item.name) || 0;
          breakdown.set(item.name, current + item.quantity);
        });
      });
      return Array.from(breakdown.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);
    };

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
          NOT: {
            status: { in: ['REJECTED', 'CANCELLED'] }
          }
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      
      return NextResponse.json({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
        itemBreakdown: calculateItemBreakdown(orders),
        orders: orders,
      });
    } else if (type === 'all') {
      const orders = await prisma.order.findMany({
        where: {
          NOT: {
            status: { in: ['REJECTED', 'CANCELLED'] }
          }
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
        itemBreakdown: calculateItemBreakdown(orders),
        orders: orders,
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        NOT: {
          status: { in: ['REJECTED', 'CANCELLED'] }
        }
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
      itemBreakdown: calculateItemBreakdown(orders),
      orders: orders,
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports", details: String(error) }, { status: 500 });
  }
}
