import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
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
  } catch (error: any) {
    console.error("GET Tables Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function prepareTableData(table: any) {
  const { id, branchId, mergedTableIds, seatedAt, ...rest } = table;
  
  const data: any = {
    ...rest,
    mergedTableIds: mergedTableIds ? JSON.stringify(mergedTableIds) : null,
    seatedAt: seatedAt ? new Date(seatedAt) : null,
  };

  // Only include branchId if it was provided
  if (branchId) data.branchId = branchId;
  
  return { id, data, branchId };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("POST /api/tables - Body:", JSON.stringify(body));

    // Bulk update/insert (Array)
    if (Array.isArray(body)) {
      const result = await prisma.$transaction(async (tx) => {
          return await Promise.all(body.map((table: any) => {
              const { id, data, branchId } = prepareTableData(table);
              const isValidId = id && id.length > 10; 
              
              return tx.table.upsert({
                  where: { id: isValidId ? id : 'non-existent' },
                  update: data,
                  create: { 
                    ...data,
                    branchId: branchId || 'b1', // Ensure branchId is present for create
                  }
              });
          }));
      });
      return NextResponse.json(result);
    }

    // Single table upsert (Object)
    const { id, data, branchId } = prepareTableData(body);
    const isValidId = id && id.length > 10;

    const result = await prisma.table.upsert({
      where: { id: isValidId ? id : 'non-existent' },
      update: data,
      create: { 
        ...data,
        branchId: branchId || 'b1',
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Tables Error Details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
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
    console.error("DELETE Table Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
