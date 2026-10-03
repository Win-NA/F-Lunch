'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleInit = () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleGoogleCallback,
      });
      const btnContainer = document.getElementById("google-signin-btn");
      if (btnContainer) {
        const parentWidth = btnContainer.parentElement?.clientWidth || 360;
        const calcWidth = Math.min(Math.max(parentWidth, 240), 380);
        window.google.accounts.id.renderButton(
          btnContainer,
          { 
            theme: "outline", 
            size: "large", 
            width: calcWidth,
            text: "signin_with", 
            shape: "rectangular",
            logo_alignment: "left"
          }
        );
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      handleGoogleInit();
    }
  }, []);

  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { credential: idToken });
      const { user, accessToken, refreshToken } = res.data;
      
      setAuth(user, accessToken, refreshToken);

      // Fetch fresh profile & balance instantly
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data) {
          updateUser(profileRes.data);
        }
      } catch (pErr) {
        // silent catch fallback
      }

      toast.success(`Chào mừng quay trở lại, ${user.fullName}!`);

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập Google thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const emailLower = email.trim().toLowerCase();
    if (!emailLower.endsWith('@fpt.edu.vn') && !emailLower.endsWith('@gmail.com')) {
      toast.error('Chỉ chấp nhận email đuôi @fpt.edu.vn hoặc @gmail.com');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data;
      
      setAuth(user, accessToken, refreshToken);

      // Fetch fresh profile & balance instantly
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data) {
          updateUser(profileRes.data);
        }
      } catch (pErr) {
        // silent catch fallback
      }

      toast.success(`Chào mừng quay trở lại, ${user.fullName}!`);

      // Điều hướng theo vai trò
      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập không thành công';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-3 sm:p-4 relative overflow-hidden">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        onLoad={handleGoogleInit}
        strategy="afterInteractive"
      />
      {/* Decorative gradient glowing circles */}
      <div className="absolute w-96 h-96 rounded-full bg-orange-600/10 blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-orange-600 font-extrabold text-2xl text-white mb-3 shadow-lg shadow-orange-600/20">
            FL
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-sans">Đăng nhập F-Lunch</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Cổng nhận hộ đơn hàng Campus FPT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
              Email Sinh viên FPT hoặc Gmail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student1@fpt.edu.vn hoặc user@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
              Mật khẩu *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-850" />
          <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hoặc tiếp tục với</span>
          <div className="flex-1 border-t border-slate-850" />
        </div>

        {/* Google Login Button */}
        <div className="flex justify-center w-full min-h-[44px] my-1">
          <div id="google-signin-btn" className="w-full flex justify-center overflow-hidden max-w-full"></div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
