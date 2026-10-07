'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Inbox,
  ShieldAlert,
  ShoppingBag,
  SlidersHorizontal,
  Clock
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const role = user?.role || 'STUDENT';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ADMIN' | 'ORDERS'>('ALL');

  const getSubtitle = () => {
    if (role === 'ADMIN') return 'Cập nhật biến động hệ thống, duyệt nạp tiền và khiếu nại';
    if (role === 'RECEIVER') return 'Cập nhật đơn nhận hộ, tiền công và thông báo hệ thống';
    return 'Theo dõi trạng thái đơn hàng, biến động số dư và phản hồi sự cố';
  };

  const getEmptyStateMessage = () => {
    if (role === 'ADMIN') {
      if (activeTab === 'ADMIN') return 'Không có thông báo khiếu nại hoặc hệ thống nào cần quản trị.';
      if (activeTab === 'ORDERS') return 'Không có thông báo đơn hàng cá nhân nào.';
      return 'Chưa có thông báo hệ thống hoặc khiếu nại mới nào.';
    }
    if (role === 'RECEIVER') return 'Bạn chưa có thông báo mới nào về đơn hàng hoặc thu nhập.';
    return 'Bạn chưa nhận me được thông báo mới nào.';
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err: any) {
      // Bỏ qua lỗi kết nối
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err: any) {
      // Bỏ qua lỗi
    }
  };

  const handleMarkAllAsRead = async () => {
    setBtnLoading(true);
    try {
      await api.post('/notifications/read-all');
      toast.success('Đã đánh dấu đọc tất cả thông báo');
      fetchNotifications();
    } catch (err: any) {
      toast.error('Không thể đánh dấu đọc tất cả');
    } finally {
      setBtnLoading(false);
    }
  };

  // Format date precisely: show "15:19 hôm nay", "15:10 hôm qua", or "15:19 - 07/10/2026"
  const formatNotificationTime = (createdAtStr: string) => {
    if (!createdAtStr) return '';
    const date = new Date(createdAtStr);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `${timeStr} hôm nay`;
    }
    if (isYesterday) {
      return `${timeStr} hôm qua`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${timeStr} • ${day}/${month}/${year}`;
  };

  // Helper to check if a notification belongs to Admin System/Report domain
  const isAdminNotification = (n: NotificationItem) => {
    const titleLower = n.title.toLowerCase();
    const msgLower = n.message.toLowerCase();
    return (
      n.type === 'WARNING' ||
      n.type === 'SYSTEM' ||
      titleLower.includes('khiếu nại') ||
      titleLower.includes('báo cáo') ||
      titleLower.includes('nạp tiền') ||
      titleLower.includes('quản trị') ||
      titleLower.includes('hệ thống') ||
      titleLower.includes('số dư') ||
      msgLower.includes('khiếu nại') ||
      msgLower.includes('báo cáo') ||
      msgLower.includes('admin')
    );
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((n) => {
    if (role !== 'ADMIN' || activeTab === 'ALL') return true;
    if (activeTab === 'ADMIN') return isAdminNotification(n);
    if (activeTab === 'ORDERS') return !isAdminNotification(n);
    return true;
  });

  const getIcon = (n: NotificationItem) => {
    if (isAdminNotification(n)) {
      return <ShieldAlert className="text-amber-500 shrink-0" size={20} />;
    }
    switch (n.type) {
      case 'SUCCESS':
        return <CheckCircleIcon className="text-emerald-500 shrink-0" size={20} />;
      case 'WARNING':
        return <Bell className="text-red-500 shrink-0" size={20} />;
      default:
        return <Bell className="text-orange-500 shrink-0" size={20} />;
    }
  };

  function CheckCircleIcon({ className, size }: { className?: string; size?: number }) {
    return <Check className={className} size={size} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            Thông báo
          </h1>
          <p className="text-slate-400 text-xs mt-1">{getSubtitle()}</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={btnLoading}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-orange-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <CheckCheck size={14} /> Đọc tất cả
          </button>
        )}
      </div>

      {/* Tabs for Admin / Filter Categorization */}
      {role === 'ADMIN' && (
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <SlidersHorizontal size={13} /> tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <ShieldAlert size={13} className="text-amber-400" /> Quản trị & Hệ thống ({notifications.filter(isAdminNotification).length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <ShoppingBag size={13} className="text-orange-400" /> Đơn cá nhân ({notifications.filter((n) => !isAdminNotification(n)).length})
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-550 text-xs">Đang tải thông báo...</p>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40 space-y-2">
          <Inbox className="mx-auto text-slate-700" size={36} />
          <p className="text-slate-400 text-xs font-medium">{getEmptyStateMessage()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isAdminType = isAdminNotification(n);
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  n.isRead
                    ? 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/50'
                    : isAdminType
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50 shadow-md cursor-pointer'
                    : 'bg-slate-900/80 border-orange-500/20 hover:border-orange-500/30 cursor-pointer shadow-md'
                }`}
              >
                {getIcon(n)}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-slate-300 font-semibold' : 'text-white'}`}>
                        {n.title}
                      </h4>
                      {role === 'ADMIN' && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                            isAdminType
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isAdminType ? 'Quản trị' : 'Đơn hàng'}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-450 font-medium flex items-center gap-1 shrink-0 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-850" title={new Date(n.createdAt).toLocaleString('vi-VN')}>
                      <Clock size={10} className="text-slate-500" />
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>

                  <p className={`text-[11px] mt-1.5 leading-relaxed ${n.isRead ? 'text-slate-450' : 'text-slate-200'}`}>
                    {n.message}
                  </p>
                </div>

                {!n.isRead && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 self-center ${
                      isAdminType ? 'bg-amber-400 animate-pulse' : 'bg-orange-500'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

