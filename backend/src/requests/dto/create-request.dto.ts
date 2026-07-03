import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { FoodPlatform } from '@prisma/client';

export class CreateRequestDto {
  @IsEnum(FoodPlatform)
  @IsNotEmpty()
  foodPlatform: FoodPlatform;

  @IsString()
  @IsOptional()
  orderCode?: string;

  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsDateString()
  @IsNotEmpty()
  pickupTime: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
