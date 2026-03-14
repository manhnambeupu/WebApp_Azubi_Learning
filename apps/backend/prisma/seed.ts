import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHashAdmin = await bcrypt.hash('Admin123!', 12);
  const passwordHashStudent = await bcrypt.hash('Student123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@azubi.de' },
    update: {
      password: passwordHashAdmin,
      fullName: 'Azubi Admin',
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@azubi.de',
      password: passwordHashAdmin,
      fullName: 'Azubi Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@azubi.de' },
    update: {
      password: passwordHashStudent,
      fullName: 'Azubi Student',
      role: Role.STUDENT,
    },
    create: {
      email: 'student@azubi.de',
      password: passwordHashStudent,
      fullName: 'Azubi Student',
      role: Role.STUDENT,
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
