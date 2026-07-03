'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { 
  Home, 
  Bell, 
  User, 
  QrCode, 
  Shield,
  ClipboardList
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

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
      { name: 'Báo động', path: '/notifications', icon: Bell }, // Hoặc "Thông báo"
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  } else if (role === 'ADMIN') {
    menuItems.push(
      { name: 'Quản trị', path: '/admin', icon: Shield },
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  }

  // Thay đổi nhãn "Báo động" thành "Thông báo" cho thân thiện
  menuItems.forEach(item => {
    if (item.path === '/notifications') {
      item.name = 'Thông báo';
    }
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-955/80 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-4 z-40 md:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ${
              isActive ? 'text-orange-500 scale-105' : 'text-slate-500'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
            <span className="text-[10px] font-semibold mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
