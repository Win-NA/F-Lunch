import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class AnalyzeImageDto {
  imageBase64: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-order-image')
  async analyzeOrderImage(@Body() body: AnalyzeImageDto) {
    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      throw new BadRequestException('Vui lòng cung cấp dữ liệu hình ảnh (imageBase64)');
    }
    return this.aiService.analyzeOrderImage(body.imageBase64);
  }
}
