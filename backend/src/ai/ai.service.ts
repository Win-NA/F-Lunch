import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OrderAnalysisResult {
  isFoodOrder: boolean;
  foodPlatform: 'GRABFOOD' | 'SHOPEEFOOD' | 'BEFOOD' | 'OTHER';
  orderCode: string | null;
  paymentStatus: 'PAID' | 'UNPAID' | 'UNKNOWN';
  detectedPaymentMethod: string | null;
  detectedCategory: string;
  reasonText: string;
  aiPowered: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async analyzeOrderImage(imageBase64: string): Promise<OrderAnalysisResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey && apiKey.trim() !== '') {
      try {
        const result = await this.callGeminiVisionApi(imageBase64, apiKey.trim());
        if (result) {
          return { ...result, aiPowered: true };
        }
      } catch (err: any) {
        this.logger.error('Gemini API call failed, falling back to local heuristic', err?.message || err);
      }
    }

    // Fallback: If no Gemini API key or error, return null so frontend/service can use local smart scanner
    return {
      isFoodOrder: true,
      foodPlatform: 'OTHER',
      orderCode: null,
      paymentStatus: 'UNKNOWN',
      detectedPaymentMethod: null,
      detectedCategory: 'Không xác định (Chưa cấu hình AI Key)',
      reasonText: 'Chưa cấu hình GEMINI_API_KEY, hệ thống đang dùng scanner mặc định.',
      aiPowered: false,
    };
  }

  private async callGeminiVisionApi(imageBase64: string, apiKey: string): Promise<OrderAnalysisResult | null> {
    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là hệ thống AI kiểm duyệt và phân loại ảnh chụp màn hình đơn hàng cho ứng dụng F-Lunch tại trường đại học.
Nhiệm vụ: Phân tích chi tiết ảnh đơn hàng được cung cấp và trả về JSON thuần túy (KHÔNG dùng markdown codeblock, không thêm ký tự lạ bên ngoài JSON).

Định dạng JSON yêu cầu:
{
  "isFoodOrder": true | false,
  "foodPlatform": "GRABFOOD" | "SHOPEEFOOD" | "BEFOOD" | "OTHER",
  "orderCode": "Mã đơn hàng đọc được hoặc null",
  "paymentStatus": "PAID" | "UNPAID" | "UNKNOWN",
  "detectedPaymentMethod": "Phương thức thanh toán (ShopeePay, GrabPay, MoMo, Thẻ ngân hàng, Tiền mặt) hoặc null",
  "detectedCategory": "Tên loại mặt hàng (VD: Đồ ăn/Thức uống, Quần áo, Bưu kiện giao hàng, Thiết bị điện tử)",
  "reasonText": "Giải thích ngắn gọn 1 câu bằng tiếng Việt về lý do chấp nhận hoặc từ chối đơn hàng"
}

Quy tắc bắt buộc:
1. "isFoodOrder": Ghi TRUE nếu đơn là Đồ ăn, Nước uống, Trà sữa, Cơm, Bún, Phở, Đồ ăn vặt từ GrabFood, ShopeeFood, BeFood, Baemin, quán ăn. Ghi FALSE nếu là mặt hàng khác (Quần áo, Giày dép, Mỹ phẩm, Linh kiện điện tử, Bưu kiện giao nhận hàng GrabExpress/Lalamove/Shopee Express).
2. "paymentStatus": Ghi PAID nếu đơn đã thanh toán trực tuyến (ShopeePay, GrabPay, MoMo, ZaloPay, Thẻ Visa/ATM, Tiền mặt: 0đ). Ghi UNPAID nếu là Tiền mặt (COD), Thanh toán khi nhận hàng, Thu hộ tiền mặt > 0đ. Ghi UNKNOWN nếu không xác định được.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Gemini API Error HTTP ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) return null;

    // Parse JSON output
    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      isFoodOrder: Boolean(parsed.isFoodOrder),
      foodPlatform: ['GRABFOOD', 'SHOPEEFOOD', 'BEFOOD'].includes(parsed.foodPlatform)
        ? parsed.foodPlatform
        : 'OTHER',
      orderCode: parsed.orderCode || null,
      paymentStatus: ['PAID', 'UNPAID'].includes(parsed.paymentStatus) ? parsed.paymentStatus : 'UNKNOWN',
      detectedPaymentMethod: parsed.detectedPaymentMethod || null,
      detectedCategory: parsed.detectedCategory || 'Đơn hàng đồ ăn',
      reasonText: parsed.reasonText || 'Ảnh đơn hàng đã được kiểm duyệt bởi AI.',
      aiPowered: true,
    };
  }
}
