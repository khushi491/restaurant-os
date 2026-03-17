import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding branches...')
  const b1 = await prisma.branch.upsert({
    where: { id: 'b1' },
    update: {},
    create: {
      id: 'b1',
      name: 'Downtown Prime',
      address: '123 Main St',
      cancellationFeeFixed: 50,
    }
  })

  const b2 = await prisma.branch.upsert({
    where: { id: 'b2' },
    update: {},
    create: {
      id: 'b2',
      name: 'Uptown Grill',
      address: '456 High St',
      cancellationFeePercent: 10,
    }
  })

  console.log('Seeding guests...')
  await prisma.guest.upsert({
    where: { id: 'g1' },
    update: {},
    create: {
      id: 'g1',
      name: 'Alice Johnson',
      phone: '555-0100',
      email: 'alice@example.com',
      visitCount: 5,
      loyaltyStatus: 'VIP',
      dietaryRestrictions: JSON.stringify(['Gluten-Free']),
      notes: 'Prefers window seat'
    }
  })

  console.log('Seeding tables...')
  const tables = [
    { number: '101', capacity: 2, status: 'available', x: 100, y: 100, shape: 'square' },
    { number: '102', capacity: 2, status: 'occupied', x: 250, y: 100, shape: 'square' },
    { number: '103', capacity: 4, status: 'reserved', x: 400, y: 100, shape: 'rectangle' },
    { number: '201', capacity: 4, status: 'cleaning', x: 100, y: 250, shape: 'circle' },
    { number: '202', capacity: 6, status: 'available', x: 300, y: 250, shape: 'rectangle' },
  ]

  for (const t of tables) {
    await prisma.table.create({
      data: {
        ...t,
        branchId: 'b1',
      }
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
