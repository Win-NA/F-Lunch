'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  Info,
  Camera,
  IdCard,
  Edit2,
  Save,
  X,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mssv, setMssv] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      updateUser(res.data);
      setFullName(res.data.fullName || '');
      setEmail(res.data.email || '');
      setPhoneNumber(res.data.phoneNumber || '');
      setMssv(res.data.mssv || '');
      setAvatar(res.data.avatar || null);
    } catch (err) {
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    router.push('/login');
  };

  const getRoleLabel = (r: string) => {
    if (r === 'ADMIN') return 'QUẢN TRỊ VIÊN';
    if (r === 'RECEIVER') return 'NGƯỜI NHẬN HỘ';
    return 'SINH VIÊN';
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Ảnh đại diện phải nhỏ hơn 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }
    if (!email.trim()) {
      toast.error('Email không được để trống');
      return;
    }
    if (mssv.trim()) {
      const mssvUpper = mssv.trim().toUpperCase();
      const regex = /^[A-Z]{2}\d{6}$/;
      if (!regex.test(mssvUpper)) {
        toast.error('Mã số sinh viên (MSSV) không đúng định dạng (Ví dụ: SE123456, HE181234...)');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.patch('/users/profile', {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        mssv: mssv ? mssv.toUpperCase() : null,
        avatar,
      });
      updateUser(res.data);
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật hồ sơ';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-slate-500 text-xs animate-pulse">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 font-sans">
            <User className="text-orange-500" size={24} />
            Hồ sơ của bạn
          </h1>
          <p className="text-slate-450 text-xs mt-1">Thông tin tài khoản cá nhân và liên lạc</p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Edit2 size={12} /> Chỉnh sửa
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar Edit */}
            <div className="flex flex-col items-center gap-2 border-b border-slate-850 pb-5">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-orange-600/10 border border-orange-500/20 overflow-hidden flex items-center justify-center text-orange-500 font-extrabold text-2xl">
                  {avatar ? (
                    <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    fullName ? fullName[0] : 'U'
                  )}
                </div>
                <label className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <p className="text-[9px] text-slate-500">Nhấp vào ảnh đại diện để thay đổi (dưới 1MB)</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550 mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550 mb-1">
                  Mã số Sinh viên (MSSV)
                </label>
                <input
                  type="text"
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  placeholder="Ví dụ: SE123456, HE181234..."
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Avatar and name */}
            <div className="flex items-center gap-4 border-b border-slate-850 pb-5">
              <div className="w-14 h-14 rounded-full bg-orange-600/10 border border-orange-500/20 overflow-hidden flex items-center justify-center text-orange-500 font-extrabold text-xl shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.fullName ? user.fullName[0] : 'U'
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{user.fullName}</h2>
                <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20 mt-1.5">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Detailed Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="text-slate-550 shrink-0" size={16} />
                <div>
                  <p className="text-[9px] text-slate-550 font-semibold uppercase tracking-wider">Địa chỉ Email</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IdCard className="text-slate-550 shrink-0" size={16} />
                <div>
                  <p className="text-[9px] text-slate-550 font-semibold uppercase tracking-wider">Mã số Sinh viên (MSSV)</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{user.mssv || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="text-slate-550 shrink-0" size={16} />
                <div>
                  <p className="text-[9px] text-slate-550 font-semibold uppercase tracking-wider">Số điện thoại</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{user.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            {user.role === 'STUDENT' && (
              <div className="pt-3 border-t border-slate-850">
                <Link
                  href="/student/reports"
                  className="w-full flex items-center justify-between p-3.5 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-2xl transition-all text-xs font-bold text-orange-400 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={18} className="text-orange-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="font-bold text-white">Báo cáo sự cố / Lỗi nạp tiền</p>
                      <p className="text-[10px] text-slate-400 font-normal">Gửi chứng từ chuyển khoản sai ND hoặc báo lỗi hệ thống</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-orange-500" />
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={14} /> Đăng xuất tài khoản
            </button>
          </>
        )}
      </div>
    </div>
  );
}
