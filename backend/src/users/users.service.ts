import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, UserRole, UserCategory } from '@prisma/client';

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
    return {
      ...result,
      mssv: user.userCode,
    };
  }

  async updateProfile(
    userId: string,
    dto: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      avatar?: string;
      userCode?: string;
      userCategory?: UserCategory;
      mssv?: string;
    },
  ) {
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

    const codeToUpdate = dto.userCode || dto.mssv;
    if (codeToUpdate) {
      const codeUpper = codeToUpdate.trim().toUpperCase();
      const existingCode = await this.prisma.user.findFirst({
        where: {
          userCode: codeUpper,
          id: { not: userId },
        },
      });
      if (existingCode) {
        throw new BadRequestException('Mã định danh (MSSV / Mã Cán bộ) này đã được sử dụng bởi tài khoản khác');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        avatar: dto.avatar,
        userCode: codeToUpdate ? codeToUpdate.trim().toUpperCase() : undefined,
        userCategory: dto.userCategory,
      },
    });

    const { password, ...result } = updated;
    return {
      ...result,
      mssv: updated.userCode,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userCode: true,
        userCategory: true,
        role: true,
        status: true,
        realBalance: true,
        bonusBalance: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      mssv: u.userCode,
    }));
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

  async changeUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }
}
