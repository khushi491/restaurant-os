import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');

  if (!branchId) {
    return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
  }

  const tables = await prisma.table.findMany({
    where: { branchId }
  });

  const parsedTables = tables.map(t => ({
    ...t,
    mergedTableIds: t.mergedTableIds ? JSON.parse(t.mergedTableIds) : []
  }));

  return NextResponse.json(parsedTables);
}

export async function POST(request: Request) {
  const body = await request.json();

  // If body is an array, it's a simple list of tables to upsert
  if (Array.isArray(body)) {
    const tables = body;
    
    const result = await prisma.$transaction(async (tx) => {
        const upserted = await Promise.all(tables.map((table: any) => {
            const { id, branchId, ...data } = table;
            return tx.table.upsert({
                where: { id: (id && id.length > 5) ? id : 'non-existent' },
                update: { 
                  ...data, 
                  mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
                },
                create: { 
                  branchId,
                  ...data, 
                  mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
                }
            });
        }));
        return upserted;
    });

    return NextResponse.json(result);
  }

  // Single table upsert
  const { id, ...data } = body;
  const result = await prisma.table.upsert({
    where: { id: id || 'new' },
    update: { 
      ...data, 
      mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
    },
    create: { 
      ...data, 
      mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
    }
  });

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
