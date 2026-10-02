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

  // Fetch initial profile & balance
  useEffect(() => {
    if (user && mounted) {
      api.get('/users/profile')
        .then((res) => updateUser(res.data))
        .catch(() => {});
    }
  }, [mounted]);

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
                duration: 2500,
              };

              if (n.type === 'SUCCESS') {
                toast.success(n.title, toastOptions);
              } else {
                toast.info(n.title, toastOptions);
              }
            }
          }
        });
      } catch (err) {
        // Silent catch
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);

    return () => clearInterval(interval);
  }, [user, mounted, router]);

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  // Handle redirect on logout or unauthenticated access
  useEffect(() => {
    if (mounted && !user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, mounted, isAuthPage, router]);

  // Prevent hydration flicker before client state is loaded
  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  // Force MSSV update for new STUDENT/RECEIVER accounts
  const isMssvMissing = user && (user.role === 'STUDENT' || user.role === 'RECEIVER') && !user.mssv;

  const handleMssvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMssv = mssvInput.trim().toUpperCase();
    const regex = /^[A-Z]{2}\d{6}$/;
    if (!regex.test(cleanMssv)) {
      toast.error('MSSV không đúng định dạng. Ví dụ: SE123456, HE181234...');
      return;
    }

    setMssvLoading(true);
    try {
      const res = await api.patch('/users/profile', { mssv: cleanMssv });
      updateUser(res.data);
      toast.success('Cập nhật MSSV thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật MSSV';
      toast.error(msg);
    } finally {
      setMssvLoading(false);
    }
  };

  const handleMssvLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    router.replace('/login');
  };

  if (isMssvMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-955 p-4 relative overflow-hidden">
        {/* Decorative gradient glowing circles */}
        <div className="absolute w-96 h-96 rounded-full bg-orange-600/10 blur-[100px] -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] -bottom-20 -right-20 pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-600 font-extrabold text-2xl text-white mb-3 shadow-lg shadow-orange-600/20">
              FL
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white font-sans">Yêu cầu Cập nhật MSSV</h2>
            <p className="text-xs text-slate-450 mt-2">
              Chào mừng bạn đến với F-Lunch! Bạn cần cập nhật Mã số Sinh viên (MSSV) FPT của mình để tiếp tục sử dụng hệ thống.
            </p>
          </div>

          <form onSubmit={handleMssvSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Mã số Sinh viên (MSSV) *
              </label>
              <input
                type="text"
                value={mssvInput}
                onChange={(e) => setMssvInput(e.target.value)}
                placeholder="Ví dụ: SE123456, HE181234..."
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors uppercase font-mono"
              />
              <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">
                Định dạng: 2 chữ cái viết hoa và 6 chữ số (Ví dụ: SE123456). Mỗi sinh viên chỉ có một MSSV duy nhất.
              </p>
            </div>

            <button
              type="submit"
              disabled={mssvLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {mssvLoading ? 'Đang cập nhật...' : 'Xác nhận Cập nhật'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={handleMssvLogout}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              Đăng xuất tài khoản
            </button>
          </div>
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
            <span className="font-extrabold text-sm tracking-wide text-white">F-LUNCH</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Mobile Wallet Button */}
            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-1.5 bg-orange-600/10 border border-orange-500/20 px-2.5 py-1 rounded-xl text-orange-400 hover:bg-orange-600/20 transition-all cursor-pointer"
            >
              <Wallet size={14} />
              <span className="text-xs font-extrabold font-mono">{totalBal.toLocaleString('vi-VN')}đ</span>
            </button>

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
