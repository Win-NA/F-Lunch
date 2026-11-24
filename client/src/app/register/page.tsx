'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/lib/translations';
import LanguageToggle from '@/components/common/LanguageToggle';
import { api } from '@/lib/api';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, lang } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
            text: "signup_with", 
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
      toast.success('Đăng nhập bằng tài khoản Google thành công!');

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kết nối tài khoản Google thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Vui lòng nhập các trường thông tin bắt buộc');
      return;
    }
    const emailDomain = email.trim().toLowerCase();
    if (!emailDomain.endsWith('@fpt.edu.vn') && !emailDomain.endsWith('@gmail.com')) {
      toast.error('Chỉ chấp nhận email đuôi @fpt.edu.vn hoặc @gmail.com');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName,
        email,
        password,
        phoneNumber: phoneNumber || undefined,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn đến với F-Lunch.');

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký tài khoản thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        onLoad={handleGoogleInit}
        strategy="afterInteractive"
      />
      {/* Decorative gradient glowing circles */}
      <div className="absolute w-96 h-96 rounded-full bg-orange-600/10 blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        {/* Top bar with Back button and Language Switcher */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1.5"
          >
            ← {t.back_to_home}
          </Link>
          <LanguageToggle variant="dark" />
        </div>

        <div className="text-center mb-5 flex flex-col items-center">
          <div className="mb-2 transition-transform hover:scale-105 duration-300">
            <Image
              src="/logoF-Lunch.png"
              alt="F-Lunch Logo"
              width={200}
              height={70}
              className="h-16 sm:h-[70px] w-auto object-contain drop-shadow-[0_4px_16px_rgba(249,115,22,0.18)]"
              priority
            />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">{t.register_title}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.register_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.fullname_label} *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullname_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.email_label} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.phone_label}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t.phone_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.password_label} *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.confirm_password_label} *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.password_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-880 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? t.register_loading : t.register_btn}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-850" />
          <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.or_google}</span>
          <div className="flex-1 border-t border-slate-850" />
        </div>

        {/* Google Register Button */}
        <div className="flex justify-center w-full min-h-[44px] my-1">
          <div id="google-signin-btn" className="w-full flex justify-center overflow-hidden max-w-full"></div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          {t.have_account}{' '}
          <Link href="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
            {t.login_link}
          </Link>
        </p>
      </div>
    </div>
  );
}
