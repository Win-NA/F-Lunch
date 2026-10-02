import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
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
  async bankWebhook(@Body() body: any) {
    // 1. Phục vụ Webhook chuẩn Casso.vn / VietQR API / SePay
    if (body && Array.isArray(body.data) && body.data.length > 0) {
      const results = [];
      for (const item of body.data) {
        const memo = item.description || item.memo || item.content || item.transactionContent || item.transferContent || item.body || item.code || '';
        const amount = Number(item.amount || item.amountIn || item.transferAmount || item.creditAmount || 0);
        const res = await this.transactionsService.handleBankWebhook(memo, amount);
        results.push(res);
      }
      return { status: 'SUCCESS', results };
    }

    // 2. Phục vụ Webhook trực tiếp (SePay, Custom Webhook, MoMo API, etc.)
    const memo = body.description || body.memo || body.content || body.note || body.transactionContent || body.transferContent || body.code || body.body || '';
    const amount = Number(body.amount || body.amountIn || body.transferAmount || body.creditAmount || 0);
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
    return this.transactionsService.approveTransaction(id);
  }

  @Post('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectTransaction(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.transactionsService.rejectTransaction(id, reason);
  }

  @Post('admin/adjust')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminAdjust(@Request() req: any, @Body() dto: AdminAdjustDto) {
    return this.transactionsService.adminAdjust(req.user.id, dto);
  }
}
