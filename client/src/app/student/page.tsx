'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { 
  Plus, 
  MapPin, 
  Pizza, 
  Calendar,
  ChevronRight,
  Clock,
  X
} from 'lucide-react';

interface RequestItem {
  id: string;
  foodPlatform: string;
  orderCode?: string;
  pickupLocation: string;
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
  
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const performOCR = async (base64: string) => {
    setOcrLoading(true);
    try {
      const ret = await Tesseract.recognize(base64, 'eng+vie');
      const text = ret.data.text;

      const code = extractOrderCode(text);
      if (code) {
        setExtractedOrderCode(code);
        toast.success(`Đã tự động nhận dạng mã đơn hàng: ${code}`);
      } else {
        setExtractedOrderCode(null);
        toast.info('Không nhận diện thấy mã đơn tự động. Ảnh chụp sẽ được dùng để đối chiếu thủ công.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Nhận diện mã đơn tự động gặp lỗi, ảnh đơn vẫn được chọn thành công.');
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
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupHour || !pickupMinute) {
      toast.error('Vui lòng chọn thời gian giao hàng');
      return;
    }

    if (!imageBase64) {
      toast.error('Vui lòng tải lên ảnh chụp màn hình đơn hàng để xác thực');
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
      await api.post('/requests', {
        foodPlatform,
        orderCode: extractedOrderCode || undefined,
        pickupLocation,
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
      // Tải lại dữ liệu
      fetchRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const activeRequests = requests.filter(r => 
    ['PENDING', 'ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(r.status)
  );

  const pastRequests = requests.filter(r => 
    ['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Đang chờ</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">Đã nhận hộ</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">Đã lấy đơn</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Chờ bạn lấy</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Hoàn thành</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Đã hủy</span>;
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">Trang Sinh viên</h1>
        <p className="text-slate-450 text-xs mt-1">Quản lý và theo dõi các yêu cầu nhận hộ đơn hàng của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Request Form */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl h-fit">
          <h2 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="text-orange-500" size={18} />
            Tạo yêu cầu mới
          </h2>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Ứng dụng đặt đồ ăn *
              </label>
              <select
                value={foodPlatform}
                onChange={(e) => setFoodPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
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
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
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
                <span className="text-[10px] text-orange-500 font-medium">Hôm nay ({getTodayString()})</span>
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
                      return <option key={h} value={h} className="bg-slate-950">{h} giờ</option>;
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
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Số điện thoại tài xế, hoặc lưu ý đồ uống có đá/cần bảo quản lạnh"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
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
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-orange-500/10 file:text-orange-500 file:cursor-pointer hover:file:bg-orange-500/20"
                />

                {ocrLoading && (
                  <div className="text-[10px] text-orange-400 flex items-center gap-1.5 animate-pulse bg-orange-500/5 p-2.5 rounded-xl border border-orange-500/10 justify-center">
                    <Clock size={12} className="animate-spin shrink-0" />
                    <span>Đang tự động quét tìm mã đơn hàng...</span>
                  </div>
                )}

                {extractedOrderCode && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[10px] flex items-center justify-between">
                    <span>Mã đơn nhận dạng được: <strong>{extractedOrderCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setExtractedOrderCode(null)}
                      className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                    >
                      Xóa mã
                    </button>
                  </div>
                )}

                {imageBase64 && (
                  <div className="relative w-full h-24 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={imageBase64}
                      alt="Xem trước đơn hàng"
                      className="max-h-full max-w-full rounded object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageBase64(null);
                        setExtractedOrderCode(null);
                      }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-xs active:scale-90 transition-transform cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {formLoading ? 'Đang gửi...' : 'Gửi yêu cầu nhận hộ'}
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Requests */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl">
            <h2 className="text-md font-bold text-white mb-4">Yêu cầu đang hoạt động ({activeRequests.length})</h2>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : activeRequests.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Pizza className="mx-auto text-slate-600 mb-2" size={28} />
                <p className="text-slate-500 text-xs">Không có yêu cầu nào đang hoạt động. Tạo một cái ở bảng bên trái nhé!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {activeRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => router.push(`/student/request/${req.id}`)}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-800/10 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Pizza size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{req.foodPlatform}</p>
                          {req.orderCode && <span className="text-[9px] text-slate-500 font-mono">Mã: {req.orderCode}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-450 mt-1">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {req.pickupLocation}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(req.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}
                      <ChevronRight className="text-slate-600" size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl">
            <h2 className="text-md font-bold text-white mb-4">Lịch sử nhận hộ ({pastRequests.length})</h2>

            {loading ? (
              <p className="text-slate-550 text-xs">Đang tải...</p>
            ) : pastRequests.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">Chưa có lịch sử yêu cầu nào.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {pastRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => router.push(`/student/request/${req.id}`)}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-800/10 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-850 flex items-center justify-center text-slate-450">
                        <Pizza size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{req.foodPlatform}</p>
                          {req.orderCode && <span className="text-[9px] text-slate-500 font-mono">Mã: {req.orderCode}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-450 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(req.pickupTime).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}
                      <ChevronRight className="text-slate-600" size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
