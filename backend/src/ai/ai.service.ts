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
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

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

    const prompt = `Bạn là hệ thống AI kiểm duyệt và phân loại ảnh chụp màn hình đơn hàng cho ứng dụng giao nhận thức ăn F-Lunch tại trường học.
Nhiệm vụ: Phân tích kỹ ảnh chụp đơn hàng được cung cấp và trả về 1 đối tượng JSON thuần túy (KHÔNG dùng markdown codeblock, không thêm ký tự lạ ngoài JSON).

Định dạng JSON yêu cầu:
{
  "isFoodOrder": true | false,
  "foodPlatform": "GRABFOOD" | "SHOPEEFOOD" | "BEFOOD" | "OTHER",
  "orderCode": "Mã đơn hàng đọc được hoặc null",
  "paymentStatus": "PAID" | "UNPAID" | "UNKNOWN",
  "detectedPaymentMethod": "Phương thức thanh toán (ShopeePay, GrabPay, MoMo, Thẻ ngân hàng, Tiền mặt) hoặc null",
  "detectedCategory": "Tên ngắn gọn sản phẩm/ứng dụng (VD: Phụ kiện điện thoại TikTok Shop, Áo thun Shopee, Đồ ăn GrabFood...)",
  "reasonText": "Lời giải thích ngắn 1 câu tiếng Việt lý do chấp nhận hoặc từ chối"
}

Quy tắc BẮT BUỘC:
1. "isFoodOrder":
   - Đặt FALSE NẾU đơn hàng là mua sắm từ trang thương mại điện tử / mua sắm tổng hợp: TikTok Shop, TikTok, Shopee E-commerce/Mall, Lazada, Tiki, Amazon.
   - Đặt FALSE NẾU sản phẩm là Phụ kiện điện thoại (kính bảo vệ camera, ốp lưng, kính cường lực, cáp sạc, tai nghe...), Quần áo, Giày dép, Mỹ phẩm, Thiết bị điện tử, Bưu kiện GrabExpress/Lalamove.
   - CHỈ ĐẶT TRUE NẾU đây là đơn giao Đồ ăn, Nước uống, Trà sữa, Cơm, Bún, Phở, Đồ ăn vặt từ ứng dụng giao đồ ăn (GrabFood, ShopeeFood, BeFood, Baemin, GoFood hoặc menu nhà hàng).
2. "paymentStatus":
   - Đặt PAID nếu đơn đã thanh toán trực tuyến (ShopeePay, GrabPay, MoMo, ZaloPay, Thẻ Visa/ATM, Tiền mặt: 0đ).
   - Đặt UNPAID nếu là Tiền mặt (COD), Thanh toán khi nhận hàng, Thu hộ tiền mặt > 0đ.
   - Đặt UNKNOWN nếu không rõ.`;

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

    // Parse JSON output safely
    let parsed: any;
    try {
      const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      this.logger.error('Failed to parse JSON response from Gemini API', candidateText);
      return null;
    }

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
