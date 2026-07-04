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
  LogOut, 
  ClipboardList
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

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
      { name: 'Hồ sơ', path: '/profile', icon: User }
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
      { name: 'Hồ sơ', path: '/profile', icon: User }
    );
  }

  return (
    <aside className="w-64 bg-slate-955 text-white min-h-screen p-5 flex flex-col justify-between border-r border-slate-800 shadow-xl">
      <div>
        <Link
          href={role === 'RECEIVER' ? '/receiver' : role === 'ADMIN' ? '/admin' : '/student'}
          className="flex items-center gap-3 px-3 py-4 mb-8 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-orange-600/30">
            FL
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight text-white tracking-wide">F-LUNCH</h1>
            <span className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">{getRoleLabel(role)}</span>
          </div>
        </Link>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800">
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
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium text-sm text-left cursor-pointer"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
