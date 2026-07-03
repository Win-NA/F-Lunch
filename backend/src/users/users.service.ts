import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: { fullName?: string; email?: string; phoneNumber?: string; avatar?: string; mssv?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new BadRequestException('Email is already in use by another account');
      }
    }

    if (dto.mssv) {
      const mssvUpper = dto.mssv.trim().toUpperCase();
      const existingMssv = await this.prisma.user.findFirst({
        where: {
          mssv: mssvUpper,
          id: { not: userId },
        },
      });
      if (existingMssv) {
        throw new BadRequestException('Mã số sinh viên (MSSV) này đã được sử dụng bởi tài khoản khác');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        avatar: dto.avatar,
        mssv: dto.mssv,
      },
    });

    const { password, ...result } = updated;
    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        mssv: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserStatus(userId: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
      },
    });
  }
}
