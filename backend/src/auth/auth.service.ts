import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Validate domain
    const emailLower = dto.email.trim().toLowerCase();
    if (!emailLower.endsWith('@fpt.edu.vn') && !emailLower.endsWith('@gmail.com')) {
      throw new BadRequestException('Email must be from domain @fpt.edu.vn or @gmail.com');
    }

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        role: UserRole.STUDENT,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mssv: user.mssv,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Account is suspended');
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mssv: user.mssv,
      },
      ...tokens,
    };
  }

  async googleLogin(credential: string) {
    if (!credential) {
      throw new BadRequestException('Google credential is required');
    }

    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        throw new UnauthorizedException('Xác thực tài khoản Google thất bại');
      }

      const payload = await response.json();
      const email = payload.email?.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Không tìm thấy Email trong tài khoản Google');
      }

      if (!email.endsWith('@fpt.edu.vn') && !email.endsWith('@gmail.com')) {
        throw new BadRequestException('Chỉ chấp nhận email thuộc tên miền @fpt.edu.vn hoặc @gmail.com');
      }

      const name = payload.name || email.split('@')[0];
      const picture = payload.picture || null;

      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await this.prisma.user.create({
          data: {
            fullName: name,
            email,
            password: hashedPassword,
            avatar: picture,
            role: UserRole.STUDENT,
          },
        });
      } else if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('Tài khoản đã bị tạm khóa');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          mssv: user.mssv,
        },
        ...tokens,
      };
    } catch (error) {
      console.error('Google login internal error:', error);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Có lỗi xảy ra khi xác thực tài khoản Google: ' + (error.message || error));
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_456',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.status === 'INACTIVE') {
        throw new UnauthorizedException('User is not authorized or inactive');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'fallback_secret_key_123',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_456',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
