import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalRequests, totalUsers, totalReceivers, statusCounts, avgRatingResult, categoryCounts] = await Promise.all([
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
      this.prisma.user.groupBy({
        by: ['userCategory'],
        _count: true,
      }),
    ]);

    const statusDistribution = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = categoryCounts.reduce((acc, curr) => {
      acc[curr.userCategory] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      totalUsers,
      activeReceivers: totalReceivers,
      statusDistribution,
      categoryDistribution,
      averageRating: avgRatingResult._avg.rating || 0,
    };
  }

  async getAllRequests() {
    const requests = await this.prisma.receivingRequest.findMany({
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            userCode: true,
            userCategory: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            userCode: true,
            userCategory: true,
          },
        },
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r,
      student: r.student ? { ...r.student, mssv: r.student.userCode } : null,
      receiver: r.receiver ? { ...r.receiver, mssv: r.receiver.userCode } : null,
    }));
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

  async getReceiverPayroll() {
    const receivers = await this.prisma.user.findMany({
      where: { role: 'RECEIVER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userCode: true,
        status: true,
        realBalance: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const calculateDailyEarnings = (N: number): number => {
      if (N <= 0) return 0;
      if (N <= 10) return N * 3000;
      if (N <= 20) return 10 * 3000 + (N - 10) * 3500;
      return 10 * 3000 + 10 * 3500 + (N - 20) * 3800;
    };

    const payrollList = await Promise.all(
      receivers.map(async (receiver) => {
        const completedRequests = await this.prisma.receivingRequest.findMany({
          where: {
            receiverId: receiver.id,
            status: 'COMPLETED',
            updatedAt: { gte: startOfMonth },
          },
          select: {
            id: true,
            foodPlatform: true,
            orderCode: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        // Group requests by date string (YYYY-MM-DD)
        const dailyMap = new Map<string, number>();
        completedRequests.forEach((req) => {
          const d = new Date(req.updatedAt);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
        });

        let monthPayout = 0;
        dailyMap.forEach((count) => {
          monthPayout += calculateDailyEarnings(count);
        });

        const todayCount = dailyMap.get(todayStr) || 0;
        const todayPayout = calculateDailyEarnings(todayCount);

        return {
          receiver,
          completedMonthCount: completedRequests.length,
          completedTodayCount: todayCount,
          monthPayout,
          todayPayout,
          daysWorked: dailyMap.size,
        };
      })
    );

    return payrollList;
  }
}

