import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/security/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(zones);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsedFee = parseFloat(body.fee);
    const zone = await prisma.deliveryZone.create({
      data: { nameEn: body.nameEn, nameAr: body.nameAr, fee: isNaN(parsedFee) ? 0 : parsedFee }
    });
    return NextResponse.json(zone);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const parsedFee = data.fee ? parseFloat(data.fee) : undefined;
    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: { ...data, fee: parsedFee !== undefined ? (isNaN(parsedFee) ? 0 : parsedFee) : undefined }
    });
    return NextResponse.json(zone);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });
    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
