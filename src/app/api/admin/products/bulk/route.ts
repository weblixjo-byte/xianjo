import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { ids, category, action = 'add' } = await req.json();

    if (!Array.isArray(ids) || !category) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (action === 'replace') {
      const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { category: category }
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    // Default: 'add' (append)
    // Fetch products to get current categories
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, category: true }
    });

    const updates = products.map(p => {
      const currentCats = p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : [];
      if (!currentCats.includes(category.trim())) {
        currentCats.push(category.trim());
      }
      return prisma.product.update({
        where: { id: p.id },
        data: { category: currentCats.join(', ') }
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    console.error("Bulk Product Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
