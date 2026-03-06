import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@azubi.de' },
    update: {
      password: passwordHash,
      fullName: 'Azubi Admin',
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@azubi.de',
      password: passwordHash,
      fullName: 'Azubi Admin',
      role: Role.ADMIN,
    },
  });

  const categories = ['Buồng phòng', 'Ẩm thực', 'Lễ tân'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error('Prisma seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
