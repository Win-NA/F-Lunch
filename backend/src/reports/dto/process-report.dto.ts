import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ProcessReportDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @IsString()
  @IsOptional()
  adminNote?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  approvedAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bonusAmount?: number;
}
