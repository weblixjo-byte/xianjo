// src/app/api/admin/products/[id]/route.ts
import { prisma } from "../../../../../db"; 
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Extract updateable fields
    const { nameEn, nameAr, price, category, imageUrl, isAvailable, descriptionAr, descriptionEn } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAr && { nameAr }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionEn !== undefined && { descriptionEn })
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
    return NextResponse.json({ error: "فشل تحديث المنتج" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ error: "فشل حذف المنتج" }, { status: 500 });
  }
}
