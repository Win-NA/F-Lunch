'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  X,
  Star
} from 'lucide-react';

interface RequestDetail {
  id: string;
  foodPlatform: string;
  orderCode: string;
  pickupLocation: string;
  pickupTime: string;
  status: string;
  note?: string;
  imageUrl?: string;
  createdAt: string;
  student: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFoodPlatform, setEditFoodPlatform] = useState('GRABFOOD');
  const [editPickupLocation, setEditPickupLocation] = useState('Cổng 1 FPT');
  const [editPickupHour, setEditPickupHour] = useState('12');
  const [editPickupMinute, setEditPickupMinute] = useState('00');
  const [editNote, setEditNote] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [editOcrLoading, setEditOcrLoading] = useState(false);
  const [editExtractedOrderCode, setEditExtractedOrderCode] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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

    const shopeePattern = /\b\d{4,10}-\d{4,10}\b/;
    const shopeeMatch = text.match(shopeePattern);
    if (shopeeMatch) {
      return shopeeMatch[0];
    }

    const genericPattern = /\b\d{8,15}\b/;
    const genericMatch = text.match(genericPattern);
    if (genericMatch) {
      return genericMatch[0];
    }

    return null;
  };

  const performEditOCR = async (base64: string) => {
    setEditOcrLoading(true);
    try {
      const ret = await Tesseract.recognize(base64, 'eng+vie');
      const text = ret.data.text;

      const code = extractOrderCode(text);
      if (code) {
        setEditExtractedOrderCode(code);
        toast.success(`Đã tự động nhận diện mã đơn mới: ${code}`);
      } else {
        setEditExtractedOrderCode(null);
      }
    } catch (err) {
      console.error('OCR Error:', err);
    } finally {
      setEditOcrLoading(false);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ảnh chụp đơn hàng phải nhỏ hơn 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setEditImageBase64(base64Data);
        performEditOCR(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPickupHour || !editPickupMinute) {
      toast.error('Vui lòng chọn thời gian giao hàng');
      return;
    }
    if (!editImageBase64) {
      toast.error('Vui lòng tải lên ảnh chụp màn hình đơn hàng để xác thực');
      return;
    }

    const today = new Date();
    const hours = parseInt(editPickupHour, 10);
    const minutes = parseInt(editPickupMinute, 10);
    const pickupDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

    if (pickupDate <= new Date()) {
      toast.error('Giờ giao hàng phải ở tương lai');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/requests/${requestId}`, {
        foodPlatform: editFoodPlatform,
        orderCode: editExtractedOrderCode || null,
        pickupLocation: editPickupLocation,
        pickupTime: pickupDate.toISOString(),
        note: editNote || '',
        imageUrl: editImageBase64,
      });
      toast.success('Cập nhật yêu cầu nhận hộ thành công!');
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật yêu cầu';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/requests/${requestId}`);
      setRequest(res.data);
      if (res.data.status === 'COMPLETED' && !res.data.feedback) {
        setShowFeedbackModal(true);
      }

      if (!isEditing) {
        setEditFoodPlatform(res.data.foodPlatform);
        setEditPickupLocation(res.data.pickupLocation);
        setEditNote(res.data.note || '');
        setEditImageBase64(res.data.imageUrl || null);
        setEditExtractedOrderCode(res.data.orderCode || null);
        const pDate = new Date(res.data.pickupTime);
        setEditPickupHour(pDate.getHours().toString().padStart(2, '0'));
        setEditPickupMinute(pDate.getMinutes().toString().padStart(2, '0'));
      }
    } catch (err: any) {
      // Bỏ qua lỗi kết nối polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // Poll mỗi 4 giây
    const interval = setInterval(fetchDetail, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu nhận hộ này không?')) return;
    setCancelling(true);
    try {
      await api.post(`/requests/${requestId}/cancel`);
      toast.success('Hủy yêu cầu nhận hộ thành công');
      fetchDetail();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể hủy yêu cầu';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      await api.post('/feedback', {
        requestId,
        rating,
        comment: comment || undefined,
      });
      toast.success('Cảm ơn bạn đã gửi phản hồi!');
      setShowFeedbackModal(false);
      fetchDetail();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi đánh giá';
      toast.error(msg);
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-4">Đang tải thông tin chi tiết...</div>;
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-sm">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <p className="text-slate-400">Không tìm thấy yêu cầu nhận hộ này.</p>
      </div>
    );
  }

  const steps = ['PENDING', 'ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP', 'COMPLETED'];
  const currentStepIndex = steps.indexOf(request.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs">
        <ArrowLeft size={14} /> Quay lại Bảng điều khiển
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle column: Details and Tracker */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tracker Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl">
            <h2 className="text-md font-bold text-white mb-6">Trạng thái đơn hàng</h2>
            
            {request.status === 'CANCELLED' ? (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <X size={18} />
                <div>
                  <p className="font-bold text-xs">Yêu cầu đã bị hủy</p>
                  <p className="text-[10px] mt-0.5 text-slate-400">Đơn hàng nhận hộ này đã được hủy bởi bạn hoặc người quản trị.</p>
                </div>
              </div>
            ) : (
              <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex || (request.status === 'COMPLETED' && idx <= currentStepIndex);
                  const isCurrent = idx === currentStepIndex && request.status !== 'COMPLETED';
                  const isFuture = idx > currentStepIndex;

                  let stepLabel = '';
                  let stepDesc = '';
                  switch (step) {
                    case 'PENDING':
                      stepLabel = 'Đã gửi yêu cầu';
                      stepDesc = 'Đang đợi một người nhận hộ chấp nhận đơn hàng.';
                      break;
                    case 'ACCEPTED':
                      stepLabel = 'Đã nhận hộ';
                      stepDesc = request.receiver 
                        ? `Người nhận hộ ${request.receiver.fullName} đã nhận việc và đang đợi shipper giao.`
                        : 'Một người nhận hộ đã chấp nhận đơn hàng.';
                      break;
                    case 'RECEIVED':
                      stepLabel = 'Đã lấy đơn';
                      stepDesc = 'Đơn hàng đã được nhận từ shipper và đang chuyển về tủ lưu trữ.';
                      break;
                    case 'READY_FOR_PICKUP':
                      stepLabel = 'Chờ bạn đến lấy';
                      stepDesc = 'Đơn hàng đã ở tủ bảo quản. Hãy đến vị trí bàn giao và xuất trình mã QR.';
                      break;
                    case 'COMPLETED':
                      stepLabel = 'Hoàn thành';
                      stepDesc = 'Đã bàn giao đơn hàng thành công!';
                      break;
                  }

                  return (
                    <div key={step} className="relative flex gap-4">
                      {/* Circle Dot Indicator */}
                      <span className={`absolute -left-[30px] w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-orange-500 border-orange-500 text-white' :
                        isCurrent ? 'bg-slate-900 border-orange-500 text-orange-500 animate-pulse' :
                        'bg-slate-955 border-slate-800 text-slate-600'
                      }`}>
                        {isCompleted && <CheckCircle2 size={12} className="fill-white stroke-orange-500" />}
                      </span>

                      <div>
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-orange-500' : isFuture ? 'text-slate-500' : 'text-white'}`}>
                          {stepLabel}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">{stepDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <h2 className="text-md font-bold text-white border-b border-slate-800 pb-2">Chi tiết đơn hàng</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ứng dụng</p>
                <p className="text-xs font-bold text-white mt-1">{request.foodPlatform}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Mã đơn hàng</p>
                <p className="text-xs font-bold text-white mt-1">{request.orderCode || 'Đã đính kèm ảnh chụp'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <MapPin className="text-orange-500 shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Vị trí nhận</p>
                <p className="text-xs font-bold text-white mt-0.5">{request.pickupLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <Calendar className="text-orange-500 shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Giờ dự kiến giao</p>
                <p className="text-xs font-bold text-white mt-0.5">{new Date(request.pickupTime).toLocaleString()}</p>
              </div>
            </div>

            {request.note && (
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl mt-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ghi chú cho F-Lunch / Thông tin thêm</p>
                <p className="text-xs text-slate-300 mt-1">{request.note}</p>
              </div>
            )}

            {request.imageUrl && (
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl mt-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Ảnh chụp đơn hàng</p>
                <div className="relative max-w-sm rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={request.imageUrl}
                    alt="Ảnh đơn hàng"
                    className="max-w-full h-auto cursor-zoom-in rounded-lg hover:scale-[1.02] transition-transform"
                    onClick={() => setFullscreenImage(request.imageUrl || null)}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Chạm vào ảnh để phóng to đơn hàng</p>
              </div>
            )}

            {/* Cancel and Edit Buttons */}
            {request.status === 'PENDING' && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Chỉnh sửa đơn
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:bg-red-955 text-red-400 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action (QR) and Receiver assignment */}
        <div className="space-y-6">
          
          {/* QR Handover Code card (if ready for pickup) */}
          {request.status === 'READY_FOR_PICKUP' && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-orange-500/30 p-5 rounded-3xl shadow-xl text-center space-y-4">
              <h2 className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">Bàn giao đơn hàng</h2>
              <p className="text-[10px] text-slate-400">Trình mã QR này cho người nhận hộ để lấy lại đơn hàng của bạn.</p>
              
              <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg">
                <QRCodeSVG value={request.id} size={150} />
              </div>

              <div className="bg-slate-955 border border-slate-800 p-2.5 rounded-xl">
                <p className="text-[9px] text-slate-500">Mã xác thực sơ cua</p>
                <p className="text-xs font-mono font-bold text-white mt-0.5">{request.id}</p>
              </div>
            </div>
          )}

          {/* Assigned Receiver Info */}
          {request.receiver && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Người nhận hộ được phân công</h3>
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 text-xs font-bold">
                  {request.receiver.fullName[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{request.receiver.fullName}</p>
                  <p className="text-[10px] text-slate-500">{request.receiver.email}</p>
                </div>
              </div>

              {request.receiver.phoneNumber && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <Phone size={12} className="text-orange-500" />
                  <span>{request.receiver.phoneNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Feedback details (if already submitted) */}
          {request.feedback && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Đánh giá của bạn</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={14} 
                    className={s <= request.feedback!.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'} 
                  />
                ))}
              </div>
              {request.feedback.comment && (
                <p className="text-xs italic text-slate-450 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  &ldquo;{request.feedback.comment}&rdquo;
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="text-center">
                <div className="w-11 h-11 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 mx-auto mb-3">
                  <Star size={20} className="fill-orange-500" />
                </div>
                <h3 className="text-base font-bold text-white">Đánh giá trải nghiệm</h3>
                <p className="text-[11px] text-slate-450 mt-1">Đánh giá dịch vụ nhận hộ của bạn {request.receiver?.fullName || ''}</p>
              </div>

              {/* Stars selector */}
              <div className="flex justify-center items-center gap-2 py-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-slate-650 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star 
                      size={28} 
                      className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-700'} 
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Bình luận / Ý kiến đóng góp (Tùy chọn)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ví dụ: Bàn giao nhanh, tủ bảo quản tốt, nhiệt tình hỗ trợ!"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {feedbackLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 relative">
            <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              Chỉnh sửa yêu cầu nhận hộ
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ứng dụng đặt đồ ăn *
                </label>
                <select
                  value={editFoodPlatform}
                  onChange={(e) => setEditFoodPlatform(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="GRABFOOD">GrabFood</option>
                  <option value="SHOPEEFOOD">ShopeeFood</option>
                  <option value="BEFOOD">BeFood</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Vị trí nhận hàng *
                </label>
                <select
                  value={editPickupLocation}
                  onChange={(e) => setEditPickupLocation(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Cổng 1 FPT">Cổng 1 FPT</option>
                  <option value="Cổng 2 FPT">Cổng 2 FPT</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Giờ giao hàng dự kiến *
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5">
                    <select
                      value={editPickupHour}
                      onChange={(e) => setEditPickupHour(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark] h-5"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, '0');
                        return <option key={h} value={h} className="bg-slate-950">{h} giờ</option>;
                      })}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5">
                    <select
                      value={editPickupMinute}
                      onChange={(e) => setEditPickupMinute(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark] h-5"
                    >
                      {Array.from({ length: 60 }, (_, i) => {
                        const m = i.toString().padStart(2, '0');
                        return <option key={m} value={m} className="bg-slate-950">{m} phút</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ghi chú cho F-Lunch / Thông tin thêm
                </label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ví dụ: Số điện thoại tài xế, hoặc lưu ý..."
                  rows={2}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between items-center">
                  <span>Ảnh chụp màn hình đơn hàng *</span>
                  <span className="text-[9px] text-slate-500 font-normal">Dưới 2MB</span>
                </label>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-orange-500/10 file:text-orange-500 file:cursor-pointer hover:file:bg-orange-500/20"
                  />

                  {editOcrLoading && (
                    <div className="text-[10px] text-orange-400 flex items-center gap-1.5 animate-pulse bg-orange-500/5 p-2.5 rounded-xl border border-orange-500/10 justify-center">
                      <Clock size={12} className="animate-spin shrink-0" />
                      <span>Đang tự động quét tìm mã đơn hàng...</span>
                    </div>
                  )}

                  {editExtractedOrderCode && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[10px] flex items-center justify-between">
                      <span>Mã đơn nhận dạng được: <strong>{editExtractedOrderCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setEditExtractedOrderCode(null)}
                        className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Xóa mã
                      </button>
                    </div>
                  )}

                  {editImageBase64 && (
                    <div className="relative w-full h-24 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={editImageBase64}
                        alt="Xem trước đơn hàng"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditImageBase64(null);
                          setEditExtractedOrderCode(null);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-xs active:scale-90 transition-transform cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Overlay */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 cursor-pointer bg-slate-900/50 rounded-full"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} />
          </button>
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center">
            <img 
              src={fullscreenImage} 
              alt="Ảnh đơn hàng phóng to" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="absolute bottom-6 text-slate-400 text-xs font-medium">Chạm vào vùng trống hoặc nút X để đóng</p>
        </div>
      )}
    </div>
  );
}
