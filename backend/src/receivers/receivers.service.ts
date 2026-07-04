import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, NotificationType } from '@prisma/client';

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
          in: [RequestStatus.ACCEPTED, RequestStatus.RECEIVED, RequestStatus.READY_FOR_PICKUP],
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
      throw new BadRequestException('Suspended or invalid receiver profile');
    }

    // Check if receiver has active assignment
    const active = await this.findActiveAssignment(receiverId);
    if (active) {
      throw new BadRequestException('You already have an active assignment');
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
        title: 'Request Accepted',
        message: `Your food receiving request has been accepted by receiver ${receiver.fullName}.`,
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
      title = 'Food Received';
      message = `Your food has been received from the driver by receiver ${request.receiver?.fullName || 'Receiver'}.`;
    } else if (status === RequestStatus.READY_FOR_PICKUP) {
      title = 'Ready for Pickup';
      message = `Your food is ready for pickup at ${request.pickupLocation}. Show your QR code to complete.`;
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
    const cleanCode = verificationCode.trim();
    let request;

    if (cleanCode.length === 36) {
      // Full UUID from QR scan
      request = await this.prisma.receivingRequest.findUnique({
        where: { id: cleanCode },
        include: { receiver: true },
      });
    } else if (cleanCode.length === 6) {
      // 6-character short code/OTP entered manually
      request = await this.prisma.receivingRequest.findFirst({
        where: {
          id: {
            startsWith: cleanCode.toLowerCase(),
          },
        },
        include: { receiver: true },
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
        title: 'Request Completed',
        message: `Your request has been successfully completed. Thank you for choosing F-Lunch! Please leave feedback.`,
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
}
