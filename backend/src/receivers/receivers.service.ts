import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, NotificationType, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class ReceiversService {
  constructor(private prisma: PrismaService) {}

  async findPending() {
    return this.prisma.receivingRequest.findMany({
      where: { status: RequestStatus.PENDING },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveAssignment(receiverId: string) {
    return this.prisma.receivingRequest.findFirst({
      where: {
        receiverId,
        status: {
          in: [RequestStatus.ACCEPTED, RequestStatus.RECEIVED],
        },
      },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
  }

  async accept(requestId: string, receiverId: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver || receiver.status !== 'ACTIVE') {
      throw new BadRequestException('Tài khoản nhận hộ đang bị tạm khóa hoặc không hợp lệ');
    }

    // Check if receiver has active assignment currently in transit (ACCEPTED, RECEIVED)
    const active = await this.findActiveAssignment(receiverId);
    if (active) {
      throw new BadRequestException(
        `Bạn đang đi lấy đơn hàng #${active.orderCode || active.id.slice(0, 8)}. Vui lòng giao đồ về tủ sảnh và bấm "Đã cất vào tủ" trước khi nhận đơn mới!`
      );
    }

    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is no longer pending');
    }

    const updated = await this.prisma.receivingRequest.update({
      where: { id: requestId },
      data: {
        receiverId,
        status: RequestStatus.ACCEPTED,
      },
      include: {
        student: true,
      },
    });

    // Notify student
    await this.prisma.notification.create({
      data: {
        userId: request.studentId,
        requestId,
        title: 'Đơn hàng đã được tiếp nhận! 🤝',
        message: `Người nhận hộ ${receiver.fullName} đã nhận đơn ${request.foodPlatform} của bạn và đang di chuyển tới ${request.pickupLocation}.`,
        type: NotificationType.SUCCESS,
      },
    });

    // Notify receiver
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        requestId,
        title: 'Nhận đơn thành công! 🚴',
        message: `Bạn đã nhận thành công đơn ${request.foodPlatform} của sinh viên ${updated.student.fullName}. Vui lòng tới ${request.pickupLocation} để lấy đồ từ tài xế.`,
        type: NotificationType.SUCCESS,
      },
    });

    return updated;
  }

  async updateStatus(requestId: string, receiverId: string, status: RequestStatus) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
      include: { receiver: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.receiverId !== receiverId) {
      throw new BadRequestException('You are not assigned to this request');
    }

    // Verify valid status update transitions
    const validStatuses: RequestStatus[] = [RequestStatus.RECEIVED, RequestStatus.READY_FOR_PICKUP];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status update for this action');
    }

    if (status === RequestStatus.RECEIVED && request.status !== RequestStatus.ACCEPTED) {
      throw new BadRequestException('Can only set RECEIVED after ACCEPTED');
    }

    if (status === RequestStatus.READY_FOR_PICKUP && request.status !== RequestStatus.RECEIVED) {
      throw new BadRequestException('Can only set READY_FOR_PICKUP after RECEIVED');
    }

    const updated = await this.prisma.receivingRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Notify student
    let title = '';
    let message = '';
    if (status === RequestStatus.RECEIVED) {
      title = 'Đã lấy đồ ăn từ tài xế 🛵';
      message = `Người nhận hộ ${request.receiver?.fullName || 'Người nhận'} đã lấy đồ ăn ${request.foodPlatform} từ tài xế shipper thành công.`;
    } else if (status === RequestStatus.READY_FOR_PICKUP) {
      title = 'Đã về tới sảnh - Hãy ra nhận đồ! 🥡';
      message = `Đồ ăn của bạn đã về tới ${request.dropoffLocation || 'Sảnh Trống Đồng'}. Vui lòng mở ứng dụng và đưa mã QR cho người nhận hộ để lấy đồ nhé!`;
    }

    await this.prisma.notification.create({
      data: {
        userId: request.studentId,
        requestId,
        title,
        message,
        type: NotificationType.REMINDER,
      },
    });

    return updated;
  }

  async complete(verificationCode: string, receiverId: string) {
    const cleanCode = verificationCode.trim().toLowerCase();
    let request;

    if (cleanCode.length === 36) {
      // Full UUID from QR scan
      request = await this.prisma.receivingRequest.findUnique({
        where: { id: cleanCode },
        include: { receiver: true, student: true },
      });
    } else if (cleanCode.length > 0) {
      // Short code/OTP or prefix match entered manually
      request = await this.prisma.receivingRequest.findFirst({
        where: {
          id: {
            startsWith: cleanCode,
          },
        },
        include: { receiver: true, student: true },
      });
    }

    if (!request) {
      throw new NotFoundException('Request not found or invalid code');
    }

    if (request.receiverId !== receiverId) {
      throw new BadRequestException('You are not assigned to this request');
    }

    if (request.status !== RequestStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Request must be READY_FOR_PICKUP to complete');
    }

    const updated = await this.prisma.receivingRequest.update({
      where: { id: request.id },
      data: { status: RequestStatus.COMPLETED },
    });

    // Notify student
    await this.prisma.notification.create({
      data: {
        userId: request.studentId,
        requestId: request.id,
        title: 'Đơn hàng đã hoàn thành! 🎉',
        message: `Đơn nhận hộ ${request.foodPlatform} đã bàn giao thành công. Cảm ơn bạn đã sử dụng F-Lunch! Hãy để lại đánh giá dịch vụ nhé.`,
        type: NotificationType.SUCCESS,
      },
    });

    // Notify receiver
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        requestId: request.id,
        title: 'Giao đơn thành công! 💰',
        message: `Bạn đã bàn giao thành công đơn hàng cho sinh viên ${request.student.fullName}. Thu nhập +5.000đ đã được ghi nhận.`,
        type: NotificationType.SUCCESS,
      },
    });

    return updated;
  }

  async findHistory(receiverId: string) {
    return this.prisma.receivingRequest.findMany({
      where: {
        receiverId,
        status: RequestStatus.COMPLETED,
      },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
          },
        },
        feedback: {
          select: {
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async cancelAssignment(requestId: string, receiverId: string) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
      include: { student: true, receiver: true },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Một khi đã chấp nhận nhận hộ đơn hàng, bạn không thể hủy đơn.');
    }

    const feeToRefund = request.serviceFee || 5000;
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    const receiverName = receiver?.fullName || 'Người nhận hộ';

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update status to CANCELLED
      const updated = await tx.receivingRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.CANCELLED,
        },
      });

      // 2. Refund 5,000đ to student realBalance
      await tx.user.update({
        where: { id: request.studentId },
        data: {
          realBalance: { increment: feeToRefund },
        },
      });

      // 3. Create refund transaction
      const transactionCode = `FL-REF-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.transaction.create({
        data: {
          userId: request.studentId,
          requestId,
          amount: feeToRefund,
          type: TransactionType.ORDER_REFUND,
          status: TransactionStatus.APPROVED,
          paymentMethod: 'SYSTEM',
          transactionCode,
          note: `Hoàn phí dịch vụ 5.000đ do người nhận hộ từ chối/hủy đơn hàng`,
        },
      });

      // 4. Send notification to student
      await tx.notification.create({
        data: {
          userId: request.studentId,
          requestId,
          title: 'Đơn nhận hộ đã bị từ chối / hủy ❌',
          message: `Người nhận hộ ${receiverName} đã từ chối nhận đơn ${request.foodPlatform} của bạn. Phí 5.000đ đã được hoàn lại vào Ví chính!`,
          type: NotificationType.WARNING,
        },
      });

      // 5. Send notification to receiver
      await tx.notification.create({
        data: {
          userId: receiverId,
          requestId,
          title: 'Đã hủy / từ chối đơn thành công 🚫',
          message: `Bạn đã từ chối / hủy đơn hàng ${request.foodPlatform} (#${request.orderCode || request.id.slice(0, 8)}). Phí 5.000đ đã được hoàn lại cho sinh viên.`,
          type: NotificationType.SYSTEM,
        },
      });

      return updated;
    });
  }
}
