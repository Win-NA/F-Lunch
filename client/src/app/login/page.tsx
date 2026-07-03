'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, ClipboardList, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!email.endsWith('@fpt.edu.vn')) {
      toast.error('Chỉ chấp nhận email đuôi @fpt.edu.vn');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data;
      
      setAuth(user, accessToken, refreshToken);
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

  const handleQuickLogin = async (quickEmail: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: quickEmail, password: '123456' });
      const { user, accessToken, refreshToken } = res.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success(`Đăng nhập nhanh thành công! Chào ${user.fullName}.`);

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập nhanh thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-3 sm:p-4 relative overflow-hidden">
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
              Email Sinh viên FPT *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: student1@fpt.edu.vn"
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
          <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hoặc đăng nhập nhanh</span>
          <div className="flex-1 border-t border-slate-850" />
        </div>

        {/* Quick Login Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('student1@fpt.edu.vn')}
            disabled={loading}
            className="bg-slate-950 hover:bg-slate-900/60 border border-slate-850 hover:border-orange-550/40 text-slate-300 py-3 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          >
            <User size={16} className="text-orange-500" />
            <span className="text-[10px] font-bold">Sinh viên</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('receiver1@fpt.edu.vn')}
            disabled={loading}
            className="bg-slate-950 hover:bg-slate-900/60 border border-slate-850 hover:border-orange-550/40 text-slate-300 py-3 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          >
            <ClipboardList size={16} className="text-orange-500" />
            <span className="text-[10px] font-bold">Người nhận</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@fpt.edu.vn')}
            disabled={loading}
            className="bg-slate-950 hover:bg-slate-900/60 border border-slate-850 hover:border-orange-550/40 text-slate-300 py-3 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shield size={16} className="text-orange-500" />
            <span className="text-[10px] font-bold">Quản trị</span>
          </button>
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
