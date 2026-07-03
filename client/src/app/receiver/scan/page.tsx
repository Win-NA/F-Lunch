'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode } from 'lucide-react';

export default function ScannerPage() {
  const router = useRouter();
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleComplete = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/receivers/complete/${id}`);
      toast.success('Bàn giao đơn hàng hoàn tất! Đã xác thực thành công.');
      
      // Update local storage earnings count
      const stored = localStorage.getItem('receiver_completed_count');
      const count = stored ? parseInt(stored, 10) : 0;
      localStorage.setItem('receiver_completed_count', (count + 1).toString());

      router.push('/receiver');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Xác thực thất bại. Mã không hợp lệ.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId) {
      toast.error('Vui lòng nhập Mã yêu cầu');
      return;
    }
    handleComplete(manualId);
  };

  useEffect(() => {
    if (scannerActive) {
      // Khởi tạo Html5QrcodeScanner
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Success
          html5QrcodeScanner.clear().then(() => {
            setScannerActive(false);
            handleComplete(decodedText);
          }).catch(() => {
            setScannerActive(false);
            handleComplete(decodedText);
          });
        },
        (error) => {
          // Bỏ qua lỗi quét quét từng frame
        }
      );

      scannerRef.current = html5QrcodeScanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch((err) => {});
        }
      };
    }
  }, [scannerActive]);

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs">
        <ArrowLeft size={14} /> Quay lại bàn việc
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-white">Xác thực bàn giao</h1>
        <p className="text-xs text-slate-400 mt-1">Xác nhận bàn giao đơn hàng bằng camera quét mã QR hoặc nhập thủ công</p>
      </div>

      {/* Camera scanner wrapper */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl text-center space-y-4">
        <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Quét bằng Camera</h2>
        
        {scannerActive ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <div id="reader" className="w-full"></div>
            <button 
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.clear().then(() => {
                    setScannerActive(false);
                  }).catch(() => {
                    setScannerActive(false);
                  });
                }
              }}
              className="mt-4 mb-4 text-xs font-semibold text-red-455 hover:text-red-400 cursor-pointer"
            >
              Hủy Quét bằng Camera
            </button>
          </div>
        ) : (
          <div className="py-8 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
            <Camera className="text-slate-650" size={32} />
            <p className="text-slate-500 text-[10px] max-w-[240px]">Đưa camera quét mã QR trên điện thoại của sinh viên để xác thực bàn giao đơn hàng.</p>
            <button
              onClick={() => setScannerActive(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Bật Camera Quét
            </button>
          </div>
        )}
      </div>

      {/* Manual verification form */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <QrCode size={14} className="text-orange-500" />
          Nhập mã thủ công
        </h2>
        <p className="text-[10px] text-slate-500">Nếu camera của thiết bị bị lỗi, hãy nhập mã định danh yêu cầu bàn giao (Request ID) của sinh viên.</p>
        
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Nhập mã số yêu cầu (UUID)"
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-300 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-orange-600/15 cursor-pointer"
          >
            {loading ? 'Đang xác thực...' : 'Xác nhận Bàn giao'}
          </button>
        </form>
      </div>

    </div>
  );
}
