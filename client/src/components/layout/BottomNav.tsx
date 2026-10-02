'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { 
  Home, 
  Bell, 
  User, 
  QrCode, 
  Shield,
  ClipboardList,
  Crown
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) {
        const count = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (err) {
      // silent catch
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  const role = user.role;
  const menuItems = [];

  if (role === 'STUDENT') {
    menuItems.push(
      { name: 'Trang chủ', path: '/student', icon: Home },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  } else if (role === 'RECEIVER') {
    menuItems.push(
      { name: 'Bàn việc', path: '/receiver', icon: ClipboardList },
      { name: 'Quét QR', path: '/receiver/scan', icon: QrCode },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  } else if (role === 'ADMIN') {
    menuItems.push(
      { name: 'Quản trị', path: '/admin', icon: Shield },
      { name: 'Báo cáo CEO', path: '/admin?view=ceo', icon: Crown },
      { name: 'Thông báo', path: '/notifications', icon: Bell },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  }

  // Thay đổi nhãn "Báo động" thành "Thông báo" cho thân thiện
  menuItems.forEach(item => {
    if (item.path === '/notifications') {
      item.name = 'Thông báo';
    }
  });

  const currentView = searchParams.get('view');

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-955/80 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-4 z-40 md:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isCeoItem = item.path === '/admin?view=ceo';
        const isAdminMainItem = item.path === '/admin';
        const isNotificationItem = item.path === '/notifications';
        
        let isActive = false;
        if (isCeoItem) {
          isActive = pathname === '/admin' && currentView === 'ceo';
        } else if (isAdminMainItem) {
          isActive = pathname === '/admin' && currentView !== 'ceo';
        } else {
          isActive = pathname === item.path;
        }

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative ${
              isActive ? 'text-orange-500 scale-105' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
              {isNotificationItem && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white font-extrabold text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow-md shadow-red-500/50 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

