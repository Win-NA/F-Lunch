import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ProcessReportDto } from './dto/process-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(req.user.id, dto);
  }

  @Get('my-reports')
  findMyReports(@Request() req: any) {
    return this.reportsService.findMyReports(req.user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin(@Query('status') status?: string) {
    return this.reportsService.findAllForAdmin(status);
  }

  @Patch('admin/:id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  processReport(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessReportDto,
  ) {
    return this.reportsService.processReport(id, req.user.id, dto);
  }
}
