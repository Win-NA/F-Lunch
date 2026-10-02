import * as crypto from 'crypto';
import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Headers, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { AdminAdjustDto } from './dto/admin-adjust.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TransactionStatus, TransactionType } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  async createDeposit(@Request() req: any, @Body() dto: DepositDto) {
    return this.transactionsService.createDeposit(req.user.id, dto);
  }

  @Post('auto-check-deposit')
  async autoCheckDeposit(@Request() req: any) {
    return this.transactionsService.autoCheckDeposit(req.user.id);
  }

  @Post('verify-deposit')
  async verifyDeposit(@Request() req: any) {
    return this.transactionsService.verifyPendingDeposit(req.user.id);
  }

  @Post('deposit-confirm')
  async confirmDeposit(@Request() req: any, @Body() dto: DepositDto) {
    return this.transactionsService.confirmDeposit(req.user.id, dto);
  }

  @Post('withdraw')
  async createWithdraw() {
    throw new BadRequestException('Hệ thống không hỗ trợ rút tiền. Số dư ví dùng để thanh toán phí 5.000đ/đơn.');
  }

  @Public()
  @Post('bank-webhook')
  async bankWebhook(@Headers() headers: any, @Body() body: any) {
    // Kiểm tra Chữ ký bảo mật HMAC-SHA256 từ SePay Webhook
    const sepaySignature = headers['x-sepay-signature'] || headers['X-Sepay-Signature'] || '';
    const sepayTimestamp = headers['x-sepay-timestamp'] || headers['X-Sepay-Timestamp'] || '';
    const secret = process.env.SEPAY_WEBHOOK_SECRET || 'whsec_eiZmc5uYYPsgkBWDnB5Z1LHkPrKzYgjG';

    if (sepaySignature && sepayTimestamp) {
      const payload = JSON.stringify(body);
      const expected = 'sha256=' + crypto.createHmac('sha256', secret)
        .update(sepayTimestamp + '.' + payload).digest('hex');

      if (sepaySignature !== expected) {
        console.warn('⚠️ SePay Webhook signature mismatch:', { received: sepaySignature, expected });
        // Throw exception only if strict mode is enabled, otherwise log warning
        if (process.env.STRICT_WEBHOOK_AUTH === 'true') {
          throw new UnauthorizedException('Invalid SePay signature');
        }
      }
    }

    // 1. Phục vụ Webhook chuẩn Casso.vn / VietQR API / SePay (dạng mảng data)
    if (body && Array.isArray(body.data) && body.data.length > 0) {
      const results = [];
      for (const item of body.data) {
        const memo = item.description || item.memo || item.content || item.transactionContent || item.transferContent || item.transaction_content || item.body || item.code || '';
        const amount = Number(item.amount || item.amountIn || item.transferAmount || item.creditAmount || item.transfer_amount || 0);
        const res = await this.transactionsService.handleBankWebhook(memo, amount);
        results.push(res);
      }
      return { status: 'SUCCESS', results };
    }

    // 2. Phục vụ Webhook trực tiếp (SePay, Custom Webhook, MoMo API, etc.)
    const memo = body.description || body.memo || body.content || body.note || body.transactionContent || body.transferContent || body.transaction_content || body.code || body.body || '';
    const amount = Number(body.amount || body.amountIn || body.transferAmount || body.creditAmount || body.transfer_amount || 0);
    return this.transactionsService.handleBankWebhook(memo, amount);
  }

  @Post('admin/simulate-bank-webhook')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async simulateBankWebhook(@Body() body: { memo: string; amount: number }) {
    if (!body.memo || !body.amount) {
      throw new BadRequestException('Vui lòng nhập đầy đủ nội dung chuyển khoản và số tiền');
    }
    return this.transactionsService.handleBankWebhook(body.memo, Number(body.amount));
  }

  @Get('my-transactions')
  async getMyTransactions(@Request() req: any) {
    return this.transactionsService.getMyTransactions(req.user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminTransactions(
    @Query('status') status?: TransactionStatus,
    @Query('type') type?: TransactionType,
  ) {
    return this.transactionsService.getAdminTransactions(status, type);
  }

  @Post('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveTransaction(@Param('id') id: string) {
    throw new BadRequestException('Hệ thống nạp tiền đã tự động hóa 100% qua Ngân hàng / Webhook. Admin không cần và không thể duyệt thủ công.');
  }

  @Post('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectTransaction(@Param('id') id: string, @Body('reason') reason?: string) {
    throw new BadRequestException('Hệ thống nạp tiền đã tự động hóa 100% qua Ngân hàng / Webhook. Admin không cần và không thể từ chối thủ công.');
  }

  @Post('admin/adjust')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminAdjust(@Request() req: any, @Body() dto: AdminAdjustDto) {
    return this.transactionsService.adminAdjust(req.user.id, dto);
  }
}
