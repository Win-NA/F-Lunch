import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class AdminAdjustDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['REAL', 'BONUS'])
  balanceType: 'REAL' | 'BONUS';

  @IsOptional()
  @IsString()
  note?: string;
}
