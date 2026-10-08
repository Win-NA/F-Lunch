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
  Crown,
  AlertTriangle
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
  realBalance?: number;
  bonusBalance?: number;
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

interface ReportTicketItem {
  id: string;
  userId: string;
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
  user: {
    id: string;
    fullName: string;
    email: string;
    mssv?: string;
    phoneNumber?: string;
    realBalance?: number;
    bonusBalance?: number;
  };
}

type TimeframeFilter = 'TODAY' | 'MONTH' | 'YEAR' | 'ALL';
type ActiveCardType = 'ALL' | 'REQUESTS' | 'REVENUE' | 'USERS' | 'FEEDBACKS' | 'CEO' | 'TRANSACTIONS' | 'REPORTS';

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

  // Transactions State
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [userTxModal, setUserTxModal] = useState<UserItem | null>(null);
  const [userTxTypeFilter, setUserTxTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'ORDER_PAYMENT'>('ALL');
  const [memberModalSearch, setMemberModalSearch] = useState<string>('');
  const [auditLogSearch, setAuditLogSearch] = useState<string>('');

  // Reports State
  const [adminReports, setAdminReports] = useState<ReportTicketItem[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('ALL');

  // Report Processing Modal State
  const [processReportModal, setProcessReportModal] = useState<ReportTicketItem | null>(null);
  const [processAction, setProcessAction] = useState<'APPROVED' | 'REJECTED' | 'RESOLVED'>('APPROVED');
  const [processAmount, setProcessAmount] = useState<string>('');
  const [processBonusAmount, setProcessBonusAmount] = useState<string>('');
  const [processAdminNote, setProcessAdminNote] = useState<string>('');
  const [processLoading, setProcessLoading] = useState(false);

  // Balance Adjust Modal State
  const [adjustModalUser, setAdjustModalUser] = useState<UserItem | null>(null);
  const [adjustAction, setAdjustAction] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustBalanceType, setAdjustBalanceType] = useState<'REAL' | 'BONUS'>('REAL');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Active Card Widget Navigation
  const [activeCard, setActiveCard] = useState<ActiveCardType>(
    viewParam === 'ceo' ? 'CEO' : viewParam === 'reports' ? 'REPORTS' : 'ALL'
  );

  useEffect(() => {
    if (viewParam === 'ceo') {
      setActiveCard('CEO');
    } else if (viewParam === 'reports') {
      setActiveCard('REPORTS');
    } else if (!viewParam) {
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
  const [userOrdersModal, setUserOrdersModal] = useState<{ user: UserItem; role: 'STUDENT' | 'RECEIVER' } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const openRevenueModal = (tf: TimeframeFilter) => {
    setRevenueModalTimeframe(tf);
    setShowRevenueModal(true);
  };

  const openAdjustModal = (targetUser: UserItem, defaultAction: 'ADD' | 'SUBTRACT' = 'ADD') => {
    setAdjustModalUser(targetUser);
    setAdjustAction(defaultAction);
    setAdjustAmount('');
    setAdjustNote('');
  };

  const openProcessReportModal = (report: ReportTicketItem, defaultAction: 'APPROVED' | 'REJECTED' | 'RESOLVED' = 'APPROVED') => {
    setProcessReportModal(report);
    setProcessAction(defaultAction);
    setProcessAmount(report.expectedAmount ? String(report.expectedAmount) : '');
    setProcessBonusAmount('');
    setProcessAdminNote('');
  };

  const handleApproveTx = async (txId: string) => {
    try {
      await api.post(`/transactions/admin/${txId}/approve`);
      toast.success('Đã duyệt & cộng tiền vào ví thành công!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể duyệt giao dịch');
    }
  };

  const handleRejectTx = async (txId: string) => {
    try {
      await api.post(`/transactions/admin/${txId}/reject`);
      toast.success('Đã từ chối giao dịch!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể từ chối giao dịch');
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, requestsRes, feedbacksRes, txRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users'),
        api.get('/admin/requests'),
        api.get('/admin/feedbacks'),
        api.get('/transactions/admin'),
        api.get('/reports/admin'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRequests(requestsRes.data);
      setFeedbacks(feedbacksRes.data);
      setAdminTransactions(txRes.data || []);
      setAdminReports(reportsRes.data || []);
    } catch (err: any) {
      if (err.response && err.response.status !== 401 && err.response.status !== 403 && useAuthStore.getState().accessToken) {
        toast.error('Không thể tải dữ liệu quản trị viên');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processReportModal) return;

    setProcessLoading(true);
    try {
      await api.patch(`/reports/admin/${processReportModal.id}/process`, {
        status: processAction,
        approvedAmount: processAmount ? Number(processAmount) : undefined,
        bonusAmount: processBonusAmount ? Number(processBonusAmount) : undefined,
        adminNote: processAdminNote.trim() || undefined,
      });

      toast.success(
        processAction === 'APPROVED'
          ? 'Đã duyệt báo cáo & cộng tiền thành công vào ví sinh viên!'
          : processAction === 'REJECTED'
          ? 'Đã từ chối khiếu nại báo cáo!'
          : 'Đã cập nhật trạng thái giải quyết sự cố!'
      );

      setProcessReportModal(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xử lý báo cáo';
      toast.error(msg);
    } finally {
      setProcessLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser || !adjustAmount) return;
    let amountNum = Math.abs(Number(adjustAmount));
    if (isNaN(amountNum) || amountNum === 0) {
      toast.error('Số tiền điều chỉnh không hợp lệ');
      return;
    }

    if (adjustAction === 'SUBTRACT') {
      amountNum = -amountNum;
    }

    setAdjustLoading(true);
    try {
      const executorInfo = currentUser?.fullName ? ` (bởi Admin ${currentUser.fullName})` : '';
      const baseNote = adjustNote || (amountNum > 0 ? 'Admin cộng tiền vào ví' : 'Admin trừ tiền khỏi ví');

      await api.post('/transactions/admin/adjust', {
        targetUserId: adjustModalUser.id,
        amount: amountNum,
        balanceType: adjustBalanceType,
        note: `${baseNote}${executorInfo}`,
      });

      toast.success(`Đã ${amountNum > 0 ? 'cộng' : 'trừ'} ${Math.abs(amountNum).toLocaleString('vi-VN')}đ cho ${adjustModalUser.fullName}`);
      setAdjustModalUser(null);
      setAdjustAmount('');
      setAdjustNote('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể điều chỉnh số dư');
    } finally {
      setAdjustLoading(false);
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

  // Receiver KPI Map Computation (Kiểm soát KPI và số đơn từng người nhận hộ theo mốc lũy tiến)
  const receiverKPIMap = useMemo(() => {
    const map = new Map<string, {
      totalAssigned: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
      totalEarnings: number;
      ratings: number[];
      avgRating: string;
      dailyRequests: Map<string, number>;
    }>();

    const calculateDailyEarnings = (N: number): number => {
      if (N <= 0) return 0;
      if (N <= 10) return N * 3000;
      if (N <= 20) return 30000 + (N - 10) * 3500;
      return 65000 + (N - 20) * 3800;
    };

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
          dailyRequests: new Map<string, number>(),
        };

        current.totalAssigned += 1;
        if (r.status === 'COMPLETED') {
          current.completedCount += 1;
          const d = new Date(r.updatedAt || r.createdAt);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          current.dailyRequests.set(dateKey, (current.dailyRequests.get(dateKey) || 0) + 1);
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
      let sumEarnings = 0;
      value.dailyRequests.forEach((count) => {
        sumEarnings += calculateDailyEarnings(count);
      });
      value.totalEarnings = sumEarnings;

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

    // Financial Metrics from Transactions
    const depositTxs = adminTransactions.filter(t => t.type === 'DEPOSIT' && t.status === 'APPROVED');

    const todayDeposits = depositTxs.filter(t => isDateInTimeframe(t.createdAt, 'TODAY'));
    const monthDeposits = depositTxs.filter(t => isDateInTimeframe(t.createdAt, 'MONTH'));
    const yearDeposits = depositTxs.filter(t => isDateInTimeframe(t.createdAt, 'YEAR'));

    const todayDepositSum = todayDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthDepositSum = monthDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const yearDepositSum = yearDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDeposited = depositTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalBonusGiven = depositTxs.reduce((sum, t) => sum + (t.bonusAmount || 0), 0);
    const totalFeesCollected = completedReqs * 5000;

    // Food Platform Share
    const platformMap: Record<string, number> = {};
    requests.forEach(r => {
      const p = r.foodPlatform || 'KHÁC';
      platformMap[p] = (platformMap[p] || 0) + 1;
    });

    // Top Depositors Ranking
    const userDepositMap = new Map<string, { totalAmount: number; count: number }>();
    depositTxs.forEach(t => {
      const uid = t.userId || t.user?.id;
      if (uid) {
        const curr = userDepositMap.get(uid) || { totalAmount: 0, count: 0 };
        curr.totalAmount += t.amount;
        curr.count += 1;
        userDepositMap.set(uid, curr);
      }
    });

    const topDepositors = Array.from(userDepositMap.entries())
      .map(([id, stat]) => {
        const u = users.find(user => user.id === id);
        return {
          id,
          fullName: u?.fullName || 'Thành viên',
          email: u?.email || '',
          mssv: u?.mssv || '',
          ...stat
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

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
      todayDepositSum,
      todayDepositCount: todayDeposits.length,
      monthDepositSum,
      monthDepositCount: monthDeposits.length,
      yearDepositSum,
      yearDepositCount: yearDeposits.length,
      totalDeposited,
      totalDepositCount: depositTxs.length,
      totalBonusGiven,
      totalFeesCollected,
      topDepositors,
      platformMap,
      topStudents,
      topReceivers,
    };
  }, [requests, users, adminTransactions, studentStatsMap, receiverKPIMap]);

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

  // Helper to render shared modals across views
  function renderModals() {
    return (
      <>
        {/* REVENUE BREAKDOWN MODAL (BẢNG KÊ CHI TIẾT THU NHẬP) */}
        {showRevenueModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-3xl w-full space-y-4 sm:space-y-5 relative my-8 max-h-[85vh] flex flex-col overflow-hidden">
              <button
                onClick={() => setShowRevenueModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-800 pb-4 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign className="text-emerald-400 shrink-0" size={20} />
                      Bảng Kê Chi Tiết Thu Nhập ({getTimeframeLabel(revenueModalTimeframe)})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Danh sách các đơn hàng đã hoàn thành (Phí dịch vụ 5.000 VNĐ / đơn)</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Tổng Doanh Thu</span>
                    <span className="text-lg sm:text-xl font-extrabold text-emerald-400">
                      {(revenueModalRequests.length * 5000).toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>

                {/* Timeframe Quick Switcher */}
                <div className="flex items-center gap-1 mt-4 bg-slate-955 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                  <button
                    onClick={() => setRevenueModalTimeframe('TODAY')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      revenueModalTimeframe === 'TODAY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hôm nay ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'TODAY')).length})
                  </button>
                  <button
                    onClick={() => setRevenueModalTimeframe('MONTH')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      revenueModalTimeframe === 'MONTH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tháng này ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'MONTH')).length})
                  </button>
                  <button
                    onClick={() => setRevenueModalTimeframe('YEAR')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      revenueModalTimeframe === 'YEAR' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Năm nay ({requests.filter(r => r.status === 'COMPLETED' && isDateInTimeframe(r.updatedAt || r.createdAt, 'YEAR')).length})
                  </button>
                  <button
                    onClick={() => setRevenueModalTimeframe('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      revenueModalTimeframe === 'ALL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả ({requests.filter(r => r.status === 'COMPLETED').length})
                  </button>
                </div>
              </div>

              {/* Revenue Requests Content (Responsive Table on Desktop, Cards on Mobile) */}
              <div className="flex-1 overflow-y-auto pr-1">
                {revenueModalRequests.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                    Chưa có đơn hàng nào hoàn thành trong khoảng thời gian này.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-left text-xs text-slate-350 border-collapse">
                        <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                          <tr>
                            <th className="pb-3 font-semibold">Đơn hàng / Mã</th>
                            <th className="pb-3 font-semibold">Người nhận hộ (Thu nhập)</th>
                            <th className="pb-3 font-semibold">Sinh viên người dùng</th>
                            <th className="pb-3 font-semibold">Thời gian hoàn thành</th>
                            <th className="pb-3 font-semibold text-right">Phí dịch vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-855">
                          {revenueModalRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-800/20">
                              <td className="py-3 pr-2">
                                <p className="font-bold text-white">{req.foodPlatform}</p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {req.orderCode ? `Mã: ${req.orderCode}` : 'Có ảnh đơn'}
                                </p>
                              </td>
                              <td className="py-3 pr-2">
                                <p className="font-bold text-blue-400 truncate max-w-[180px]">{req.receiver?.fullName || 'Người nhận hộ'}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{req.receiver?.email}</p>
                              </td>
                              <td className="py-3 pr-2">
                                <p className="font-bold text-slate-200 truncate max-w-[180px]">{req.student?.fullName}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{req.student?.email}</p>
                              </td>
                              <td className="py-3 pr-2 text-[10px] text-slate-400">
                                {new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN')}
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
                    </div>

                    {/* Mobile Native Cards View (Prevents text squeeze & overlap) */}
                    <div className="md:hidden space-y-3">
                      {revenueModalRequests.map((req) => (
                        <div key={req.id} className="p-3.5 bg-slate-955 rounded-2xl border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-orange-400">#{req.orderCode || req.id.slice(0, 8)}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                                {req.foodPlatform}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              +5.000 VNĐ
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] text-slate-400 shrink-0">Người nhận hộ:</span>
                              <span className="font-bold text-blue-400 text-right text-xs break-all">
                                {req.receiver?.fullName || 'N/A'} ({req.receiver?.email})
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] text-slate-400 shrink-0">Sinh viên đặt:</span>
                              <span className="font-bold text-slate-200 text-right text-xs break-all">
                                {req.student?.fullName} ({req.student?.email})
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-855">
                              <span>Thời gian hoàn thành:</span>
                              <span>{new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedRequestDetail(req)}
                            className="w-full text-center text-[10px] font-bold text-orange-400 hover:text-orange-300 pt-1 border-t border-slate-855 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Xem chi tiết đơn hàng
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
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

        {/* USER ORDER HISTORY MODAL */}
        {userOrdersModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-3xl w-full space-y-4 relative my-8 max-h-[85vh] flex flex-col overflow-hidden">
              <button
                onClick={() => setUserOrdersModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-800 pb-3 pr-8 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    userOrdersModal.role === 'STUDENT' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {userOrdersModal.role === 'STUDENT' ? 'Sinh Viên Đặt Đơn' : 'Người Nhận Hộ'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Lịch Sử Đơn Hàng: {userOrdersModal.user.fullName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {userOrdersModal.user.email} {userOrdersModal.user.mssv ? `• MSSV: ${userOrdersModal.user.mssv}` : ''}
                </p>
              </div>

              {/* Compute user orders */}
              {(() => {
                const userReqs = requests.filter(r => {
                  if (userOrdersModal.role === 'STUDENT') {
                    return r.student?.id === userOrdersModal.user.id || r.student?.email?.toLowerCase() === userOrdersModal.user.email?.toLowerCase();
                  } else {
                    return r.receiver?.id === userOrdersModal.user.id || r.receiver?.email?.toLowerCase() === userOrdersModal.user.email?.toLowerCase();
                  }
                });

                const completedCount = userReqs.filter(r => r.status === 'COMPLETED').length;
                const activeCount = userReqs.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;

                return (
                  <>
                    {/* Summary Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-955 p-3 rounded-2xl border border-slate-800 shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tổng số đơn</span>
                        <span className="font-extrabold text-white text-sm">{userReqs.length} đơn</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Phí dịch vụ 5k</span>
                        <span className="font-extrabold text-orange-400 text-sm">{(userReqs.length * 5000).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Đã hoàn thành</span>
                        <span className="font-extrabold text-emerald-400 text-sm">{completedCount} đơn</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Đang xử lý</span>
                        <span className="font-extrabold text-blue-400 text-sm">{activeCount} đơn</span>
                      </div>
                    </div>

                    {/* List of user's orders */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {userReqs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                          Thành viên này chưa có dữ liệu đơn hàng nào.
                        </div>
                      ) : (
                        userReqs.map((req) => (
                          <div key={req.id} className="p-3.5 bg-slate-955 rounded-2xl border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-855 pb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-orange-400">#{req.orderCode || req.id.slice(0, 8)}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                                  {req.foodPlatform}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  req.status === 'CANCELLED' 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {req.status === 'CANCELLED' ? 'Hoàn phí 5.000đ' : 'Phí 5.000đ (Đã thanh toán ví)'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(req.status)}
                                <button
                                  onClick={() => setSelectedRequestDetail(req)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye size={12} /> Chi tiết
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">
                                  <span className="font-semibold text-slate-300">Giao đến:</span> {req.pickupLocation} → {req.dropoffLocation || 'Sảnh Trống Đồng'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  <span className="font-semibold text-slate-300">Giờ hẹn:</span> {new Date(req.pickupTime).toLocaleString('vi-VN')}
                                </p>
                              </div>

                              <div className="space-y-1 sm:text-right">
                                {userOrdersModal.role === 'STUDENT' ? (
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Người nhận hộ:</span>{' '}
                                    <span className="text-blue-400 font-bold">{req.receiver?.fullName || 'Chưa ai nhận'}</span>
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Sinh viên đặt:</span>{' '}
                                    <span className="text-slate-200 font-bold">{req.student?.fullName}</span>
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400">
                                  <span className="font-semibold text-slate-300">Cập nhật:</span> {new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
                <button
                  onClick={() => setUserOrdersModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REQUEST DETAIL MODAL */}
        {selectedRequestDetail && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-xl w-full space-y-4 relative my-auto max-h-[85vh] flex flex-col overflow-hidden">
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-800 pb-3 pr-8 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    {selectedRequestDetail.foodPlatform}
                  </span>
                  {getStatusBadge(selectedRequestDetail.status)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-2">
                  Mã đơn: {selectedRequestDetail.orderCode || 'Đã đính kèm ảnh đơn hàng'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedRequestDetail.id}</p>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {/* Student & Receiver Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Student info */}
                  <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Người gửi (Sinh viên)</p>
                    <p className="text-xs font-bold text-white">{selectedRequestDetail.student.fullName}</p>
                    <p className="text-[10px] text-slate-400 break-all">{selectedRequestDetail.student.email}</p>
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
                        <p className="text-[10px] text-slate-400 break-all">{selectedRequestDetail.receiver.email}</p>
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
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500">Giao tới: </span>
                      <span className="font-bold text-white">{selectedRequestDetail.pickupLocation}</span>
                      <span className="text-[10px] text-slate-500"> → Trả khách tại: </span>
                      <span className="font-bold text-white">{selectedRequestDetail.dropoffLocation || 'Sảnh Trống Đồng'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-855">
                    <Clock size={14} className="text-orange-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500">Giờ hẹn giao: </span>
                      <span className="font-bold text-white">{new Date(selectedRequestDetail.pickupTime).toLocaleString('vi-VN')}</span>
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

              {/* Modal Footer with Close Button */}
              <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedRequestDetail(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Đóng chi tiết
                </button>
              </div>
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
        {/* ADMIN ADJUST BALANCE MODAL (+ CỘNG TIỀN HOẶC - TRỪ TIỀN) */}
        {adjustModalUser && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 relative my-auto">
              <button
                onClick={() => setAdjustModalUser(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <DollarSign className="text-orange-500" size={18} />
                  Điều Chỉnh Số Dư Ví Thành Viên
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Thành viên: <span className="text-white">{adjustModalUser.fullName}</span> ({adjustModalUser.email})
                </p>
                <div className="flex gap-3 text-xs mt-2 text-slate-400 font-mono">
                  <span>Ví nạp chính: <strong className="text-emerald-400">{(adjustModalUser.realBalance || 0).toLocaleString()}đ</strong></span>
                  <span>Ví Khuyến mãi: <strong className="text-orange-400">{(adjustModalUser.bonusBalance || 0).toLocaleString()}đ</strong></span>
                </div>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                {/* Action Toggle: + Cộng tiền vs - Trừ tiền */}
                <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('ADD')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      adjustAction === 'ADD' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    + Cộng Tiền Vào Ví
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('SUBTRACT')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      adjustAction === 'SUBTRACT' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    - Trừ Tiền Khỏi Ví
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Loại ví điều chỉnh *
                  </label>
                  <select
                    value={adjustBalanceType}
                    onChange={(e) => setAdjustBalanceType(e.target.value as 'REAL' | 'BONUS')}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer font-bold"
                  >
                    <option value="REAL">Ví Nạp Chính (Ví dùng thanh toán phí)</option>
                    <option value="BONUS">Ví Khuyến Mãi (Ví tặng thêm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Số tiền (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Nhập số tiền (Ví dụ: 20000)..."
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono font-bold"
                    min={1000}
                    step={1000}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Lý do / Ghi chú
                  </label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Lý do điều chỉnh (Ví dụ: Thưởng sự kiện, Nạp bổ sung...)"
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={adjustLoading}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md cursor-pointer ${
                      adjustAction === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                    }`}
                  >
                    {adjustLoading ? 'Đang lưu...' : adjustAction === 'ADD' ? 'Xác Nhận Cộng Tiền' : 'Xác Nhận Trừ Tiền'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MEMBER DETAILED DEPOSIT & TRANSACTION HISTORY MODAL */}
        {userTxModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-3xl w-full space-y-4 relative my-8 max-h-[85vh] flex flex-col overflow-hidden">
              <button
                onClick={() => setUserTxModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-800 pb-3 pr-8 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    userTxModal.role === 'STUDENT' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    userTxModal.role === 'RECEIVER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {userTxModal.role === 'STUDENT' ? '🎓 Lịch Sử Sinh Viên (Nạp Ví & Phí Đơn)' :
                     userTxModal.role === 'RECEIVER' ? '🛵 Lịch Sử Nhận Hộ (Giao Đơn & KPI)' :
                     '🛡️ Nhật Ký Thao Tác Quản Trị Viên'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    {userTxModal.fullName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {userTxModal.email} {userTxModal.mssv ? `• MSSV: ${userTxModal.mssv}` : ''}
                </p>
              </div>

              {(() => {
                const targetRole = userTxModal.role;

                // Transactions for Student / Admin
                const userTxs = adminTransactions.filter(t => 
                  t.userId === userTxModal.id || 
                  t.user?.id === userTxModal.id || 
                  (t.user?.email && t.user.email.toLowerCase() === userTxModal.email?.toLowerCase())
                );

                // Orders for Student or Receiver
                const studentReqs = requests.filter(r => 
                  r.student?.id === userTxModal.id || 
                  (r.student?.email && r.student.email.toLowerCase() === userTxModal.email?.toLowerCase())
                );

                const receiverReqs = requests.filter(r => 
                  r.receiver?.id === userTxModal.id || 
                  (r.receiver?.email && r.receiver.email.toLowerCase() === userTxModal.email?.toLowerCase())
                );

                // Admin Operations Log (Strictly for actions performed by or related to THIS specific admin)
                const adminActions = adminTransactions.filter(t => {
                  const isTargetUser = t.userId === userTxModal.id || 
                                       t.user?.id === userTxModal.id || 
                                       (t.user?.email && t.user.email.toLowerCase() === userTxModal.email.toLowerCase());
                  
                  const isActorInNote = t.note && (
                    t.note.toLowerCase().includes(userTxModal.fullName.toLowerCase()) ||
                    t.note.toLowerCase().includes(userTxModal.email.toLowerCase()) ||
                    (userTxModal.mssv && t.note.toLowerCase().includes(userTxModal.mssv.toLowerCase()))
                  );

                  return isTargetUser || isActorInNote;
                });

                if (targetRole === 'RECEIVER') {
                  const completedCount = receiverReqs.filter(r => r.status === 'COMPLETED').length;
                  const activeCount = receiverReqs.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
                  const fulfillRate = receiverReqs.length > 0 ? ((completedCount / receiverReqs.length) * 100).toFixed(0) : '0';

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-955 p-3 rounded-2xl border border-slate-800 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tổng đơn đã nhận</span>
                          <span className="font-extrabold text-blue-400 text-sm">{receiverReqs.length} đơn</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Đã hoàn thành</span>
                          <span className="font-extrabold text-emerald-400 text-sm">{completedCount} đơn</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Đang đi giao</span>
                          <span className="font-extrabold text-orange-400 text-sm">{activeCount} đơn</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tỷ lệ thành công</span>
                          <span className="font-extrabold text-purple-400 text-sm">{fulfillRate}%</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {receiverReqs.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                            Người nhận hộ này chưa có dữ liệu giao đơn nào.
                          </div>
                        ) : (
                          receiverReqs.map((req) => (
                            <div key={req.id} className="p-3.5 bg-slate-955 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all">
                              <div className="flex items-center justify-between border-b border-slate-855 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-blue-400">#{req.orderCode || req.id.slice(0, 8)}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                                    {req.foodPlatform}
                                  </span>
                                </div>
                                {getStatusBadge(req.status)}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Sinh viên đặt:</span>{' '}
                                    <strong className="text-white">{req.student?.fullName}</strong> ({req.student?.email})
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Tuyến đường:</span> {req.pickupLocation} → {req.dropoffLocation || 'Sảnh Trống Đồng'}
                                  </p>
                                </div>
                                <div className="sm:text-right">
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Giờ hẹn:</span> {new Date(req.pickupTime).toLocaleString('vi-VN')}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Cập nhật:</span> {new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  );
                }

                if (targetRole === 'ADMIN') {
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs bg-slate-955 p-3 rounded-2xl border border-slate-800 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Vai trò</span>
                          <span className="font-extrabold text-red-400 text-sm">QUẢN TRỊ VIÊN</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Số lần điều chỉnh ví</span>
                          <span className="font-extrabold text-amber-400 text-sm">{adminActions.length} lần</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Trạng thái</span>
                          <span className="font-extrabold text-emerald-400 text-sm">HOẠT ĐỘNG</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {adminActions.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                            Chưa ghi nhận lịch sử điều chỉnh ví nào từ Quản trị viên này.
                          </div>
                        ) : (
                          adminActions.map((tx: any) => (
                            <div key={tx.id} className="p-3 bg-slate-955 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    ADMIN ĐIỀU CHỈNH
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">#{tx.transactionCode}</span>
                                </div>
                                <p className="text-[10px] text-slate-300 mt-1 font-medium">{tx.note || 'Điều chỉnh số dư thành viên'}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                              </div>
                              <div className="text-right font-mono">
                                <p className="font-extrabold text-sm text-emerald-400">+{tx.amount.toLocaleString('vi-VN')}đ</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  );
                }

                // Default STUDENT View
                const totalDep = userTxs.filter(t => t.type === 'DEPOSIT' && t.status === 'APPROVED').reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalBon = userTxs.filter(t => t.type === 'DEPOSIT' && t.status === 'APPROVED').reduce((sum, t) => sum + (t.bonusAmount || 0), 0);
                const totalPaidFees = userTxs.filter(t => t.type === 'ORDER_PAYMENT').reduce((sum, t) => sum + (t.amount || 0), 0);
                const orderPaymentCount = userTxs.filter(t => t.type === 'ORDER_PAYMENT').length;

                const filteredUserTxs = userTxs.filter(t => {
                  if (userTxTypeFilter === 'DEPOSIT') return t.type === 'DEPOSIT' || t.type === 'ADMIN_ADJUST';
                  if (userTxTypeFilter === 'ORDER_PAYMENT') return t.type === 'ORDER_PAYMENT' || t.type === 'ORDER_REFUND';
                  return true;
                });

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-955 p-3 rounded-2xl border border-slate-800 shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Số dư hiện tại</span>
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {((userTxModal.realBalance || 0) + (userTxModal.bonusBalance || 0)).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tổng nạp (+KM)</span>
                        <span className="font-extrabold text-white text-sm">{(totalDep + totalBon).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Phí 5k đã trả</span>
                        <span className="font-extrabold text-rose-400 text-sm">-{totalPaidFees.toLocaleString('vi-VN')}đ ({orderPaymentCount} đơn)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Đơn đã đặt</span>
                        <span className="font-extrabold text-orange-400 text-sm">{studentReqs.length} đơn</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setUserTxTypeFilter('ALL')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            userTxTypeFilter === 'ALL' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tất cả ({userTxs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserTxTypeFilter('DEPOSIT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            userTxTypeFilter === 'DEPOSIT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          💳 Nạp tiền & KM ({userTxs.filter(t => t.type === 'DEPOSIT' || t.type === 'ADMIN_ADJUST').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserTxTypeFilter('ORDER_PAYMENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            userTxTypeFilter === 'ORDER_PAYMENT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🍱 Phí thanh toán đơn ({orderPaymentCount})
                        </button>
                      </div>
                      <div className="relative min-w-[180px]">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                          type="text"
                          value={memberModalSearch}
                          onChange={(e) => setMemberModalSearch(e.target.value)}
                          placeholder="Tìm mã, nội dung..."
                          className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {(() => {
                        const searchedUserTxs = filteredUserTxs.filter(t => {
                          if (!memberModalSearch.trim()) return true;
                          const q = memberModalSearch.toLowerCase();
                          return (
                            (t.transactionCode || '').toLowerCase().includes(q) ||
                            (t.note || '').toLowerCase().includes(q) ||
                            (t.amount || '').toString().includes(q)
                          );
                        });

                        if (searchedUserTxs.length === 0) {
                          return (
                            <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                              Không có lịch sử giao dịch nào phù hợp với tìm kiếm.
                            </div>
                          );
                        }

                        return searchedUserTxs.map((tx: any) => {
                          const isNegative = tx.type === 'ORDER_PAYMENT';
                          return (
                            <div key={tx.id} className="p-3 bg-slate-955 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    tx.type === 'ORDER_REFUND' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    tx.type === 'ORDER_PAYMENT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {tx.type === 'DEPOSIT' ? 'NẠP TIỀN VÀO VÍ' :
                                     tx.type === 'ORDER_PAYMENT' ? 'THANH TOÁN PHÍ ĐƠN 5K' :
                                     tx.type === 'ORDER_REFUND' ? 'HOÀN PHÍ HỦY ĐƠN' :
                                     tx.type === 'ADMIN_ADJUST' ? 'ADMIN ĐIỀU CHỈNH' : tx.type}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">#{tx.transactionCode}</span>
                                </div>
                                <p className="text-[10px] text-slate-300 mt-1 font-medium">{tx.note || `Thực hiện qua ${tx.paymentMethod}`}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                              </div>
                              <div className="text-right font-mono shrink-0 whitespace-nowrap pl-2">
                                <p className={`font-extrabold text-sm ${isNegative ? 'text-rose-400' : 'text-emerald-400'} whitespace-nowrap`}>
                                  {isNegative ? '-' : '+'}{tx.amount.toLocaleString('vi-VN')} đ
                                </p>
                                {tx.bonusAmount > 0 && (
                                  <p className="text-[10px] text-orange-400 font-bold whitespace-nowrap">+{tx.bonusAmount.toLocaleString('vi-VN')} đ KM</p>
                                )}
                                {tx.status === 'APPROVED' ? (
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-0.5 whitespace-nowrap">
                                    Thành công
                                  </span>
                                ) : tx.status === 'PENDING' ? (
                                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5 whitespace-nowrap">
                                    Chờ xác nhận
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 inline-block mt-0.5 whitespace-nowrap">
                                    Từ chối
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* REPORT APPROVAL & PROCESS MODAL */}
        {processReportModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 relative my-auto max-h-[90vh] flex flex-col overflow-hidden">
              <button
                onClick={() => setProcessReportModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-800 pb-3 pr-8 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {processReportModal.type === 'DEPOSIT_ERROR' ? '💳 Lỗi nạp tiền' : '🐛 Lỗi hệ thống'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">#{processReportModal.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Xử Lý Phản Ánh: {processReportModal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sinh viên: <strong className="text-white">{processReportModal.user.fullName}</strong> ({processReportModal.user.email} {processReportModal.user.mssv ? `• ${processReportModal.user.mssv}` : ''})
                </p>
              </div>

              <form onSubmit={handleProcessReportSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Mode Selector */}
                <div className="grid grid-cols-3 bg-slate-955 p-1 rounded-xl border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setProcessAction('APPROVED')}
                    className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      processAction === 'APPROVED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    + Duyệt Cộng Ví
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessAction('REJECTED')}
                    className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      processAction === 'REJECTED' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ❌ Từ Chối
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessAction('RESOLVED')}
                    className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      processAction === 'RESOLVED' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🟢 Đã Giải Quyết
                  </button>
                </div>

                {/* If APPROVED mode */}
                {processAction === 'APPROVED' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                    <p className="text-[11px] font-bold text-emerald-400">
                      Cộng tiền trực tiếp vào Ví Chính của sinh viên
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Số tiền cộng ví chính (VNĐ) *
                        </label>
                        <input
                          type="number"
                          value={processAmount}
                          onChange={(e) => setProcessAmount(e.target.value)}
                          placeholder="VD: 50000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-extrabold focus:outline-none focus:border-emerald-500"
                          min={1000}
                          step={1000}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Thưởng khuyến mãi thêm (Ví KM)
                        </label>
                        <input
                          type="number"
                          value={processBonusAmount}
                          onChange={(e) => setProcessBonusAmount(e.target.value)}
                          placeholder="VD: 5000 (Tùy chọn)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-orange-500"
                          min={0}
                          step={1000}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Note Input */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Ghi chú phản hồi cho Sinh viên {processAction === 'REJECTED' ? '(Bắt buộc ghi lý do từ chối)' : ''}
                  </label>
                  <textarea
                    value={processAdminNote}
                    onChange={(e) => setProcessAdminNote(e.target.value)}
                    placeholder={
                      processAction === 'APPROVED'
                        ? "VD: Admin đã kiểm tra chứng từ CK thành công và cộng 50.000đ vào ví."
                        : processAction === 'REJECTED'
                        ? "VD: Không tìm thấy giao dịch 50k nào vào thời điểm nêu trên. Vui lòng kiểm tra lại."
                        : "VD: Đã tiếp nhận và khắc phục xong lỗi giao diện."
                    }
                    rows={3}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProcessReportModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={processLoading}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md cursor-pointer ${
                      processAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' :
                      processAction === 'REJECTED' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {processLoading ? 'Đang xử lý...' : processAction === 'APPROVED' ? 'Xác Nhận & Cộng Tiền Ví' : processAction === 'REJECTED' ? 'Xác Nhận Từ Chối' : 'Xác Nhận Đã Giải Quyết'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

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
              Tổng quan chỉ số hoạt động, doanh thu và quản lý đơn hàng tại FPTU.
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

        {/* CEO DEPOSIT REVENUE DASHBOARD (BÁO CÁO TIỀN NẠP HÀNG NGÀY & HÀNG THÁNG) */}
        <div className="bg-slate-900/80 border border-emerald-500/30 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <DollarSign className="text-emerald-400" size={22} />
                Báo Cáo Dòng Tiền Nạp Vào Ví (CEO Executive Deposit Dashboard)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Theo dõi chi tiết số tiền sinh viên nạp vào ví theo ngày, tháng & tổng tích lũy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today Deposit */}
            <div className="p-4.5 rounded-2xl bg-slate-955 border border-emerald-500/40 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiền Nạp Hôm Nay</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {ceoAnalytics.todayDepositSum.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                {ceoAnalytics.todayDepositCount} lượt nạp hôm nay
              </p>
            </div>

            {/* Month Deposit */}
            <div className="p-4.5 rounded-2xl bg-slate-955 border border-blue-500/40 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiền Nạp Tháng Này</span>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {ceoAnalytics.monthDepositSum.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                {ceoAnalytics.monthDepositCount} lượt nạp tháng này
              </p>
            </div>

            {/* All-time Deposit */}
            <div className="p-4.5 rounded-2xl bg-slate-955 border border-purple-500/40 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Tiền Nạp Tích Lũy</span>
              <p className="text-2xl font-black text-purple-400 mt-1">
                {ceoAnalytics.totalDeposited.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                {ceoAnalytics.totalDepositCount} tổng lượt nạp
              </p>
            </div>

            {/* Total Bonus */}
            <div className="p-4.5 rounded-2xl bg-slate-955 border border-orange-500/40 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Khuyến Mãi Đã Trao (+KM)</span>
              <p className="text-2xl font-black text-orange-400 mt-1">
                {ceoAnalytics.totalBonusGiven.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Thưởng nạp khuyến mãi
              </p>
            </div>
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
                ceoAnalytics.topStudents.map((s, idx) => {
                  const targetUser = users.find(u => u.id === s.id || u.email.toLowerCase() === s.email.toLowerCase()) || {
                    id: s.id,
                    fullName: s.fullName,
                    email: s.email,
                    mssv: s.mssv,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                    createdAt: ''
                  };

                  return (
                    <div
                      key={s.id}
                      onClick={() => setUserOrdersModal({ user: targetUser, role: 'STUDENT' })}
                      className="py-3 px-2 rounded-xl flex items-center justify-between hover:bg-slate-800/50 transition-all cursor-pointer group"
                      title="Bấm để xem danh sách đơn hàng đã đặt"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{s.fullName}</p>
                          <p className="text-[10px] text-slate-400">{s.email} {s.mssv ? `• ${s.mssv}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-orange-400 group-hover:underline">{s.totalOrdered} đơn đã đặt</span>
                        <p className="text-[10px] text-slate-400">{s.completedCount} đã giao ({s.totalSpent.toLocaleString()} VNĐ)</p>
                      </div>
                    </div>
                  );
                })
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
                ceoAnalytics.topReceivers.map((r, idx) => {
                  const targetUser = users.find(u => u.id === r.id || u.email.toLowerCase() === r.email.toLowerCase()) || {
                    id: r.id,
                    fullName: r.fullName,
                    email: r.email,
                    mssv: r.mssv,
                    role: 'RECEIVER',
                    status: 'ACTIVE',
                    createdAt: ''
                  };

                  return (
                    <div
                      key={r.id}
                      onClick={() => setUserOrdersModal({ user: targetUser, role: 'RECEIVER' })}
                      className="py-3 px-2 rounded-xl flex items-center justify-between hover:bg-slate-800/50 transition-all cursor-pointer group"
                      title="Bấm để xem danh sách đơn hàng đã nhận"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{r.fullName}</p>
                          <p className="text-[10px] text-slate-400">{r.email} {r.mssv ? `• ${r.mssv}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400 group-hover:underline">{r.completedCount} đơn hoàn thành</span>
                        <p className="text-[10px] text-slate-400">Tiền công: {r.totalEarnings.toLocaleString()} VNĐ {r.avgRating !== 'Chưa có' ? `• Star: ${r.avgRating}⭐` : ''}</p>
                      </div>
                    </div>
                  );
                })
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

        {renderModals()}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      {activeCard === 'REPORTS' ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-500/20 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <AlertTriangle size={20} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                Duyệt Khiếu Nại Nạp Tiền & Báo Cáo Sự Cố
              </h1>
            </div>
            <p className="text-slate-400 text-xs pl-10">
              Xem và đối chiếu chứng từ chuyển khoản sai nội dung của sinh viên để tự động cộng tiền vào ví chính hoặc xử lý sự cố hệ thống
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Shield className="text-orange-500" size={24} />
              Bảng Điều Khiển Quản Trị
            </h1>
            <p className="text-slate-400 text-xs">Tổng quan chỉ số hoạt động, doanh thu và quản lý đơn hàng tại FPTU.</p>
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
      )}

      {/* INTERACTIVE APP METRIC CARDS (CHẠM TRỰC TIẾP VÀO CÁC Ô ĐỂ XEM MỤC TƯƠNG ỨNG) */}
      {stats && activeCard !== 'REPORTS' && (
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
                  Xem chi tiết <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đơn Hàng</p>
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
                  Báo cáo <ChevronRight size={10} />
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
                  Bảng lương <ChevronRight size={10} />
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
                  Danh sách thành viên <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thành Viên</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalUsers}</p>
            </div>
          </div>

          {/* 5. VÍ & QUẢN LÝ TIỀN CARD */}
          <div
            onClick={() => setActiveCard(activeCard === 'TRANSACTIONS' ? 'ALL' : 'TRANSACTIONS')}
            className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer select-none active:scale-95 hover:scale-[1.02] ${
              activeCard === 'TRANSACTIONS'
                ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                <DollarSign size={18} />
              </div>
              {activeCard === 'TRANSACTIONS' ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-sm">
                  Đang xem
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-semibold group-hover:text-orange-400 flex items-center gap-0.5">
                  Quản lý số dư <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quản Lý Tiền Thành Viên</p>
              <p className="text-xl font-extrabold text-white mt-0.5">
                {adminTransactions.length} giao dịch nạp
              </p>
            </div>
          </div>

          {/* 6. ĐÁNH GIÁ TB CARD */}
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
                  Phản hồi khách hàng <ChevronRight size={10} />
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
                Danh sách Đơn hàng Toàn hệ thống ({filteredRequests.length})
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
                  <th className="px-4 py-3.5 font-bold">NGƯỜI ĐẶT</th>
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
                Danh sách Thành viên Hệ thống ({filteredUsers.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Quản lý vai trò, trạng thái và lịch sử hoạt động của thành viên.</p>
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
                              <button
                                onClick={() => setUserOrdersModal({ user: u, role: 'STUDENT' })}
                                className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title="Bấm để xem chi tiết danh sách đơn hàng"
                              >
                                {studentStat.totalOrdered} đơn đã đặt
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">0 đơn</span>
                            )
                          ) : u.role === 'RECEIVER' ? (
                            receiverKPI && receiverKPI.totalAssigned > 0 ? (
                              <button
                                onClick={() => setUserOrdersModal({ user: u, role: 'RECEIVER' })}
                                className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title="Bấm để xem chi tiết danh sách đơn hàng"
                              >
                                {receiverKPI.totalAssigned} đơn đã nhận
                              </button>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setUserTxModal(u)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                              title="Xem chi tiết lịch sử nạp tiền & giao dịch của thành viên"
                            >
                              📋 Lịch Sử
                            </button>
                            <button
                              onClick={() => openAdjustModal(u, 'ADD')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                              title="Cộng tiền vào ví thành viên"
                            >
                              + Cộng Tiền
                            </button>
                            <button
                              onClick={() => openAdjustModal(u, 'SUBTRACT')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                              title="Trừ tiền khỏi ví thành viên"
                            >
                              - Trừ Tiền
                            </button>
                            {isSelf ? (
                              <span className="text-[10px] text-slate-500 font-semibold italic whitespace-nowrap">
                                Đang dùng
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                disabled={btnLoading === u.id}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                }`}
                              >
                                {btnLoading === u.id ? '...' : u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                              </button>
                            )}
                          </div>
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
                      <div 
                        onClick={() => {
                          if (u.role === 'STUDENT' || u.role === 'RECEIVER') {
                            setUserOrdersModal({ user: u, role: u.role as 'STUDENT' | 'RECEIVER' });
                          }
                        }}
                        className="p-2 bg-slate-900 rounded-xl border border-slate-850 cursor-pointer hover:border-orange-500/50 active:scale-95 transition-all"
                        title="Bấm để xem chi tiết danh sách đơn hàng"
                      >
                        <span className="text-slate-500 font-semibold block text-[9px] uppercase">Số đơn (Bấm xem)</span>
                        <span className="font-extrabold text-orange-400 underline decoration-dashed">
                          {u.role === 'STUDENT' ? `${studentStat?.totalOrdered || 0} đã đặt` : `${receiverKPI?.totalAssigned || 0} đã nhận`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-slate-500 font-semibold block text-[9px] uppercase">Ví chính / KM</span>
                        <span className="font-extrabold text-emerald-400 font-mono">
                          {((u.realBalance || 0) + (u.bonusBalance || 0)).toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-850 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setUserTxModal(u)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        >
                          📋 Lịch sử
                        </button>
                        <button
                          onClick={() => openAdjustModal(u, 'ADD')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          + Cộng
                        </button>
                        <button
                          onClick={() => openAdjustModal(u, 'SUBTRACT')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          - Trừ
                        </button>
                      </div>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          disabled={btnLoading === u.id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700'
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

      {/* SECTION 3.5: BẢNG QUẢN LÝ TIỀN SINH VIÊN & LỊCH SỬ GIAO DỊCH */}
      {(activeCard === 'ALL' || activeCard === 'TRANSACTIONS') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-6">
          {/* PART 1: BẢNG QUẢN LÝ VÍ SINH VIÊN */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-md sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <DollarSign className="text-orange-500" size={20} />
                  Quản lý Số dư Thành viên ({users.filter(u => u.role === 'STUDENT').length})
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Danh sách số dư tài khoản thành viên trong hệ thống.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, email, MSSV..."
                  className="bg-slate-955 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Desktop Table: Student Members Wallet */}
            <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-2xl bg-slate-955/50">
              <table className="w-full text-left text-xs text-slate-350 min-w-[750px]">
                <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Sinh viên / Email / MSSV</th>
                    <th className="px-4 py-3.5 font-bold">Vai trò</th>
                    <th className="px-4 py-3.5 font-bold text-right">Ví nạp chính</th>
                    <th className="px-4 py-3.5 font-bold text-right">Ví Khuyến mãi</th>
                    <th className="px-4 py-3.5 font-bold text-right">Tổng số dư</th>
                    <th className="px-4 py-3.5 font-bold text-right">Thao tác ví</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users
                    .filter(u => u.role === 'STUDENT')
                    .filter(u => {
                      const q = searchQuery.toLowerCase().trim();
                      return !q || 
                        u.fullName.toLowerCase().includes(q) || 
                        u.email.toLowerCase().includes(q) || 
                        (u.mssv && u.mssv.toLowerCase().includes(q));
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                        Không tìm thấy sinh viên nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter(u => u.role === 'STUDENT')
                      .filter(u => {
                        const q = searchQuery.toLowerCase().trim();
                        return !q || 
                          u.fullName.toLowerCase().includes(q) || 
                          u.email.toLowerCase().includes(q) || 
                          (u.mssv && u.mssv.toLowerCase().includes(q));
                      })
                      .map((u) => {
                        const realBal = u.realBalance || 0;
                        const bonusBal = u.bonusBalance || 0;
                        const totalBal = realBal + bonusBal;

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-white text-xs">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400">{u.email} {u.mssv ? `• MSSV: ${u.mssv}` : ''}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                {getRoleLabel(u.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                              {realBal.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-orange-400">
                              {bonusBal.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-black text-white text-sm">
                              {totalBal.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openAdjustModal(u, 'ADD')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                                  title="Cộng tiền vào ví"
                                >
                                  + Cộng Tiền
                                </button>
                                <button
                                  onClick={() => openAdjustModal(u, 'SUBTRACT')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                                  title="Trừ tiền khỏi ví"
                                >
                                  - Trừ Tiền
                                </button>
                                <button
                                  onClick={() => setUserTxModal(u)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                                  title="Xem lịch sử nạp tiền"
                                >
                                  📋 Lịch Sử
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Native Cards: Student Members Wallet */}
            <div className="md:hidden space-y-3">
              {users
                .filter(u => u.role === 'STUDENT')
                .filter(u => {
                  const q = searchQuery.toLowerCase().trim();
                  return !q || 
                    u.fullName.toLowerCase().includes(q) || 
                    u.email.toLowerCase().includes(q) || 
                    (u.mssv && u.mssv.toLowerCase().includes(q));
                })
                .length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-955 border border-slate-800 rounded-2xl">
                  Không tìm thấy sinh viên nào phù hợp.
                </div>
              ) : (
                users
                  .filter(u => u.role === 'STUDENT')
                  .filter(u => {
                    const q = searchQuery.toLowerCase().trim();
                    return !q || 
                      u.fullName.toLowerCase().includes(q) || 
                      u.email.toLowerCase().includes(q) || 
                      (u.mssv && u.mssv.toLowerCase().includes(q));
                  })
                  .map((u) => {
                    const realBal = u.realBalance || 0;
                    const bonusBal = u.bonusBalance || 0;
                    const totalBal = realBal + bonusBal;

                    return (
                      <div key={u.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div>
                            <p className="font-extrabold text-xs text-white">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400">{u.email} {u.mssv ? `• ${u.mssv}` : ''}</p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {getRoleLabel(u.role)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                          <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                            <span className="text-slate-500 font-semibold block text-[9px] uppercase">Ví chính</span>
                            <span className="font-extrabold text-emerald-400 font-mono">{realBal.toLocaleString()}đ</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                            <span className="text-slate-500 font-semibold block text-[9px] uppercase">Ví KM</span>
                            <span className="font-extrabold text-orange-400 font-mono">{bonusBal.toLocaleString()}đ</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openAdjustModal(u, 'ADD')}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              + Cộng
                            </button>
                            <button
                              onClick={() => openAdjustModal(u, 'SUBTRACT')}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                            >
                              - Trừ
                            </button>
                            <button
                              onClick={() => setUserTxModal(u)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            >
                              📋 Lịch sử
                            </button>
                          </div>
                          <span className="text-xs font-black text-white font-mono">
                            {totalBal.toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* PART 2: NHẬT KÝ NẠP TIỀN TỰ ĐỘNG (SYSTEM AUDIT LOG) */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText size={16} className="text-orange-500" />
                Nhật Ký Nạp Tiền & Điều Chỉnh Ví ({adminTransactions.filter((tx: any) => tx.type === 'DEPOSIT' || tx.type === 'ADMIN_ADJUST').length})
              </h3>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={auditLogSearch}
                  onChange={(e) => setAuditLogSearch(e.target.value)}
                  placeholder="Tìm mã GD, tên, email, MSSV..."
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                {auditLogSearch && (
                  <button
                    onClick={() => setAuditLogSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-800 rounded-2xl bg-slate-955/50 overflow-hidden">
              {(() => {
                const depositTxs = adminTransactions.filter((tx: any) => tx.type === 'DEPOSIT' || tx.type === 'ADMIN_ADJUST');
                const filteredTxs = depositTxs.filter((tx: any) => {
                  if (!auditLogSearch.trim()) return true;
                  const q = auditLogSearch.toLowerCase();
                  return (
                    (tx.transactionCode || '').toLowerCase().includes(q) ||
                    (tx.user?.fullName || '').toLowerCase().includes(q) ||
                    (tx.user?.email || '').toLowerCase().includes(q) ||
                    (tx.user?.mssv || '').toLowerCase().includes(q) ||
                    (tx.note || tx.description || '').toLowerCase().includes(q) ||
                    (tx.amount || '').toString().includes(q)
                  );
                });

                if (filteredTxs.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      {auditLogSearch.trim()
                        ? `Không tìm thấy nhật ký nạp tiền nào khớp với "${auditLogSearch}"`
                        : 'Chưa có giao dịch nạp tiền nào được ghi nhận.'}
                    </div>
                  );
                }

                return (
                  <>
                    {/* MOBILE CARD VIEW (< sm) */}
                    <div className="block sm:hidden space-y-3 p-3">
                      {filteredTxs.map((tx: any) => (
                        <div key={tx.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                          <div className="flex justify-between items-start gap-2 border-b border-slate-800/80 pb-2">
                            <div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block ${
                                tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {tx.type === 'DEPOSIT' ? 'NẠP TIỀN TỰ ĐỘNG' : 'ADMIN ĐIỀU CHỈNH'}
                              </span>
                              <p className="font-mono font-bold text-white text-xs mt-1">#{tx.transactionCode}</p>
                            </div>
                            <div className="text-right shrink-0 whitespace-nowrap">
                              {tx.status === 'APPROVED' ? (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap inline-block">
                                  ✅ Thành công
                                </span>
                              ) : tx.status === 'PENDING' ? (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap inline-block">
                                  ⏳ Chờ duyệt
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap inline-block">
                                  ❌ Từ chối
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs gap-2 pt-0.5">
                            <div>
                              <p className="font-bold text-white text-xs">{tx.user?.fullName || 'Thành viên'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{tx.user?.email} {tx.user?.mssv ? `• ${tx.user.mssv}` : ''}</p>
                            </div>
                            <div className="text-right font-mono shrink-0 whitespace-nowrap">
                              <p className="font-extrabold text-sm text-emerald-400 whitespace-nowrap">+{tx.amount.toLocaleString('vi-VN')}đ</p>
                              {tx.bonusAmount > 0 && (
                                <p className="text-[10px] text-orange-400 font-bold whitespace-nowrap">+{tx.bonusAmount.toLocaleString('vi-VN')}đ KM</p>
                              )}
                            </div>
                          </div>

                          {tx.note && (
                            <p className="text-[10px] text-slate-400 bg-slate-955 p-2 rounded-xl border border-slate-800/60 font-sans leading-relaxed break-words">
                              {tx.note}
                            </p>
                          )}

                          <p className="text-[9px] text-slate-500 font-mono text-right">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP TABLE VIEW (>= sm) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-350 min-w-[750px]">
                        <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/80">
                          <tr>
                            <th className="px-4 py-3.5 font-bold">Mã GD / Thời gian</th>
                            <th className="px-4 py-3.5 font-bold">Thành viên nạp</th>
                            <th className="px-4 py-3.5 font-bold">Loại / Phương thức</th>
                            <th className="px-4 py-3.5 font-bold text-right">Số tiền nạp / KM</th>
                            <th className="px-4 py-3.5 font-bold text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredTxs.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-4 py-3.5 font-mono">
                                <p className="font-bold text-white text-xs">{tx.transactionCode}</p>
                                <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-white">{tx.user?.fullName}</p>
                                <p className="text-[10px] text-slate-400">{tx.user?.email} {tx.user?.mssv ? `• ${tx.user.mssv}` : ''}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {tx.type === 'DEPOSIT' ? 'NẠP TIỀN TỰ ĐỘNG' : 'ADMIN ĐIỀU CHỈNH'}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate" title={tx.note || tx.paymentMethod}>{tx.note || tx.paymentMethod || 'VietQR / Bank'}</p>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono shrink-0 whitespace-nowrap">
                                <p className="font-extrabold text-sm text-emerald-400 whitespace-nowrap">+{tx.amount.toLocaleString('vi-VN')}đ</p>
                                {tx.bonusAmount > 0 && (
                                  <p className="text-[10px] text-orange-400 font-bold whitespace-nowrap">+{tx.bonusAmount.toLocaleString('vi-VN')}đ KM</p>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right shrink-0 whitespace-nowrap">
                                {tx.status === 'APPROVED' ? (
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap inline-block">
                                    ✅ Thành công
                                  </span>
                                ) : tx.status === 'PENDING' ? (
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap inline-block">
                                    ⏳ Chờ duyệt
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap inline-block">
                                    ❌ Từ chối
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3.6: BẢNG QUẢN LÝ BÁO CÁO SỰ CỐ & KHIẾU NẠI NẠP TIỀN */}
      {(activeCard === 'ALL' || activeCard === 'REPORTS') && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-md sm:text-lg font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                Quản lý Báo cáo & Khiếu nại ({adminReports.filter(r => r.status === 'PENDING').length} Đang Chờ)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Tiếp nhận và xử lý khiếu nại giao dịch, sự cố hệ thống.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setReportStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  reportStatusFilter === 'ALL' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({adminReports.length})
              </button>
              <button
                onClick={() => setReportStatusFilter('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  reportStatusFilter === 'PENDING' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Đang chờ ({adminReports.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setReportStatusFilter('DEPOSIT_ERROR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  reportStatusFilter === 'DEPOSIT_ERROR' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lỗi nạp tiền ({adminReports.filter(r => r.type === 'DEPOSIT_ERROR').length})
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-slate-800 rounded-2xl bg-slate-955/50">
            <table className="w-full text-left text-xs text-slate-350 min-w-[850px]">
              <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Sinh viên khiếu nại</th>
                  <th className="px-4 py-3.5 font-bold">Loại / Tiêu đề</th>
                  <th className="px-4 py-3.5 font-bold">Nội dung sự cố</th>
                  <th className="px-4 py-3.5 font-bold text-right">Số tiền khiếu nại / Mã CK</th>
                  <th className="px-4 py-3.5 font-bold text-center">Bằng chứng (Screenshot)</th>
                  <th className="px-4 py-3.5 font-bold text-right">Trạng thái / Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {adminReports
                  .filter(r => {
                    if (reportStatusFilter === 'PENDING') return r.status === 'PENDING';
                    if (reportStatusFilter === 'DEPOSIT_ERROR') return r.type === 'DEPOSIT_ERROR';
                    return true;
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                      Không có báo cáo sự cố nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  adminReports
                    .filter(r => {
                      if (reportStatusFilter === 'PENDING') return r.status === 'PENDING';
                      if (reportStatusFilter === 'DEPOSIT_ERROR') return r.type === 'DEPOSIT_ERROR';
                      return true;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white text-xs">{item.user?.fullName}</p>
                          <p className="text-[10px] text-slate-400">{item.user?.email} {item.user?.mssv ? `• ${item.user.mssv}` : ''}</p>
                          {item.user?.phoneNumber && (
                            <p className="text-[10px] text-slate-500">SĐT: {item.user.phoneNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            item.type === 'DEPOSIT_ERROR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.type === 'DEPOSIT_ERROR' ? '💳 LỖI NẠP TIỀN' : '🐛 LỖI HỆ THỐNG'}
                          </span>
                          <p className="font-bold text-white text-xs mt-1">{item.title}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300 max-w-xs">
                          <p className="line-clamp-2">{item.description}</p>
                          {item.adminNote && (
                            <p className="text-[10px] text-amber-400 mt-1 italic">Ghi chú Admin: {item.adminNote}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          {item.expectedAmount ? (
                            <p className="font-black text-emerald-400 text-sm">{item.expectedAmount.toLocaleString('vi-VN')} đ</p>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">Không có</p>
                          )}
                          {item.transactionCode && (
                            <p className="text-[10px] text-slate-300 font-bold">Mã CK: {item.transactionCode}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {item.proofImage ? (
                            <button
                              onClick={() => setFullscreenImage(item.proofImage!)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              🔍 Xem ảnh CK
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Không có ảnh</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {item.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openProcessReportModal(item, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                                title="Duyệt chứng từ & Cộng tiền ví"
                              >
                                ✅ Duyệt Cộng Tiền
                              </button>
                              <button
                                onClick={() => openProcessReportModal(item, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                                title="Từ chối khiếu nại"
                              >
                                ❌ Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              item.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {item.status === 'APPROVED' ? 'Đã cộng tiền ví' : item.status === 'REJECTED' ? 'Đã từ chối' : 'Đã giải quyết'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Native Cards View */}
          <div className="md:hidden space-y-3">
            {adminReports
              .filter(r => {
                if (reportStatusFilter === 'PENDING') return r.status === 'PENDING';
                if (reportStatusFilter === 'DEPOSIT_ERROR') return r.type === 'DEPOSIT_ERROR';
                return true;
              })
              .length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-955 border border-slate-800 rounded-2xl">
                Không có báo cáo sự cố nào phù hợp.
              </div>
            ) : (
              adminReports
                .filter(r => {
                  if (reportStatusFilter === 'PENDING') return r.status === 'PENDING';
                  if (reportStatusFilter === 'DEPOSIT_ERROR') return r.type === 'DEPOSIT_ERROR';
                  return true;
                })
                .map((item) => (
                  <div key={item.id} className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div>
                        <p className="font-extrabold text-xs text-white">{item.user?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{item.user?.email} {item.user?.mssv ? `• ${item.user.mssv}` : ''}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        item.type === 'DEPOSIT_ERROR' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.type === 'DEPOSIT_ERROR' ? '💳 Lỗi nạp tiền' : '🐛 Lỗi hệ thống'}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{item.description}</p>
                    </div>

                    {item.type === 'DEPOSIT_ERROR' && (
                      <div className="flex items-center justify-between text-xs font-mono p-2 bg-slate-900 rounded-xl border border-slate-850">
                        <span>Số tiền nạp: <strong className="text-emerald-400">{item.expectedAmount?.toLocaleString()}đ</strong></span>
                        {item.transactionCode && <span className="text-[10px] text-slate-400">Mã CK: {item.transactionCode}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                      {item.proofImage ? (
                        <button
                          onClick={() => setFullscreenImage(item.proofImage!)}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        >
                          🔍 Xem ảnh CK
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Không có ảnh</span>
                      )}

                      {item.status === 'PENDING' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openProcessReportModal(item, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-white"
                          >
                            Duyệt cộng tiền
                          </button>
                          <button
                            onClick={() => openProcessReportModal(item, 'REJECTED')}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.status === 'APPROVED' ? '✅ Đã cộng tiền' : '❌ Từ chối'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
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
                <div key={f.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{f.student?.fullName || 'Sinh viên'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={12} 
                            className={s <= f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'} 
                          />
                        ))}
                      </div>
                    </div>
                    {f.comment && (
                      <p className="text-xs italic text-slate-300">&ldquo;{f.comment}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Mã đơn: #{f.request?.orderCode || f.id.slice(-6)} • {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {renderModals()}
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

