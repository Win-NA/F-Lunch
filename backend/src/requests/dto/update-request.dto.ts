import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { FoodPlatform } from '@prisma/client';

export class UpdateRequestDto {
  @IsEnum(FoodPlatform)
  @IsOptional()
  foodPlatform?: FoodPlatform;

  @IsString()
  @IsOptional()
  orderCode?: string;

  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsDateString()
  @IsOptional()
  pickupTime?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
