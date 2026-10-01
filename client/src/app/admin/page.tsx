'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Pizza, 
  Star,
  CheckCircle,
  XCircle,
  DollarSign,
  Search,
  MapPin,
  Clock,
  Eye,
  X,
  TrendingUp,
  UserCheck,
  FileText,
  Layers,
  ChevronRight,
  Award,
  BarChart3,
  PieChart,
  ShoppingBag,
  Briefcase,
  Crown
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
  mssv?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface RequestItem {
  id: string;
  foodPlatform: string;
  orderCode?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: string;
  note?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    mssv?: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    mssv?: string;
  };
  feedback?: {
    rating: number;
    comment?: string;
  };
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

type TimeframeFilter = 'TODAY' | 'MONTH' | 'YEAR' | 'ALL';
type ActiveCardType = 'ALL' | 'REQUESTS' | 'REVENUE' | 'USERS' | 'FEEDBACKS' | 'CEO';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');

  const { user: currentUser } = useAuthStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<string | null>(null);

  // Active Card Widget Navigation
  const [activeCard, setActiveCard] = useState<ActiveCardType>(viewParam === 'ceo' ? 'CEO' : 'ALL');

  useEffect(() => {
    if (viewParam === 'ceo') {
      setActiveCard('CEO');
    } else if (!viewParam && activeCard === 'CEO') {
      setActiveCard('ALL');
    }
  }, [viewParam]);

  
  // User Role Sub-filter
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'RECEIVER' | 'STUDENT' | 'ADMIN'>('ALL');

  // Timeframe Filter for Revenue Dashboard
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('TODAY');

  // Revenue Breakdown Modal
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueModalTimeframe, setRevenueModalTimeframe] = useState<TimeframeFilter>('TODAY');

  // Request Section Filters & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<RequestItem | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, requestsRes, feedbacksRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users'),
        api.get('/admin/requests'),
        api.get('/admin/feedbacks'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRequests(requestsRes.data);
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
    if (currentUser?.id === userId) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình');
      return;
    }

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (currentUser?.id === userId) {
      toast.error('Bạn không thể thay đổi vai trò của chính mình');
      return;
    }

    setBtnLoading(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Cập nhật vai trò thành công sang: ${getRoleLabel(newRole)}`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật vai trò người dùng';
      toast.error(msg);
    } finally {
      setBtnLoading(null);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'ADMIN') return 'QUẢN TRỊ';
    if (role === 'RECEIVER') return 'NHẬN HỘ';
    return 'SINH VIÊN';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 whitespace-nowrap">Đang chờ</span>;
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">Đã xác nhận</span>;
      case 'RECEIVED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 whitespace-nowrap">Đã lấy đơn</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">Chờ SV lấy</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">Hoàn thành</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">Đã hủy</span>;
    }
  };

  // Helper to check if a date string falls into the selected timeframe
  const isDateInTimeframe = (dateStr: string, tf: TimeframeFilter) => {
    if (tf === 'ALL') return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (tf === 'TODAY') {
      return d.getDate() === now.getDate() &&
             d.getMonth() === now.getMonth() &&
             d.getFullYear() === now.getFullYear();
    }
    if (tf === 'MONTH') {
      return d.getMonth() === now.getMonth() &&
             d.getFullYear() === now.getFullYear();
    }
    if (tf === 'YEAR') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Revenue & Period Stats Computations
  const periodStats = useMemo(() => {
    const todayCompleted = requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'TODAY'));
    const monthCompleted = requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'MONTH'));
    const yearCompleted = requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'YEAR'));
    const allCompleted = requests.filter(r => r.status === 'COMPLETED');

    return {
      todayRevenue: todayCompleted.length * 5000,
      todayCount: todayCompleted.length,
      monthRevenue: monthCompleted.length * 5000,
      monthCount: monthCompleted.length,
      yearRevenue: yearCompleted.length * 5000,
      yearCount: yearCompleted.length,
      allRevenue: allCompleted.length * 5000,
      allCount: allCompleted.length,
    };
  }, [requests]);

  // Receiver KPI Map Computation (Kiểm soát KPI và số đơn từng người nhận hộ)
  const receiverKPIMap = useMemo(() => {
    const map = new Map<string, {
      totalAssigned: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
      totalEarnings: number;
      ratings: number[];
      avgRating: string;
    }>();

    requests.forEach(r => {
      if (r.receiver) {
        const key = r.receiver.id;
        const current = map.get(key) || {
          totalAssigned: 0,
          completedCount: 0,
          activeCount: 0,
          cancelledCount: 0,
          totalEarnings: 0,
          ratings: [],
          avgRating: 'Chưa có',
        };

        current.totalAssigned += 1;
        if (r.status === 'COMPLETED') {
          current.completedCount += 1;
          current.totalEarnings += 5000;
        } else if (['ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(r.status)) {
          current.activeCount += 1;
        } else if (r.status === 'CANCELLED') {
          current.cancelledCount += 1;
        }

        if (r.feedback?.rating) {
          current.ratings.push(r.feedback.rating);
        }

        map.set(key, current);
      }
    });

    map.forEach((value) => {
      if (value.ratings.length > 0) {
        const sum = value.ratings.reduce((a, b) => a + b, 0);
        value.avgRating = (sum / value.ratings.length).toFixed(1);
      }
    });

    return map;
  }, [requests]);

  // Student Order Stats Map Computation (Thống kê số đơn đã đặt của từng Sinh viên cho CEO Dashboard)
  const studentStatsMap = useMemo(() => {
    const map = new Map<string, {
      totalOrdered: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
      totalSpent: number;
    }>();

    requests.forEach(r => {
      if (r.student) {
        const key = r.student.id;
        const current = map.get(key) || {
          totalOrdered: 0,
          completedCount: 0,
          activeCount: 0,
          cancelledCount: 0,
          totalSpent: 0,
        };

        current.totalOrdered += 1;
        if (r.status === 'COMPLETED') {
          current.completedCount += 1;
          current.totalSpent += 5000;
        } else if (['PENDING', 'ACCEPTED', 'RECEIVED', 'READY_FOR_PICKUP'].includes(r.status)) {
          current.activeCount += 1;
        } else if (r.status === 'CANCELLED') {
          current.cancelledCount += 1;
        }

        map.set(key, current);
      }
    });

    return map;
  }, [requests]);

  // CEO Executive Dashboard Metrics
  const ceoAnalytics = useMemo(() => {
    const totalReqs = requests.length;
    const completedReqs = requests.filter(r => r.status === 'COMPLETED').length;
    const fulfillRate = totalReqs > 0 ? ((completedReqs / totalReqs) * 100).toFixed(1) : '0';

    // Food Platform Share
    const platformMap: Record<string, number> = {};
    requests.forEach(r => {
      const p = r.foodPlatform || 'KHÁC';
      platformMap[p] = (platformMap[p] || 0) + 1;
    });

    // Top Ordering Students
    const topStudents = Array.from(studentStatsMap.entries())
      .map(([id, stat]) => {
        const u = users.find(user => user.id === id);
        return {
          id,
          fullName: u?.fullName || 'Sinh viên',
          email: u?.email || '',
          mssv: u?.mssv || '',
          ...stat
        };
      })
      .sort((a, b) => b.totalOrdered - a.totalOrdered)
      .slice(0, 5);

    // Top Receivers
    const topReceivers = Array.from(receiverKPIMap.entries())
      .map(([id, stat]) => {
        const u = users.find(user => user.id === id);
        return {
          id,
          fullName: u?.fullName || 'Người nhận hộ',
          email: u?.email || '',
          mssv: u?.mssv || '',
          ...stat
        };
      })
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    return {
      fulfillRate,
      platformMap,
      topStudents,
      topReceivers,
    };
  }, [requests, users, studentStatsMap, receiverKPIMap]);

  // Revenue Detailed List for Modal
  const revenueModalRequests = useMemo(() => {
    return requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, revenueModalTimeframe));
  }, [requests, revenueModalTimeframe]);

  // Filtered Requests List
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (r.orderCode && r.orderCode.toLowerCase().includes(q)) ||
        (r.foodPlatform && r.foodPlatform.toLowerCase().includes(q)) ||
        (r.student?.fullName && r.student.fullName.toLowerCase().includes(q)) ||
        (r.student?.email && r.student.email.toLowerCase().includes(q)) ||
        (r.receiver?.fullName && r.receiver.fullName.toLowerCase().includes(q));
      
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === 'ALL') return users;
    return users.filter(u => u.role === userRoleFilter);
  }, [users, userRoleFilter]);

  const getTimeframeLabel = (tf: TimeframeFilter) => {
    if (tf === 'TODAY') return 'Hôm nay';
    if (tf === 'MONTH') return 'Tháng này';
    if (tf === 'YEAR') return 'Năm nay';
    return 'Tất cả thời gian';
  };

  const openRevenueModal = (tf: TimeframeFilter) => {
    setRevenueModalTimeframe(tf);
    setShowRevenueModal(true);
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-4">Đang tải bảng phân tích quản trị...</div>;
  }

  // DEDICATED CEO EXECUTIVE DASHBOARD VIEW
  if (activeCard === 'CEO') {
    const selectedRevenue = 
      timeframe === 'TODAY' ? periodStats.todayRevenue :
      timeframe === 'MONTH' ? periodStats.monthRevenue :
      timeframe === 'YEAR' ? periodStats.yearRevenue :
      periodStats.allRevenue;

    const selectedCount = 
      timeframe === 'TODAY' ? periodStats.todayCount :
      timeframe === 'MONTH' ? periodStats.monthCount :
      timeframe === 'YEAR' ? periodStats.yearCount :
      periodStats.allCount;

    return (
      <div className="space-y-6 pb-12">
        {/* CEO EXECUTIVE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown size={20} className="fill-amber-400/30" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                Báo Cáo Điều Hành CEO Executive
              </h1>
            </div>
            <p className="text-slate-400 text-xs pl-10">
              Tổng hợp chỉ số doanh thu tài chính, thị phần nền tảng giao hàng, KPI người nhận hộ & hành vi đặt đơn của sinh viên
            </p>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto shadow-md overflow-x-auto max-w-full">
            {(['TODAY', 'MONTH', 'YEAR', 'ALL'] as TimeframeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  timeframe === tf
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {getTimeframeLabel(tf)}
              </button>
            ))}
          </div>
        </div>

        {/* 1. KEY EXECUTIVE METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Doanh Thu Phí Dịch Vụ</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{selectedRevenue.toLocaleString()} VNĐ</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-400" />
              <span>{selectedCount} đơn giao thành công ({getTimeframeLabel(timeframe).toLowerCase()})</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tỷ Lệ Hoàn Thành Đơn</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-blue-400 mt-2">{ceoAnalytics.fulfillRate}%</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {periodStats.allCount} đơn thành công / {requests.length} tổng đơn tạo
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trung Bình Đơn / Sinh Viên</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ShoppingBag size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-purple-400 mt-2">
              {(requests.length / (users.filter(u => u.role === 'STUDENT').length || 1)).toFixed(1)} đơn
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tần suất nhu cầu của {users.filter(u => u.role === 'STUDENT').length} sinh viên
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hiệu Suất / Người Nhận Hộ</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Award size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-amber-400 mt-2">
              {(periodStats.allCount / (stats?.activeReceivers || 1)).toFixed(1)} đơn
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.activeReceivers || 0} người nhận hộ hoạt động
            </p>
          </div>

        </div>

        {/* 2. FOOD PLATFORM MARKET SHARE WITH PROGRESS BARS */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <PieChart size={16} /> Thị Phần Nền Tảng Đồ Ăn Sinh Viên Đặt Nhiều Nhất
            </h2>
            <span className="text-xs font-semibold text-slate-400">Tổng cộng {requests.length} đơn</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(ceoAnalytics.platformMap).map(([platform, count]) => {
              const percentNum = requests.length > 0 ? (count / requests.length) * 100 : 0;
              const percentStr = percentNum.toFixed(1);
              return (
                <div key={platform} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-white">{platform}</span>
                    <span className="text-slate-400 font-medium">{count} đơn ({percentStr}%)</span>
                  </div>
                  <div className="w-full bg-slate-955 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentNum}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. TOP PERFORMERS LEADERBOARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 5 Students */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={16} /> Top 5 Sinh Viên Đặt Đơn Nhiều Nhất
              </h3>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Nhu Cầu Cao
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {ceoAnalytics.topStudents.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Chưa có dữ liệu sinh viên đặt đơn</p>
              ) : (
                ceoAnalytics.topStudents.map((s, idx) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400">{s.email} {s.mssv ? `• ${s.mssv}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-orange-400">{s.totalOrdered} đơn đã đặt</span>
                      <p className="text-[10px] text-slate-400">{s.completedCount} đã giao ({s.totalSpent.toLocaleString()} VNĐ)</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top 5 Receivers */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Award size={16} /> Top 5 Người Nhận Hộ KPI Xuất Sắc Nhất
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Hiệu Suất Cao
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {ceoAnalytics.topReceivers.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Chưa có dữ liệu người nhận hộ</p>
              ) : (
                ceoAnalytics.topReceivers.map((r, idx) => (
                  <div key={r.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{r.fullName}</p>
                        <p className="text-[10px] text-slate-400">{r.email} {r.mssv ? `• ${r.mssv}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-400">{r.completedCount} đơn hoàn thành</span>
                      <p className="text-[10px] text-slate-400">Tiền công: {r.totalEarnings.toLocaleString()} VNĐ {r.avgRating !== 'Chưa có' ? `• Star: ${r.avgRating}⭐` : ''}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 4. REVENUE BREAKDOWN & DETAILED LOG MODAL TRIGGER */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                <DollarSign className="text-emerald-400" size={16} />
                Bảng Kê Doanh Thu Phí Dịch Vụ Chi Tiết
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Phí dịch vụ cố định 5.000 VNĐ / đơn hoàn thành. Chọn mốc thời gian để xem từng hóa đơn.</p>
            </div>
            <button
              onClick={() => openRevenueModal(timeframe)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Eye size={14} /> Xem Bảng Kê Đơn Hóa Đơn ({getTimeframeLabel(timeframe)})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-955 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hôm Nay</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{periodStats.todayRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1">{periodStats.todayCount} đơn hoàn thành</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-955 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tháng Này</span>
              <p className="text-xl font-extrabold text-blue-400 mt-1">{periodStats.monthRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1">{periodStats.monthCount} đơn hoàn thành</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-955 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Năm Nay</span>
              <p className="text-xl font-extrabold text-purple-400 mt-1">{periodStats.yearRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1">{periodStats.yearCount} đơn hoàn thành</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-955 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tất Cả Thời Gian</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{periodStats.allRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1">{periodStats.allCount} đơn hoàn thành</p>
            </div>
          </div>
        </div>

        {/* 5. CUSTOMER SATISFACTION (CSAT) SCORE */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 font-extrabold text-2xl shadow-lg">
              {stats?.averageRating.toFixed(1)}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Star size={16} className="fill-yellow-500 text-yellow-500" />
                Chỉ Số Hài Lòng Khách Hàng (CSAT)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Đánh giá trung bình đạt {stats?.averageRating.toFixed(1)} / 5.0⭐ dựa trên {feedbacks.length} lượt phản hồi thực tế từ sinh viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-955 px-4 py-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">Chất lượng dịch vụ:</span>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Rất Tốt (Excellence)
            </span>
          </div>
        </div>

        {/* REVENUE BREAKDOWN MODAL */}
        {showRevenueModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-955">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-400" />
                    Bảng Kê Hóa Đơn Doanh Thu Phí Dịch Vụ ({getTimeframeLabel(revenueModalTimeframe)})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tổng doanh thu: <strong className="text-emerald-400">{(revenueModalRequests.length * 5000).toLocaleString()} VNĐ</strong> ({revenueModalRequests.length} đơn hoàn thành)
                  </p>
                </div>
                <button
                  onClick={() => setShowRevenueModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {revenueModalRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Không có đơn hàng hoàn thành trong khoảng thời gian này</p>
                ) : (
                  revenueModalRequests.map((req) => (
                    <div key={req.id} className="p-3.5 bg-slate-955 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-orange-400">#{req.orderCode || req.id.slice(0, 8)}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">{req.foodPlatform}</span>
                        </div>
                        <p className="text-xs font-semibold text-white mt-1">SV: {req.student.fullName} ({req.student.email})</p>
                        <p className="text-[10px] text-slate-400">Nhận hộ: {req.receiver?.fullName || 'N/A'} • Thời gian: {new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">+5.000 VNĐ</span>
                        <p className="text-[10px] text-slate-400">Phí cố định</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-orange-500" size={24} />
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-slate-400 text-xs">Chạm trực tiếp vào các ô chỉ số bên dưới để xem mục tương ứng & kiểm soát KPI</p>
        </div>

        {activeCard !== 'ALL' && (
          <button
            onClick={() => {
              setActiveCard('ALL');
              setUserRoleFilter('ALL');
            }}
            className="self-start sm:self-auto flex items-center gap-1.5 bg-slate-955 border border-slate-800 hover:border-orange-500 text-orange-400 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Layers size={14} /> Hiển thị tất cả mục
          </button>
        )}
      </div>

      {/* INTERACTIVE APP METRIC CARDS (CHẠM TRỰC TIẾP VÀO CÁC Ô ĐỂ XEM MỤC TƯƠNG ỨNG) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* 1. TỔNG ĐƠN CARD */}
          <div
            onClick={() => setActiveCard(activeCard === 'REQUESTS' ? 'ALL' : 'REQUESTS')}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'REQUESTS'
                ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Pizza size={18} />
              </div>
              {activeCard === 'REQUESTS' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-orange-400 flex items-center gap-0.5">
                  Chạm xem <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đơn Đã Đặt</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalRequests}</p>
            </div>
          </div>

          {/* 2. TỔNG THU NHẬP CARD */}
          <div
            onClick={() => setActiveCard(activeCard === 'REVENUE' ? 'ALL' : 'REVENUE')}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'REVENUE'
                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <DollarSign size={18} />
              </div>
              {activeCard === 'REVENUE' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-emerald-400 flex items-center gap-0.5">
                  Chạm xem <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thu Nhập</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{periodStats.allRevenue.toLocaleString()} VNĐ</p>
            </div>
          </div>

          {/* 3. NGƯỜI NHẬN HỘ CARD */}
          <div
            onClick={() => {
              setActiveCard('USERS');
              setUserRoleFilter('RECEIVER');
            }}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'USERS' && userRoleFilter === 'RECEIVER'
                ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <UserCheck size={18} />
              </div>
              {activeCard === 'USERS' && userRoleFilter === 'RECEIVER' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-blue-400 flex items-center gap-0.5">
                  KPI & Đơn <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người Nhận Hộ</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats.activeReceivers}</p>
            </div>
          </div>

          {/* 4. TỔNG THÀNH VIÊN CARD */}
          <div
            onClick={() => {
              setActiveCard('USERS');
              setUserRoleFilter('ALL');
            }}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'USERS' && userRoleFilter === 'ALL'
                ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <Users size={18} />
              </div>
              {activeCard === 'USERS' && userRoleFilter === 'ALL' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-purple-400 flex items-center gap-0.5">
                  Chạm xem <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thành Viên</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalUsers}</p>
            </div>
          </div>

          {/* 5. ĐÁNH GIÁ TB CARD */}
          <div
            onClick={() => setActiveCard(activeCard === 'FEEDBACKS' ? 'ALL' : 'FEEDBACKS')}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'FEEDBACKS'
                ? 'bg-yellow-500/10 border-yellow-500 ring-2 ring-yellow-500/40 shadow-lg shadow-yellow-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                <Star className="fill-yellow-500" size={18} />
              </div>
              {activeCard === 'FEEDBACKS' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-yellow-400 flex items-center gap-0.5">
                  Chạm xem <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đánh Giá TB</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats.averageRating.toFixed(1)} / 5.0</p>
            </div>
          </div>

        </div>
      )}



      {/* SECTION 1: REVENUE DASHBOARD (KHI CHẠM VÀO Ô TỔNG THU NHẬP HOẶC XEM TẤT CẢ) */}
      {(activeCard === 'ALL' || activeCard === 'REVENUE') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={18} />
                Theo Dõi Doanh Thu & Bảng Lương Dịch Vụ
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Giá phí cố định 5.000 VNĐ / đơn hoàn thành thành công. Bấm vào từng ô để xem bảng kê chi tiết.</p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1.5 bg-slate-955 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setTimeframe('TODAY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  timeframe === 'TODAY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setTimeframe('MONTH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  timeframe === 'MONTH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => setTimeframe('YEAR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  timeframe === 'YEAR' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Năm nay
              </button>
              <button
                onClick={() => setTimeframe('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  timeframe === 'ALL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Revenue Cards Grid by Timeframe (Clickable for Detail Modal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Today Card */}
            <div 
              onClick={() => openRevenueModal('TODAY')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${timeframe === 'TODAY' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-slate-955 border-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh Thu Hôm Nay</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Xem chi tiết</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-400 mt-2">{periodStats.todayRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{periodStats.todayCount} đơn hoàn thành</span>
                <Eye size={12} className="text-emerald-400" />
              </p>
            </div>

            {/* Month Card */}
            <div 
              onClick={() => openRevenueModal('MONTH')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${timeframe === 'MONTH' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-slate-955 border-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh Thu Tháng Này</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">Xem chi tiết</span>
              </div>
              <p className="text-xl font-extrabold text-blue-400 mt-2">{periodStats.monthRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{periodStats.monthCount} đơn hoàn thành</span>
                <Eye size={12} className="text-blue-400" />
              </p>
            </div>

            {/* Year Card */}
            <div 
              onClick={() => openRevenueModal('YEAR')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${timeframe === 'YEAR' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-slate-955 border-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh Thu Năm Nay</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">Xem chi tiết</span>
              </div>
              <p className="text-xl font-extrabold text-purple-400 mt-2">{periodStats.yearRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{periodStats.yearCount} đơn hoàn thành</span>
                <Eye size={12} className="text-purple-400" />
              </p>
            </div>

            {/* All Time Card */}
            <div 
              onClick={() => openRevenueModal('ALL')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${timeframe === 'ALL' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-slate-955 border-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng Thu Nhập Tích Lũy</span>
                <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold">Xem chi tiết</span>
              </div>
              <p className="text-xl font-extrabold text-orange-400 mt-2">{periodStats.allRevenue.toLocaleString()} VNĐ</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{periodStats.allCount} tổng đơn hoàn thành</span>
                <Eye size={12} className="text-orange-400" />
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => openRevenueModal(timeframe)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <FileText size={14} /> Xem Bảng Kê Chi Tiết Thu Nhập ({getTimeframeLabel(timeframe)})
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: REQUESTS LIST (KHI CHẠM VÀO Ô TỔNG ĐƠN HOẶC XEM TẤT CẢ) */}
      {(activeCard === 'ALL' || activeCard === 'REQUESTS') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <FileText className="text-orange-500" size={18} />
                Danh Sách Tất Cả Đơn Hàng ({filteredRequests.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Xem chi tiết từng đơn hàng, trạng thái, người gửi, người nhận hộ và ảnh chụp</p>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đơn, tên, email..."
                  className="bg-slate-955 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-955 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="ACCEPTED">Đã xác nhận</option>
                <option value="RECEIVED">Đã lấy đơn</option>
                <option value="READY_FOR_PICKUP">Chờ SV lấy</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Requests Desktop Table */}
          <div className="hidden md:block overflow-hidden border border-slate-800 rounded-2xl bg-slate-955/50">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Mã đơn / Ứng dụng</th>
                  <th className="px-4 py-3.5 font-bold">Sinh viên gửi</th>
                  <th className="px-4 py-3.5 font-bold">Người nhận hộ</th>
                  <th className="px-4 py-3.5 font-bold">Địa điểm</th>
                  <th className="px-4 py-3.5 font-bold">Giờ giao dự kiến</th>
                  <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-bold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      Không tìm thấy đơn hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white">{req.foodPlatform}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {req.orderCode ? `Mã: ${req.orderCode}` : 'Có ảnh đính kèm'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white">{req.student?.fullName}</p>
                        <p className="text-[10px] text-slate-500">{req.student?.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {req.receiver ? (
                          <>
                            <p className="font-bold text-slate-200">{req.receiver.fullName}</p>
                            <p className="text-[10px] text-slate-500">{req.receiver.email}</p>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-400">
                        <p className="font-medium text-slate-300">{req.pickupLocation}</p>
                        <p className="text-slate-500">→ {req.dropoffLocation || 'Sảnh Trống Đồng'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-400">
                        {new Date(req.pickupTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedRequestDetail(req)}
                          className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye size={12} /> Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Requests Mobile Native Cards */}
          <div className="md:hidden space-y-3">
            {filteredRequests.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">Không tìm thấy đơn hàng nào phù hợp.</p>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                    <div>
                      <span className="font-extrabold text-xs text-orange-500 uppercase tracking-wider">{req.foodPlatform}</span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{req.orderCode || req.id.slice(0, 8)}</p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Sinh viên gửi</span>
                      <p className="font-bold text-white truncate">{req.student?.fullName}</p>
                      <p className="text-[9px] text-slate-400 truncate">{req.student?.email}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Người nhận hộ</span>
                      <p className="font-bold text-slate-200 truncate">{req.receiver ? req.receiver.fullName : 'Chưa phân công'}</p>
                      <p className="text-[9px] text-slate-400 truncate">{req.receiver?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <div className="text-[10px] text-slate-400">
                      <span>{req.pickupLocation} → {req.dropoffLocation || 'Sảnh Trống Đồng'}</span>
                    </div>
                    <button
                      onClick={() => setSelectedRequestDetail(req)}
                      className="px-3 py-1 rounded-lg bg-orange-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} /> Xem đơn
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: USERS LIST, STUDENT ORDER STATS & RECEIVER KPI TRACKING */}
      {(activeCard === 'ALL' || activeCard === 'USERS') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                Kiểm Duyệt Thành Viên, Đơn Đã Đặt (Sinh Viên) & KPI (Nhận Hộ) ({filteredUsers.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Thống kê số đơn sinh viên đã đặt & số đơn người nhận hộ đã làm để báo cáo CEO</p>
            </div>

            {/* Sub-filter by Role */}
            <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  userRoleFilter === 'ALL' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('RECEIVER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  userRoleFilter === 'RECEIVER' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nhận hộ ({users.filter(u => u.role === 'RECEIVER').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('STUDENT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  userRoleFilter === 'STUDENT' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sinh viên ({users.filter(u => u.role === 'STUDENT').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('ADMIN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  userRoleFilter === 'ADMIN' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quản trị ({users.filter(u => u.role === 'ADMIN').length})
              </button>
            </div>
          </div>

          {/* Users Desktop Table */}
          <div className="hidden md:block overflow-hidden border border-slate-800 rounded-2xl bg-slate-955/50">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Tên / Email / MSSV</th>
                  <th className="px-4 py-3.5 font-bold">Vai trò</th>
                  <th className="px-4 py-3.5 font-bold text-center">Số đơn đặt / Nhận</th>
                  <th className="px-4 py-3.5 font-bold text-center">Hoàn thành / Đang làm</th>
                  <th className="px-4 py-3.5 font-bold text-center">Chi trả / Thu nhập</th>
                  <th className="px-4 py-3.5 font-bold text-center">Đánh giá</th>
                  <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                      Không tìm thấy thành viên nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id || currentUser?.email?.toLowerCase() === u.email?.toLowerCase();
                    const receiverKPI = receiverKPIMap.get(u.id);
                    const studentStat = studentStatsMap.get(u.id);

                    return (
                      <tr 
                        key={u.id} 
                        className={`transition-colors ${
                          isSelf 
                            ? 'bg-orange-500/10 border-l-4 border-l-orange-500 font-medium' 
                            : 'hover:bg-slate-800/10'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{u.fullName}</p>
                            {isSelf && (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-orange-600 text-white shadow-sm shadow-orange-600/30 uppercase tracking-wider">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{u.email} {u.mssv ? `• MSSV: ${u.mssv}` : ''}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          {isSelf ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                              QUẢN TRỊ (Bạn)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={btnLoading === u.id}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-200 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                            >
                              <option value="STUDENT">SINH VIÊN</option>
                              <option value="RECEIVER">NHẬN HỘ</option>
                              <option value="ADMIN">QUẢN TRỊ</option>
                            </select>
                          )}
                        </td>

                        {/* SỐ ĐƠN ĐÃ ĐẶT (SINH VIÊN) NẾU LA SINH VIÊN / SỐ ĐƠN NHẬN (NHẬN HỘ) NẾU LÀ NHẬN HỘ */}
                        <td className="px-4 py-3.5 text-center">
                          {u.role === 'STUDENT' ? (
                            studentStat && studentStat.totalOrdered > 0 ? (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                {studentStat.totalOrdered} đơn đã đặt
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">0 đơn</span>
                            )
                          ) : u.role === 'RECEIVER' ? (
                            receiverKPI && receiverKPI.totalAssigned > 0 ? (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {receiverKPI.totalAssigned} đơn đã nhận
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">0 đơn</span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                          )}
                        </td>

                        {/* HOÀN THÀNH / ĐANG LÀM */}
                        <td className="px-4 py-3.5 text-center">
                          {u.role === 'STUDENT' ? (
                            studentStat && studentStat.totalOrdered > 0 ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-emerald-400">
                                  {studentStat.completedCount} đã xong
                                </span>
                                {studentStat.activeCount > 0 && (
                                  <p className="text-[9px] text-orange-400">({studentStat.activeCount} đang chờ)</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )
                          ) : receiverKPI && receiverKPI.totalAssigned > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-emerald-400">
                                {receiverKPI.completedCount} đã xong
                              </span>
                              {receiverKPI.activeCount > 0 && (
                                <p className="text-[9px] text-blue-400">({receiverKPI.activeCount} đang giao)</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                          )}
                        </td>

                        {/* CHI TRẢ (SINH VIÊN) HOẶC THU NHẬP (NHẬN HỘ) */}
                        <td className="px-4 py-3.5 text-center">
                          {u.role === 'STUDENT' ? (
                            studentStat && studentStat.completedCount > 0 ? (
                              <span className="font-bold text-slate-200 text-xs">
                                {(studentStat.totalSpent).toLocaleString()} VNĐ
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">0 VNĐ</span>
                            )
                          ) : receiverKPI && receiverKPI.completedCount > 0 ? (
                            <span className="font-bold text-emerald-400 text-xs">
                              {(receiverKPI.totalEarnings).toLocaleString()} VNĐ
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600">0 VNĐ</span>
                          )}
                        </td>

                        {/* ĐÁNH GIÁ */}
                        <td className="px-4 py-3.5 text-center">
                          {u.role === 'RECEIVER' && receiverKPI && receiverKPI.avgRating !== 'Chưa có' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                              <Star size={10} className="fill-yellow-400" /> {receiverKPI.avgRating}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1.5">
                            {u.status === 'ACTIVE' ? (
                              <>
                                <CheckCircle size={12} className="text-emerald-500" />
                                <span className="text-[11px] text-emerald-400 font-semibold">Hoạt động</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} className="text-red-500" />
                                <span className="text-[11px] text-red-400 font-semibold">Bị khóa</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-slate-500 font-semibold italic">
                              Đang sử dụng
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              disabled={btnLoading === u.id}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {btnLoading === u.id ? '...' : u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Users Mobile Native Cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">Không tìm thấy thành viên nào trong mục này.</p>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = currentUser?.id === u.id || currentUser?.email?.toLowerCase() === u.email?.toLowerCase();
                const receiverKPI = receiverKPIMap.get(u.id);
                const studentStat = studentStatsMap.get(u.id);

                return (
                  <div key={u.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center font-bold text-xs text-orange-500 shrink-0">
                          {u.fullName ? u.fullName[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-white flex items-center gap-1.5">
                            {u.fullName}
                            {isSelf && (
                              <span className="px-1.5 py-0.2 text-[8px] bg-orange-600 text-white font-extrabold rounded-full">
                                Bạn
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">{u.email} {u.mssv ? `• MSSV: ${u.mssv}` : ''}</p>
                        </div>
                      </div>

                      <div>
                        {isSelf ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            QUẢN TRỊ
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={btnLoading === u.id}
                            className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-200 cursor-pointer"
                          >
                            <option value="STUDENT">SINH VIÊN</option>
                            <option value="RECEIVER">NHẬN HỘ</option>
                            <option value="ADMIN">QUẢN TRỊ</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-slate-500 font-semibold block text-[9px] uppercase">Số đơn</span>
                        <span className="font-extrabold text-orange-400">
                          {u.role === 'STUDENT' ? `${studentStat?.totalOrdered || 0} đã đặt` : `${receiverKPI?.totalAssigned || 0} đã nhận`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-slate-500 font-semibold block text-[9px] uppercase">Chi trả / Thu nhập</span>
                        <span className="font-extrabold text-emerald-400">
                          {u.role === 'STUDENT' ? `${(studentStat?.totalSpent || 0).toLocaleString()} VNĐ` : `${(receiverKPI?.totalEarnings || 0).toLocaleString()} VNĐ`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-xs">
                      <span className="flex items-center gap-1">
                        {u.status === 'ACTIVE' ? (
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle size={12} /> Hoạt động
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold text-[10px] flex items-center gap-1">
                            <XCircle size={12} /> Bị khóa
                          </span>
                        )}
                      </span>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          disabled={btnLoading === u.id}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {btnLoading === u.id ? '...' : u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: FEEDBACK LOG (KHI CHẠM VÀO Ô ĐÁNH GIÁ TB HOẶC XEM TẤT CẢ) */}
      {(activeCard === 'ALL' || activeCard === 'FEEDBACKS') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" size={18} />
            Đánh Giá Dịch Vụ Từ Sinh Viên ({feedbacks.length})
          </h2>

          {feedbacks.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-6">Chưa có phản hồi đánh giá nào từ người dùng.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs font-bold text-white">{f.student.fullName}</p>
                        <p className="text-[9px] text-slate-500">{f.student.email}</p>
                      </div>
                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 shrink-0 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={10} 
                            className={s <= f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Đơn hàng: <span className="text-orange-400 font-semibold">{f.request.foodPlatform}</span> ({f.request.orderCode || 'Có ảnh chụp'})
                    </p>

                    {f.comment && (
                      <p className="text-xs italic text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-855 mt-1">
                        &ldquo;{f.comment}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-500 self-end">
                    {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVENUE BREAKDOWN MODAL (BẢNG KÊ CHI TIẾT THU NHẬP) */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-3xl w-full space-y-5 relative my-8">
            <button
              onClick={() => setShowRevenueModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-4 pr-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="text-emerald-400" size={20} />
                    Bảng Kê Chi Tiết Thu Nhập ({getTimeframeLabel(revenueModalTimeframe)})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Danh sách các đơn hàng đã hoàn thành tạo ra doanh thu 5.000 VNĐ / đơn</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tổng Doanh Thu</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {(revenueModalRequests.length * 5000).toLocaleString()} VNĐ
                  </span>
                </div>
              </div>

              {/* Timeframe Quick Switcher */}
              <div className="flex items-center gap-1.5 mt-4 bg-slate-955 p-1 rounded-xl border border-slate-800 w-fit">
                <button
                  onClick={() => setRevenueModalTimeframe('TODAY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    revenueModalTimeframe === 'TODAY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hôm nay ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'TODAY')).length})
                </button>
                <button
                  onClick={() => setRevenueModalTimeframe('MONTH')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    revenueModalTimeframe === 'MONTH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tháng này ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'MONTH')).length})
                </button>
                <button
                  onClick={() => setRevenueModalTimeframe('YEAR')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    revenueModalTimeframe === 'YEAR' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Năm nay ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'YEAR')).length})
                </button>
                <button
                  onClick={() => setRevenueModalTimeframe('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    revenueModalTimeframe === 'ALL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({requests.filter(r => r.status === 'COMPLETED').length})
                </button>
              </div>
            </div>

            {/* Revenue Requests Table */}
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              {revenueModalRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  Chưa có đơn hàng nào hoàn thành trong khoảng thời gian này.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-350">
                  <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-900">
                    <tr>
                      <th className="pb-3 font-semibold">Đơn hàng / Mã</th>
                      <th className="pb-3 font-semibold">Người nhận hộ (Thu nhập)</th>
                      <th className="pb-3 font-semibold">Sinh viên người dùng</th>
                      <th className="pb-3 font-semibold">Thời gian hoàn thành</th>
                      <th className="pb-3 font-semibold text-right">Phí dịch vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {revenueModalRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/20">
                        <td className="py-3">
                          <p className="font-bold text-white">{req.foodPlatform}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {req.orderCode ? `Mã: ${req.orderCode}` : 'Có ảnh đơn'}
                          </p>
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-blue-400">{req.receiver?.fullName || 'Người nhận hộ'}</p>
                          <p className="text-[10px] text-slate-500">{req.receiver?.email}</p>
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-slate-200">{req.student?.fullName}</p>
                          <p className="text-[10px] text-slate-500">{req.student?.email}</p>
                        </td>
                        <td className="py-3 text-[10px] text-slate-400">
                          {new Date(req.updatedAt || req.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            +5.000 VNĐ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRevenueModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Đóng bảng kê
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST DETAIL MODAL */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-xl w-full space-y-5 relative my-8">
            <button
              onClick={() => setSelectedRequestDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  {selectedRequestDetail.foodPlatform}
                </span>
                {getStatusBadge(selectedRequestDetail.status)}
              </div>
              <h3 className="text-lg font-bold text-white mt-2">
                Mã đơn: {selectedRequestDetail.orderCode || 'Đã đính kèm ảnh đơn hàng'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedRequestDetail.id}</p>
            </div>

            {/* Student & Receiver Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student info */}
              <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Người gửi (Sinh viên)</p>
                <p className="text-xs font-bold text-white">{selectedRequestDetail.student.fullName}</p>
                <p className="text-[10px] text-slate-400">{selectedRequestDetail.student.email}</p>
                {selectedRequestDetail.student.phoneNumber && (
                  <p className="text-[10px] text-slate-400">SĐT: {selectedRequestDetail.student.phoneNumber}</p>
                )}
                {selectedRequestDetail.student.mssv && (
                  <p className="text-[10px] text-slate-400">MSSV: {selectedRequestDetail.student.mssv}</p>
                )}
              </div>

              {/* Receiver info */}
              <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">Người nhận hộ được giao</p>
                {selectedRequestDetail.receiver ? (
                  <>
                    <p className="text-xs font-bold text-white">{selectedRequestDetail.receiver.fullName}</p>
                    <p className="text-[10px] text-slate-400">{selectedRequestDetail.receiver.email}</p>
                    {selectedRequestDetail.receiver.phoneNumber && (
                      <p className="text-[10px] text-slate-400">SĐT: {selectedRequestDetail.receiver.phoneNumber}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Chưa có ai nhận đơn này</p>
                )}
              </div>
            </div>

            {/* Location & Time info */}
            <div className="space-y-2 text-xs bg-slate-955 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-orange-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500">Giao tới: </span>
                  <span className="font-bold text-white">{selectedRequestDetail.pickupLocation}</span>
                  <span className="text-[10px] text-slate-500"> → Trả khách tại: </span>
                  <span className="font-bold text-white">{selectedRequestDetail.dropoffLocation || 'Sảnh Trống Đồng'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-855">
                <Clock size={14} className="text-orange-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500">Giờ hẹn giao: </span>
                  <span className="font-bold text-white">{new Date(selectedRequestDetail.pickupTime).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Note if present */}
            {selectedRequestDetail.note && (
              <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ghi chú của sinh viên</p>
                <p className="text-xs text-slate-300">{selectedRequestDetail.note}</p>
              </div>
            )}

            {/* Image Preview if present */}
            {selectedRequestDetail.imageUrl && (
              <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ảnh màn hình đơn hàng</p>
                <div className="relative max-w-full h-40 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <img
                    src={selectedRequestDetail.imageUrl}
                    alt="Ảnh đơn hàng"
                    className="max-h-full max-w-full object-contain cursor-zoom-in rounded-lg"
                    onClick={() => setFullscreenImage(selectedRequestDetail.imageUrl || null)}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1.5 text-center">Chạm vào ảnh để phóng to</p>
              </div>
            )}

            {/* Feedback if completed */}
            {selectedRequestDetail.feedback && (
              <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-400">Đánh giá của sinh viên</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={12} 
                      className={s <= selectedRequestDetail.feedback!.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'} 
                    />
                  ))}
                </div>
                {selectedRequestDetail.feedback.comment && (
                  <p className="text-xs italic text-slate-300">&ldquo;{selectedRequestDetail.feedback.comment}&rdquo;</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE OVERLAY */}
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

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm py-4">Đang tải bảng phân tích quản trị...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

