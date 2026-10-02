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
  RefreshCw
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<'DEPOSIT' | 'HISTORY'>('DEPOSIT');

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'MOMO'>('BANK_TRANSFER');
  const [momoMode, setMomoMode] = useState<'MOMO_APP' | 'BANK_APP'>('MOMO_APP');

  // History State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Copy state helper
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Track balance changes to alert user automatically
  const prevBalanceRef = useRef<number | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        const newTotalBal = (res.data.realBalance || 0) + (res.data.bonusBalance || 0);
        if (prevBalanceRef.current !== null && newTotalBal > prevBalanceRef.current) {
          const added = newTotalBal - prevBalanceRef.current;
          toast.success(`🎉 TỰ ĐỘNG CỘNG TIỀN THÀNH CÔNG! +${added.toLocaleString('vi-VN')} đ`);
          fetchHistory();
        }
        prevBalanceRef.current = newTotalBal;
        updateUser(res.data);
      }
    } catch (err) {
      // silent catch
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/transactions/my-transactions');
      setTransactions(res.data || []);
    } catch (err) {
      // silent catch
    } finally {
      setHistoryLoading(false);
    }
  };

  const memoCode = `FLUNCH ${user?.mssv || user?.fullName?.replace(/\s+/g, '') || ''}`;

  // Automatically register a pending deposit in background when user selects amount
  useEffect(() => {
    if (depositAmount && depositAmount >= 10000) {
      api.post('/transactions/deposit', {
        amount: depositAmount,
        paymentMethod,
      }).catch(() => {
        // silent catch
      });
    }
  }, [depositAmount, paymentMethod]);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      if (tab === 'HISTORY') {
        fetchHistory();
      }
      const interval = setInterval(fetchProfile, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, tab]);

  if (!isOpen || !user) return null;

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
              <p style={{ color: '#cbd5e1' }} className="text-sm sm:text-base font-bold">Nạp tiền tự động 100% không cần xác nhận</p>
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
                    const isSelected = depositAmount === item.amount;
                    return (
                      <button
                        key={item.amount}
                        type="button"
                        onClick={() => setDepositAmount(item.amount)}
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
                    type="number"
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    placeholder="Nhập số tiền nạp tùy ý (VD: 30000)..."
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                    className="w-full rounded-2xl px-5 py-4 text-lg sm:text-xl font-mono font-black focus:border-orange-500 focus:outline-none transition-colors border-2 placeholder:font-sans placeholder:text-sm sm:placeholder:text-base placeholder:font-normal"
                    min={10000}
                    step={5000}
                  />
                </div>
              </div>

              {/* Bonus Highlight */}
              {depositAmount && depositAmount >= 10000 && getBonusAmount(depositAmount) > 0 && (
                <div 
                  style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: 'rgba(249, 115, 22, 0.5)' }} 
                  className="p-4.5 rounded-2xl border-2 flex items-center justify-between text-sm sm:text-base shadow-lg"
                >
                  <span style={{ color: '#ffedd5' }} className="font-extrabold flex items-center gap-2">
                    <Sparkles size={20} style={{ color: '#f97316' }} /> Ưu đãi đợt này:
                  </span>
                  <span style={{ color: '#fb923c' }} className="font-black font-mono text-lg sm:text-xl">
                    +{getBonusAmount(depositAmount).toLocaleString('vi-VN')} đ KM
                  </span>
                </div>
              )}

              {/* Payment Section (Hidden until amount >= 10000) */}
              {!depositAmount || depositAmount < 10000 ? (
                <div style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="p-7 sm:p-10 rounded-3xl border-2 text-center space-y-4">
                  <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }} className="w-16 h-16 rounded-2xl border-2 border-orange-500/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <QrCode size={36} />
                  </div>
                  <h4 style={{ color: '#ffffff' }} className="text-lg sm:text-xl font-black">Vui lòng chọn hoặc nhập số tiền nạp</h4>
                  <p style={{ color: '#cbd5e1' }} className="text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
                    Bấm chọn một trong các mức tiền gợi ý ở Bước 1 hoặc tự gõ số tiền (tối thiểu 10.000đ) để hệ thống tạo mã QR thanh toán tự động.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 pt-1">
                  {/* Step 2: Payment Method */}
                  <div className="space-y-3">
                    <label style={{ color: '#fb923c' }} className="block text-xs sm:text-sm font-black uppercase tracking-widest">
                      2. Chọn phương thức thanh toán
                    </label>
                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        style={{
                          backgroundColor: paymentMethod === 'BANK_TRANSFER' ? 'rgba(59, 130, 246, 0.25)' : '#1e293b',
                          borderColor: paymentMethod === 'BANK_TRANSFER' ? '#3b82f6' : '#334155',
                          color: paymentMethod === 'BANK_TRANSFER' ? '#93c5fd' : '#cbd5e1',
                        }}
                        className="p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-center gap-3 text-sm sm:text-lg font-black transition-all cursor-pointer shadow-md"
                      >
                        <Building2 size={24} /> VietinBank (VietQR)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MOMO')}
                        style={{
                          backgroundColor: paymentMethod === 'MOMO' ? 'rgba(236, 72, 153, 0.25)' : '#1e293b',
                          borderColor: paymentMethod === 'MOMO' ? '#ec4899' : '#334155',
                          color: paymentMethod === 'MOMO' ? '#fbcfe8' : '#cbd5e1',
                        }}
                        className="p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-center gap-3 text-sm sm:text-lg font-black transition-all cursor-pointer shadow-md"
                      >
                        <QrCode size={24} /> Ví MoMo (Mã QR)
                      </button>
                    </div>
                  </div>

                  {/* Payment Info Card with MUCH LARGER QR CODE & BIG CRISP TYPOGRAPHY */}
                  {paymentMethod === 'BANK_TRANSFER' ? (
                    <div style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="border-2 rounded-3xl p-5 sm:p-7 text-center space-y-6 shadow-2xl">
                      <div style={{ color: '#ffffff' }} className="flex items-center justify-center gap-2 text-base sm:text-xl font-black">
                        <span>Quét mã VietQR VietinBank</span>
                        <span style={{ color: '#34d399' }} className="font-mono text-lg sm:text-2xl">({depositAmount.toLocaleString('vi-VN')}đ)</span>
                      </div>

                      {/* HUGE CRISP QR CODE CONTAINER */}
                      <div className="w-72 h-72 sm:w-96 sm:h-96 bg-white p-4 rounded-3xl mx-auto shadow-2xl overflow-hidden flex items-center justify-center border-4 border-slate-600">
                        <img 
                          src={`https://img.vietqr.io/image/vietinbank-106875040898-compact.png?amount=${depositAmount}&addInfo=${encodeURIComponent(memoCode)}&accountName=LE%20DO%20NHAT%20ANH`} 
                          alt="VietinBank VietQR" 
                          className="w-full h-full object-contain" 
                        />
                      </div>

                      {/* High-Contrast Crisp Details Box */}
                      <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="text-left p-5 sm:p-6 rounded-2xl border-2 space-y-4 font-sans shadow-inner">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">Ngân hàng:</span>
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
                          <span style={{ color: '#fb923c' }} className="font-black text-base sm:text-lg">Nội dung CK (BẮT BUỘC):</span>
                          <button
                            onClick={() => copyToClipboard(memoCode, 'Nội dung')}
                            style={{ backgroundColor: 'rgba(249, 115, 22, 0.25)', color: '#fdba74', borderColor: 'rgba(249, 115, 22, 0.6)' }}
                            className="font-black font-mono text-lg sm:text-xl hover:bg-orange-500/40 flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all shadow-lg"
                          >
                            {memoCode} {copiedField === 'Nội dung' ? <Check size={20} style={{ color: '#34d399' }} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="border-2 rounded-3xl p-5 sm:p-7 text-center space-y-6 shadow-2xl">
                      <div style={{ color: '#ffffff' }} className="flex items-center justify-center gap-2 text-base sm:text-xl font-black">
                        <span>Chuyển tiền Ví MoMo</span>
                        <span style={{ color: '#f472b6' }} className="font-mono text-lg sm:text-2xl">({depositAmount.toLocaleString('vi-VN')}đ)</span>
                      </div>

                      {/* MoMo Mode Switcher Tabs */}
                      <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="flex border-2 p-1 rounded-2xl gap-1">
                        <button
                          type="button"
                          onClick={() => setMomoMode('MOMO_APP')}
                          style={{
                            backgroundColor: momoMode === 'MOMO_APP' ? '#be185d' : 'transparent',
                            color: momoMode === 'MOMO_APP' ? '#ffffff' : '#cbd5e1',
                          }}
                          className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer"
                        >
                          📱 Dùng App MoMo Quét
                        </button>
                        <button
                          type="button"
                          onClick={() => setMomoMode('BANK_APP')}
                          style={{
                            backgroundColor: momoMode === 'BANK_APP' ? '#be185d' : 'transparent',
                            color: momoMode === 'BANK_APP' ? '#ffffff' : '#cbd5e1',
                          }}
                          className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer"
                        >
                          🏦 Dùng App Ngân Hàng Quét (VietQR)
                        </button>
                      </div>

                      {/* CRISP QR CODE CONTAINER */}
                      <div className="w-72 h-72 sm:w-96 sm:h-96 bg-white p-4 rounded-3xl mx-auto shadow-2xl overflow-hidden flex items-center justify-center border-4 border-slate-600 relative">
                        <img 
                          src={
                            momoMode === 'MOMO_APP'
                              ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`https://nhantien.momo.vn/0797906979/${depositAmount}`)}`
                              : `https://img.vietqr.io/image/momo-0797906979-compact.png?amount=${depositAmount}&addInfo=${encodeURIComponent(memoCode)}&accountName=LE%20DO%20NHAT%20ANH`
                          } 
                          alt="MoMo QR" 
                          className="w-full h-full object-contain" 
                        />
                      </div>

                      {/* Direct Open MoMo App Button for Mobile users when in MOMO_APP mode */}
                      {momoMode === 'MOMO_APP' && (
                        <a
                          href={`https://nhantien.momo.vn/0797906979/${depositAmount}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ backgroundColor: '#ec4899', color: '#ffffff' }}
                          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-pink-600 transition-all shadow-lg cursor-pointer"
                        >
                          <Sparkles size={20} /> Bấm vào đây để mở App MoMo chuyển tiền ngay
                        </a>
                      )}

                      {/* High-Contrast Crisp Details Box */}
                      <div style={{ backgroundColor: '#0f172a', borderColor: '#334155' }} className="p-5 sm:p-6 rounded-2xl border-2 space-y-4 text-left font-sans shadow-inner">
                        {/* MoMo Specific Transfer Notice */}
                        <div style={{ backgroundColor: '#831843', borderColor: '#f472b6' }} className="p-3.5 rounded-xl border-2 space-y-1">
                          <p style={{ color: '#fbcfe8' }} className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                            <AlertTriangle size={18} className="text-pink-400 shrink-0" />
                            {momoMode === 'MOMO_APP' ? 'HƯỚNG DẪN DÙNG APP MOMO:' : 'HƯỚNG DẪN DÙNG APP NGÂN HÀNG:'}
                          </p>
                          {momoMode === 'MOMO_APP' ? (
                            <>
                              <p style={{ color: '#fce7f3' }} className="text-xs leading-normal">
                                👉 Mở App MoMo quét mã QR trên HOẶC chọn <strong>"Chuyển tiền MoMo"</strong> (Chuyển đến SĐT <strong>0797906979</strong>).
                              </p>
                              <p style={{ color: '#fce7f3' }} className="text-xs leading-normal">
                                ⚠️ Nhớ dán lời nhắn: <strong className="font-mono text-orange-300 font-bold">{memoCode}</strong> khi chuyển tiền.
                              </p>
                            </>
                          ) : (
                            <>
                              <p style={{ color: '#fce7f3' }} className="text-xs leading-normal">
                                👉 Dùng App Ngân hàng (MB, VCB, ACB...) quét mã VietQR NAPAS MoMo ở trên.
                              </p>
                              <p style={{ color: '#fce7f3' }} className="text-xs leading-normal">
                                ⚠️ <strong>KHÔNG dùng App MoMo quét mã VietQR này</strong> vì MoMo sẽ hiểu nhầm là chuyển khoản ngân hàng và báo lỗi số tài khoản.
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">SĐT Ví MoMo:</span>
                          <button
                            onClick={() => copyToClipboard('0797906979', 'SĐT MoMo')}
                            style={{ backgroundColor: 'rgba(236, 72, 153, 0.25)', color: '#fbcfe8', borderColor: 'rgba(236, 72, 153, 0.5)' }}
                            className="font-black font-mono text-lg sm:text-xl hover:bg-pink-500/35 flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all shadow-md"
                          >
                            0797906979 {copiedField === 'SĐT MoMo' ? <Check size={20} style={{ color: '#34d399' }} /> : <Copy size={20} />}
                          </button>
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span style={{ color: '#cbd5e1' }} className="font-bold text-base sm:text-lg">Chủ tài khoản:</span>
                          <span style={{ color: '#ffffff' }} className="font-black text-lg sm:text-xl">Lê Đỗ Nhật Anh</span>
                        </div>

                        <div style={{ borderColor: '#334155' }} className="flex justify-between items-center flex-wrap gap-2 pt-3 border-t-2">
                          <span style={{ color: '#f472b6' }} className="font-black text-base sm:text-lg">Lời nhắn / Nội dung:</span>
                          <button
                            onClick={() => copyToClipboard(memoCode, 'Nội dung')}
                            style={{ backgroundColor: 'rgba(236, 72, 153, 0.25)', color: '#fbcfe8', borderColor: 'rgba(236, 72, 153, 0.6)' }}
                            className="font-black font-mono text-lg sm:text-xl hover:bg-pink-500/40 flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all shadow-lg"
                          >
                            {memoCode} {copiedField === 'Nội dung' ? <Check size={20} style={{ color: '#34d399' }} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto Bank Listener Live Pulse Box */}
                  <div style={{ backgroundColor: '#064e3b', borderColor: '#10b981' }} className="p-5 sm:p-6 rounded-2xl border-2 text-center space-y-3 shadow-xl">
                    <div style={{ color: '#34d399' }} className="inline-flex items-center gap-3 text-base sm:text-lg font-black">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                      </span>
                      Hệ thống đang tự động theo dõi chuyển khoản...
                    </div>
                    <p style={{ color: '#ecfdf5' }} className="text-xs sm:text-sm leading-relaxed font-semibold">
                      Bạn <strong style={{ color: '#ffffff' }} className="font-black">KHÔNG CẦN BẤM BẤT KỲ NÚT XÁC NHẬN NÀO</strong>. Ngay khi bạn quét mã &amp; chuyển khoản thành công với nội dung <strong style={{ color: '#fb923c' }} className="font-mono font-black">{memoCode}</strong>, tiền sẽ <strong style={{ color: '#34d399' }} className="font-black underline">tự động cộng ngay lập tức vào số dư ví</strong>!
                    </p>
                  </div>

                  {/* Red Warning Banner */}
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
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === 'HISTORY' && (
            <div className="space-y-3.5">
              {historyLoading ? (
                <p style={{ color: '#cbd5e1' }} className="text-center text-sm sm:text-base py-10 font-semibold">Đang tải lịch sử giao dịch...</p>
              ) : transactions.length === 0 ? (
                <p style={{ color: '#cbd5e1' }} className="text-center text-sm sm:text-base py-10 font-semibold">Chưa có giao dịch nào được ghi nhận.</p>
              ) : (
                transactions.map((tx: any) => {
                  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'ORDER_REFUND';
                  return (
                    <div
                      key={tx.id}
                      style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                      className="p-4.5 border-2 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
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
                        <div>
                          <p style={{ color: '#ffffff' }} className="font-black text-sm sm:text-base">
                            {tx.type === 'DEPOSIT'
                              ? 'Nạp tiền vào ví'
                              : tx.type === 'ORDER_PAYMENT'
                              ? 'Phí nhận hộ 5k'
                              : tx.type === 'ORDER_REFUND'
                              ? 'Hoàn tiền đơn hủy'
                              : 'Điều chỉnh hệ thống'}
                          </p>
                          <p style={{ color: '#cbd5e1' }} className="text-xs font-mono font-medium mt-0.5">
                            {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.transactionCode}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          style={{ color: isPositive ? '#34d399' : '#f8fafc' }}
                          className="font-mono font-black text-base sm:text-xl"
                        >
                          {isPositive ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                        </p>
                        <span
                          style={{
                            backgroundColor: tx.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: tx.status === 'APPROVED' ? '#34d399' : '#fcd34d',
                            borderColor: tx.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                          }}
                          className="text-xs font-extrabold px-3 py-1 rounded-md border inline-block mt-0.5"
                        >
                          {tx.status === 'APPROVED' ? 'Thành công' : tx.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
