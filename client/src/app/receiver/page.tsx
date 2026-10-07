'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ClipboardList,
  MapPin,
  Clock,
  User,
  CheckCircle,
  Play,
  Inbox,
  ArrowRight,
  DollarSign,
  X,
  Star,
  Pizza,
  Search,
  Award
} from 'lucide-react';

interface RequestItem {
  id: string;
  foodPlatform: string;
  orderCode: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: string;
  note?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  student: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}


export default function ReceiverDashboard() {
  const router = useRouter();

  const [pendingRequests, setPendingRequests] = useState<RequestItem[]>([]);
  const [activeTask, setActiveTask] = useState<RequestItem | null>(null);
  const [historyRequests, setHistoryRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Stats
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);

  // Detail Modal State
  const [modalTab, setModalTab] = useState<'EARNINGS' | 'TIER' | null>(null);

  const fetchData = async () => {
    try {
      // Tải yêu cầu chờ nhận hộ
      const pendingRes = await api.get('/receivers/pending');
      setPendingRequests(pendingRes.data);

      // Tải công việc đang làm
      const activeRes = await api.get('/receivers/active');
      setActiveTask(activeRes.data || null);

      // Tải lịch sử nhận hộ
      const historyRes = await api.get('/receivers/history');
      setHistoryRequests(historyRes.data);
      setCompletedCount(historyRes.data.length);

      // Tính số đơn hoàn thành hôm nay
      const today = new Date();
      const completedToday = historyRes.data.filter((req: any) => {
        const d = new Date(req.updatedAt);
        return d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
      });
      setCompletedTodayCount(completedToday.length);
    } catch (err: any) {
      // Bỏ qua lỗi kết nối
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (requestId: string) => {
    setBtnLoading(true);
    try {
      await api.post(`/receivers/accept/${requestId}`);
      toast.success('Nhận đơn thành công! Hãy chuẩn bị đi lấy đơn hàng.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể chấp nhận yêu cầu';
      toast.error(msg);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!activeTask) return;
    setBtnLoading(true);
    try {
      await api.patch(`/receivers/status/${activeTask.id}`, { status });
      let displayStatus = status;
      if (status === 'RECEIVED') displayStatus = 'Đã lấy đơn';
      if (status === 'READY_FOR_PICKUP') displayStatus = 'Đã cất vào tủ';
      toast.success(`Cập nhật trạng thái thành công: ${displayStatus}`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái';
      toast.error(msg);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCancelOrder = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối / hủy đơn hàng này không? Đơn hàng sẽ bị HỦY và 5.000đ phí dịch vụ sẽ được hoàn lại cho sinh viên.')) {
      return;
    }
    setBtnLoading(true);
    try {
      await api.post(`/receivers/cancel/${requestId}`);
      toast.success('Đã từ chối / hủy đơn thành công. Đơn hàng đã được hoàn tiền lại cho sinh viên.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể hủy đơn';
      toast.error(msg);
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACCEPTED') return 'Đang đợi shipper';
    if (status === 'RECEIVED') return 'Đã lấy đơn';
    if (status === 'READY_FOR_PICKUP') return 'Đã đến điểm tập kết (Chờ SV lấy)';
    return status;
  };

  const historySectionRef = useRef<HTMLDivElement>(null);

  const calculateDailyEarnings = (N: number): number => {
    if (N <= 0) return 0;
    if (N <= 10) return N * 3000;
    if (N <= 20) return 30000 + (N - 10) * 3500;
    return 65000 + (N - 20) * 3800;
  };

  const todayEarnings = calculateDailyEarnings(completedTodayCount);
  const nextOrderRate = completedTodayCount < 10 ? 3000 : completedTodayCount < 20 ? 3500 : 3800;
  const currentTierText = completedTodayCount < 10 
    ? 'Bậc 1 (1-10 đơn: 3.000đ/đơn)' 
    : completedTodayCount < 20 
    ? 'Bậc 2 (11-20 đơn: 3.500đ/đơn)' 
    : 'Bậc 3 (21+ đơn: 3.800đ/đơn)';

  const monthEarnings = historyRequests.reduce((acc, req) => {
    // Basic summation for completed history in current month
    const d = new Date(req.updatedAt || req.createdAt);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return acc + 3000; // approximate or real balance sum
    }
    return acc;
  }, 0);

  const scrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">Bàn làm việc Người nhận hộ</h1>
        <p className="text-slate-400 text-xs mt-1">Chấp nhận nhận hộ và hoàn thành các đơn hàng của sinh viên</p>
      </div>

      {/* Receiver Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div 
          onClick={scrollToHistory}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl flex items-center gap-3.5 cursor-pointer hover:bg-slate-850/80 transition-all group"
          title="Nhấn để xem danh sách lịch sử đơn đã hoàn thành"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Đơn hoàn thành hôm nay</p>
            <p className="text-lg font-bold text-white mt-0.5">{completedTodayCount}</p>
          </div>
        </div>

        <div 
          onClick={() => setModalTab('EARNINGS')}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl flex items-center gap-3.5 cursor-pointer hover:bg-slate-850/80 transition-all group"
          title="Nhấn để xem chi tiết tiền công hôm nay"
        >
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tiền công hôm nay</p>
            <p className="text-lg font-bold text-white mt-0.5">{todayEarnings.toLocaleString('vi-VN')} VND</p>
            <p className="text-[9px] text-orange-400 font-medium mt-0.5">Đơn thứ {completedTodayCount + 1}: +{nextOrderRate.toLocaleString('vi-VN')}đ/đơn</p>
          </div>
        </div>

        <div 
          onClick={() => setModalTab('TIER')}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl flex items-center gap-3.5 cursor-pointer hover:bg-slate-850/80 transition-all group"
          title="Nhấn để xem chi tiết mức thưởng của bạn"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-105 transition-transform">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mức thưởng của bạn</p>
            <p className="text-xs font-bold text-white mt-1">{currentTierText}</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Task */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl">
            <h2 className="text-md font-bold text-white mb-4">Nhiệm vụ đang thực hiện</h2>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : !activeTask ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <ClipboardList className="mx-auto text-slate-700 mb-2" size={32} />
                <p className="text-slate-500 text-xs">Hiện tại chưa nhận nhiệm vụ nào. Nhanh tay nhận các đơn mới nhé!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      Trạng thái: {getStatusLabel(activeTask.status)}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2">
                      {activeTask.foodPlatform} {activeTask.orderCode ? `— ${activeTask.orderCode}` : '— (Có ảnh đơn)'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Gửi lúc: {new Date(activeTask.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Sinh viên</p>
                    <p className="text-xs font-bold text-white">{activeTask.student.fullName}</p>
                    {activeTask.student.phoneNumber && (
                      <p className="text-[10px] text-slate-450 mt-0.5">{activeTask.student.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-550">Lấy hàng tại (Shipper)</p>
                        <p className="text-xs font-bold text-white">{activeTask.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-550">Giao cho khách tại</p>
                        <p className="text-xs font-bold text-white">{activeTask.dropoffLocation || 'Sảnh Trống Đồng'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-555">Giờ tài xế tới</p>
                      <p className="text-xs font-bold text-white">{new Date(activeTask.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {activeTask.note && (
                    <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl mt-3">
                      <p className="text-[10px] font-semibold text-slate-550 uppercase tracking-wider">Ghi chú cho F-Lunch / Thông tin thêm</p>
                      <p className="text-xs text-slate-355 mt-1">{activeTask.note}</p>
                    </div>
                  )}

                  {activeTask.imageUrl && (
                    <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl mt-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Ảnh chụp đơn hàng</p>
                      <div className="relative max-w-xs rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                        <img
                          src={activeTask.imageUrl}
                          alt="Ảnh đơn hàng"
                          className="max-w-full h-auto cursor-zoom-in rounded-lg"
                          onClick={() => setFullscreenImage(activeTask.imageUrl || null)}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Chạm vào ảnh để phóng to đơn hàng</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                  {activeTask.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus('RECEIVED')}
                      disabled={btnLoading}
                      className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-300 text-white font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play size={14} /> Xác nhận Đã Lấy Đơn
                    </button>
                  )}

                  {activeTask.status === 'RECEIVED' && (
                    <button
                      onClick={() => handleUpdateStatus('READY_FOR_PICKUP')}
                      disabled={btnLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 text-white font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} /> Xác nhận Đã Cất Vào Tủ
                    </button>
                  )}

                  {activeTask.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={() => router.push('/receiver/scan')}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      Xác thực bàn giao và hoàn thành <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lịch sử nhận hộ đơn hàng */}
          <div ref={historySectionRef} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-md font-bold text-white">Lịch sử đơn nhận hộ ({historyRequests.length})</h2>
              {historyRequests.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Tìm sinh viên, mã đơn..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : historyRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa hoàn thành đơn nhận hộ nào.</p>
            ) : (
              (() => {
                const filtered = historyRequests.filter((req) => {
                  if (!historySearchQuery.trim()) return true;
                  const q = historySearchQuery.toLowerCase();
                  return (
                    (req.orderCode || '').toLowerCase().includes(q) ||
                    req.foodPlatform.toLowerCase().includes(q) ||
                    req.student.fullName.toLowerCase().includes(q) ||
                    req.pickupLocation.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-6">Không tìm thấy đơn nào khớp với "{historySearchQuery}"</p>;
                }

                return (
                  <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto pr-1">
                    {filtered.map((req) => (
                      <div key={req.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-400 shrink-0">
                            <Pizza size={18} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <p className="text-xs font-bold text-white truncate max-w-[120px]">{req.foodPlatform}</p>
                              {req.orderCode && (
                                <span className="text-[9px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[140px]" title={req.orderCode}>
                                  Mã: {req.orderCode}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-450">
                              <span>Sinh viên: {req.student.fullName}</span>
                              <span>•</span>
                              <span>Lấy: {req.pickupLocation} → Giao: {req.dropoffLocation || 'Sảnh Trống Đồng'}</span>
                            </div>
                            {/* Hiển thị đánh giá của sinh viên */}
                            {(req as any).feedback && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 w-fit">
                                <span className="flex gap-0.5">
                                  {Array.from({ length: (req as any).feedback.rating }).map((_, i) => (
                                    <Star key={i} size={8} className="fill-orange-500 stroke-orange-500" />
                                  ))}
                                </span>
                                {(req as any).feedback.comment && (
                                  <span className="text-slate-500 italic">"{(req as any).feedback.comment}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md font-bold uppercase shrink-0 whitespace-nowrap">
                          Hoàn thành
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Available Tasks list */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl h-fit space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-md font-bold text-white">Đơn hàng chờ nhận hộ ({pendingRequests.length})</h2>
              {pendingRequests.length > 0 && (
                <div className="relative w-full sm:w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={pendingSearchQuery}
                    onChange={(e) => setPendingSearchQuery(e.target.value)}
                    placeholder="Tìm đơn chờ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {pendingSearchQuery && (
                    <button
                      onClick={() => setPendingSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-6">
                <Inbox className="mx-auto text-slate-700 mb-2" size={24} />
                <p className="text-slate-500 text-xs">Không có yêu cầu chờ nhận hộ nào trống.</p>
              </div>
            ) : (
              (() => {
                const filtered = pendingRequests.filter((job) => {
                  if (!pendingSearchQuery.trim()) return true;
                  const q = pendingSearchQuery.toLowerCase();
                  return (
                    (job.orderCode || '').toLowerCase().includes(q) ||
                    job.foodPlatform.toLowerCase().includes(q) ||
                    job.student.fullName.toLowerCase().includes(q) ||
                    job.pickupLocation.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-6">Không tìm thấy đơn chờ nào khớp với "{pendingSearchQuery}"</p>;
                }

                return (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {filtered.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-white">{job.foodPlatform}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {job.orderCode ? `Đơn: ${job.orderCode}` : 'Đã đính kèm ảnh'}
                            </p>
                          </div>
                          <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold">
                            Đang đợi
                          </span>
                        </div>

                        <div className="space-y-1 text-[10px] text-slate-400">
                          <p className="flex items-center gap-1.5" title="Vị trí shipper giao → Vị trí khách nhận"><MapPin size={10} /> {job.pickupLocation} → {job.dropoffLocation || 'Sảnh Trống Đồng'}</p>
                          <p className="flex items-center gap-1.5"><Clock size={10} /> {new Date(job.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="flex items-center gap-1.5"><User size={10} /> {job.student.fullName}</p>
                        </div>

                        {job.imageUrl && (
                          <div className="mt-2 bg-slate-950 p-2 border border-slate-850 rounded-xl">
                            <p className="text-[8px] font-bold text-slate-550 uppercase tracking-wider mb-1">Ảnh đơn hàng đính kèm:</p>
                            <div className="relative w-full max-h-24 rounded-lg overflow-hidden border border-slate-900 bg-slate-900 flex items-center justify-center">
                              <img
                                src={job.imageUrl}
                                alt="Ảnh đơn hàng"
                                className="max-h-24 max-w-full cursor-zoom-in object-contain rounded hover:scale-[1.02] transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullscreenImage(job.imageUrl || null);
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleAccept(job.id)}
                            disabled={btnLoading || !!activeTask}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-orange-600/20"
                          >
                            Nhận đơn hộ
                          </button>
                          <button
                            onClick={() => handleCancelOrder(job.id)}
                            disabled={btnLoading}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Từ chối / Hủy
                          </button>
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

      {/* Modal Details for Earnings & Bonus Tiers */}
      {modalTab && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalTab(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalTab(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${modalTab === 'EARNINGS' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {modalTab === 'EARNINGS' ? <DollarSign size={22} /> : <Award size={22} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {modalTab === 'EARNINGS' ? 'Chi tiết Tiền công hôm nay' : 'Chi tiết Mức thưởng của bạn'}
                </h3>
                <p className="text-[11px] text-slate-400">Thống kê thu nhập & chính sách thưởng lũy tiến của Người nhận hộ</p>
              </div>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setModalTab('EARNINGS')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  modalTab === 'EARNINGS' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tiền công hôm nay
              </button>
              <button
                onClick={() => setModalTab('TIER')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  modalTab === 'TIER' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mức thưởng của bạn
              </button>
            </div>

            {/* Content for EARNINGS tab */}
            {modalTab === 'EARNINGS' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-4 text-center">
                  <p className="text-xs text-orange-300 font-medium">Tổng tiền công tích lũy hôm nay</p>
                  <p className="text-3xl font-black text-orange-400 mt-1">{todayEarnings.toLocaleString('vi-VN')} <span className="text-sm font-normal text-orange-200">VND</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">Hoàn thành <span className="font-bold text-white">{completedTodayCount}</span> đơn hàng hôm nay</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Đơn hàng tiếp theo (Đơn #{completedTodayCount + 1})</span>
                    <span className="font-bold text-emerald-400">+{nextOrderRate.toLocaleString('vi-VN')}đ / đơn</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Mức thưởng đang áp dụng</span>
                    <span className="font-bold text-blue-400">{currentTierText}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content for TIER tab */}
            {modalTab === 'TIER' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-xs text-blue-300 font-semibold">Hiện tại: <span className="text-white font-bold">{currentTierText}</span></p>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (completedTodayCount / 20) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">Đã hoàn thành {completedTodayCount} đơn hôm nay</p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-300">Bảng thưởng lũy tiến theo số đơn/ngày:</p>

                  <div className={`p-3 rounded-2xl border transition-all ${completedTodayCount <= 10 ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs">Bậc 1 (Từ 1 - 10 đơn)</span>
                      <span className="font-black text-sm text-emerald-400">3.000đ <span className="text-[10px] font-normal text-slate-400">/đơn</span></span>
                    </div>
                    <p className="text-[11px] mt-0.5 text-slate-400">Tiền công cơ bản cho mỗi đơn nhận hộ.</p>
                  </div>

                  <div className={`p-3 rounded-2xl border transition-all ${completedTodayCount > 10 && completedTodayCount <= 20 ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs">Bậc 2 (Từ 11 - 20 đơn)</span>
                      <span className="font-black text-sm text-orange-400">3.500đ <span className="text-[10px] font-normal text-slate-400">/đơn</span></span>
                    </div>
                    <p className="text-[11px] mt-0.5 text-slate-400">Thưởng thêm +500đ/đơn từ đơn thứ 11.</p>
                  </div>

                  <div className={`p-3 rounded-2xl border transition-all ${completedTodayCount > 20 ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs">Bậc 3 (Từ 21 đơn trở lên)</span>
                      <span className="font-black text-sm text-purple-400">3.800đ <span className="text-[10px] font-normal text-slate-400">/đơn</span></span>
                    </div>
                    <p className="text-[11px] mt-0.5 text-slate-400">Thưởng cao nhất +800đ/đơn cho sự chăm chỉ!</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setModalTab(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
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
