'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { 
  Home, 
  Bell, 
  User, 
  QrCode, 
  Shield, 
  LogOut, 
  ClipboardList,
  Crown,
  Wallet
} from 'lucide-react';

export default function Sidebar({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      { name: 'Báo cáo CEO', path: '/admin?view=ceo', icon: Crown },
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
            <span className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">{getRoleLabel(role)}</span>
          </div>
        </Link>

        {/* Wallet Balance Card */}
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

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isCeoItem = item.path === '/admin?view=ceo';
            const isAdminMainItem = item.path === '/admin';
            
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
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon size={18} className={isCeoItem && isActive ? 'fill-white' : ''} />
                <span>{item.name}</span>
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
