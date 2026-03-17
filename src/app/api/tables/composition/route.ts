import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { tableIds } = await request.json();
    if (!tableIds || !Array.isArray(tableIds)) {
      return NextResponse.json({ error: 'tableIds array is required' }, { status: 400 });
    }

    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } }
    });

    return NextResponse.json(tables);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
