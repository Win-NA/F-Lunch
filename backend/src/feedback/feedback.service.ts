import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(studentId: string, dto: CreateFeedbackDto) {
    const request = await this.prisma.receivingRequest.findUnique({
      where: { id: dto.requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.studentId !== studentId) {
      throw new BadRequestException('You do not own this request');
    }

    if (request.status !== RequestStatus.COMPLETED) {
      throw new BadRequestException('Can only leave feedback for completed requests');
    }

    const existing = await this.prisma.feedback.findUnique({
      where: { requestId: dto.requestId },
    });

    if (existing) {
      throw new BadRequestException('Feedback already submitted for this request');
    }

    return this.prisma.feedback.create({
      data: {
        requestId: dto.requestId,
        studentId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }
}
