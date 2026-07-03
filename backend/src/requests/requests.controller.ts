import { Controller, Post, Get, Param, Body, UseGuards, Request, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: any, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  findAllForStudent(@Request() req: any) {
    return this.requestsService.findAllForStudent(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, req.user.id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.cancel(id, req.user.id);
  }
}
