'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

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
      {/* Decorative gradient glowing circles */}
      <div className="absolute w-96 h-96 rounded-full bg-orange-600/10 blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-600 font-extrabold text-2xl text-white mb-3 shadow-lg shadow-orange-600/20">
            FL
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Đăng Ký Tài Khoản</h2>
          <p className="text-sm text-slate-400 mt-1">Trở thành thành viên của cộng đồng F-Lunch</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: student1@fpt.edu.vn hoặc user@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mật khẩu *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Nhập lại mật khẩu *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu của bạn"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-880 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
            Đăng Nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
