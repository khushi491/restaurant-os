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

/**
 * Prepares data for Prisma, ensuring types match the schema exactly.
 */
function sanitizeTableData(table: any) {
  const { 
    id, 
    branchId, 
    mergedTableIds, 
    seatedAt, 
    number, 
    capacity, 
    status, 
    x, 
    y, 
    shape, 
    rotation, 
    assignedServerId, 
    currentResId, 
    isCombined 
  } = table;
  
  const data: any = {
    number: String(number),
    capacity: parseInt(capacity) || 0,
    status: String(status),
    x: Math.round(parseFloat(x)) || 0,
    y: Math.round(parseFloat(y)) || 0,
    shape: String(shape),
    rotation: parseInt(rotation) || 0,
    isCombined: Boolean(isCombined),
    assignedServerId: assignedServerId || null,
    currentResId: currentResId || null,
    mergedTableIds: mergedTableIds ? JSON.stringify(mergedTableIds) : null,
    seatedAt: seatedAt ? new Date(seatedAt) : null,
  };

  // Only include branchId for creations
  return { id, data, branchId };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle Bulk Operations (e.g. Merge/Split)
    if (Array.isArray(body)) {
      const result = await prisma.$transaction(async (tx) => {
        return await Promise.all(body.map(async (item: any) => {
          const { id, data, branchId } = sanitizeTableData(item);
          const isExisting = id && id.length > 10; // Simple CUID check

          if (isExisting) {
            return tx.table.update({
              where: { id },
              data
            });
          } else {
            return tx.table.create({
              data: { ...data, branchId: branchId || 'b1' }
            });
          }
        }));
      });
      return NextResponse.json(result);
    }

    // Handle Single Operation
    const { id, data, branchId } = sanitizeTableData(body);
    const isExisting = id && id.length > 10;

    if (isExisting) {
      const result = await prisma.table.update({
        where: { id },
        data
      });
      return NextResponse.json(result);
    } else {
      const result = await prisma.table.create({
        data: { ...data, branchId: branchId || 'b1' }
      });
      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    return NextResponse.json({ 
      error: "Database operation failed", 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
