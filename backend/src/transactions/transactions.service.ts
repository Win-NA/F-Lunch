import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { AdminAdjustDto } from './dto/admin-adjust.dto';
import { TransactionType, TransactionStatus, NotificationType, PaymentMethod } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private calculateBonus(amount: number): number {
    if (amount >= 500000) return 100000;
    if (amount >= 200000) return 40000;
    if (amount >= 100000) return 20000;
    if (amount >= 50000) return 10000;
    if (amount >= 20000) return 5000;
    return 0;
  }

  private generateCode(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FL-${prefix}-${timestamp}${random}`;
  }

  async createDeposit(userId: string, dto: DepositDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const bonusAmount = this.calculateBonus(dto.amount);
    const transactionCode = this.generateCode('DEP');

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        bonusAmount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        transactionCode,
        note: dto.note || `Chờ ngân hàng VietinBank / MoMo xác nhận chuyển khoản (${dto.paymentMethod})`,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Đã tạo yêu cầu nạp tiền ⏳',
        message: `Mã GD: ${transactionCode}. Tiền sẽ tự động cộng vào ví ngay khi Ngân hàng/MoMo xác nhận biến động số dư.`,
        type: NotificationType.SYSTEM,
      },
    });

    return transaction;
  }

  // TỰ ĐỘNG XỬ LÝ KHI NGÂN HÀNG BÁO TIỀN VỀ (CASSO / VIETQR WEBHOOK)
  async handleBankWebhook(memoContent: string, amount: number) {
    if (!memoContent || amount <= 0) {
      throw new BadRequestException('Thông tin biến động số dư không hợp lệ');
    }

    const cleanMemo = memoContent.toUpperCase().replace(/\s+/g, '');

    // 1. Tìm theo mã giao dịch PENDING cụ thể
    let pendingTx = await this.prisma.transaction.findFirst({
      where: {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        amount: amount,
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Nếu không tìm thấy GD PENDING khớp số tiền chính xác, tìm theo MSSV/Email/Tên trong memo
    let targetUserId = pendingTx?.userId;

    if (!targetUserId) {
      const users = await this.prisma.user.findMany();
      const matchedUser = users.find(u => {
        const mssvMatch = u.mssv && cleanMemo.includes(u.mssv.toUpperCase());
        const nameMatch = u.fullName && cleanMemo.includes(u.fullName.toUpperCase().replace(/\s+/g, ''));
        const emailMatch = u.email && cleanMemo.includes(u.email.split('@')[0].toUpperCase());
        return mssvMatch || nameMatch || emailMatch;
      });

      if (matchedUser) {
        targetUserId = matchedUser.id;
      }
    }

    if (!targetUserId) {
      return {
        success: false,
        message: 'Không tìm thấy sinh viên tương ứng với nội dung chuyển khoản: ' + memoContent,
      };
    }

    const bonusAmount = this.calculateBonus(amount);
    const transactionCode = pendingTx ? pendingTx.transactionCode : this.generateCode('AUTODEP');

    return await this.prisma.$transaction(async (tx) => {
      // Cộng tiền trực tiếp vào tài khoản sinh viên
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          realBalance: { increment: amount },
          bonusBalance: { increment: bonusAmount },
        },
      });

      let updatedTx;
      if (pendingTx) {
        updatedTx = await tx.transaction.update({
          where: { id: pendingTx.id },
          data: {
            status: TransactionStatus.APPROVED,
            note: `Tự động duyệt qua Webhook Ngân hàng (Nội dung: ${memoContent})`,
          },
        });
      } else {
        updatedTx = await tx.transaction.create({
          data: {
            userId: targetUserId,
            amount,
            bonusAmount,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.APPROVED,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            transactionCode,
            note: `Biến động số dư Ngân hàng VietinBank/MoMo: ${memoContent}`,
          },
        });
      }

      const bonusText = bonusAmount > 0 ? ` (+${bonusAmount.toLocaleString('vi-VN')}đ KM)` : '';
      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: 'Ngân hàng đã xác nhận nạp tiền! 🎉',
          message: `Tài khoản vừa được cộng tự động ${amount.toLocaleString('vi-VN')}đ${bonusText} từ VietinBank/MoMo. Mã GD: ${transactionCode}`,
          type: NotificationType.SUCCESS,
        },
      });

      return {
        success: true,
        message: `Đã tự động cộng ${amount.toLocaleString('vi-VN')}đ cho sinh viên!`,
        transaction: updatedTx,
      };
    });
  }

  async createWithdraw(userId: string, dto: WithdrawDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.realBalance < dto.amount) {
      throw new BadRequestException(
        `Số dư thực tế có thể rút không đủ (${user.realBalance.toLocaleString()}đ). Tiền khuyến mãi không thể rút.`
      );
    }

    const transactionCode = this.generateCode('WIT');

    // Deduct realBalance temporarily when pending withdraw request is placed
    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          realBalance: { decrement: dto.amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: dto.amount,
          bonusAmount: 0,
          type: TransactionType.WITHDRAW,
          status: TransactionStatus.PENDING,
          transactionCode,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
          note: `Yêu cầu rút tiền về ${dto.bankName} - ${dto.accountNumber} (${dto.accountName})`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Yêu cầu rút tiền đã được gửi',
          message: `Yêu cầu rút ${dto.amount.toLocaleString()}đ (Mã: ${transactionCode}) đang chờ Admin xử lý.`,
          type: NotificationType.SYSTEM,
        },
      });

      return transaction;
    });
  }

  async getMyTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            id: true,
            orderCode: true,
            foodPlatform: true,
          },
        },
      },
    });
  }

  async getAdminTransactions(status?: TransactionStatus, type?: TransactionType) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            mssv: true,
            realBalance: true,
            bonusBalance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveTransaction(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Giao dịch này đã được xử lý từ trước');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.APPROVED },
      });

      if (transaction.type === TransactionType.DEPOSIT) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            realBalance: { increment: transaction.amount },
            bonusBalance: { increment: transaction.bonusAmount },
          },
        });

        const bonusText = transaction.bonusAmount > 0 ? ` (+${transaction.bonusAmount.toLocaleString()}đ KM)` : '';
        await tx.notification.create({
          data: {
            userId: transaction.userId,
            title: 'Nạp tiền thành công! 🎉',
            message: `Tài khoản của bạn đã được cộng ${transaction.amount.toLocaleString()}đ${bonusText}. Mã GD: ${transaction.transactionCode}`,
            type: NotificationType.SUCCESS,
          },
        });
      } else if (transaction.type === TransactionType.WITHDRAW) {
        await tx.notification.create({
          data: {
            userId: transaction.userId,
            title: 'Rút tiền thành công! ✅',
            message: `Yêu cầu rút ${transaction.amount.toLocaleString()}đ về ${transaction.bankName} (${transaction.accountNumber}) đã được chuyển hoàn tất.`,
            type: NotificationType.SUCCESS,
          },
        });
      }

      return updated;
    });
  }

  async rejectTransaction(transactionId: string, reason?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Giao dịch này đã được xử lý từ trước');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.REJECTED,
          note: reason ? `${transaction.note || ''} (Lý do từ chối: ${reason})` : transaction.note,
        },
      });

      // If withdraw is rejected, refund the reserved real balance
      if (transaction.type === TransactionType.WITHDRAW) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            realBalance: { increment: transaction.amount },
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: transaction.userId,
          title: 'Giao dịch bị từ chối ⚠️',
          message: `Yêu cầu ${transaction.type === TransactionType.DEPOSIT ? 'nạp tiền' : 'rút tiền'} (${transaction.transactionCode}) đã bị từ chối. ${reason ? `Lý do: ${reason}` : ''}`,
          type: NotificationType.WARNING,
        },
      });

      return updated;
    });
  }

  async adminAdjust(adminId: string, dto: AdminAdjustDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const transactionCode = this.generateCode('ADJ');
    const updateField = dto.balanceType === 'REAL' ? 'realBalance' : 'bonusBalance';

    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dto.targetUserId },
        data: {
          [updateField]: { increment: dto.amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: dto.targetUserId,
          amount: dto.amount,
          type: TransactionType.ADMIN_ADJUST,
          status: TransactionStatus.APPROVED,
          paymentMethod: 'SYSTEM',
          transactionCode,
          note: dto.note || `Admin điều chỉnh số dư (${dto.balanceType === 'REAL' ? 'Thực tế' : 'Khuyến mãi'}): ${dto.amount > 0 ? '+' : ''}${dto.amount.toLocaleString()}đ`,
        },
      });

      await tx.notification.create({
        data: {
          userId: dto.targetUserId,
          title: 'Thay đổi số dư tài khoản 🔔',
          message: `Số dư ví của bạn vừa được điều chỉnh ${dto.amount > 0 ? '+' : ''}${dto.amount.toLocaleString()}đ (${dto.balanceType === 'REAL' ? 'Ví chính' : 'Ví KM'}). ${dto.note ? `Ghi chú: ${dto.note}` : ''}`,
          type: NotificationType.SYSTEM,
        },
      });

      return transaction;
    });
  }
}
