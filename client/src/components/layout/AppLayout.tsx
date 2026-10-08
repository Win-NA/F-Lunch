'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import WalletModal from '../wallet/WalletModal';
import { Wallet, MapPin } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Wallet Modal State
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // MSSV Overlay Form State
  const [mssvInput, setMssvInput] = useState('');
  const [mssvLoading, setMssvLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial profile & balance on mount, user change, or route change
  useEffect(() => {
    if (user && mounted) {
      api.get('/users/profile')
        .then((res) => updateUser(res.data))
        .catch(() => {});
    }
  }, [mounted, user?.id, pathname]);

  // Global Notification Polling & Toasts
  useEffect(() => {
    if (!user || !mounted) return;

    let isFirstFetch = true;
    const seenNotificationIds = new Set<string>();

    const pollNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const notifications = res.data || [];

        if (isFirstFetch) {
          notifications.forEach((n: any) => seenNotificationIds.add(n.id));
          isFirstFetch = false;
          return;
        }

        notifications.forEach((n: any) => {
          if (!seenNotificationIds.has(n.id)) {
            seenNotificationIds.add(n.id);
            if (!n.isRead) {
              const toastOptions = {
                description: n.message,
                onClick: () => router.push('/notifications'),
                duration: 4000,
              };

              if (n.type === 'SUCCESS') {
                toast.success(n.title, toastOptions);
              } else if (n.type === 'WARNING') {
                toast.warning(n.title, toastOptions);
              } else {
                toast.info(n.title, toastOptions);
              }

              // Refresh profile balance on new notification
              api.get('/users/profile').then((pRes) => updateUser(pRes.data)).catch(() => {});
            }
          }
        });
      } catch (err) {
        // Silent catch
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 3000);

    return () => clearInterval(interval);
  }, [user, mounted, router]);

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  // Handle redirect on logout or unauthenticated access & role authorization check
  useEffect(() => {
    if (!mounted) return;

    if (!user && !isAuthPage) {
      router.replace('/login');
      return;
    }

    if (user) {
      const isStudentRoute = pathname.startsWith('/student');
      const isReceiverRoute = pathname.startsWith('/receiver');
      const isAdminRoute = pathname.startsWith('/admin');

      if (isAdminRoute && user.role !== 'ADMIN') {
        toast.error('Bạn không có quyền truy cập trang Quản trị!');
        router.replace(user.role === 'RECEIVER' ? '/receiver' : '/student');
      } else if (isReceiverRoute && user.role !== 'RECEIVER') {
        toast.error('Bạn không có quyền truy cập trang Nhận hộ!');
        router.replace(user.role === 'ADMIN' ? '/admin' : '/student');
      } else if (isStudentRoute && user.role !== 'RECEIVER' && user.role !== 'STUDENT') {
        toast.error('Bạn không có quyền truy cập trang này!');
        router.replace('/admin');
      }
    }
  }, [user, mounted, isAuthPage, pathname, router]);

  // Prevent hydration flicker before client state is loaded
  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  // Block rendering unauthorized page content while redirecting
  const isUnauthorized =
    (pathname.startsWith('/admin') && user.role !== 'ADMIN') ||
    (pathname.startsWith('/receiver') && user.role !== 'RECEIVER') ||
    (pathname.startsWith('/student') && user.role !== 'STUDENT' && user.role !== 'RECEIVER');

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <p className="text-sm font-semibold text-slate-300">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  const totalBal = (user.realBalance || 0) + (user.bonusBalance || 0);

  return (
    <div className="flex flex-col md:flex-row bg-slate-900 text-slate-100 min-h-screen">
      {/* Desktop Sidebar */}
      <div className="md:flex hidden shrink-0 h-screen sticky top-0 z-30">
        <Sidebar onOpenWallet={() => setIsWalletOpen(true)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-955/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-30">
          <Link
            href={user.role === 'RECEIVER' ? '/receiver' : user.role === 'ADMIN' ? '/admin' : '/student'}
            className="flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-base text-white shadow-md shadow-orange-600/25">
              FL
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white block leading-tight">F-LUNCH</span>
              {user.role !== 'STUDENT' && (
                <span className="text-[9px] uppercase font-bold text-orange-500 tracking-wider block leading-none mt-0.5">
                  {user.role === 'ADMIN' ? 'QUẢN TRỊ' : 'NGƯỜI NHẬN HỘ'}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Mobile Wallet Button (Only for STUDENT) */}
            {user.role === 'STUDENT' && (
              <button
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center gap-1.5 bg-orange-600/10 border border-orange-500/20 px-2.5 py-1 rounded-xl text-orange-400 hover:bg-orange-600/20 transition-all cursor-pointer"
              >
                <Wallet size={14} />
                <span className="text-xs font-extrabold font-mono">{totalBal.toLocaleString('vi-VN')}đ</span>
              </button>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 hover:bg-slate-900 px-2.5 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-orange-500 uppercase shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.fullName ? user.fullName[0] : 'U'
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Wallet Modal */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
}
