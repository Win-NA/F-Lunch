'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Wallet, 
  ArrowDownLeft, 
  History, 
  X, 
  Copy, 
  Building2, 
  QrCode, 
  Gift, 
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Check,
  RefreshCw,
  Search
} from 'lucide-react';

import { isProfileComplete } from '@/lib/profileGuard';
import IncompleteProfileModal from '../profile/IncompleteProfileModal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<'DEPOSIT' | 'HISTORY'>('DEPOSIT');

  // Deposit Form State
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const paymentMethod = 'BANK_TRANSFER';
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins = 900 seconds

  // History State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Copy state helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Track balance changes to alert user automatically
  const prevBalanceRef = useRef<number | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        const newTotalBal = (res.data.realBalance || 0) + (res.data.bonusBalance || 0);
        if (prevBalanceRef.current !== null && newTotalBal > prevBalanceRef.current) {
          const added = newTotalBal - prevBalanceRef.current;
          toast.success(`🎉 Nạp tiền thành công! +${added.toLocaleString('vi-VN')} đ`);
          fetchHistory();
        }
        prevBalanceRef.current = newTotalBal;
        updateUser(res.data);
      }
    } catch (err) {
      // silent catch
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await api.post('/transactions/verify-deposit');
      if (res.data?.success) {
        toast.success(res.data.message || 'Thành công! Số dư đã được cộng vào ví.');
        fetchProfile();
        fetchHistory();
      } else {
        toast.info(res.data?.message || 'Hệ thống chưa nhận được thông tin từ ngân hàng. Vui lòng chờ ít phút.');
      }
    } catch (err: any) {
      toast.error('Không thể kiểm tra giao dịch vào lúc này.');
    } finally {
      setChecking(false);
    }
  };

  const depositAmountRef = useRef(depositAmount);
  useEffect(() => {
    depositAmountRef.current = depositAmount;
  }, [depositAmount]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const fetchHistory = async (isSilent = false) => {
    if (!isSilent && transactions.length === 0) {
      setHistoryLoading(true);
    }
    try {
      const res = await api.get('/transactions/my-transactions');
      setTransactions(res.data || []);
    } catch (err) {
      // silent catch
    } finally {
      if (!isSilent) {
        setHistoryLoading(false);
      }
    }
  };

  const memoCode = `SEVQR FLUNCH ${user?.mssv || user?.fullName?.replace(/\s+/g, '') || ''}`.trim();

  // Confirm deposit amount to generate QR code
  const handleConfirmDeposit = async () => {
    if (!selectedAmount || selectedAmount < 10000) {
      toast.error('Vui lòng chọn hoặc nhập số tiền nạp tối thiểu 10.000đ');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      await api.post('/transactions/deposit', {
        amount: selectedAmount,
        paymentMethod: 'BANK_TRANSFER',
      });
      setDepositAmount(selectedAmount);
      setTimeLeft(900);
      toast.success(`Đã khởi tạo mã QR nạp ${selectedAmount.toLocaleString('vi-VN')}đ!`);
      fetchHistory(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo mã QR nạp tiền. Vui lòng thử lại.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Cancel selected amount before confirming
  const handleCancelSelection = () => {
    setSelectedAmount(null);
  };

  // Cancel active transaction code
  const handleCancelActiveDeposit = async () => {
    try {
      await api.post('/transactions/cancel-deposit');
      setDepositAmount(null);
      setSelectedAmount(null);
      setTimeLeft(0);
      toast.success('Đã hủy mã giao dịch này.');
      fetchHistory(true);
    } catch (err: any) {
      toast.error('Không thể hủy mã giao dịch. Vui lòng thử lại.');
    }
  };

  // Check active pending deposit on mount/open
  const checkActivePendingDeposit = async () => {
    try {
      const res = await api.post('/transactions/auto-check-deposit');
      if (res.data?.transaction && res.data.transaction.status === 'PENDING') {
        const tx = res.data.transaction;
        const createdAtTime = new Date(tx.createdAt).getTime();
        const elapsedSecs = Math.floor((Date.now() - createdAtTime) / 1000);
        const remainingSecs = 900 - elapsedSecs;

        if (remainingSecs > 0) {
          setSelectedAmount(tx.amount);
          setDepositAmount(tx.amount);
          setTimeLeft(remainingSecs);
        } else {
          await api.post('/transactions/cancel-deposit');
          setDepositAmount(null);
          setSelectedAmount(null);
          setTimeLeft(0);
        }
      }
    } catch (e) {
      // silent
    }
  };

  // Auto-expire in backend when countdown reaches 0
  useEffect(() => {
    if (timeLeft === 0 && depositAmount) {
      api.post('/transactions/cancel-deposit').catch(() => {});
      fetchHistory(true);
    }
  }, [timeLeft, depositAmount]);

  // 15-minute countdown tick
  useEffect(() => {
    if (!depositAmount || depositAmount < 10000) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [depositAmount]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Initial fetch when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      checkActivePendingDeposit();
      if (tab === 'HISTORY') {
        fetchHistory(false);
      }
    }
  }, [isOpen, tab]);

  // Background polling for balance & auto-check deposit without reloading spinner
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(async () => {
      const amt = depositAmountRef.current;
      const timer = timeLeftRef.current;

      if (amt && amt >= 10000 && timer > 0) {
        try {
          const res = await api.post('/transactions/auto-check-deposit');
          if (res.data?.success) {
            fetchProfile();
            fetchHistory(true);
          }
        } catch (e) {
          // silent catch
        }
      }
      fetchProfile();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !user) return null;

  if (!isProfileComplete(user)) {
    return (
      <IncompleteProfileModal
        isOpen={isOpen}
        onClose={onClose}
        title="Yêu cầu Cập nhật Hồ sơ trước khi Nạp tiền"
        message="Vui lòng cập nhật đầy đủ Số điện thoại, Chức vụ và Mã định danh (MSSV / Mã Cán bộ) để có thể khởi tạo mã QR Nạp tiền vào ví!"
      />
    );
  }

  const realBal = user.realBalance || 0;
  const bonusBal = user.bonusBalance || 0;
  const totalBal = realBal + bonusBal;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getBonusAmount = (amount: number) => {
    if (amount >= 500000) return 100000;
    if (amount >= 200000) return 40000;
    if (amount >= 100000) return 20000;
    if (amount >= 50000) return 10000;
    if (amount >= 20000) return 5000;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 overflow-y-auto">
      <div 
        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
        className="relative w-full max-w-2xl border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div 
          style={{ backgroundColor: '#090d16' }} 
          className="flex items-center justify-between px-5 sm:px-8 py-5 border-b-2 border-slate-800 shrink-0"
        >
          <div className="flex items-center gap-3.5">
            <div 
              style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }} 
              className="w-12 h-12 rounded-2xl border-2 border-orange-500/40 flex items-center justify-center shadow-lg shrink-0"
            >
              <Wallet size={26} />
            </div>
            <div>
              <h3 style={{ color: '#ffffff' }} className="font-black text-2xl tracking-tight">Ví F-Lunch</h3>
              <p style={{ color: '#cbd5e1' }} className="text-sm sm:text-base font-bold">Quản lý số dư &amp; Nạp tiền vào ví</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center hover:text-white hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-7">
          {/* Balance Highlight Banner */}
          <div 
            style={{ backgroundColor: '#1e293b', borderColor: 'rgba(249, 115, 22, 0.5)' }} 
            className="p-5 sm:p-6 rounded-3xl border-2 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span style={{ color: '#f1f5f9' }} className="text-xs sm:text-sm font-extrabold uppercase tracking-widest">
                Tổng số dư khả dụng
              </span>
              <span 
                style={{ backgroundColor: 'rgba(249, 115, 22, 0.25)', color: '#fed7aa', borderColor: 'rgba(249, 115, 22, 0.5)' }} 
                className="text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full border-2 flex items-center gap-2"
              >
                <ShieldCheck size={18} style={{ color: '#f97316' }} /> Phí 5.000đ / đơn
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 font-mono">
              <span style={{ color: '#ffffff' }} className="text-4xl sm:text-5xl font-black tracking-tight">
                {totalBal.toLocaleString('vi-VN')}
              </span>
              <span style={{ color: '#f97316' }} className="text-2xl sm:text-3xl font-black font-sans">
                VNĐ
              </span>
            </div>

            {/* Breakdown */}
            <div style={{ borderColor: '#334155' }} className="grid grid-cols-2 gap-3.5 pt-4 border-t-2">
              <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="p-4 rounded-2xl border-2">
                <p style={{ color: '#cbd5e1' }} className="text-xs sm:text-sm font-bold">Ví nạp chính</p>
                <p style={{ color: '#34d399' }} className="text-xl sm:text-2xl font-black font-mono mt-1">
                  {realBal.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="p-4 rounded-2xl border-2">
                <p style={{ color: '#cbd5e1' }} className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  Ví Khuyến mãi <Gift size={16} style={{ color: '#f97316' }} />
                </p>
                <p style={{ color: '#fb923c' }} className="text-xl sm:text-2xl font-black font-mono mt-1">
                  {bonusBal.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ backgroundColor: '#090d16', borderColor: '#334155' }} className="flex border-2 p-1.5 rounded-2xl gap-1.5">
            <button
              onClick={() => setTab('DEPOSIT')}
              style={{
                backgroundColor: tab === 'DEPOSIT' ? '#ea580c' : 'transparent',
                color: tab === 'DEPOSIT' ? '#ffffff' : '#cbd5e1',
              }}
              className="flex-1 py-3.5 sm:py-4 rounded-xl text-sm sm:text-lg font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ArrowDownLeft size={22} /> Nạp tiền vào ví
            </button>
            <button
              onClick={() => setTab('HISTORY')}
              style={{
                backgroundColor: tab === 'HISTORY' ? '#ea580c' : 'transparent',
                color: tab === 'HISTORY' ? '#ffffff' : '#cbd5e1',
              }}
              className="flex-1 py-3.5 sm:py-4 rounded-xl text-sm sm:text-lg font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <History size={22} /> Lịch sử giao dịch
            </button>
          </div>

          {/* DEPOSIT TAB */}
          {tab === 'DEPOSIT' && (
            <div className="space-y-7">
              {/* Red Warning Banner - ALWAYS VISIBLE AT TOP */}
              <div style={{ backgroundColor: '#450a0a', borderColor: '#dc2626' }} className="p-5 rounded-2xl border-2 flex items-start gap-3.5 text-sm sm:text-base shadow-xl">
                <AlertTriangle size={28} style={{ color: '#f87171' }} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p style={{ color: '#fca5a5' }} className="font-black uppercase tracking-wider text-xs sm:text-sm">
                    LƯU Ý QUAN TRỌNG (KHÔNG THỂ RÚT / HOÀN TIỀN):
                  </p>
                  <p style={{ color: '#fee2e2' }} className="text-xs sm:text-sm leading-relaxed font-semibold">
                    Số dư Ví F-Lunch chỉ sử dụng cho phí nhận hộ 5.000đ/đơn và <strong style={{ color: '#ffffff' }} className="font-extrabold underline">KHÔNG THỂ rút ra ngoài hoặc hoàn tiền mặt</strong>. Vui lòng cân nhắc kỹ trước khi quét mã chuyển khoản.
                  </p>
                </div>
              </div>

              {/* Step 1: Select Amount */}
              <div className="space-y-3.5">
                <label style={{ color: '#fb923c' }} className="block text-xs sm:text-sm font-black uppercase tracking-widest">
                  1. Chọn hoặc nhập số tiền nạp
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                  {[
                    { amount: 20000, label: '20.000đ', bonus: 5000 },
                    { amount: 50000, label: '50.000đ', bonus: 10000 },
                    { amount: 100000, label: '100.000đ', bonus: 20000 },
                    { amount: 200000, label: '200.000đ', bonus: 40000 },
                    { amount: 500000, label: '500.000đ', bonus: 100000 },
                  ].map((item) => {
                    const isSelected = selectedAmount === item.amount;
                    return (
                      <button
                        key={item.amount}
                        type="button"
                        onClick={() => setSelectedAmount(item.amount)}
                        style={{
                          backgroundColor: isSelected ? '#c2410c' : '#1e293b',
                          borderColor: isSelected ? '#f97316' : '#334155',
                          color: '#ffffff',
                        }}
                        className="p-4 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden active:scale-95 shadow-md"
                      >
                        <div className="text-lg sm:text-xl font-black font-mono">{item.label}</div>
                        {item.bonus > 0 && (
                          <div style={{ color: isSelected ? '#fef08a' : '#fb923c' }} className="text-xs sm:text-sm font-black mt-1">
                            +{item.bonus / 1000}k KM
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input */}
                <div className="pt-2">
                  <label style={{ color: '#f1f5f9' }} className="block text-xs sm:text-sm font-bold mb-2">
                    Hoặc nhập số tiền tùy chọn (đ):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={selectedAmount ? selectedAmount.toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/[^0-9]/g, '');
                      if (!rawDigits) {
                        setSelectedAmount(null);
                      } else {
                        const parsed = parseInt(rawDigits, 10);
                        setSelectedAmount(parsed > 10000000 ? 10000000 : parsed);
                      }
                    }}
                    placeholder="Nhập số tiền nạp tùy ý (VD: 30.000)..."
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    className="w-full rounded-2xl px-5 py-4 text-lg sm:text-xl font-mono font-black focus:border-orange-500 focus:outline-none transition-colors border-2 placeholder:font-sans placeholder:text-sm sm:placeholder:text-base placeholder:font-normal"
                  />
                </div>

                {/* Action Buttons: Confirm & Cancel selected amount */}
                {selectedAmount && selectedAmount > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmDeposit}
                      disabled={isSubmittingDeposit || selectedAmount < 10000}
                      style={{
                        backgroundColor: (selectedAmount >= 10000 && !isSubmittingDeposit) ? '#ea580c' : '#475569',
                        color: '#ffffff',
                      }}
                      className="flex-1 py-3.5 px-5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check size={22} />
                      {isSubmittingDeposit
                        ? 'Đang tạo mã QR...'
                        : `Xác nhận nạp ${selectedAmount.toLocaleString('vi-VN')}đ`}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSelection}
                      disabled={isSubmittingDeposit}
                      style={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#cbd5e1' }}
                      className="py-3.5 px-5 rounded-2xl font-bold text-base border-2 hover:bg-slate-700 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X size={20} /> Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Bonus Highlight */}
              {selectedAmount && selectedAmount >= 10000 && getBonusAmount(selectedAmount) > 0 && (
                <div 
                  style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: 'rgba(249, 115, 22, 0.5)' }} 
                  className="p-4.5 rounded-2xl border-2 flex items-center justify-between text-sm sm:text-base shadow-lg"
                >
                  <span style={{ color: '#ffedd5' }} className="font-extrabold flex items-center gap-2">
                    <Sparkles size={20} style={{ color: '#f97316' }} /> Ưu đãi đợt này:
                  </span>
                  <span style={{ color: '#fb923c' }} className="font-black font-mono text-lg sm:text-xl">
                    +{getBonusAmount(selectedAmount).toLocaleString('vi-VN')} đ KM
                  </span>
                </div>
              )}

              {/* Payment Section (Hidden until confirmed depositAmount >= 10000) */}
              {!depositAmount || depositAmount < 10000 ? (
                <div style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="p-7 sm:p-10 rounded-3xl border-2 text-center space-y-4">
                  <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }} className="w-16 h-16 rounded-2xl border-2 border-orange-500/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <QrCode size={36} />
                  </div>
                  <h4 style={{ color: '#ffffff' }} className="text-lg sm:text-xl font-black">Vui lòng chọn hoặc nhập số tiền nạp</h4>
                  <p style={{ color: '#cbd5e1' }} className="text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
                    Bấm chọn một trong các mức tiền gợi ý ở Bước 1 hoặc tự gõ số tiền (tối thiểu 10.000đ), sau đó ấn nút <strong style={{ color: '#f97316' }}>"Xác nhận"</strong> để hệ thống tạo mã QR thanh toán.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 pt-1">
                  {/* Payment Card - App Ngân Hàng VietQR */}
                  <div style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="border-2 rounded-3xl p-5 sm:p-7 text-center space-y-6 shadow-2xl">
                    <div className="border-b-2 border-slate-700/60 pb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between text-left">
                      {/* Title & Amount */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Building2 size={22} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 style={{ color: '#ffffff' }} className="font-black text-base sm:text-lg leading-tight">
                              Quét mã VietQR
                            </h4>
                            <span style={{ color: '#34d399' }} className="font-mono font-black text-base sm:text-lg px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                              {depositAmount.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 15-Minute Countdown Badge (Without Clock Icon) */}
                      <div className="shrink-0 flex items-center">
                        {timeLeft > 0 ? (
                          <div 
                            style={{ 
                              backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                              color: '#fbbf24', 
                              borderColor: 'rgba(245, 158, 11, 0.4)' 
                            }} 
                            className="px-3.5 py-2 rounded-2xl border-2 text-xs sm:text-sm font-extrabold flex items-center gap-2 whitespace-nowrap shadow-md w-full sm:w-auto justify-center"
                          >
                            <span style={{ color: '#fef08a' }} className="font-bold">Hạn thanh toán:</span>
                            <span className="font-mono font-black text-amber-300 text-sm sm:text-base px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/30 whitespace-nowrap tracking-wider">
                              {formatCountdown(timeLeft)}
                            </span>
                          </div>
                        ) : (
                          <div 
                            style={{ 
                              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                              color: '#fca5a5', 
                              borderColor: 'rgba(239, 68, 68, 0.4)' 
                            }} 
                            className="px-3.5 py-2 rounded-2xl border-2 text-xs sm:text-sm font-black flex items-center gap-1.5 whitespace-nowrap w-full sm:w-auto justify-center"
                          >
                            <span>⚠️ Đã hết hạn</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR Code Container or Expired Notice */}
                    {timeLeft > 0 ? (
                      <div className="space-y-6">
                        <div className="w-72 h-72 sm:w-96 sm:h-96 bg-white p-4 rounded-3xl mx-auto shadow-2xl overflow-hidden flex items-center justify-center border-4 border-slate-600">
                          <img 
                            src={`https://vietqr.app/img?bank=VietinBank&acc=106875040898&template=compact&amount=${depositAmount}&des=${encodeURIComponent(memoCode)}&showinfo=true&holder=LE%20DO%20NHAT%20ANH&store=F-Lunch`} 
                            alt="VietinBank VietQR" 
                            className="w-full h-full object-contain" 
                          />
                        </div>

                        {/* High-Contrast Crisp Details Box */}
                        <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="text-left p-5 sm:p-6 rounded-2xl border-2 space-y-4 font-sans shadow-inner">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">Ngân hàng nhận:</span>
                            <span style={{ color: '#ffffff' }} className="font-black text-lg sm:text-xl">VietinBank</span>
                          </div>
                          
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">Số tài khoản:</span>
                            <button
                              onClick={() => copyToClipboard('106875040898', 'STK')}
                              style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.5)' }}
                              className="font-black font-mono text-lg sm:text-xl hover:bg-amber-500/30 flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all shadow-md"
                            >
                              106875040898 {copiedField === 'STK' ? <Check size={20} style={{ color: '#34d399' }} /> : <Copy size={20} />}
                            </button>
                          </div>

                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">Chủ tài khoản:</span>
                            <span style={{ color: '#ffffff' }} className="font-black text-lg sm:text-xl uppercase tracking-wider">LÊ ĐỖ NHẬT ANH</span>
                          </div>

                          <div style={{ borderColor: '#334155' }} className="flex justify-between items-center flex-wrap gap-2 pt-3 border-t-2">
                            <div>
                              <span style={{ color: '#fb923c' }} className="font-black text-base sm:text-lg block">Nội dung CK:</span>
                              <span style={{ color: '#f87171' }} className="text-xs font-black uppercase tracking-wider block">(BẮT BUỘC)</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(memoCode, 'Nội dung')}
                              style={{ backgroundColor: 'rgba(249, 115, 22, 0.25)', color: '#fdba74', borderColor: 'rgba(249, 115, 22, 0.6)' }}
                              className="font-black font-mono text-base sm:text-xl hover:bg-orange-500/40 flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all shadow-lg shrink-0"
                            >
                              {memoCode} {copiedField === 'Nội dung' ? <Check size={20} style={{ color: '#34d399' }} /> : <Copy size={20} />}
                            </button>
                          </div>

                          {/* Cancel Active Transaction Line */}
                          <div style={{ borderColor: '#334155' }} className="pt-3 border-t-2 text-center">
                            <button
                              type="button"
                              onClick={handleCancelActiveDeposit}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              className="w-full py-3 px-4 rounded-xl border-2 font-black text-sm sm:text-base hover:bg-red-500/25 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow"
                            >
                              <X size={20} className="text-red-400" /> Hủy mã giao dịch này
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }} className="p-8 rounded-3xl border-2 space-y-4 text-center">
                        <AlertTriangle size={48} className="text-red-400 mx-auto" />
                        <h4 className="text-xl font-black text-white">Mã QR đã hết hạn thanh toán (Quá 15 phút)</h4>
                        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                          Mã QR giao dịch cũ đã bị hủy tự động để đảm bảo an toàn. Vui lòng bấm bên dưới để tạo lại mã QR nạp tiền mới.
                        </p>
                        <button
                          type="button"
                          onClick={handleCancelActiveDeposit}
                          style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                          className="px-6 py-3.5 rounded-2xl font-black text-base hover:bg-orange-600 transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
                        >
                          <RefreshCw size={20} /> Tạo lại mã QR mới
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Live Silent Auto-Check Status Indicator */}
                  {timeLeft > 0 && (
                    <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="p-4.5 rounded-2xl border-2 text-center space-y-2 shadow-md">
                      <div style={{ color: '#34d399' }} className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-extrabold">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Hệ thống tự động kiểm tra biến động số dư ngân hàng...
                      </div>
                      <p style={{ color: '#cbd5e1' }} className="text-xs font-medium leading-relaxed">
                        Chuyển khoản thành công tiền sẽ <strong style={{ color: '#ffffff' }} className="font-extrabold underline">tự động nhảy trực tiếp vào số dư ví</strong> ngay tức thì (Không cần bấm nút xác nhận hay chờ Admin duyệt).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === 'HISTORY' && (
            <div className="space-y-3.5">
              {/* Search Bar */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Tìm theo mã giao dịch, số tiền, loại giao dịch..."
                  style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-md"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {historyLoading ? (
                <p style={{ color: '#cbd5e1' }} className="text-center text-sm sm:text-base py-10 font-semibold">Đang tải lịch sử giao dịch...</p>
              ) : transactions.length === 0 ? (
                <p style={{ color: '#cbd5e1' }} className="text-center text-sm sm:text-base py-10 font-semibold">Chưa có giao dịch nào được ghi nhận.</p>
              ) : (
                (() => {
                  const filtered = transactions.filter((tx: any) => {
                    if (!historySearchQuery.trim()) return true;
                    const q = historySearchQuery.toLowerCase();
                    const code = (tx.transactionCode || '').toLowerCase();
                    const note = (tx.description || tx.note || '').toLowerCase();
                    const amount = (tx.amount || '').toString();
                    const type = tx.type === 'DEPOSIT' ? 'nạp tiền' : tx.type === 'ORDER_PAYMENT' ? 'phí nhận hộ' : tx.type === 'ORDER_REFUND' ? 'hoàn tiền' : 'điều chỉnh';
                    return code.includes(q) || note.includes(q) || amount.includes(q) || type.includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <p style={{ color: '#cbd5e1' }} className="text-center text-sm py-8 font-semibold">
                        Không tìm thấy giao dịch nào khớp với "{historySearchQuery}"
                      </p>
                    );
                  }

                  return filtered.map((tx: any) => {
                    const isPositive = tx.type === 'DEPOSIT' || tx.type === 'ORDER_REFUND';
                    const isApproved = tx.status === 'APPROVED';
                    const isPending = tx.status === 'PENDING';

                    const badgeBg = isApproved
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isPending
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)';
                    const badgeColor = isApproved
                      ? '#34d399'
                      : isPending
                      ? '#fcd34d'
                      : '#fca5a5';
                    const badgeBorder = isApproved
                      ? 'rgba(16, 185, 129, 0.4)'
                      : isPending
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(239, 68, 68, 0.5)';
                    const statusText = isApproved ? 'Thành công' : isPending ? 'Chờ duyệt' : (tx.type === 'DEPOSIT' ? 'Đã hủy' : 'Từ chối');

                    return (
                      <div
                        key={tx.id}
                        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                        className="p-4.5 border-2 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-md gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            style={{
                              backgroundColor: tx.type === 'DEPOSIT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                              color: tx.type === 'DEPOSIT' ? '#34d399' : '#fb923c',
                              borderColor: tx.type === 'DEPOSIT' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)',
                            }}
                            className="w-11 h-11 rounded-xl border-2 flex items-center justify-center shrink-0"
                          >
                            {tx.type === 'DEPOSIT' ? (
                              <ArrowDownLeft size={22} />
                            ) : (
                              <Wallet size={22} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p style={{ color: '#ffffff' }} className="font-black text-sm sm:text-base truncate">
                              {tx.type === 'DEPOSIT'
                                ? 'Nạp tiền vào ví'
                                : tx.type === 'ORDER_PAYMENT'
                                ? 'Phí nhận hộ 5k'
                                : tx.type === 'ORDER_REFUND'
                                ? 'Hoàn tiền đơn hủy'
                                : 'Điều chỉnh hệ thống'}
                            </p>
                            <p style={{ color: '#cbd5e1' }} className="text-xs font-mono font-medium mt-0.5 truncate">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.transactionCode}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 whitespace-nowrap">
                          <p
                            style={{ color: isPositive ? '#34d399' : '#f8fafc' }}
                            className="font-mono font-black text-base sm:text-xl whitespace-nowrap"
                          >
                            {isPositive ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                          </p>
                          <span
                            style={{
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              borderColor: badgeBorder,
                            }}
                            className="text-xs font-extrabold px-3 py-1 rounded-md border inline-block mt-0.5 whitespace-nowrap"
                          >
                            {statusText}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
