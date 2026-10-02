import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  proofImage?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  expectedAmount?: number;

  @IsString()
  @IsOptional()
  transactionCode?: string;
}
