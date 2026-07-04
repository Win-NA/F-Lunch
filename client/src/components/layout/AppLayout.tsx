'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          // Initialize seen notifications to prevent toaster spam of old alerts on page refresh
          notifications.forEach((n: any) => seenNotificationIds.add(n.id));
          isFirstFetch = false;
          return;
        }

        // Identify and display new unread notifications
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
        // Silent catch for polling errors
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

  return (
    <div className="flex flex-col md:flex-row bg-slate-900 text-slate-100 min-h-screen">
      {/* Desktop Sidebar */}
      <div className="md:flex hidden shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-30">
          <Link
            href={user.role === 'RECEIVER' ? '/receiver' : user.role === 'ADMIN' ? '/admin' : '/student'}
            className="flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-base text-white shadow-md shadow-orange-600/25">
              FL
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white">F-LUNCH</span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-650/10 text-orange-500 border border-orange-500/20 scale-90">
              {user.role}
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:bg-slate-900 px-2.5 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-xs font-semibold text-slate-350 max-w-[120px] truncate">{user.fullName}</span>
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-orange-500 uppercase shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.fullName ? user.fullName[0] : 'U'
              )}
            </div>
          </Link>
        </header>

        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
