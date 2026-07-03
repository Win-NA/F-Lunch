import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Clear existing data (in order of relations)
  await prisma.feedback.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.receivingRequest.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@fpt.edu.vn',
      password: hashedPassword,
      phoneNumber: '0901234567',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create Students
  const student1 = await prisma.user.create({
    data: {
      fullName: 'Nguyen Van Student One',
      email: 'student1@fpt.edu.vn',
      password: hashedPassword,
      phoneNumber: '0902222222',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });
  const student2 = await prisma.user.create({
    data: {
      fullName: 'Tran Thi Student Two',
      email: 'student2@fpt.edu.vn',
      password: hashedPassword,
      phoneNumber: '0903333333',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Created students: ${student1.email}, ${student2.email}`);

  // Create Receivers
  const receiver1 = await prisma.user.create({
    data: {
      fullName: 'Le Van Receiver One',
      email: 'receiver1@fpt.edu.vn',
      password: hashedPassword,
      phoneNumber: '0904444444',
      role: UserRole.RECEIVER,
      status: UserStatus.ACTIVE,
    },
  });
  const receiver2 = await prisma.user.create({
    data: {
      fullName: 'Pham Thi Receiver Two',
      email: 'receiver2@fpt.edu.vn',
      password: hashedPassword,
      phoneNumber: '0905555555',
      role: UserRole.RECEIVER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Created receivers: ${receiver1.email}, ${receiver2.email}`);

  console.log('Seeding complete!');
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
