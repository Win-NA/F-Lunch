'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/lib/translations';
import LanguageToggle from '@/components/common/LanguageToggle';
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
  AlertTriangle,
  Globe,
  ShoppingBag
} from 'lucide-react';

export default function Sidebar({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { t, lang } = useTranslation();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handleLogout = () => {
    logout();
    toast.success(t.logout_success);
    router.replace('/');
  };

  const fetchSyncData = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      // silent catch
    }
  };

  useEffect(() => {
    if (user) {
      fetchSyncData();
      const interval = setInterval(fetchSyncData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, pathname]);

  if (!user) return null;

  const role = user.role;
  const menuItems = [];

  const getRoleLabel = (r: string) => {
    if (r === 'ADMIN') return t.role_admin;
    if (r === 'RECEIVER') return t.role_receiver;
    return t.role_student;
  };

  if (role === 'STUDENT') {
    menuItems.push(
      { name: t.nav_landing, path: '/', icon: Globe },
      { name: t.nav_dashboard, path: '/student', icon: ShoppingBag },
      { name: t.nav_notifications, path: '/notifications', icon: Bell },
      { name: t.nav_profile, path: '/profile', icon: User },
      { name: t.nav_reports, path: '/student/reports', icon: AlertTriangle }
    );
  } else if (role === 'RECEIVER') {
    menuItems.push(
      { name: t.nav_landing, path: '/', icon: Globe },
      { name: t.nav_receiverDesk, path: '/receiver', icon: ClipboardList },
      { name: t.nav_receiverScan, path: '/receiver/scan', icon: QrCode },
      { name: t.nav_notifications, path: '/notifications', icon: Bell },
      { name: t.nav_profile, path: '/profile', icon: User }
    );
  } else if (role === 'ADMIN') {
    menuItems.push(
      { name: t.nav_landing, path: '/', icon: Globe },
      { name: t.nav_admin, path: '/admin', icon: Shield },
      { name: t.nav_adminReports, path: '/admin?view=reports', icon: AlertTriangle },
      { name: t.nav_adminCeo, path: '/admin?view=ceo', icon: Crown },
      { name: t.nav_notifications, path: '/notifications', icon: Bell },
      { name: t.nav_profile, path: '/profile', icon: User }
    );
  }

  const currentView = searchParams.get('view');
  const totalBalance = (user.realBalance || 0) + (user.bonusBalance || 0);

  return (
    <aside className="w-64 bg-slate-955 text-white h-full p-5 flex flex-col justify-between border-r border-slate-800 shadow-xl overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto pr-1">
        <Link
          href="/"
          title={t.nav_landing}
          className="flex items-center gap-3 px-3 py-3 mb-4 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer rounded-2xl bg-white/[0.03] border border-white/5 hover:border-orange-500/30 group"
        >
          <Image
            src="/logoF-Lunch-icon.png"
            alt="F-Lunch"
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-orange-600/25 group-hover:scale-105 transition-transform"
            priority
          />
          <div>
            <h1 className="font-extrabold text-lg leading-tight text-white tracking-wide">F-LUNCH</h1>
            {role !== 'STUDENT' ? (
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">{getRoleLabel(role)}</span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Campus Food Delivery</span>
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
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.wallet_title}</p>
                <p className="text-xs font-extrabold text-white font-mono">
                  {totalBalance.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-600 text-white shadow-sm shadow-orange-600/20 hover:bg-orange-500 transition-colors">
              {t.wallet_topup}
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

      <div className="pt-4 border-t border-slate-800 shrink-0 mt-4 space-y-3">
        {/* Language Switcher in Sidebar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">
            {lang === 'vi' ? 'Ngôn ngữ' : 'Language'}
          </span>
          <LanguageToggle variant="dark" />
        </div>

        <div className="px-3 flex items-center gap-3">
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
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium text-sm text-left cursor-pointer"
        >
          <LogOut size={18} />
          <span>{t.logout_btn}</span>
        </button>
      </div>
    </aside>
  );
}
