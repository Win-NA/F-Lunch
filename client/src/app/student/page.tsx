'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/lib/translations';
import {
  Plus,
  MapPin,
  Pizza,
  Calendar,
  ChevronRight,
  Clock,
  X,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Info,
  Search,
  Copy,
  MessageSquare,
  Sparkles,
  Camera,
  Upload
} from 'lucide-react';

import { isProfileComplete } from '@/lib/profileGuard';
import IncompleteProfileModal from '@/components/profile/IncompleteProfileModal';

interface RequestItem {
  id: string;
  foodPlatform: string;
  orderCode?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: string;
  createdAt: string;
  receiver?: {
    fullName: string;
    phoneNumber: string;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, lang } = useTranslation();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isIncompleteProfileModalOpen, setIsIncompleteProfileModalOpen] = useState(false);

  const totalBal = user ? (user.realBalance || 0) + (user.bonusBalance || 0) : 0;

  // Form State
  const [foodPlatform, setFoodPlatform] = useState('GRABFOOD');
  const [pickupLocation, setPickupLocation] = useState('Cổng 1 FPT');
  const [pickupHour, setPickupHour] = useState(() => {
    const nextHour = (new Date().getHours() + 1) % 24;
    return nextHour.toString().padStart(2, '0');
  });
  const [pickupMinute, setPickupMinute] = useState('00');
  const [note, setNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedOrderCode, setExtractedOrderCode] = useState<string | null>(null);

  // AI Verification State
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'UNKNOWN'>('UNKNOWN');
  const [detectedPaymentMethod, setDetectedPaymentMethod] = useState<string | null>(null);
  const [isFoodOrder, setIsFoodOrder] = useState<boolean>(true);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState<boolean>(false);

  const extractOrderCode = (text: string): string | null => {
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(/(?:mã đơn hàng|mã đơn|order code|mã số|mã|order)\s*[:\-]?\s*([a-zA-Z0-9\-]+)/i);
      if (match && match[1]) {
        const cleanCode = match[1].replace(/sao\s*chép/gi, '').trim();
        if (cleanCode.length >= 4) {
          return cleanCode;
        }
      }
    }

    // Mẫu ShopeeFood: 03076-407387424
    const shopeePattern = /\b\d{4,10}-\d{4,10}\b/;
    const shopeeMatch = text.match(shopeePattern);
    if (shopeeMatch) {
      return shopeeMatch[0];
    }

    // Các dãy số định danh khác 8-15 ký tự
    const genericPattern = /\b\d{8,15}\b/;
    const genericMatch = text.match(genericPattern);
    if (genericMatch) {
      return genericMatch[0];
    }

    return null;
  };

  const checkNonFoodKeywords = (text: string): { isNonFood: boolean; matchedKeyword: string | null } => {
    const lower = text.toLowerCase();
    const nonFoodKeywords = [
      // E-Commerce Platforms & UI terms (TikTok Shop, Shopee, Lazada...)
      'tiktok', 'tiktok shop', 'lazada', 'tiki', 'shopee mall', 'liên hệ với tiktok', 'liên hệ với người bán',
      'yêu cầu hoàn tiền', 'thêm vào giỏ', 'mua lại', 'viết đánh giá', 'trả hàng miễn phí', 'phụ kiện chất',
      // Parcel Delivery Platforms
      'grabexpress', 'lalamove', 'shopee express', 'spx express', 'ghtk', 'ghn', 'viettelpost', 'ninjavan', 'giao hàng nhanh', 'bưu kiện', 'hàng hóa', 'bưu phẩm',
      // Non-food product terms
      'phụ kiện', 'kính bảo vệ', 'kính cường lực', 'ốp lưng', 'cáp sạc', 'củ sạc', 'tai nghe', 'sạc dự phòng', 'camera', 'gopro',
      'áo thun', 'áo sơ mi', 'áo khoác', 'quần jean', 'quần đùi', 'quần áo', 'giày thể thao', 'giày dép', 'túi xách', 'ví nữ', 'ví nam',
      'mỹ phẩm', 'son môi', 'kem dưỡng', 'nước hoa', 'điện thoại', 'văn phòng phẩm', 'sách', 'tủ đồ', 'đồ chơi', 'trang sức'
    ];

    const matched = nonFoodKeywords.find((kw) => lower.includes(kw));
    return {
      isNonFood: Boolean(matched),
      matchedKeyword: matched || null,
    };
  };

  const analyzePaymentStatus = (text: string): { status: 'PAID' | 'UNPAID' | 'UNKNOWN'; method: string | null } => {
    const lowerText = text.toLowerCase();

    // Check for prepaid / online payment keywords
    if (lowerText.includes('shopeepay')) {
      return { status: 'PAID', method: 'Ví ShopeePay' };
    }
    if (lowerText.includes('grabpay')) {
      return { status: 'PAID', method: 'Ví GrabPay' };
    }
    if (lowerText.includes('bepay')) {
      return { status: 'PAID', method: 'Ví bePay' };
    }
    if (lowerText.includes('momo')) {
      return { status: 'PAID', method: 'Ví MoMo' };
    }
    if (lowerText.includes('zalopay')) {
      return { status: 'PAID', method: 'Ví ZaloPay' };
    }
    if (lowerText.includes('thẻ tín dụng') || lowerText.includes('thẻ ghi nợ') || lowerText.includes('visa') || lowerText.includes('mastercard') || lowerText.includes('thẻ atm')) {
      return { status: 'PAID', method: 'Thẻ Ngân Hàng' };
    }
    if (lowerText.includes('đã thanh toán') || lowerText.includes('chuyển khoản')) {
      return { status: 'PAID', method: 'Đã thanh toán trực tuyến' };
    }
    if (lowerText.includes('tiền mặt: 0') || lowerText.includes('tiền mặt 0') || lowerText.includes('0đ tiền mặt') || lowerText.includes('0 đ tiền mặt')) {
      return { status: 'PAID', method: 'Đã trả trước (Tiền mặt 0đ)' };
    }

    // Check for unpaid / cash COD keywords
    if (
      lowerText.includes('tiền mặt') ||
      lowerText.includes('chưa thanh toán') ||
      lowerText.includes('thanh toán khi nhận') ||
      lowerText.includes('thu hộ') ||
      lowerText.includes('cod')
    ) {
      return { status: 'UNPAID', method: 'Tiền mặt (Chưa thanh toán)' };
    }

    return { status: 'UNKNOWN', method: null };
  };

  const detectFoodPlatform = (rawText: string, extractedCode?: string | null): 'GRABFOOD' | 'SHOPEEFOOD' | 'BEFOOD' | null => {
    const text = rawText.toLowerCase();

    if (
      text.includes('befood') ||
      text.includes('be food') ||
      text.includes('bepay') ||
      text.includes('be group') ||
      text.includes('ứng dụng be') ||
      text.includes('tài xế be') ||
      /\b(be)\b/i.test(text)
    ) {
      return 'BEFOOD';
    }

    if (
      text.includes('shopeefood') ||
      text.includes('shopee food') ||
      text.includes('shopeepay') ||
      text.includes('shopee') ||
      text.includes('quán yêu thích') ||
      /\bspf[-_\d]/i.test(text)
    ) {
      return 'SHOPEEFOOD';
    }

    if (
      text.includes('grabfood') ||
      text.includes('grab food') ||
      text.includes('grabpay') ||
      text.includes('grab') ||
      text.includes('tài xế grab') ||
      /\bgf[-_\d]/i.test(text)
    ) {
      return 'GRABFOOD';
    }

    // 2. Cấu trúc mã đơn hàng đặc trưng khi ảnh bị crop mất logo
    if (extractedCode) {
      const trimmed = extractedCode.trim();
      if (/^gf[-_]/i.test(trimmed)) return 'GRABFOOD';
      if (/^spf[-_]/i.test(trimmed) || trimmed.includes('-')) return 'SHOPEEFOOD';
      if (/^\d{8}$/.test(trimmed)) return 'BEFOOD';
    }

    return null;
  };

  const performOCR = async (base64: string) => {
    setOcrLoading(true);
    setIsFoodOrder(true);
    setDetectedCategory(null);
    setAiReason(null);
    setAiPowered(false);

    try {
      // Step 1: Attempt Gemini AI Vision via backend
      try {
        const aiRes = await api.post('/ai/analyze-order-image', { imageBase64: base64 });
        const aiData = aiRes.data;

        if (aiData && aiData.aiPowered) {
          setAiPowered(true);
          setIsFoodOrder(aiData.isFoodOrder);
          setDetectedCategory(aiData.detectedCategory || null);
          setAiReason(aiData.reasonText || null);
          setPaymentStatus(aiData.paymentStatus || 'UNKNOWN');
          setDetectedPaymentMethod(aiData.detectedPaymentMethod || null);
          if (aiData.orderCode) setExtractedOrderCode(aiData.orderCode);
          if (aiData.foodPlatform && ['GRABFOOD', 'SHOPEEFOOD', 'BEFOOD'].includes(aiData.foodPlatform)) {
            setFoodPlatform(aiData.foodPlatform);
          }

          if (!aiData.isFoodOrder) {
            toast.error(`CẢNH BÁO AI: ${aiData.reasonText || 'Đơn hàng không phải đồ ăn!'}`);
          } else if (aiData.paymentStatus === 'UNPAID') {
            toast.error(`CẢNH BÁO AI: Đơn hàng Tiền mặt (COD). F-Lunch chỉ nhận đơn trả trước!`);
          } else {
            toast.success(`AI Vision xác thực: Đơn đồ ăn hợp lệ & đã trả trước!`);
          }
          return;
        }
      } catch (aiErr) {
        console.log('AI Service fallback to local OCR');
      }

      // Step 2: Fallback local Tesseract OCR
      const ret = await Tesseract.recognize(base64, 'eng+vie');
      const text = ret.data.text;

      const code = extractOrderCode(text);
      const paymentInfo = analyzePaymentStatus(text);
      const { isNonFood, matchedKeyword } = checkNonFoodKeywords(text);
      const detectedPlatform = detectFoodPlatform(text, code);

      if (detectedPlatform) {
        setFoodPlatform(detectedPlatform);
      }

      setPaymentStatus(paymentInfo.status);
      setDetectedPaymentMethod(paymentInfo.method);

      if (isNonFood) {
        setIsFoodOrder(false);
        setDetectedCategory(`Mặt hàng E-Commerce / Phụ kiện (${matchedKeyword || 'Non-Food'})`);
        setAiReason(`Ảnh đơn hàng chứa từ khóa sản phẩm/trang mua sắm '${matchedKeyword}', không thuộc nhóm Đồ ăn & Thức uống.`);
        toast.error(`CẢNH BÁO: Đơn hàng thuộc nhóm mua sắm/phụ kiện (${matchedKeyword}), không phải đồ ăn!`);
      } else {
        setIsFoodOrder(true);
      }

      if (code) {
        setExtractedOrderCode(code);
      } else {
        setExtractedOrderCode(null);
      }

      if (!isNonFood) {
        if (paymentInfo.status === 'PAID') {
          toast.success(`Đã tự động xác thực: Đơn hàng ĐÃ THANH TOÁN (${paymentInfo.method || 'Online'})!`);
        } else if (paymentInfo.status === 'UNPAID') {
          toast.error(`CẢNH BÁO: Đơn hàng ghi nhận 'Tiền mặt' (Chưa thanh toán). F-Lunch chỉ nhận đơn đã trả trước!`);
        } else {
          toast.info(code ? `Đã nhận dạng mã đơn: ${code}. Hãy đảm bảo đơn đã thanh toán trực tuyến.` : 'Đã quét xong ảnh đơn hàng.');
        }
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Nhận diện tự động gặp sự cố, ảnh đơn vẫn được chọn thành công.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ảnh chụp đơn hàng phải nhỏ hơn 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setImageBase64(base64Data);
        performOCR(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchRequests = async () => {
    if (!useAuthStore.getState().accessToken) return;
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      if (err.response && err.response.status !== 401 && err.response.status !== 403 && useAuthStore.getState().accessToken) {
        toast.error('Không thể tải danh sách yêu cầu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileComplete(user)) {
      setIsIncompleteProfileModalOpen(true);
      return;
    }
    if (!pickupHour || !pickupMinute) {
      toast.error('Vui lòng chọn thời gian giao hàng');
      return;
    }

    if (!imageBase64) {
      toast.error('Vui lòng tải lên ảnh chụp màn hình đơn hàng để xác thực');
      return;
    }

    if (paymentStatus === 'UNPAID') {
      toast.error('Không thể gửi! Đơn hàng hiển thị phương thức Tiền mặt (Chưa thanh toán). F-Lunch chỉ nhận hộ các đơn đã trả trước qua ShopeePay/GrabPay/MoMo/Thẻ.');
      return;
    }

    // Gộp ngày hôm nay với giờ được chọn
    const today = new Date();
    const hours = parseInt(pickupHour, 10);
    const minutes = parseInt(pickupMinute, 10);
    const pickupDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

    if (pickupDate <= new Date()) {
      toast.error('Giờ giao hàng phải ở tương lai');
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.post('/requests', {
        foodPlatform,
        orderCode: extractedOrderCode || undefined,
        pickupLocation,
        dropoffLocation: 'Sảnh Trống Đồng',
        pickupTime: pickupDate.toISOString(),
        note: note || undefined,
        imageUrl: imageBase64,
      });

      toast.success('Yêu cầu nhận hộ đơn hàng đã được gửi!');
      // Reset form
      setNote('');
      setImageBase64(null);
      setExtractedOrderCode(null);
      const nextHour = (new Date().getHours() + 1) % 24;
      setPickupHour(nextHour.toString().padStart(2, '0'));
      setPickupMinute('00');

      // Tải lại dữ liệu và làm mới số dư ví
      fetchRequests();
      try {
        const profileRes = await api.get('/users/profile');
        useAuthStore.getState().updateUser(profileRes.data);
      } catch (profileErr) {
        // Ignore silent error
      }

      // Điều hướng ngay tới trang chi tiết của đơn vừa tạo
      if (res.data && res.data.id) {
        router.push(`/student/request/${res.data.id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelRequestFromDashboard = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    if (!confirm(t.student_cancel_confirm)) return;
    try {
      await api.post(`/requests/${requestId}/cancel`);
      toast.success('Hủy yêu cầu nhận hộ thành công, đã hoàn tiền phí dịch vụ vào ví!');
      fetchRequests();
      try {
        const profileRes = await api.get('/users/profile');
        useAuthStore.getState().updateUser(profileRes.data);
      } catch (profileErr) { }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể hủy yêu cầu';
      toast.error(msg);
    }
  };

  const activeRequests = requests.filter(r =>
    ['PENDING', 'ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(r.status)
  );

  const hasActiveUnstoredRequest = requests.some(r =>
    ['PENDING', 'ACCEPTED', 'RECEIVED'].includes(r.status)
  );

  const pastRequests = requests.filter(r =>
    ['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 whitespace-nowrap">{t.status_pending}</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">{t.status_accepted}</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 whitespace-nowrap">{t.status_received}</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">{t.status_ready}</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">{t.status_completed}</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 whitespace-nowrap">{t.status_cancelled}</span>;
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">{t.student_page_title}</h1>
        <p className="text-slate-450 text-xs mt-1">{t.student_page_sub}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Request Form */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl h-fit">
          <h2 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="text-orange-500" size={18} />
            {t.student_form_title}
          </h2>

          {hasActiveUnstoredRequest ? (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-2xl space-y-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-amber-400 text-xs">
                <AlertCircle className="shrink-0 text-amber-400" size={18} />
                <span>{t.student_ineligible_banner_title}</span>
              </div>
              <p className="text-[11.5px] font-bold text-slate-200 leading-relaxed">
                {t.student_ineligible_banner_msg}
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span>{t.student_order_status_label}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* 1. SCREENSHOT UPLOAD - PROMINENT AT TOP */}
              <div className="space-y-2.5 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-orange-500/30 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5 min-w-0">
                    <Sparkles size={14} className="text-orange-600 animate-pulse shrink-0" />
                    <span className="whitespace-nowrap">{t.student_form_upload_title}</span>
                    <span className="text-red-500 font-black text-sm leading-none shrink-0">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wide text-orange-700 bg-orange-100 border border-orange-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>{t.student_form_upload_badge}</span>
                  </span>
                </div>

                {!imageBase64 ? (
                  <label
                    htmlFor="order-screenshot-upload"
                    className="relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-2 border-dashed border-orange-500/50 hover:border-orange-500 bg-gradient-to-b from-orange-500/[0.08] to-orange-500/[0.02] hover:bg-orange-500/[0.12] transition-all cursor-pointer group shadow-lg shadow-orange-500/5 text-center"
                  >
                    <input
                      id="order-screenshot-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/20 text-orange-600 border border-orange-500/40 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-orange-500/30 transition-all shadow-md shadow-orange-500/20">
                      <Camera size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-black text-[#4a1f05] group-hover:text-orange-600 transition-colors">
                      {lang === 'vi' ? 'Nhấn để chọn hoặc kéo thả ảnh đơn' : 'Click to select or drag & drop order image'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-full sm:max-w-[280px] leading-relaxed">
                      {t.student_form_upload_sub}
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black shadow-md shadow-orange-600/30 transition-all">
                      <Upload size={13} />
                      <span>{t.student_form_upload_btn}</span>
                    </div>
                  </label>
                ) : (
                  <div className="relative rounded-2xl border-2 border-orange-500/50 bg-slate-900 p-3 space-y-2.5 shadow-lg">
                    <div className="relative w-full h-36 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                      <img
                        src={imageBase64}
                        alt="Order preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageBase64(null);
                          setExtractedOrderCode(null);
                          setPaymentStatus('UNKNOWN');
                          setDetectedPaymentMethod(null);
                          setIsFoodOrder(true);
                          setDetectedCategory(null);
                          setAiReason(null);
                          setAiPowered(false);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                        title={lang === 'vi' ? 'Xóa ảnh' : 'Remove image'}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Change screenshot button */}
                    <label
                      htmlFor="order-screenshot-upload-replace"
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload size={14} />
                      <span>{t.student_form_change_img}</span>
                      <input
                        id="order-screenshot-upload-replace"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Scanning & AI indicators */}
                {ocrLoading && (
                  <div className="text-[10px] text-orange-400 flex items-center gap-1.5 animate-pulse bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20 justify-center font-bold">
                    <Clock size={12} className="animate-spin shrink-0 text-orange-400" />
                    <span>{t.student_scan_loading}</span>
                  </div>
                )}

                {extractedOrderCode && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-[10px] flex items-center gap-2">
                    <span>{t.student_code_detected} <strong className="text-emerald-400 font-bold">{extractedOrderCode}</strong></span>
                  </div>
                )}

                {/* AI Warning Alerts */}
                {(!isFoodOrder || paymentStatus === 'UNPAID') && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-red-400">
                      <AlertCircle size={14} className="shrink-0 text-red-400" />
                      <span>{!isFoodOrder ? t.student_alert_non_food : t.student_alert_cod}</span>
                    </div>
                    <p className="text-[9.5px] text-red-400/90 leading-normal">
                      {!isFoodOrder
                        ? (aiReason || (lang === 'vi' ? 'F-Lunch hiện chỉ hỗ trợ nhận hộ Đồ ăn & Thức uống. Hệ thống không nhận hộ bưu kiện hoặc hàng hóa khác.' : 'F-Lunch only supports food & drinks delivery. Packages/parcels are not accepted.'))
                        : t.student_alert_cod_desc}
                    </p>
                    {detectedCategory && (
                      <div className="inline-block mt-0.5 bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-[9px] font-semibold border border-red-500/20">
                        {lang === 'vi' ? 'Mặt hàng phát hiện:' : 'Detected category:'} {detectedCategory}
                      </div>
                    )}
                  </div>
                )}

                {isFoodOrder && paymentStatus === 'PAID' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                      <span>{t.student_alert_prepaid_ok}</span>
                    </div>
                    <p className="text-[9.5px] text-emerald-400/90 leading-normal">
                      {t.student_alert_prepaid_desc} <strong>{detectedPaymentMethod || (lang === 'vi' ? 'Ví/Thẻ Trực tuyến' : 'Online Card/Wallet')}</strong>.
                    </p>
                    {aiPowered && (
                      <div className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-medium border border-emerald-500/20 mt-0.5">
                        {t.student_ai_badge}
                      </div>
                    )}
                  </div>
                )}

                {paymentStatus === 'UNKNOWN' && imageBase64 && !ocrLoading && isFoodOrder && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-red-400">
                      <AlertCircle size={14} className="shrink-0 text-red-400" />
                      <span>{t.student_alert_unknown}</span>
                    </div>
                    <p className="text-[9.5px] text-red-400/90 leading-normal">
                      {t.student_alert_unknown_desc}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. ORDER DETAILS */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3.5">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.student_form_step2}</p>
                
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t.student_platform_label}
                  </label>
                  <select
                    value={foodPlatform}
                    onChange={(e) => setFoodPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="GRABFOOD">GrabFood</option>
                    <option value="SHOPEEFOOD">ShopeeFood</option>
                    <option value="BEFOOD">BeFood</option>
                    <option value="OTHER">{t.student_platform_other}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t.student_pickup_loc_label}
                  </label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Cổng 1 FPT">{t.student_gate_1}</option>
                    <option value="Cổng 2 FPT">{t.student_gate_2}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t.student_dropoff_loc_label}
                  </label>
                  <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-350 flex items-center gap-2 select-none">
                    <MapPin size={12} className="text-orange-500 shrink-0" />
                    <span>{t.student_dropoff_default}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {t.student_est_time}
                    </label>
                    <span className="text-[10px] text-orange-500 font-medium">{t.student_today} ({getTodayString()})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5">
                      <select
                        value={pickupHour}
                        onChange={(e) => setPickupHour(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark] h-5"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = i.toString().padStart(2, '0');
                          return <option key={h} value={h} className="bg-slate-950">{h} {t.student_hour_suffix}</option>;
                        })}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5">
                      <select
                        value={pickupMinute}
                        onChange={(e) => setPickupMinute(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark] h-5"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const m = i.toString().padStart(2, '0');
                          return <option key={m} value={m} className="bg-slate-950">{m} {t.student_minute_suffix}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t.student_note_label}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.student_note_placeholder}
                    rows={2}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>

              <div className="bg-slate-955 p-3 rounded-xl border border-slate-800 text-[10px] space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1 font-medium">
                    <Wallet size={12} className="text-orange-500" /> {t.student_fee_label}
                  </span>
                  <span className="font-mono font-black text-orange-400 text-xs">5.000 VNĐ</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-normal border-t border-slate-900 pt-1.5">
                  <span className="text-orange-400 font-semibold">{t.student_fee_note}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={formLoading || !isFoodOrder || paymentStatus === 'UNPAID'}
                className={`w-full font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${!isFoodOrder || paymentStatus === 'UNPAID'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white shadow-orange-600/25 cursor-pointer active:scale-[0.99]'
                  }`}
              >
                {formLoading ? t.student_submitting_btn : t.student_submit_btn}
              </button>
            </form>
          )}
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Requests */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-md font-bold text-white">{t.student_active_title} ({activeRequests.length})</h2>
              {activeRequests.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={activeSearchQuery}
                    onChange={(e) => setActiveSearchQuery(e.target.value)}
                    placeholder={t.student_search_placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {activeSearchQuery && (
                    <button
                      onClick={() => setActiveSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      {t.student_clear_search}
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : activeRequests.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Pizza className="mx-auto text-slate-600 mb-2" size={28} />
                <p className="text-slate-500 text-xs">{t.student_active_empty}</p>
              </div>
            ) : (
              (() => {
                const filtered = activeRequests.filter((req) => {
                  if (!activeSearchQuery.trim()) return true;
                  const q = activeSearchQuery.toLowerCase();
                  return (
                    (req.orderCode || '').toLowerCase().includes(q) ||
                    req.foodPlatform.toLowerCase().includes(q) ||
                    req.pickupLocation.toLowerCase().includes(q) ||
                    (req.dropoffLocation || '').toLowerCase().includes(q) ||
                    (req.receiver?.fullName || '').toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-6">{t.student_no_results} "{activeSearchQuery}"</p>;
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => router.push(`/student/request/${req.id}`)}
                        className="p-3.5 rounded-2xl bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800/80 hover:border-slate-700/80 transition-all cursor-pointer space-y-3 shadow-md hover:shadow-lg group"
                      >
                        {/* Top Header Row: Platform Icon, Platform Name, Order Code, Status Badge, Arrow */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20 transition-colors">
                              <Pizza size={18} />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">{req.foodPlatform}</p>
                              {req.orderCode && (
                                <span className="text-[9px] text-slate-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate shrink-0 max-w-[130px]" title={req.orderCode}>
                                  {t.student_code_prefix} {req.orderCode}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(req.status)}
                            <ChevronRight className="text-slate-500 group-hover:text-slate-300 transition-colors" size={16} />
                          </div>
                        </div>

                        {/* Location & Time Info */}
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0" title="Vị trí shipper giao → Vị trí bạn nhận">
                            <MapPin size={12} className="shrink-0 text-orange-400" />
                            <span className="truncate max-w-[200px] sm:max-w-[320px]">{req.pickupLocation} → {req.dropoffLocation || (lang === 'vi' ? 'Sảnh Trống Đồng' : 'Trong Dong Lobby')}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400 shrink-0">
                            <Clock size={12} className="shrink-0 text-slate-500" />
                            <span>{new Date(req.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Action Button Row (Copy message or Cancel) */}
                        {((req.receiver && ['ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(req.status)) || req.status === 'PENDING') && (
                          <div className="pt-1 flex items-center justify-end gap-2">
                            {req.receiver && ['ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(req.status) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const phoneStr = req.receiver?.phoneNumber ? req.receiver.phoneNumber : '';
                                  const textToCopy = `Chào anh/chị tài xế, em có nhờ bạn nhận hộ. Khi tới ${req.pickupLocation || 'Cổng 1 FPT'}, anh/chị vui lòng gọi cho bạn nhận hộ giúp em: ${req.receiver?.fullName} - SĐT: ${phoneStr}. Em cảm ơn!`;
                                  navigator.clipboard.writeText(textToCopy);
                                  toast.success('Đã sao chép tin nhắn gửi tài xế!');
                                }}
                                className="w-full sm:w-auto px-3 py-1.5 text-[11px] font-extrabold rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.98] text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                title="Copy tin nhắn thông báo cho tài xế giao hàng"
                              >
                                <Copy size={13} />
                                <span>Copy tin nhắn gửi tài xế</span>
                              </button>
                            )}
                            {req.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={(e) => handleCancelRequestFromDashboard(e, req.id)}
                                className="w-full sm:w-auto px-3 py-1.5 text-[11px] font-bold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                title="Hủy đơn nhận hộ này và hoàn tiền 5.000đ"
                              >
                                Hủy đơn
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* History */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-md font-bold text-white">{t.student_history_title} ({pastRequests.length})</h2>
              {pastRequests.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder={t.student_search_placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      {t.student_clear_search}
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-slate-550 text-xs">Đang tải...</p>
            ) : pastRequests.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">{t.student_history_empty}</p>
            ) : (
              (() => {
                const filtered = pastRequests.filter((req) => {
                  if (!historySearchQuery.trim()) return true;
                  const q = historySearchQuery.toLowerCase();
                  return (
                    (req.orderCode || '').toLowerCase().includes(q) ||
                    req.foodPlatform.toLowerCase().includes(q) ||
                    req.pickupLocation.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-6">{t.student_no_results} "{historySearchQuery}"</p>;
                }

                return (
                  <div className="space-y-2.5">
                    {filtered.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => router.push(`/student/request/${req.id}`)}
                        className="p-3.5 rounded-2xl bg-slate-950/40 hover:bg-slate-850/50 border border-slate-800/60 hover:border-slate-700/60 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-slate-850 group-hover:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 transition-colors">
                              <Pizza size={16} />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">{req.foodPlatform}</p>
                              {req.orderCode && (
                                <span className="text-[9px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate shrink-0 max-w-[120px]" title={req.orderCode}>
                                  {t.student_code_prefix} {req.orderCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(req.status)}
                            <ChevronRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={14} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800/30">
                          <span className="flex items-center gap-1"><Calendar size={10} className="shrink-0 text-slate-500" /> {new Date(req.pickupTime).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                          <span className="flex items-center gap-1"><MapPin size={10} className="shrink-0 text-slate-500" /> {req.pickupLocation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
      <IncompleteProfileModal
        isOpen={isIncompleteProfileModalOpen}
        onClose={() => setIsIncompleteProfileModalOpen(false)}
        title={lang === 'vi' ? 'Yêu cầu Cập nhật Hồ sơ trước khi Tạo đơn' : 'Profile Update Required Before Creating Order'}
        message={lang === 'vi' ? 'Vui lòng cập nhật đầy đủ Số điện thoại, Chức vụ và Mã định danh (MSSV / Mã Cán bộ) để có thể đăng đơn nhờ nhận hộ!' : 'Please complete your phone number, role, and student ID / staff code before submitting orders!'}
      />
    </div>
  );
}
