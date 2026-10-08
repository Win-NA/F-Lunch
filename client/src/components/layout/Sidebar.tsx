'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Home, 
  Bell, 
  User, 
  QrCode, 
  Shield, 
  LogOut, 
  ClipboardList,
  Crown,
  Wallet,
  AlertTriangle
} from 'lucide-react';

export default function Sidebar({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    router.replace('/login');
  };

  const fetchSyncData = async () => {
    try {
      const [notifRes, profileRes] = await Promise.all([
        api.get('/notifications').catch(() => null),
        api.get('/users/profile').catch(() => null),
      ]);
      if (notifRes && Array.isArray(notifRes.data)) {
        const count = notifRes.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
      if (profileRes && profileRes.data) {
        updateUser(profileRes.data);
      }
    } catch (err) {
      // silent catch
    }
  };

  useEffect(() => {
    if (user) {
      fetchSyncData();
      const interval = setInterval(fetchSyncData, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  if (!user) return null;

  const role = user.role;
  const menuItems = [];

  const getRoleLabel = (r: string) => {
    if (r === 'ADMIN') return 'QUẢN TRỊ';
    if (r === 'RECEIVER') return 'NGƯỜI NHẬN HỘ';
    return 'SINH VIÊN';
  };

  if (role === 'STUDENT') {
    menuItems.push(
      { name: 'Bảng điều khiển', path: '/student', icon: Home },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User },
      { name: 'Báo cáo sự cố', path: '/student/reports', icon: AlertTriangle }
    );
  } else if (role === 'RECEIVER') {
    menuItems.push(
      { name: 'Bàn làm việc', path: '/receiver', icon: ClipboardList },
      { name: 'Quét QR bàn giao', path: '/receiver/scan', icon: QrCode },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  } else if (role === 'ADMIN') {
    menuItems.push(
      { name: 'Quản trị viên', path: '/admin', icon: Shield },
      { name: 'Duyệt khiếu nại', path: '/admin?view=reports', icon: AlertTriangle },
      { name: 'Báo cáo CEO', path: '/admin?view=ceo', icon: Crown },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  }

  const currentView = searchParams.get('view');
  const totalBalance = (user.realBalance || 0) + (user.bonusBalance || 0);

  return (
    <aside className="w-64 bg-slate-955 text-white h-full p-5 flex flex-col justify-between border-r border-slate-800 shadow-xl overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto pr-1">
        <Link
          href={role === 'RECEIVER' ? '/receiver' : role === 'ADMIN' ? '/admin' : '/student'}
          className="flex items-center gap-3 px-3 py-4 mb-4 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-orange-600/30">
            FL
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight text-white tracking-wide">F-LUNCH</h1>
            {role !== 'STUDENT' && (
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">{getRoleLabel(role)}</span>
            )}
          </div>
        </Link>

        {/* Wallet Balance Card (Only for STUDENT) */}
        {role === 'STUDENT' && (
          <div 
            onClick={onOpenWallet}
            className="bg-slate-900 border border-slate-800 hover:border-orange-500/40 p-3 rounded-2xl flex items-center justify-between text-left transition-all mb-4 cursor-pointer group shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Ví F-Lunch</p>
                <p className="text-xs font-extrabold text-white font-mono">
                  {totalBalance.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-600 text-white shadow-sm shadow-orange-600/20 hover:bg-orange-500 transition-colors">
              Nạp
            </span>
          </div>
        )}

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isCeoItem = item.path === '/admin?view=ceo';
            const isReportsItem = item.path === '/admin?view=reports';
            const isAdminMainItem = item.path === '/admin';
            const isNotificationItem = item.path === '/notifications';
            
            let isActive = false;
            if (isCeoItem) {
              isActive = pathname === '/admin' && currentView === 'ceo';
            } else if (isReportsItem) {
              isActive = pathname === '/admin' && currentView === 'reports';
            } else if (isAdminMainItem) {
              isActive = pathname === '/admin' && currentView !== 'ceo' && currentView !== 'reports';
            } else {
              isActive = pathname === item.path;
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon size={18} className={isCeoItem && isActive ? 'fill-white' : ''} />
                  <span>{item.name}</span>
                </div>

                {isNotificationItem && unreadCount > 0 && (
                  <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md shadow-red-500/40 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 shrink-0 mt-4">
        <div className="px-3 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center text-sm font-semibold text-orange-500 shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.fullName ? user.fullName[0] : 'U'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-white">{user.fullName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium text-sm text-left cursor-pointer"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
