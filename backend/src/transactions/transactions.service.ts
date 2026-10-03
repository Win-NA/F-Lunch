import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { AdminAdjustDto } from './dto/admin-adjust.dto';
import { TransactionType, TransactionStatus, NotificationType, PaymentMethod } from '@prisma/client';

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

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

  private async expireOldPendingDeposits() {
    try {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      await this.prisma.transaction.updateMany({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          createdAt: { lt: fifteenMinsAgo },
        },
        data: {
          status: TransactionStatus.REJECTED,
          note: 'Tự động hủy do quá hạn 15 phút không chuyển khoản',
        },
      });
    } catch (e) {
      // silent catch
    }
  }

  async createDeposit(userId: string, dto: DepositDto) {
    await this.expireOldPendingDeposits();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Hủy các mã PENDING nạp tiền cũ của user này để chỉ giữ 1 mã QR mới nhất
    await this.prisma.transaction.updateMany({
      where: {
        userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
      },
      data: {
        status: TransactionStatus.REJECTED,
        note: 'Hủy do sinh viên tạo mã QR nạp tiền mới',
      },
    });

    const bonusAmount = this.calculateBonus(dto.amount);
    const transactionCode = this.generateCode('DEP');

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        bonusAmount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        transactionCode,
        note: dto.note || `Chờ ngân hàng VietinBank (VietQR) xác nhận chuyển khoản (Hạn 15 phút)`,
      },
    });

    return transaction;
  }

  // CỘNG TIỀN TRỰC TIẾP KHI SINH VIÊN XÁC NHẬN ĐÃ CHUYỂN KHOẢN
  async confirmDeposit(userId: string, dto: DepositDto) {
    if (!dto.amount || dto.amount < 10000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 10.000đ');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const bonusAmount = this.calculateBonus(dto.amount);
    const transactionCode = this.generateCode('DEP');

    return await this.prisma.$transaction(async (tx) => {
      // 1. Cộng tiền trực tiếp vào số dư thực tế và khuyến mãi
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          realBalance: { increment: dto.amount },
          bonusBalance: { increment: bonusAmount },
        },
      });

      // 2. Tạo giao dịch DEPOSIT trạng thái APPROVED
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: dto.amount,
          bonusAmount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.APPROVED,
          paymentMethod: dto.paymentMethod || PaymentMethod.BANK_TRANSFER,
          transactionCode,
          note: dto.note || `Nạp tiền thành công qua ${dto.paymentMethod === 'MOMO' ? 'Ví MoMo' : 'VietinBank VietQR'}`,
        },
      });

      // 3. Thông báo cho sinh viên
      const bonusText = bonusAmount > 0 ? ` (+${bonusAmount.toLocaleString('vi-VN')}đ KM)` : '';
      await tx.notification.create({
        data: {
          userId,
          title: 'Nạp tiền thành công! 🎉',
          message: `Tài khoản vừa được cộng ${dto.amount.toLocaleString('vi-VN')}đ${bonusText}. Mã GD: ${transactionCode}`,
          type: NotificationType.SUCCESS,
        },
      });

      return {
        success: true,
        message: `Nạp tiền thành công! Đã cộng ${dto.amount.toLocaleString('vi-VN')}đ vào ví.`,
        transaction,
        user: updatedUser,
      };
    });
  }

  // KIỂM TRA TRẠNG THÁI NẠP TIỀN TỪ NGÂN HÀNG (LẮNG NGHE WEBHOOK BANCKING THỰC TẾ)
  async autoCheckDeposit(userId: string) {
    await this.expireOldPendingDeposits();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 1. Kiểm tra xem có giao dịch NẠP TIỀN vừa được WEBHOOK NGÂN HÀNG xác nhận APPROVED trong vòng 2 phút gần đây không
    const recentApprovedTx = await this.prisma.transaction.findFirst({
      where: {
        userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.APPROVED,
        updatedAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (recentApprovedTx) {
      return {
        success: true,
        message: `Ngân hàng đã báo có! Đã tự động cộng ${recentApprovedTx.amount.toLocaleString('vi-VN')}đ vào ví.`,
        user,
        transaction: recentApprovedTx,
      };
    }

    // 2. Nếu vẫn đang PENDING (Chưa nhận được Webhook từ Ngân hàng / Casso / SePay)
    const pendingTx = await this.prisma.transaction.findFirst({
      where: {
        userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: false,
      status: pendingTx ? 'PENDING' : 'NONE',
      message: pendingTx 
        ? 'Đang chờ hệ thống Ngân hàng (VietinBank / VietQR / MoMo) gửi Webhook biến động số dư...' 
        : 'Chưa có yêu cầu nạp tiền nào.',
      transaction: pendingTx || null,
    };
  }

  // XÁC NHẬN VÀ CỘNG TIỀN VÍ
  async verifyPendingDeposit(userId: string) {
    return this.autoCheckDeposit(userId);
  }

  // TỰ ĐỘNG XỬ LÝ KHI NGÂN HÀNG BÁO TIỀN VỀ (CASSO / SEPAY / VIETQR WEBHOOK)
  async handleBankWebhook(memoContent: string, amount: number) {
    if (!memoContent || amount <= 0) {
      throw new BadRequestException('Thông tin biến động số dư không hợp lệ');
    }

    const rawCleanMemo = removeAccents(memoContent);
    const users = await this.prisma.user.findMany();

    // 1. Tìm Sinh viên dựa trên MSSV, Tên (không dấu), Email prefix trong Nội dung chuyển khoản (Memo)
    let matchedUser = users.find(u => {
      const mssvClean = u.mssv ? removeAccents(u.mssv) : '';
      const mssvMatch = mssvClean.length >= 3 && rawCleanMemo.includes(mssvClean);

      const mssvDigits = mssvClean.replace(/[^0-9]/g, '');
      const mssvDigitsMatch = mssvDigits.length >= 4 && rawCleanMemo.includes(mssvDigits);

      const nameClean = u.fullName ? removeAccents(u.fullName) : '';
      const nameMatch = nameClean.length >= 3 && rawCleanMemo.includes(nameClean);

      const emailPrefix = u.email ? removeAccents(u.email.split('@')[0]) : '';
      const emailMatch = emailPrefix.length >= 3 && rawCleanMemo.includes(emailPrefix);

      return mssvMatch || mssvDigitsMatch || nameMatch || emailMatch;
    });

    let targetUserId = matchedUser?.id;
    let pendingTx = null;

    if (targetUserId) {
      pendingTx = await this.prisma.transaction.findFirst({
        where: {
          userId: targetUserId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: amount,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      const pendingTxs = await this.prisma.transaction.findMany({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      pendingTx = pendingTxs.find(tx => {
        const cleanTxCode = removeAccents(tx.transactionCode);
        return rawCleanMemo.includes(cleanTxCode);
      });
      if (pendingTx) {
        targetUserId = pendingTx.userId;
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
          title: 'Nạp tiền thành công! 🎉',
          message: `Tài khoản vừa được cộng ${amount.toLocaleString('vi-VN')}đ${bonusText} qua VietinBank/MoMo. Mã GD: ${transactionCode}`,
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
