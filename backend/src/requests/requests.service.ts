import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { NotificationType, RequestStatus } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, dto: CreateRequestDto) {
    const pickupDate = new Date(dto.pickupTime);
    if (pickupDate <= new Date()) {
      throw new BadRequestException('Pickup time must be in the future');
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

    // Create request
    const request = await this.prisma.receivingRequest.create({
      data: {
        studentId,
        foodPlatform: dto.foodPlatform,
        orderCode: dto.orderCode,
        pickupLocation: dto.pickupLocation || 'FPT Main Gate',
        pickupTime: pickupDate,
        status: RequestStatus.PENDING,
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

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: studentId,
        requestId: request.id,
        title: 'Request Created',
        message: `Your receiving request for ${request.foodPlatform} (Order Code: ${request.orderCode}) has been submitted.`,
        type: NotificationType.REQUEST,
      },
    });

    return request;
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

    const updated = await this.prisma.receivingRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: studentId,
        requestId,
        title: 'Request Cancelled',
        message: `Your request for ${request.foodPlatform} has been cancelled.`,
        type: NotificationType.WARNING,
      },
    });

    return updated;
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
