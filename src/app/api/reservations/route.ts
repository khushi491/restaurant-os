import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const reservations = await prisma.reservation.findMany({
      where: { branchId },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(reservations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, branchId, guestId, partySize, date, time, status, notes, tableId } = body;

    const data: any = {
      branchId: branchId || 'b1',
      guestId: guestId || 'g1', // Default guest for demo if none selected
      partySize: parseInt(partySize) || 2,
      date: String(date),
      time: String(time),
      status: String(status || 'upcoming'),
      notes: notes || null,
      tableId: tableId || null,
    };

    if (id && id.length > 10) {
      const result = await prisma.reservation.update({ where: { id }, data });
      return NextResponse.json(result);
    } else {
      const result = await prisma.reservation.create({ data });
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("RESERVATION ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
