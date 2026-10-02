import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ReceiversService } from './receivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, RequestStatus } from '@prisma/client';

@Controller('receivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECEIVER)
export class ReceiversController {
  constructor(private receiversService: ReceiversService) {}

  @Get('pending')
  findPending() {
    return this.receiversService.findPending();
  }

  @Get('active')
  findActiveAssignment(@Request() req: any) {
    return this.receiversService.findActiveAssignment(req.user.id);
  }

  @Get('history')
  findHistory(@Request() req: any) {
    return this.receiversService.findHistory(req.user.id);
  }

  @Post('accept/:id')
  @HttpCode(HttpStatus.OK)
  accept(@Param('id') id: string, @Request() req: any) {
    return this.receiversService.accept(id, req.user.id);
  }

  @Patch('status/:id')
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: RequestStatus,
  ) {
    return this.receiversService.updateStatus(id, req.user.id, status);
  }

  @Post('complete/:id')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @Request() req: any) {
    return this.receiversService.complete(id, req.user.id);
  }

  @Post('cancel/:id')
  @HttpCode(HttpStatus.OK)
  cancelAssignment(@Param('id') id: string, @Request() req: any) {
    return this.receiversService.cancelAssignment(id, req.user.id);
  }
}
