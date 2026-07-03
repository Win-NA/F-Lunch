'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Inbox
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircleIcon className="text-emerald-500 shrink-0" size={20} />;
      case 'WARNING':
        return <Bell className="text-red-500 shrink-0" size={20} />;
      default:
        return <Bell className="text-orange-500 shrink-0" size={20} />;
    }
  };

  function CheckCircleIcon({ className, size }: { className?: string, size?: number }) {
    return <Check className={className} size={size} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            Thông báo
          </h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi quá trình giao nhận đồ ăn của bạn</p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={btnLoading}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-orange-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <CheckCheck size={12} /> Đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500 text-xs">Đang tải thông báo...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <Inbox className="mx-auto text-slate-700 mb-2" size={32} />
          <p className="text-slate-500 text-xs">Bạn chưa nhận được thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                n.isRead
                  ? 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/50'
                  : 'bg-slate-900/80 border-orange-500/20 hover:border-orange-500/30 cursor-pointer shadow-md'
              }`}
            >
              {getIcon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-slate-350 font-semibold' : 'text-white'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[9px] text-slate-500 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${n.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
