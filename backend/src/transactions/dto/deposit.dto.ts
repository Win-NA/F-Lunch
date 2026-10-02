import { IsNumber, IsEnum, IsOptional, Min, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class DepositDto {
  @IsNumber()
  @Min(10000)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  note?: string;
}
