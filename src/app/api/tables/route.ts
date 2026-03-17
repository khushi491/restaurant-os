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
  try {
    const body = await request.json();

    // Bulk update/insert (Array)
    if (Array.isArray(body)) {
      const result = await prisma.$transaction(async (tx) => {
          return await Promise.all(body.map((table: any) => {
              const { id, branchId, ...data } = table;
              // Only use id if it looks like a valid CUID/UUID (not 't123' mock)
              const isValidId = id && id.length > 10; 
              
              return tx.table.upsert({
                  where: { id: isValidId ? id : 'new-record' },
                  update: { 
                    ...data, 
                    mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
                  },
                  create: { 
                    branchId: branchId || 'b1',
                    ...data, 
                    mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
                  }
              });
          }));
      });
      return NextResponse.json(result);
    }

    // Single table upsert (Object)
    const { id, branchId, ...data } = body;
    const isValidId = id && id.length > 10;

    const result = await prisma.table.upsert({
      where: { id: isValidId ? id : 'new-record' },
      update: { 
        ...data, 
        mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
      },
      create: { 
        branchId: branchId || 'b1',
        ...data, 
        mergedTableIds: data.mergedTableIds ? JSON.stringify(data.mergedTableIds) : null 
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
