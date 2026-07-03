import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalRequests, totalUsers, totalReceivers, statusCounts, avgRatingResult] = await Promise.all([
      this.prisma.receivingRequest.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'RECEIVER', status: 'ACTIVE' } }),
      this.prisma.receivingRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.feedback.aggregate({
        _avg: {
          rating: true,
        },
      }),
    ]);

    const statusDistribution = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      totalUsers,
      activeReceivers: totalReceivers,
      statusDistribution,
      averageRating: avgRatingResult._avg.rating || 0,
    };
  }

  async getAllRequests() {
    return this.prisma.receivingRequest.findMany({
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllFeedbacks() {
    return this.prisma.feedback.findMany({
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
        request: {
          select: {
            orderCode: true,
            foodPlatform: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
