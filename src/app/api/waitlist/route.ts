import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const waitlist = await prisma.waitlistEntry.findMany({
      where: { branchId, status: 'waiting' },
      orderBy: { joinedAt: 'asc' }
    });

    return NextResponse.json(waitlist);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, branchId, guestId, partySize, quotedWaitTimeMins, notes, status } = body;

    const data: any = {
      branchId: branchId || 'b1',
      guestId: guestId || 'g1',
      partySize: parseInt(partySize) || 2,
      quotedWaitTimeMins: parseInt(quotedWaitTimeMins) || 30,
      notes: notes || null,
      status: String(status || 'waiting')
    };

    if (id && id.length > 10) {
      const result = await prisma.waitlistEntry.update({ where: { id }, data });
      return NextResponse.json(result);
    } else {
      const result = await prisma.waitlistEntry.create({ data });
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
