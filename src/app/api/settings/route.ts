import { prisma } from "../../../db";
import { NextResponse } from "next/server";

export const runtime = 'experimental-edge';
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
    const { isStoreOpen } = await req.json();

    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: { isStoreOpen },
      create: { id: 1, isStoreOpen },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Store Settings PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update store settings" }, { status: 500 });
  }
}
