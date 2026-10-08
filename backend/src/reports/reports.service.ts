import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ProcessReportDto } from './dto/process-report.dto';
import { ReportStatus, ReportType, NotificationType, TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateReportDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.type === ReportType.DEPOSIT_ERROR && (!dto.expectedAmount || dto.expectedAmount <= 0)) {
      throw new BadRequestException('Vui lòng nhập số tiền bạn đã chuyển khoản để Admin đối chiếu!');
    }

    const reportType = dto.type || ReportType.DEPOSIT_ERROR;
    const defaultTitle = reportType === ReportType.DEPOSIT_ERROR 
      ? `Phản ánh lỗi nạp tiền${dto.expectedAmount ? ` (${dto.expectedAmount.toLocaleString('vi-VN')}đ)` : ''}`
      : 'Báo cáo sự cố hệ thống';
    const finalTitle = dto.title?.trim() || defaultTitle;

    const report = await this.prisma.reportTicket.create({
      data: {
        userId,
        type: reportType,
        title: finalTitle,
        description: dto.description,
        proofImage: dto.proofImage,
        expectedAmount: dto.expectedAmount ? Math.round(dto.expectedAmount) : null,
        transactionCode: dto.transactionCode ? dto.transactionCode.trim() : null,
        status: ReportStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userCode: true,
            userCategory: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Notify user that report was submitted
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Yêu cầu hỗ trợ đã được ghi nhận',
        message: `Yêu cầu phản ánh #${report.id.slice(0, 8)} của bạn đã được ghi nhận. Ban quản trị sẽ đối chiếu chứng từ và phản hồi sớm nhất!`,
        type: NotificationType.SYSTEM,
      },
    });

    // Notify ALL Admins about the new report ticket
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Báo cáo khiếu nại mới',
          message: `Thành viên ${user.fullName} vừa gửi phản ánh #${report.id.slice(0, 8)} (${report.type === 'DEPOSIT_ERROR' ? 'Lỗi nạp tiền' : 'Lỗi hệ thống'}).`,
          type: NotificationType.WARNING,
        },
      });
    }

    return report;
  }

  async findMyReports(userId: string) {
    return this.prisma.reportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin(statusFilter?: string) {
    const whereCondition: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      whereCondition.status = statusFilter as ReportStatus;
    }

    return this.prisma.reportTicket.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userCode: true,
            userCategory: true,
            phoneNumber: true,
            realBalance: true,
            bonusBalance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processReport(reportId: string, adminId: string, dto: ProcessReportDto) {
    const report = await this.prisma.reportTicket.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report) {
      throw new NotFoundException('Report ticket not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Báo cáo này đã được xử lý trước đó rồi');
    }

    return await this.prisma.$transaction(async (tx) => {
      let updatedReport;

      if (dto.status === ReportStatus.APPROVED) {
        const creditAmount = dto.approvedAmount !== undefined ? dto.approvedAmount : (report.expectedAmount || 0);
        const extraBonus = dto.bonusAmount || 0;

        if (creditAmount <= 0 && extraBonus <= 0) {
          throw new BadRequestException('Số tiền duyệt cộng vào ví phải lớn hơn 0đ');
        }

        // 1. Credit wallet
        await tx.user.update({
          where: { id: report.userId },
          data: {
            realBalance: { increment: creditAmount },
            bonusBalance: { increment: extraBonus },
          },
        });

        // 2. Generate transaction record
        const txCode = report.transactionCode || `FL-NNC-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.transaction.create({
          data: {
            userId: report.userId,
            amount: creditAmount,
            bonusAmount: extraBonus,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.APPROVED,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            transactionCode: txCode,
            proofImage: report.proofImage,
            note: `Cộng tiền từ Duyệt báo cáo lỗi nạp #${report.id.slice(0, 8)}${dto.adminNote ? ` - Ghi chú: ${dto.adminNote}` : ''}`,
          },
        });

        // 3. Update report status
        updatedReport = await tx.reportTicket.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.APPROVED,
            adminNote: dto.adminNote || `Đã xác minh chứng từ chuyển khoản và cộng ${creditAmount.toLocaleString('vi-VN')}đ vào ví chính thành công.`,
            resolvedAt: new Date(),
          },
          include: { user: true },
        });

        // 4. Send SUCCESS notification to student
        await tx.notification.create({
          data: {
            userId: report.userId,
            title: 'Yêu cầu nạp tiền đã được phê duyệt',
            message: `Admin đã xác minh chứng từ nạp tiền của bạn ${report.transactionCode ? `(Mã CK: ${report.transactionCode})` : ''}. Số tiền ${creditAmount.toLocaleString('vi-VN')}đ đã được cộng vào ví chính.${extraBonus > 0 ? ` Tiền thưởng: ${extraBonus.toLocaleString('vi-VN')}đ.` : ''}`,
            type: NotificationType.SUCCESS,
          },
        });

      } else if (dto.status === ReportStatus.REJECTED) {
        updatedReport = await tx.reportTicket.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.REJECTED,
            adminNote: dto.adminNote || 'Không thể xác minh chứng từ chuyển khoản hợp lệ hoặc giao dịch chưa khớp hệ thống.',
            resolvedAt: new Date(),
          },
          include: { user: true },
        });

        // Send WARNING notification to student
        await tx.notification.create({
          data: {
            userId: report.userId,
            title: 'Yêu cầu hỗ trợ bị từ chối',
            message: `Báo cáo #${report.id.slice(0, 8)} của bạn đã bị từ chối. Lý do từ Admin: ${updatedReport.adminNote}`,
            type: NotificationType.WARNING,
          },
        });

      } else {
        // RESOLVED for general bugs
        updatedReport = await tx.reportTicket.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.RESOLVED,
            adminNote: dto.adminNote || 'Sự cố đã được bộ phận kỹ thuật hỗ trợ và xử lý thành công.',
            resolvedAt: new Date(),
          },
          include: { user: true },
        });

        // Send SUCCESS notification to student
        await tx.notification.create({
          data: {
            userId: report.userId,
            title: 'Sự cố đã được giải quyết',
            message: `Báo cáo #${report.id.slice(0, 8)} của bạn đã được giải quyết: ${updatedReport.adminNote}`,
            type: NotificationType.SUCCESS,
          },
        });
      }

      return updatedReport;
    });
  }
}
