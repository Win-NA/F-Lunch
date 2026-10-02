'use client';

import { useState, useEffect } from 'react';
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
  Pizza
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

  // Stats
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);

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

  const handleCancelAssignment = async () => {
    if (!activeTask) return;
    if (!confirm('Bạn có chắc chắn muốn từ chối / hủy nhận đơn hàng này không? Đơn hàng sẽ bị HỦY và 5.000đ phí dịch vụ sẽ được hoàn lại cho sinh viên.')) {
      return;
    }
    setBtnLoading(true);
    try {
      await api.post(`/receivers/cancel/${activeTask.id}`);
      toast.success('Đã từ chối nhận đơn thành công. Đơn hàng đã bị hủy và hoàn tiền lại cho sinh viên.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể từ chối nhận đơn';
      toast.error(msg);
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACCEPTED') return 'Đang đợi shipper';
    if (status === 'RECEIVED') return 'Đã lấy đơn';
    if (status === 'READY_FOR_PICKUP') return 'Đã cất tủ (Chờ SV lấy)';
    return status;
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">Bàn làm việc Người nhận hộ</h1>
        <p className="text-slate-400 text-xs mt-1">Chấp nhận nhận hộ và hoàn thành các đơn hàng của sinh viên</p>
      </div>

      {/* Receiver Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn hoàn thành hôm nay</p>
            <p className="text-xl font-bold text-white mt-1">{completedTodayCount}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiền công hôm nay</p>
            <p className="text-xl font-bold text-white mt-1">{(completedTodayCount * 5000).toLocaleString()} VND</p>
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

                  {['ACCEPTED', 'RECEIVED'].includes(activeTask.status) && (
                    <button
                      onClick={handleCancelAssignment}
                      disabled={btnLoading}
                      className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X size={14} /> Hủy nhận đơn
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lịch sử nhận hộ đơn hàng */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl">
            <h2 className="text-md font-bold text-white mb-4">Lịch sử đơn nhận hộ ({historyRequests.length})</h2>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : historyRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa hoàn thành đơn nhận hộ nào.</p>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto pr-1">
                {historyRequests.map((req) => (
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
            )}
          </div>
        </div>

        {/* Available Tasks list */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl h-fit">
            <h2 className="text-md font-bold text-white mb-4">Các đơn hàng chờ nhận hộ ({pendingRequests.length})</h2>

            {loading ? (
              <p className="text-slate-500 text-xs">Đang tải...</p>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-6">
                <Inbox className="mx-auto text-slate-700 mb-2" size={24} />
                <p className="text-slate-500 text-xs">Không có yêu cầu chờ nhận hộ nào trống.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {pendingRequests.map((job) => (
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

                    <button
                      onClick={() => handleAccept(job.id)}
                      disabled={btnLoading || !!activeTask}
                      className="w-full bg-slate-900 hover:bg-orange-600 disabled:bg-slate-955 disabled:text-slate-650 border border-slate-850 hover:border-orange-500 text-white font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Nhận đơn hộ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

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
