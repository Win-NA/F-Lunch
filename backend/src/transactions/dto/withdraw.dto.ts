import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @Min(10000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;
}
