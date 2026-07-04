'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Pizza, 
  Star,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';

interface Stats {
  totalRequests: number;
  totalUsers: number;
  activeReceivers: number;
  statusDistribution: Record<string, number>;
  averageRating: number;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student: {
    fullName: string;
    email: string;
  };
  request: {
    orderCode: string;
    foodPlatform: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, feedbacksRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users'),
        api.get('/admin/feedbacks'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (err: any) {
      toast.error('Không thể tải dữ liệu quản trị viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setBtnLoading(userId);
    try {
      await api.patch(`/users/${userId}/status`, { status: nextStatus });
      toast.success(`Cập nhật trạng thái thành công sang: ${nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}`);
      fetchData();
    } catch (err: any) {
      toast.error('Không thể cập nhật trạng thái người dùng');
    } finally {
      setBtnLoading(null);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'ADMIN') return 'QUẢN TRỊ';
    if (role === 'RECEIVER') return 'NHẬN HỘ';
    return 'SINH VIÊN';
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-4">Đang tải bảng phân tích quản trị...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Shield className="text-orange-500" size={24} />
          Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-slate-400 text-xs mt-1">Giám sát hoạt động hệ thống, quản lý tài khoản và xem các đánh giá dịch vụ</p>
      </div>

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <Pizza size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn</p>
              <p className="text-md font-bold text-white mt-0.5">{stats.totalRequests}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Thu Nhập</p>
              <p className="text-md font-bold text-white mt-0.5">{((stats.statusDistribution?.['COMPLETED'] || 0) * 5000).toLocaleString()} VND</p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Người Nhận Hộ</p>
              <p className="text-md font-bold text-white mt-0.5">{stats.activeReceivers}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Thành Viên</p>
              <p className="text-md font-bold text-white mt-0.5">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
              <Star className="fill-yellow-500" size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Đánh Giá TB</p>
              <p className="text-md font-bold text-white mt-0.5">{stats.averageRating.toFixed(1)} / 5.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* User Management */}
        <div className="xl:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            Kiểm duyệt Thành viên
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Tên / Email</th>
                  <th className="pb-3 font-semibold">Vai trò</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                  <th className="pb-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/10">
                    <td className="py-3">
                      <p className="font-bold text-white">{u.fullName}</p>
                      <p className="text-[10px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        u.role === 'RECEIVER' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1">
                        {u.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle size={10} className="text-emerald-500" />
                            <span className="text-[11px] text-emerald-500 font-medium">Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={10} className="text-red-500" />
                            <span className="text-[11px] text-red-500 font-medium">Bị khóa</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          disabled={btnLoading === u.id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {btnLoading === u.id ? '...' : u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Log */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl h-fit space-y-4">
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" size={18} />
            Đánh giá từ Sinh viên
          </h2>

          {feedbacks.length === 0 ? (
            <p className="text-[11px] text-slate-550 text-center py-4">Chưa có phản hồi nào từ người dùng.</p>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-3 bg-slate-955 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-white">{f.student.fullName}</p>
                      <p className="text-[9px] text-slate-550">{f.student.email}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={10} 
                          className={s <= f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500">
                    Đơn hàng: <span className="text-slate-400 font-medium">{f.request.foodPlatform} ({f.request.orderCode})</span>
                  </p>

                  {f.comment && (
                    <p className="text-xs italic text-slate-400 mt-1">
                      &ldquo;{f.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
