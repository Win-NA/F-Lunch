import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { NotificationType, RequestStatus, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, dto: CreateRequestDto) {
    const pickupDate = new Date(dto.pickupTime);
    if (pickupDate <= new Date()) {
      throw new BadRequestException('Pickup time must be in the future');
    }

    // Check student wallet balance
    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new NotFoundException('User not found');

    const SERVICE_FEE = 5000;
    const totalBalance = user.realBalance + user.bonusBalance;

    if (totalBalance < SERVICE_FEE) {
      throw new BadRequestException(
        `Số dư ví của bạn không đủ (${totalBalance.toLocaleString()}đ). Phí nhận hộ là 5.000đ. Vui lòng nạp thêm tiền vào ví!`
      );
    }

    // Check duplicate active requests
    if (dto.orderCode) {
      const existing = await this.prisma.receivingRequest.findFirst({
        where: {
          studentId,
          orderCode: dto.orderCode,
          status: {
            in: ['PENDING', 'ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'],
          },
        },
      });
      if (existing) {
        throw new BadRequestException('You already have an active request for this order code');
      }
    }

    // Execute creation and fee deduction in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Calculate deduction: priority to bonusBalance
      let bonusDeduct = 0;
      let realDeduct = 0;

      if (user.bonusBalance >= SERVICE_FEE) {
        bonusDeduct = SERVICE_FEE;
      } else if (user.bonusBalance > 0) {
        bonusDeduct = user.bonusBalance;
        realDeduct = SERVICE_FEE - bonusDeduct;
      } else {
        realDeduct = SERVICE_FEE;
      }

      await tx.user.update({
        where: { id: studentId },
        data: {
          bonusBalance: { decrement: bonusDeduct },
          realBalance: { decrement: realDeduct },
        },
      });

      // Create request
      const request = await tx.receivingRequest.create({
        data: {
          studentId,
          foodPlatform: dto.foodPlatform,
          orderCode: dto.orderCode,
          pickupLocation: dto.pickupLocation || 'FPT Main Gate',
          dropoffLocation: dto.dropoffLocation || 'Sảnh Trống Đồng',
          pickupTime: pickupDate,
          status: RequestStatus.PENDING,
          serviceFee: SERVICE_FEE,
          note: dto.note,
          imageUrl: dto.imageUrl,
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Create Transaction record
      const transactionCode = `FL-ORD-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.transaction.create({
        data: {
          userId: studentId,
          requestId: request.id,
          amount: SERVICE_FEE,
          type: TransactionType.ORDER_PAYMENT,
          status: TransactionStatus.APPROVED,
          paymentMethod: 'SYSTEM',
          transactionCode,
          note: `Thanh toán phí dịch vụ nhận hộ cho đơn hàng ${request.orderCode || request.foodPlatform}`,
        },
      });

      // Create notification for Student
      await tx.notification.create({
        data: {
          userId: studentId,
          requestId: request.id,
          title: 'Đơn hàng mới đã được tạo 🍱',
          message: `Đơn nhận hộ ${request.foodPlatform} (Mã: ${request.orderCode || 'N/A'}) đã tạo thành công. Phí dịch vụ 5.000đ.`,
          type: NotificationType.REQUEST,
        },
      });

      // Notify active receivers about the new available request
      const activeReceivers = await tx.user.findMany({
        where: { role: 'RECEIVER', status: 'ACTIVE' },
      });
      for (const receiver of activeReceivers) {
        await tx.notification.create({
          data: {
            userId: receiver.id,
            requestId: request.id,
            title: '🍱 Đơn nhận hộ mới vừa đăng!',
            message: `Có đơn nhận hộ ${request.foodPlatform} mới tại ${request.pickupLocation}. Hãy vào Bàn làm việc để nhận đơn ngay!`,
            type: NotificationType.REQUEST,
          },
        });
      }

      return request;
    });
  }

  async findAllForStudent(studentId: string) {
    return this.prisma.receivingRequest.findMany({
      where: { studentId },
      include: {
        receiver: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(requestId: string, userId: string, role: string) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        feedback: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Enforce ownership for students
    if (role === 'STUDENT' && request.studentId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return request;
  }

  async cancel(requestId: string, studentId: string) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.studentId !== studentId) {
      throw new BadRequestException('You do not own this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Cannot cancel request once it has been accepted by a receiver');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.receivingRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.CANCELLED },
      });

      // Refund 5,000đ back to student realBalance
      await tx.user.update({
        where: { id: studentId },
        data: {
          realBalance: { increment: request.serviceFee || 5000 },
        },
      });

      const transactionCode = `FL-REF-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.transaction.create({
        data: {
          userId: studentId,
          requestId,
          amount: request.serviceFee || 5000,
          type: TransactionType.ORDER_REFUND,
          status: TransactionStatus.APPROVED,
          paymentMethod: 'SYSTEM',
          transactionCode,
          note: `Hoàn phí dịch vụ 5.000đ do hủy đơn hàng ${request.orderCode || request.foodPlatform}`,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: studentId,
          requestId,
          title: 'Đã hủy đơn hàng & Hoàn tiền',
          message: `Đơn nhận hộ ${request.foodPlatform} đã được hủy. 5.000đ phí dịch vụ đã được hoàn lại vào ví của bạn.`,
          type: NotificationType.WARNING,
        },
      });

      return updated;
    });
  }

  async update(requestId: string, studentId: string, dto: UpdateRequestDto) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.studentId !== studentId) {
      throw new BadRequestException('You do not own this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Cannot edit request after it has been accepted');
    }

    // Prepare update data
    const updateData: any = {};
    if (dto.foodPlatform) updateData.foodPlatform = dto.foodPlatform;
    if (dto.orderCode !== undefined) updateData.orderCode = dto.orderCode;
    if (dto.pickupLocation) updateData.pickupLocation = dto.pickupLocation;
    if (dto.dropoffLocation) updateData.dropoffLocation = dto.dropoffLocation;
    if (dto.pickupTime) {
      const pickupDate = new Date(dto.pickupTime);
      if (pickupDate <= new Date()) {
        throw new BadRequestException('Pickup time must be in the future');
      }
      updateData.pickupTime = pickupDate;
    }
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;

    return this.prisma.receivingRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}
