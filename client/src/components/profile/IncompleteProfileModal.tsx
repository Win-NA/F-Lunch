'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function IncompleteProfileModal({
  isOpen,
  onClose,
  title = 'Yêu cầu Cập nhật Hồ sơ',
  message = 'Vui lòng cập nhật đầy đủ Số điện thoại, Chức vụ và Mã định danh (MSSV / Mã Cán bộ) để tiếp tục sử dụng tính năng này!',
}: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    onClose();
    router.push('/profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center space-y-5 animate-scale-up">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{message}</p>
        </div>

        <div className="bg-slate-955/60 border border-slate-850 rounded-2xl p-4 text-left space-y-2">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-orange-500" /> Các thông tin cần hoàn thiện:
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside pl-1">
            <li>Số điện thoại liên hệ chính thức</li>
            <li>Chức vụ / Đối tượng (Sinh viên hoặc Cán bộ / Giảng viên)</li>
            <li>Mã số định danh FPT (MSSV hoặc Mã Cán bộ)</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={handleGoToProfile}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Cập nhật hồ sơ ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
