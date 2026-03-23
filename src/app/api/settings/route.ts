import { prisma } from "../../../db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 1 },
    });
    
    // Create default if it doesn't exist yet
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: 1, isStoreOpen: true }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Store Settings GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch store settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { isStoreOpen, categoryOrder } = await req.json();

    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: { isStoreOpen, categoryOrder },
      create: { id: 1, isStoreOpen, categoryOrder },
    });

    revalidatePath("/");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Store Settings PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update store settings" }, { status: 500 });
  }
}
