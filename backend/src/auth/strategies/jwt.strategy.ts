import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // In-memory cache for validated users to avoid hundreds of thousands of DB queries
  private userCache = new Map<string, { user: any; expiresAt: number }>();
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds TTL

  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_123',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const now = Date.now();
    const cached = this.userCache.get(payload.sub);
    if (cached && now < cached.expiresAt) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
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
    });

    if (!user || user.status === 'INACTIVE') {
      this.userCache.delete(payload.sub);
      throw new UnauthorizedException('User is not authorized or inactive');
    }

    this.userCache.set(payload.sub, {
      user,
      expiresAt: now + this.CACHE_TTL,
    });

    // Cleanup expired cache entries periodically if map grows large
    if (this.userCache.size > 2000) {
      for (const [key, value] of this.userCache.entries()) {
        if (now >= value.expiresAt) {
          this.userCache.delete(key);
        }
      }
    }

    return user;
  }
}
