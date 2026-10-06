import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database safely...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Admin account
  const admin = await prisma.user.upsert({
    where: { email: 'se180055ledonhatanh@gmail.com' },
    update: {
      role: UserRole.ADMIN,
      realBalance: 255000,
    },
    create: {
      fullName: 'Anh Lê Đỗ Nhật (Win)',
      email: 'se180055ledonhatanh@gmail.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      realBalance: 255000,
    },
  });

  // Student account
  const student = await prisma.user.upsert({
    where: { email: 'anhldnse180055@fpt.edu.vn' },
    update: {
      role: UserRole.STUDENT,
      realBalance: 255000,
    },
    create: {
      fullName: 'Le Do Nhat Anh (K18 HCM)',
      email: 'anhldnse180055@fpt.edu.vn',
      password: hashedPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      realBalance: 255000,
    },
  });

  // Receiver account
  const receiver = await prisma.user.upsert({
    where: { email: 'nhatanh@gmail.com' },
    update: {
      role: UserRole.RECEIVER,
      phoneNumber: '0909146466',
      realBalance: 255000,
    },
    create: {
      fullName: 'Lê Đỗ Nhật Anh',
      email: 'nhatanh@gmail.com',
      password: hashedPassword,
      phoneNumber: '0909146466',
      role: UserRole.RECEIVER,
      status: UserStatus.ACTIVE,
      realBalance: 255000,
    },
  });

  console.log(`Seeding complete: ADMIN (${admin.email}), STUDENT (${student.email}), RECEIVER (${receiver.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
