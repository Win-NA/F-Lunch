'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  HelpCircle,
  FileText,
  X,
  Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';

interface ReportTicket {
  id: string;
  type: 'DEPOSIT_ERROR' | 'SYSTEM_BUG' | 'OTHER';
  title: string;
  description: string;
  proofImage?: string;
  expectedAmount?: number;
  transactionCode?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export default function StudentReportsPage() {
  const [reports, setReports] = useState<ReportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [type, setType] = useState<'DEPOSIT_ERROR' | 'SYSTEM_BUG' | 'OTHER'>('DEPOSIT_ERROR');
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/my-reports');
      setReports(res.data);
    } catch (err: any) {
      if (err.response && err.response.status !== 401 && err.response.status !== 403 && useAuthStore.getState().accessToken) {
        toast.error('Không thể tải lịch sử báo cáo sự cố');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Dung lượng ảnh chứng từ không được vượt quá 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Vui lòng mô tả chi tiết sự cố');
      return;
    }
    if (type === 'DEPOSIT_ERROR') {
      if (!expectedAmount || parseInt(expectedAmount, 10) <= 0) {
        toast.error('Vui lòng nhập số tiền bạn đã chuyển khoản để Admin kiểm tra');
        return;
      }
      if (!proofImage) {
        toast.error('Vui lòng tải lên ảnh biên lai chuyển khoản để Admin đối chiếu!');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post('/reports', {
        type,
        description: description.trim(),
        expectedAmount: expectedAmount ? parseInt(expectedAmount, 10) : undefined,
        proofImage: proofImage || undefined,
      });

      toast.success('Báo cáo sự cố đã được gửi tới Ban quản trị thành công!');
      // Reset form
      setDescription('');
      setExpectedAmount('');
      setProofImage(null);
      fetchReports();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi báo cáo sự cố';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock size={11} /> Đang chờ Admin xác minh
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 size={11} /> Đã duyệt & Cộng tiền
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
            <XCircle size={11} /> Đã bị từ chối
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 size={11} /> Đã giải quyết
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5 font-sans">
          <AlertTriangle className="text-orange-500" size={26} />
          Báo Cáo Sự Cố & Phản Ánh Nạp Tiền
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Gửi báo cáo lỗi hệ thống hoặc phản ánh sự cố nạp tiền sai nội dung chuyển khoản để Admin đối chiếu chứng từ và hỗ trợ xử lý.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl h-fit space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText size={16} className="text-orange-500" />
            Tạo phản ánh / báo cáo mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Loại sự cố / vấn đề *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('DEPOSIT_ERROR')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                    type === 'DEPOSIT_ERROR'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <DollarSign size={14} className="text-orange-500" /> Lỗi nạp tiền
                  </span>
                  <span className="text-[9.5px] font-normal text-slate-400">Sai ND / Tiền chưa vào ví</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('SYSTEM_BUG')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                    type === 'SYSTEM_BUG'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <ShieldAlert size={14} className="text-orange-500" /> Lỗi hệ thống
                  </span>
                  <span className="text-[9.5px] font-normal text-slate-400">Lỗi giao diện / Chức năng</span>
                </button>
              </div>
            </div>

            {/* Deposit-specific fields */}
            {type === 'DEPOSIT_ERROR' && (
              <div className="p-3.5 bg-slate-955 border border-orange-500/20 rounded-2xl space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-orange-400 mb-1">
                  Số tiền bạn đã chuyển khoản (VNĐ) *
                </label>
                <input
                  type="number"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="VD: 50000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-extrabold placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  min={1000}
                  step={1000}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Mô tả chi tiết sự cố *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể thời gian chuyển khoản, thông tin tài khoản chuyển hoặc thao tác xảy ra lỗi..."
                rows={3}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Screenshot proof upload */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between items-center">
                <span>{type === 'DEPOSIT_ERROR' ? 'Ảnh biên lai chuyển khoản (Bắt buộc) *' : 'Ảnh chụp màn hình lỗi (Không bắt buộc)'}</span>
                <span className="text-[9px] text-slate-500">Tối đa 4MB</span>
              </label>
              
              <div className="flex flex-col gap-2.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 cursor-pointer"
                />

                {proofImage && (
                  <div className="relative w-full h-36 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden p-2 flex items-center justify-center group">
                    <img
                      src={proofImage}
                      alt="Chứng từ chuyển khoản"
                      className="max-h-full max-w-full rounded object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      title="Xóa ảnh này"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={14} />
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              Lịch sử phản ánh của tôi ({reports.length})
            </span>
            <button
              onClick={fetchReports}
              className="text-[10px] text-orange-400 hover:underline font-medium cursor-pointer"
            >
              Làm mới
            </button>
          </h2>

          {loading ? (
            <p className="text-slate-500 text-xs py-6 text-center">Đang tải lịch sử báo cáo...</p>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-2">
              <HelpCircle className="mx-auto text-slate-600" size={32} />
              <p className="text-slate-400 text-xs font-medium">Bạn chưa gửi báo cáo sự cố nào.</p>
              <p className="text-[11px] text-slate-500">Nếu bị lỗi nạp tiền hoặc sự cố ứng dụng, hãy tạo báo cáo ở ô bên cạnh nhé!</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
              {reports.map((item) => (
                <div key={item.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          item.type === 'DEPOSIT_ERROR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.type === 'DEPOSIT_ERROR' ? '💳 Lỗi nạp tiền' : '🐛 Lỗi hệ thống'}
                        </span>
                        <span className="text-[10px] text-slate-500">#{item.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="font-extrabold text-white text-xs mt-1">{item.title}</h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <p className="text-slate-350 text-xs leading-relaxed whitespace-pre-wrap">{item.description}</p>

                  {/* Metadata if deposit error */}
                  {item.type === 'DEPOSIT_ERROR' && (
                    <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-900 rounded-xl text-[11px] font-mono border border-slate-850">
                      {item.expectedAmount && (
                        <span>Số tiền nạp: <strong className="text-orange-400">{item.expectedAmount.toLocaleString('vi-VN')} đ</strong></span>
                      )}
                      {item.transactionCode && (
                        <span>Mã CK: <strong className="text-slate-300">{item.transactionCode}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Screenshot thumbnail */}
                  {item.proofImage && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedImage(item.proofImage!)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1.5 rounded-lg border border-orange-500/20 transition-all cursor-pointer"
                      >
                        <ImageIcon size={12} />
                        <span>Xem chứng từ đã đính kèm</span>
                      </button>
                    </div>
                  )}

                  {/* Admin feedback note */}
                  {item.adminNote && (
                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                      item.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                      item.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-300'
                    }`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Phản hồi từ Admin:</p>
                      <p className="font-medium">{item.adminNote}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-850">
                    <span>Ngày gửi: {new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                    {item.resolvedAt && (
                      <span>Đã xử lý: {new Date(item.resolvedAt).toLocaleString('vi-VN')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl max-w-2xl w-full space-y-3 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-white">Ảnh chứng từ / Bằng chứng</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img src={selectedImage} alt="Chứng từ" className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
