import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: any, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(req.user.id, dto);
  }
}
