'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { useLanguageStore } from '@/stores/language.store';
import { translations } from '@/lib/translations';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ShoppingBag,
  MapPin,
  Clock,
  Send,
  Truck,
  QrCode,
  PiggyBank,
  Smartphone,
  Calendar,
  Hourglass,
  GraduationCap,
  Bike,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Zap,
  PhoneCall,
  Utensils,
  Sparkles,
  Phone,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Search,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

function FacebookIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34c3.5 0 6.34-2.84 6.34-6.34V8.58a8.27 8.27 0 0 0 4.82 1.54V6.69z" />
    </svg>
  );
}

function ZaloIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.477 2 2 6.14 2 11.25c0 2.87 1.43 5.438 3.682 7.115-.162 1.378-.65 3.09-1.682 4.135 1.82-.162 3.682-.975 4.82-1.87.382.052.775.08 1.18.08 5.523 0 10-4.14 10-9.25S17.523 2 12 2z" />
    </svg>
  );
}

// Multi-language dictionary for VI and EN
const content = {
  vi: {
    nav: {
      home: 'Trang chủ',
      problem: 'Vấn đề',
      steps: '5 Bước nhận đồ',
      benefits: 'Lợi ích',
      pricing: 'Chi phí',
      useCases: 'Dùng khi nào',
      faq: 'Hỏi đáp (FAQ)',
      login: 'Đăng nhập',
      register: 'Đăng ký',
      dashboard: 'Vào ứng dụng',
    },
    hero: {
      badge: 'Dịch vụ nhận hộ đồ ăn trưa FPT University',
      clause1: 'ĐẶT MÓN XONG,',
      clause2: 'VIỆC NHẬN ĐỒ ĐỂ F-LUNCH LO!',
      desc: 'Tối giản nhận đồ: Bạn ngoài ngõ hay bạn ở trong phòng? Hãy đến sảnh Trống Đồng lấy đồ trong khung giờ 11:00 - 13:30.',
      cta1: 'GỬI ĐƠN CHO F-LUNCH',
      cta2: 'XEM CÁCH HOẠT ĐỘNG',
      pill1: 'Nhận hộ tức thì',
      pill2: 'Bảo quản chu đáo',
      pill3: 'Quét QR 10 giây',
      liveStatus: 'ĐANG NHẬN HỘ TRỰC TIẾP',
      timeSlot: 'Khung 11:00 - 13:30',
      hubTitle: 'Điểm nhận đồ tập trung',
      hubDesc: 'Quầy F-Lunch • Sảnh Trống Đồng FPTU',
      orderSample1: 'Cơm sườn nướng mật ong',
      orderSample2: 'Trà đào cam sả x2',
      statusReceived: 'Đã nhận hộ',
      statusReady: 'Sẵn sàng nhận',
      qrText: 'Nhận đồ bằng mã QR cá nhân',
      qrTime: '10 giây hoàn tất',
    },
    pain: {
      clause1: 'GIỜ NGHỈ TRƯA THÌ NGẮN,',
      clause2: 'MÀ SHIPPER THÌ KHÔNG CHỜ!',
      subtitle: 'Bạn có từng gặp phải những tình huống dở khóc dở cười này mỗi khi đặt đồ ăn trưa tại trường?',
      badge: 'Nghe quen không?',
      p1Title: 'Giờ nghỉ chưa kịp chớp mắt',
      p1Desc: 'Vừa đặt đồ ăn xong đã phải nhìn đồng hồ lo sợ không kịp giờ vào tiết học kế tiếp. Nhiều hôm ăn vội vàng vừa nghẹn vừa mệt mỏi.',
      p2Title: 'Từng chờ shipper mòn mỏi dưới cổng trường',
      p2Desc: 'Thời gian nghỉ trưa vốn đã ít ỏi, đứng chờ shipper 15-20 phút nắng nôi khiến buổi chiều mất hết năng lượng học tập.',
      p3Title: 'Vừa học vừa ngóng chuông điện thoại',
      p3Desc: 'Đang làm bài kiểm tra, thuyết trình hay thảo luận nhóm thì shipper gọi liên hồi. Phải bỏ dở để chạy xuống cổng nhận đồ.',
      box1: 'Shipper đang đợi ở cổng trường: 12 phút ⏳',
      box2: 'F-Lunch ra nhận hộ ngay — An tâm học tiếp!',
    },
    steps: {
      badge: 'Quy trình tiện lợi',
      clause1: '5 BƯỚC,',
      clause2: 'NHẬN ĐỒ GỌN HƠN',
      subtitle: 'Chỉ với vài thao tác quen thuộc trên điện thoại, đồ ăn đã sẵn sàng tại sảnh Trống Đồng chờ bạn ghé lấy!',
      cta: 'GỬI ĐƠN NGAY!',
      items: [
        {
          num: '01',
          title: 'ĐẶT MÓN',
          desc: 'Đặt món trên app giao hàng quen thuộc của bạn (ShopeeFood, GrabFood, beFood...).',
          badge: 'App giao hàng',
        },
        {
          num: '02',
          title: 'CHỌN NƠI & GIỜ GIAO',
          desc: 'Ghi chú giao tại sảnh Trống Đồng, hẹn shipper trong khung giờ 11:00 - 13:30.',
          badge: 'Sảnh Trống Đồng',
        },
        {
          num: '03',
          title: 'GỬI ĐƠN CHO F-LUNCH',
          desc: 'Tạo đơn và gửi thông tin mã đơn hàng, số điện thoại shipper lên hệ thống F-Lunch.',
          badge: 'Chỉ 30 giây',
        },
        {
          num: '04',
          title: 'THEO DÕI ĐƠN HÀNG',
          desc: 'Người nhận hộ lấy đồ từ shipper, kiểm tra và bảo quản cẩn thận tại quầy sảnh.',
          badge: 'Thời gian thực',
        },
        {
          num: '05',
          title: 'QUÉT MÃ NHẬN ĐỒ',
          desc: 'Ghé sảnh Trống Đồng bất kỳ lúc nào giữa giờ nghỉ trưa, quét QR lấy đồ trong 10s.',
          badge: 'Nhận đồ 10s',
        },
      ],
    },
    benefits: {
      clause1: 'F-LUNCH LO PHẦN',
      clause2: 'NHẬN ĐỒ GIÚP BẠN!',
      subtitle: 'Mô hình dịch vụ hỗ trợ sinh viên nhận và bảo quản đồ ăn đặt trước tại khu vực sảnh Trống Đồng FPTU.',
      badgeText: 'ƯU ĐIỂM DỊCH VỤ',
      noticeTitle: 'Bạn tự do đặt đồ ăn yêu thích từ mọi ứng dụng bên ngoài',
      noticeDesc: 'F-Lunch không bán đồ ăn, chúng tôi chuyên trách khâu nhận hộ & giữ đồ an toàn!',
      b1Title: 'Tiết kiệm thời gian, không lo ngóng shipper',
      b1Desc: 'Không cần chạy đi chạy lại cổng trường. Bạn chỉ cần bước xuống sảnh Trống Đồng khi rảnh rỗi là có đồ ăn ngay.',
      b2Title: 'Nghỉ trưa trọn vẹn, tái tạo năng lượng',
      b2Desc: 'Dành trọn thời gian nghỉ trưa để thưởng thức bữa ăn ngon miệng, trò chuyện cùng bạn bè hoặc chợp mắt nghỉ ngơi.',
      b3Title: 'Tập trung học tập, không gián đoạn tiết học',
      b3Desc: 'Yên tâm làm bài kiểm tra, ôn thi hoặc thảo luận dự án nhóm mà không sợ shipper gọi nhỡ làm lỡ mất đơn hàng.',
    },
    pricing: {
      badge: 'Minh bạch & Tiết kiệm',
      clause1: 'CHI PHÍ RÕ RÀNG,',
      clause2: 'MỘT MỨC DUY NHẤT',
      subtitle: 'Không phí ẩn, không phụ thu bất ngờ. Mọi giao dịch đều được quản lý tiện lợi qua ví cá nhân.',
      c1Title: 'Giá dịch vụ: 5.000đ/đơn',
      c1Desc: 'Chi phí tiết kiệm chỉ 5.000đ mỗi đơn nhận hộ, thanh toán tự động và trừ trực tiếp qua số dư ví F-Lunch.',
      c1Tag: 'Nạp tiền qua website F-Lunch',
      c2Title: 'Tiền đồ ăn độc lập',
      c2Desc: 'Tiền đồ ăn không tính qua F-Lunch. Bạn thanh toán trực tiếp trên ứng dụng đặt món (ShopeeFood, GrabFood...).',
      c2Tag: 'Minh bạch 100% không lo chênh giá',
      c3Title: 'Khung giờ: 11:00 - 13:30',
      c3Desc: 'Đội ngũ túc trực nhận và giữ đồ cho bạn trong khung giờ trưa từ 11:00 đến 13:30 tại sảnh Trống Đồng.',
      c3Tag: 'Thứ Hai - Thứ Bảy hàng tuần',
      cta: 'GỬI ĐƠN NGAY!',
    },
    useCases: {
      badge: 'Dùng khi nào?',
      clause1: 'MỘT BƯỚC NHỎ,',
      clause2: 'ĐỠ ĐƯỢC NHIỀU VIỆC',
      clause3: 'GIỮA GIỜ NGHỈ',
      subtitle: 'F-Lunch được thiết kế tối ưu nhất cho lịch học và thói quen ăn uống của sinh viên FPTU.',
      cta: 'GỬI ĐƠN NGAY!',
      items: [
        {
          title: 'Giờ nghỉ trưa ngắn',
          desc: 'Đặt món và để F-Lunch nhận hộ, bạn dành trọn 100% thời gian nghỉ để ăn uống thư thái và chợp mắt.',
          tag: 'Tiết kiệm 30-45 phút',
        },
        {
          title: 'Ứng dụng quen thuộc',
          desc: 'Dù là GrabFood, ShopeeFood hay bất kỳ ứng dụng nào, bạn cứ tự do đặt món yêu thích rồi gửi đơn.',
          tag: 'Tất cả nền tảng',
        },
        {
          title: 'Đang làm bài, ôn thi',
          desc: 'Không cần lo lắng hay bỏ dở tiết học, bài thi để chạy ra cổng nhận đồ. Mọi việc đã có F-Lunch lo.',
          tag: 'Tập trung tối đa',
        },
        {
          title: 'Shipper đến lệch giờ',
          desc: 'Không sợ shipper gọi giục liên hồi làm phiền giờ học trong giảng đường hay thuyết trình.',
          tag: 'Không bị làm phiền',
        },
      ],
    },
    footer: {
      desc: 'Nền tảng hỗ trợ sinh viên FPTU nhận hộ và bảo quản đồ ăn trưa tại sảnh Trống Đồng. Giúp bạn tận hưởng trọn vẹn giờ nghỉ trưa thư thái, không lo trễ giờ vào lớp.',
      connect: 'Kết nối với chúng tôi:',
      hotlineLabel: 'Hotline hỗ trợ:',
      hotline: '093 260 07 20',
      col1Title: 'Về F-Lunch',
      col1Items: [
        { label: 'Giới thiệu dịch vụ', section: 'benefits' },
        { label: 'Quy trình 5 bước', section: 'how-it-works' },
        { label: 'Biểu phí & Ví', section: 'pricing' },
        { label: 'Đăng nhập tài khoản', isLoginBtn: true },
      ],
      col2Title: 'Hướng dẫn',
      col2Items: [
        { label: 'Cách tạo đơn', section: 'how-it-works' },
        { label: 'Quy định nhận đồ', section: 'pricing' },
        { label: 'Câu hỏi thường gặp (FAQ)', isFaqBtn: true },
        { label: 'Hỗ trợ sinh viên', link: 'tel:0932600720' },
      ],
      col3Title: 'Điểm nhận đồ & Giờ phục vụ',
      locationLabel: 'Địa điểm nhận đồ:',
      locationText: 'Sảnh Trống Đồng, Tòa nhà Alpha, Trường Đại học FPT Hà Nội.',
      hoursLabel: 'Khung giờ hoạt động:',
      hoursText: '11:00 - 13:30 (Thứ 2 đến Thứ 7 hàng tuần)',
      summary: 'F-Lunch: Dịch vụ hỗ trợ sinh viên nhận đồ ăn tại trường',
      linksLabel: 'Liên kết:',
      copyright: '© 2026 F-Lunch. Toàn bộ bản quyền thuộc về dự án F-Lunch FPTU.',
    },
    modal: {
      title: 'CÂU HỎI THƯỜNG GẶP (FAQ)',
      subtitle: 'Giải đáp nhanh mọi thắc mắc của bạn về dịch vụ nhận hộ F-Lunch',
      searchPlaceholder: 'Tìm kiếm câu hỏi...',
      hotlineHelp: 'Vẫn còn thắc mắc? Liên hệ ngay Hotline:',
      close: 'Đóng',
    },
  },
  en: {
    nav: {
      home: 'Home',
      problem: 'Problem',
      steps: '5 Steps',
      benefits: 'Benefits',
      pricing: 'Pricing',
      useCases: 'When to Use',
      faq: 'FAQ',
      login: 'Login',
      register: 'Register',
      dashboard: 'Go to App',
    },
    hero: {
      badge: 'FPT University Campus Food Receiving Service',
      clause1: 'ORDER YOUR FOOD,',
      clause2: 'LET F-LUNCH HANDLE THE PICKUP!',
      desc: 'Simplified food pickup: In dorms or in class? Head to Trong Dong Lobby anytime between 11:00 and 13:30 to collect your meals.',
      cta1: 'SUBMIT ORDER TO F-LUNCH',
      cta2: 'HOW IT WORKS',
      pill1: 'Instant receiving',
      pill2: 'Careful storage',
      pill3: '10s QR Pickup',
      liveStatus: 'LIVE RECEIVING IN PROGRESS',
      timeSlot: 'Slot 11:00 - 13:30',
      hubTitle: 'Central Pickup Hub',
      hubDesc: 'F-Lunch Counter • Trong Dong Lobby FPTU',
      orderSample1: 'Honey BBQ Pork Rice',
      orderSample2: 'Peach Orange Lemongrass Tea x2',
      statusReceived: 'Received & Stored',
      statusReady: 'Ready for Pickup',
      qrText: 'Pickup using personal QR code',
      qrTime: '10 seconds flat',
    },
    pain: {
      clause1: 'LUNCH BREAK IS SHORT,',
      clause2: 'AND SHIPPERS WON’T WAIT!',
      subtitle: 'Have you ever faced these frustrating moments when ordering lunch on campus?',
      badge: 'Sounds familiar?',
      p1Title: 'Break ends in the blink of an eye',
      p1Desc: 'Just placed an order and constantly checking the clock, scared you will be late for class. Gulping down food leaves you drained for the rest of the day.',
      p2Title: 'Endless waiting at campus gates',
      p2Desc: 'Lunch breaks are precious. Standing in the blazing heat for 15-20 minutes waiting for shippers ruins your afternoon focus.',
      p3Title: 'Interrupting study for incoming calls',
      p3Desc: 'In the middle of exams, presentations, or group work and your phone rings endlessly. You must drop everything to dash down for delivery.',
      box1: 'Shipper waiting at gate: 12 minutes ⏳',
      box2: 'F-Lunch picks it up immediately — Keep studying with peace of mind!',
    },
    steps: {
      badge: 'Convenient Process',
      clause1: '5 STEPS TO',
      clause2: 'EFFORTLESS PICKUP',
      subtitle: 'With just a few clicks on your phone, hot meals will be ready and waiting for you at Trong Dong Lobby!',
      cta: 'SUBMIT ORDER NOW!',
      items: [
        {
          num: '01',
          title: 'ORDER FOOD',
          desc: 'Order food on your favorite app (ShopeeFood, GrabFood, beFood...).',
          badge: 'Delivery App',
        },
        {
          num: '02',
          title: 'SELECT LOCATION & TIME',
          desc: 'Note Trong Dong Lobby as drop-off point, scheduled between 11:00 and 13:30.',
          badge: 'Trong Dong Lobby',
        },
        {
          num: '03',
          title: 'SUBMIT TO F-LUNCH',
          desc: 'Create an order with your tracking code and shipper phone number on F-Lunch.',
          badge: 'Takes 30 seconds',
        },
        {
          num: '04',
          title: 'TRACK LIVE STATUS',
          desc: 'Our receiver collects food from the shipper, checks and safely stores it at our booth.',
          badge: 'Real-time',
        },
        {
          num: '05',
          title: 'SCAN QR TO COLLECT',
          desc: 'Drop by Trong Dong Lobby anytime during lunch break, scan QR and grab your food in 10s.',
          badge: '10s QR Scan',
        },
      ],
    },
    benefits: {
      clause1: 'F-LUNCH HANDLES',
      clause2: 'THE PICKUP FOR YOU!',
      subtitle: 'Campus food receiving and storage platform tailored for FPT University students at Trong Dong Lobby.',
      badgeText: 'KEY BENEFITS',
      noticeTitle: 'Freely order from any third-party food app',
      noticeDesc: 'F-Lunch does not sell food; we specialize in receiving, storing, and handing over orders safely!',
      b1Title: 'Save time, skip the waiting hassle',
      b1Desc: 'No need to rush back and forth to campus gates. Walk down to Trong Dong Lobby whenever you are free to collect your meal.',
      b2Title: 'Enjoy complete lunch breaks',
      b2Desc: 'Spend your entire lunch hour savoring delicious meals, chatting with friends, or taking a refreshing power nap.',
      b3Title: 'Stay focused on study & exams',
      b3Desc: 'Take exams, study, or discuss projects without worrying about missed delivery calls or cancelled orders.',
    },
    pricing: {
      badge: 'Transparent & Affordable',
      clause1: 'CLEAR PRICING,',
      clause2: 'ONE FLAT RATE',
      subtitle: 'No hidden fees, no surprises. Manage all transactions conveniently through your in-app wallet.',
      c1Title: 'Service Fee: 5,000đ/order',
      c1Desc: 'Affordable fee of just 5,000 VND per received order, automatically deducted from your F-Lunch wallet balance.',
      c1Tag: 'Top-up via F-Lunch Website',
      c2Title: 'Food Cost Handled Separately',
      c2Desc: 'Food costs are never billed through F-Lunch. You pay directly on the ordering app (ShopeeFood, GrabFood...).',
      c2Tag: '100% Transparent Price',
      c3Title: 'Hours: 11:00 - 13:30',
      c3Desc: 'Our dedicated team receives and stores your food during lunch hours from 11:00 to 13:30 at Trong Dong Lobby.',
      c3Tag: 'Monday - Saturday weekly',
      cta: 'SUBMIT ORDER NOW!',
    },
    useCases: {
      badge: 'When to Use?',
      clause1: 'ONE SMALL STEP,',
      clause2: 'SAVING COUNTLESS HASSLES',
      clause3: 'DURING BREAKS',
      subtitle: 'F-Lunch is optimized specifically for class schedules and dining habits at FPTU.',
      cta: 'SUBMIT ORDER NOW!',
      items: [
        {
          title: 'Short Lunch Break',
          desc: 'Order food and let F-Lunch handle pickup so you can spend 100% of your time dining and resting.',
          tag: 'Save 30-45 mins',
        },
        {
          title: 'Familiar Food Apps',
          desc: 'Whether GrabFood, ShopeeFood or any other app, order as usual then submit your tracking code.',
          tag: 'All Platforms',
        },
        {
          title: 'During Exams & Projects',
          desc: 'Never interrupt important study sessions to run to the gate. Everything is covered by F-Lunch.',
          tag: 'Maximum Focus',
        },
        {
          title: 'Unpredictable Shippers',
          desc: 'No stress over shippers calling incessantly during class lectures or presentations.',
          tag: 'No Distractions',
        },
      ],
    },
    footer: {
      desc: 'Campus food receiving platform for FPTU students at Trong Dong Lobby. Helping you enjoy peaceful lunch breaks without fear of missing classes.',
      connect: 'Connect with us:',
      hotlineLabel: 'Hotline support:',
      hotline: '093 260 07 20',
      col1Title: 'About F-Lunch',
      col1Items: [
        { label: 'About Service', section: 'benefits' },
        { label: '5-Step Process', section: 'how-it-works' },
        { label: 'Pricing & Wallet', section: 'pricing' },
        { label: 'Account Login', isLoginBtn: true },
      ],
      col2Title: 'Instructions',
      col2Items: [
        { label: 'How to Submit Order', section: 'how-it-works' },
        { label: 'Pickup Rules', section: 'pricing' },
        { label: 'Frequently Asked Questions (FAQ)', isFaqBtn: true },
        { label: 'Student Support', link: 'tel:0932600720' },
      ],
      col3Title: 'Pickup Hub & Hours',
      locationLabel: 'Pickup Location:',
      locationText: 'Trong Dong Lobby, Alpha Building, FPT University Hanoi.',
      hoursLabel: 'Operating Hours:',
      hoursText: '11:00 - 13:30 (Monday to Saturday weekly)',
      summary: 'F-Lunch: Campus food receiving and storage platform for students',
      linksLabel: 'Links:',
      copyright: '© 2026 F-Lunch. All rights reserved by F-Lunch FPTU.',
    },
    modal: {
      title: 'FREQUENTLY ASKED QUESTIONS (FAQ)',
      subtitle: 'Quick answers to everything you need to know about F-Lunch service',
      searchPlaceholder: 'Search question...',
      hotlineHelp: 'Still have questions? Call our hotline:',
      close: 'Close',
    },
  },
};

// All FAQ questions matching the user uploaded image
const allFaqs = {
  vi: [
    {
      q: 'F-Lunch là dịch vụ gì?',
      a: 'F-Lunch hỗ trợ sinh viên nhận đồ ăn đã đặt trên các ứng dụng giao đồ ăn. Bạn đặt món như bình thường, F-Lunch lo phần nhận và giao đơn.',
      cat: 'Dịch vụ',
    },
    {
      q: 'F-Lunch có thu phí không?',
      a: 'Có. Phí dịch vụ 5.000đ/đơn, nạp tiền qua website.',
      cat: 'Chi phí',
      highlight: true,
    },
    {
      q: 'Tôi có cần đặt đồ ăn qua F-Lunch không?',
      a: 'Không. F-Lunch không bán đồ ăn. Bạn tự chọn món và đặt trên nền tảng quen thuộc.',
      cat: 'Dịch vụ',
    },
    {
      q: 'Làm thế nào để gửi đơn?',
      a: 'Vào ứng dụng F-Lunch, chọn nền tảng, chọn giờ giao và gửi đơn hàng bạn đã đặt.',
      cat: 'Cách dùng',
    },
    {
      q: 'Theo dõi đơn thế nào?',
      a: 'Xem trạng thái đơn ngay trên website F-Lunch theo thời gian thực.',
      cat: 'Cách dùng',
    },
    {
      q: 'Tôi cần cung cấp thông tin gì?',
      a: 'Số điện thoại, MSSV và mã đơn hàng.',
      cat: 'Cách dùng',
    },
    {
      q: 'Nên gửi đơn lúc nào?',
      a: 'Sau khi bạn đã có mã đơn hàng từ ứng dụng đặt món.',
      cat: 'Thời gian',
    },
    {
      q: 'F-Lunch hoạt động giờ nào?',
      a: 'Từ 11:00 đến 13:30 các ngày từ Thứ 2 đến Thứ 7.',
      cat: 'Thời gian',
    },
    {
      q: 'Nhận đồ ở đâu?',
      a: 'Tại quầy F-Lunch ở sảnh Trống Đồng, Tòa nhà Alpha.',
      cat: 'Địa điểm',
    },
    {
      q: 'Tiền đồ ăn có tính qua F-Lunch không?',
      a: 'Không. Bạn thanh toán tiền đồ ăn trên ứng dụng đặt món như bình thường.',
      cat: 'Chi phí',
    },
    {
      q: 'F-Lunch có hỗ trợ nền tảng ngoài GrabFood và ShopeeFood không?',
      a: 'Có. Khi gửi đơn, bạn chọn nền tảng mà bạn đã đặt món (beFood, ShopeeFood, GrabFood...).',
      cat: 'Dịch vụ',
    },
  ],
  en: [
    {
      q: 'What is F-Lunch?',
      a: 'F-Lunch helps students receive food ordered from delivery apps. You order as usual, and F-Lunch takes care of pickup and safe storage.',
      cat: 'Service',
    },
    {
      q: 'Does F-Lunch charge a fee?',
      a: 'Yes. The service fee is 5,000 VND/order, topped up via the website wallet.',
      cat: 'Pricing',
      highlight: true,
    },
    {
      q: 'Do I need to order food through F-Lunch?',
      a: 'No. F-Lunch does not sell food. You select food and order directly on your favorite delivery apps.',
      cat: 'Service',
    },
    {
      q: 'How do I submit an order?',
      a: 'Open the F-Lunch app, select your ordering platform, pick delivery time, and submit your order details.',
      cat: 'Usage',
    },
    {
      q: 'How do I track my order?',
      a: 'Check live order status directly on the F-Lunch website in real-time.',
      cat: 'Usage',
    },
    {
      q: 'What information do I need to provide?',
      a: 'Phone number, Student ID (MSSV), and delivery order code.',
      cat: 'Usage',
    },
    {
      q: 'When should I submit the order?',
      a: 'Right after you have received the order code from your food delivery app.',
      cat: 'Timing',
    },
    {
      q: 'What are F-Lunch operating hours?',
      a: 'From 11:00 to 13:30, Monday through Saturday.',
      cat: 'Timing',
    },
    {
      q: 'Where do I pick up my food?',
      a: 'At F-Lunch Counter in Trong Dong Lobby, Alpha Building.',
      cat: 'Location',
    },
    {
      q: 'Is food cost charged through F-Lunch?',
      a: 'No. You pay food costs directly on the delivery app as normal.',
      cat: 'Pricing',
    },
    {
      q: 'Does F-Lunch support platforms other than GrabFood and ShopeeFood?',
      a: 'Yes. When submitting an order, simply choose the platform you used (beFood, ShopeeFood, GrabFood...).',
      cat: 'Service',
    },
  ],
};

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang } = useLanguageStore();
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Auth modal states (login / register popup)
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const openAuthModal = (mode: 'login' | 'register') => {
    setMobileMenuOpen(false);
    setAuthModal(mode);
    try {
      window.history.pushState({ authModal: mode }, '', `?auth=${mode}`);
    } catch (e) {}
  };

  const closeAuthModal = () => {
    setAuthModal(null);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth')) {
        window.history.pushState(null, '', window.location.pathname);
      }
    } catch (e) {}
  };

  const switchAuthMode = (mode: 'login' | 'register') => {
    setAuthModal(mode);
    try {
      window.history.replaceState({ authModal: mode }, '', `?auth=${mode}`);
    } catch (e) {}
  };

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth === 'login' || auth === 'register') {
        setAuthModal(auth);
      } else {
        setAuthModal(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    if (auth === 'login' || auth === 'register') {
      setAuthModal(auth);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Escape key to close any active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (authModal) closeAuthModal();
        if (isFaqModalOpen) setIsFaqModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModal, isFaqModalOpen]);

  // Google Sign-in initialization
  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    const isRegister = authModal === 'register';
    if (isRegister) setRegLoading(true);
    else setLoginLoading(true);

    try {
      const res = await api.post('/auth/google', { credential: idToken });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);

      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data) {
          updateUser(profileRes.data);
        }
      } catch (pErr) {}

      toast.success(isRegister ? 'Đăng nhập bằng tài khoản Google thành công!' : `Chào mừng quay trở lại, ${user.fullName}!`);
      closeAuthModal();

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kết nối Google thất bại';
      toast.error(msg);
    } finally {
      setLoginLoading(false);
      setRegLoading(false);
    }
  };

  const handleGoogleInit = () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleGoogleCallback,
      });
      const btnContainer = document.getElementById("google-signin-btn-modal");
      if (btnContainer) {
        btnContainer.innerHTML = '';
        const parentWidth = btnContainer.parentElement?.clientWidth || 340;
        const calcWidth = Math.min(Math.max(parentWidth, 240), 380);
        window.google.accounts.id.renderButton(
          btnContainer,
          { 
            theme: "outline", 
            size: "large", 
            width: calcWidth,
            text: authModal === 'register' ? "signup_with" : "signin_with", 
            shape: "rectangular",
            logo_alignment: "left"
          }
        );
      }
    }
  };

  useEffect(() => {
    if (authModal) {
      const timer = setTimeout(() => {
        handleGoogleInit();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [authModal]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }
    const emailLower = loginEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@fpt.edu.vn') && !emailLower.endsWith('@gmail.com')) {
      toast.error('Chỉ chấp nhận email đuôi @fpt.edu.vn hoặc @gmail.com');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);

      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data) {
          updateUser(profileRes.data);
        }
      } catch (pErr) {}

      toast.success(`Chào mừng quay trở lại, ${user.fullName}!`);
      closeAuthModal();

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
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword || !regConfirmPassword) {
      toast.error('Vui lòng nhập các trường thông tin bắt buộc');
      return;
    }
    const emailDomain = regEmail.trim().toLowerCase();
    if (!emailDomain.endsWith('@fpt.edu.vn') && !emailDomain.endsWith('@gmail.com')) {
      toast.error('Chỉ chấp nhận email đuôi @fpt.edu.vn hoặc @gmail.com');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phoneNumber: regPhoneNumber || undefined,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn đến với F-Lunch.');
      closeAuthModal();

      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'RECEIVER') {
        router.push('/receiver');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký tài khoản thất bại';
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const switchLanguage = (newLang: 'vi' | 'en') => {
    setLang(newLang);
  };

  const authT = translations[lang] || translations.vi;
  const t = content[lang];
  const questionsList = allFaqs[lang];

  const filteredFaqs = questionsList.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  const handleCtaClick = () => {
    if (!user) {
      openAuthModal('login');
    } else if (user.role === 'STUDENT') {
      router.push('/student/request');
    } else if (user.role === 'RECEIVER') {
      router.push('/receiver');
    } else if (user.role === 'ADMIN') {
      router.push('/admin');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset for fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const stepIcons = [ShoppingBag, MapPin, Send, Truck, QrCode];
  const stepImages = [
    '/landing/step-1.png',
    '/landing/step-2.png',
    '/landing/step-3.png',
    '/landing/step-4.png',
    '/landing/step-5.png',
  ];

  const useCaseImageIcons = [
    '/landing/icon-hourglass.png',
    '/landing/icon-phone-tap.png',
    '/landing/icon-book.png',
    '/landing/icon-scooter.png',
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#4A1F05] selection:bg-orange-500 selection:text-white flex flex-col font-sans">
      {/* 1. FIXED TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF7]/95 backdrop-blur-md border-b border-orange-200/80 shadow-xs h-20 transition-all">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-full flex items-center justify-between">
          {/* Far Left: Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative h-12 w-40 sm:w-48">
              <Image
                src="/logoF-Lunch.png"
                alt="F-Lunch Logo"
                fill
                className="object-contain object-left group-hover:scale-[1.02] transition-transform"
                priority
              />
            </div>
          </Link>

          {/* Center Navigation Links (Clean 6 items, elegantly spaced) */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-[15px] font-bold text-[#5C2700]">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => scrollToSection('pain-points')}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.problem}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.steps}
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.benefits}
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.pricing}
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="hover:text-orange-600 transition-colors cursor-pointer py-1"
            >
              {t.nav.useCases}
            </button>
          </nav>

          {/* Far Right: Language Switcher + User / Auth Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Language Toggle Pill */}
            <div className="flex items-center bg-orange-100/80 p-0.5 rounded-full border border-orange-200">
              <button
                onClick={() => switchLanguage('vi')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lang === 'vi'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-[#6E3919] hover:text-orange-600'
                }`}
              >
                VN
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-[#6E3919] hover:text-orange-600'
                }`}
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={
                    user.role === 'ADMIN'
                      ? '/admin'
                      : user.role === 'RECEIVER'
                      ? '/receiver'
                      : '/student'
                  }
                  className="flex items-center gap-2.5 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full hover:bg-orange-100 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.fullName ? user.fullName[0] : 'U'
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#4A1F05] block leading-tight">
                      {user.fullName || 'User'}
                    </span>
                    <span className="text-[10px] text-orange-600 font-bold uppercase block leading-none">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleCtaClick}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2 rounded-full shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <span>{t.nav.dashboard}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-orange-600 hover:text-orange-700 font-bold text-sm px-4 py-2 rounded-full border border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-5 py-2 rounded-full shadow-md shadow-orange-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  {t.nav.register}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Language switch + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex items-center bg-orange-100/80 p-0.5 rounded-full border border-orange-200">
              <button
                onClick={() => switchLanguage('vi')}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  lang === 'vi'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-[#6E3919]'
                }`}
              >
                VN
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  lang === 'en'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-[#6E3919]'
                }`}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-orange-100 bg-[#FFFBF7] px-6 pt-3 pb-6 space-y-3 shadow-lg"
            >
              <div className="flex flex-col space-y-2 text-base font-bold text-[#6E3919]">
                <button
                  onClick={() => scrollToSection('pain-points')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  {t.nav.problem}
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  {t.nav.steps}
                </button>
                <button
                  onClick={() => scrollToSection('benefits')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  {t.nav.benefits}
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  {t.nav.pricing}
                </button>
                <button
                  onClick={() => scrollToSection('use-cases')}
                  className="text-left py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  {t.nav.useCases}
                </button>
              </div>

              <div className="pt-3 border-t border-orange-100 flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={handleCtaClick}
                    className="w-full bg-orange-600 text-white font-bold py-2.5 rounded-full text-center shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{t.nav.dashboard} ({user.fullName})</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="text-center text-orange-600 font-bold py-2.5 rounded-full border border-orange-300 cursor-pointer hover:bg-orange-50 transition-all"
                    >
                      {t.nav.login}
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="text-center bg-orange-600 text-white font-bold py-2.5 rounded-full shadow-md cursor-pointer hover:bg-orange-700 transition-all"
                    >
                      {t.nav.register}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EA580C] via-[#F97316] to-[#E65100] py-16 sm:py-20 lg:py-24 text-white">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl pointer-events-none -mt-40" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-950/20 rounded-full blur-2xl pointer-events-none -mb-32 -mr-20" />

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide text-white shadow-xs">
                <Sparkles size={16} className="text-amber-200" />
                <span>{t.hero.badge}</span>
              </div>

              {/* Title with logical inline-block phrases */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                <span className="block sm:inline-block">{t.hero.clause1}&nbsp;</span>
                <span className="block sm:inline-block text-amber-200 drop-shadow-md">{t.hero.clause2}</span>
              </h1>

              <p className="text-base sm:text-xl text-orange-50 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t.hero.desc}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto bg-white hover:bg-orange-50 font-black text-base sm:text-lg px-8 py-4 rounded-full shadow-2xl shadow-orange-950/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white"
                  style={{ color: '#EA580C' }}
                >
                  <span style={{ color: '#EA580C' }}>{t.hero.cta1}</span>
                  <ArrowRight size={20} className="text-orange-600" />
                </button>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full border-2 border-white/80 backdrop-blur-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.hero.cta2}</span>
                </button>
              </div>

              {/* Quick Feature Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/20 max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                  <Zap size={18} className="text-amber-300 shrink-0" />
                  <span>{t.hero.pill1}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                  <ShieldCheck size={18} className="text-amber-300 shrink-0" />
                  <span>{t.hero.pill2}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                  <QrCode size={18} className="text-amber-300 shrink-0" />
                  <span>{t.hero.pill3}</span>
                </div>
              </div>
            </motion.div>

            {/* Right Visual: Interactive Live Status Mockup Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div className="absolute inset-0 bg-white/20 rounded-3xl transform rotate-1 blur-lg" />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/40 bg-white p-6 sm:p-7 text-[#4A1F05]">
                  {/* Top Live Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                        {t.hero.liveStatus}
                      </span>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                      {t.hero.timeSlot}
                    </span>
                  </div>

                  {/* Location & Hub Info */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#4A1F05]">{t.hero.hubTitle}</h4>
                      <p className="text-xs text-orange-700 font-bold mt-0.5">
                        {t.hero.hubDesc}
                      </p>
                    </div>
                  </div>

                  {/* Sample Order Tracker Display */}
                  <div className="mt-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          #FL
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#4A1F05]">{t.hero.orderSample1}</p>
                          <p className="text-[11px] text-slate-500 font-medium">ShopeeFood • Shipper: 0932***720</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        {t.hero.statusReceived}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                          #FL
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#4A1F05]">{t.hero.orderSample2}</p>
                          <p className="text-[11px] text-slate-500 font-medium">GrabFood • 11:45 AM</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                        {t.hero.statusReady}
                      </span>
                    </div>
                  </div>

                  {/* Bottom QR Pickup simulation */}
                  <div className="mt-5 pt-4 border-t border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6E3919]">
                      <QrCode size={18} className="text-orange-600" />
                      <span>{t.hero.qrText}</span>
                    </div>
                    <span className="text-xs font-black text-orange-600">{t.hero.qrTime}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. SECTION PAIN POINTS (Strictly 1 line on desktop with lg:whitespace-nowrap) */}
      <section id="pain-points" className="py-20 lg:py-24 bg-[#FFF8F2] relative">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[40px] 2xl:text-[44px] font-black uppercase tracking-tight text-[#4A1F05] leading-tight lg:whitespace-nowrap">
              <span className="block sm:inline-block">{t.pain.clause1}&nbsp;</span>
              <span className="block sm:inline-block text-orange-600">{t.pain.clause2}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#6E3919] font-medium leading-relaxed max-w-3xl mx-auto">
              {t.pain.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Pain Points Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2">
                {t.pain.badge}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200/80 hover:border-orange-400 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.pain.p1Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.pain.p1Desc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200/80 hover:border-orange-400 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bike size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.pain.p2Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.pain.p2Desc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200/80 hover:border-orange-400 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.pain.p3Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.pain.p3Desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Graphic illustration + Status Badges */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-md bg-gradient-to-b from-orange-100/70 via-amber-50 to-orange-200/40 rounded-3xl p-8 border border-orange-200 shadow-md flex flex-col items-center justify-center">
                <div className="relative w-full h-60 sm:h-72">
                  <Image
                    src="/landing/shipper-waiting.png"
                    alt="Shipper waiting"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>

                <div className="mt-6 w-full space-y-2.5">
                  <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-xs border border-orange-200 flex items-center gap-2.5 sm:gap-3">
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[11px] sm:text-xs font-bold text-[#4A1F05] whitespace-nowrap overflow-hidden text-ellipsis">{t.pain.box1}</p>
                  </div>
                  <div className="bg-orange-600 text-white p-2.5 sm:p-3 rounded-xl shadow-xs flex items-center gap-2.5 sm:gap-3">
                    <CheckCircle size={18} className="text-amber-200 shrink-0" />
                    <p className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{t.pain.box2}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 5 BƯỚC, NHẬN ĐỒ GỌN HƠN (Strictly 1 line on desktop) */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white relative">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <span className="inline-block bg-white/20 text-white font-bold text-xs uppercase px-4 py-1.5 rounded-full tracking-wider mb-3">
              {t.steps.badge}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] xl:text-[42px] 2xl:text-[46px] font-black uppercase tracking-tight text-white leading-tight lg:whitespace-nowrap">
              <span className="block sm:inline-block">{t.steps.clause1}&nbsp;</span>
              <span className="block sm:inline-block">{t.steps.clause2}</span>
            </h2>
            <p className="mt-4 text-orange-100 text-base sm:text-lg font-medium max-w-3xl mx-auto">
              {t.steps.subtitle}
            </p>
          </div>

          {/* 5 Cards Process Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {t.steps.items.map((step, idx) => {
              const IconComp = stepIcons[idx];
              const stepImg = stepImages[idx];
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white rounded-3xl p-5 shadow-2xl border-2 border-orange-200/60 flex flex-col justify-between hover:-translate-y-2 transition-all group"
                  style={{ color: '#4A1F05' }}
                >
                  <div>
                    {/* Header: Step Number & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {step.num}
                      </span>
                      <span className="text-[11px] font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border border-orange-200/60">
                        {step.badge}
                      </span>
                    </div>

                    {/* Step Visual Preview */}
                    <div className="relative w-full h-44 sm:h-48 bg-orange-50 rounded-2xl overflow-hidden mb-4 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Image
                        src={stepImg}
                        alt={step.title}
                        fill
                        unoptimized
                        className="object-contain p-2"
                      />
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-base uppercase text-orange-600 mb-2 leading-snug">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#6E3919] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-orange-100 flex items-center gap-2 text-xs font-bold text-orange-600">
                    <IconComp size={16} />
                    <span>Step {step.num}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Center CTA Button */}
          <div className="text-center mt-16">
            <button
              onClick={handleCtaClick}
              className="bg-white hover:bg-orange-50 font-black text-base sm:text-xl px-12 py-4 rounded-full shadow-2xl shadow-orange-950/40 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer border-2 border-white"
              style={{ color: '#EA580C' }}
            >
              <span style={{ color: '#EA580C' }}>{t.steps.cta}</span>
              <ArrowRight size={22} className="text-orange-600" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. SECTION F-LUNCH LO PHẦN NHẬN ĐỒ GIÚP BẠN! (Strictly 1 line on desktop) */}
      <section id="benefits" className="py-20 lg:py-24 bg-[#FFFBF7]">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[40px] 2xl:text-[44px] font-black uppercase tracking-tight text-[#4A1F05] leading-tight lg:whitespace-nowrap">
              <span className="block sm:inline-block">{t.benefits.clause1}&nbsp;</span>
              <span className="block sm:inline-block text-orange-600">{t.benefits.clause2}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#6E3919] font-medium leading-relaxed max-w-3xl mx-auto">
              {t.benefits.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual Illustration with Clean Fastfood + Courier */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-100/40 p-6 sm:p-8 rounded-3xl border border-orange-200/90 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4 w-full items-center">
                  <div className="relative h-44 sm:h-48 w-full">
                    <Image
                      src="/landing/courier-scooter.png"
                      alt="Shipper delivery"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-44 sm:h-48 w-full">
                    <Image
                      src="/landing/fastfood.png"
                      alt="Lunch meal"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Floating message card below visual */}
                <div className="mt-6 bg-white p-4 rounded-2xl border border-orange-200/80 w-full text-center shadow-xs">
                  <p className="text-sm font-bold text-orange-600">
                    {t.benefits.noticeTitle}
                  </p>
                  <p className="text-xs text-[#6E3919] mt-1">
                    {t.benefits.noticeDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Core Benefits List (Polished badge & aligned cards) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Polished Modern Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm mb-1">
                <Sparkles size={14} className="text-amber-200" />
                <span>{t.benefits.badgeText}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-orange-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.benefits.b1Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.benefits.b1Desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-orange-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.benefits.b2Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.benefits.b2Desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-orange-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#4A1F05]">{t.benefits.b3Title}</h3>
                    <p className="text-sm sm:text-base text-[#6E3919] mt-1.5 leading-relaxed">{t.benefits.b3Desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION CHI PHÍ RÕ RÀNG (Strictly 1 line on desktop) */}
      <section id="pricing" className="py-20 lg:py-24 bg-gradient-to-b from-[#FFF8F2] to-[#FFFBF7]">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <div className="inline-block bg-orange-600 text-white text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider mb-3">
              {t.pricing.badge}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[40px] 2xl:text-[44px] font-black uppercase tracking-tight text-[#4A1F05] leading-tight lg:whitespace-nowrap">
              <span className="block sm:inline-block">{t.pricing.clause1}&nbsp;</span>
              <span className="block sm:inline-block text-orange-600">{t.pricing.clause2}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#6E3919] font-medium leading-relaxed max-w-3xl mx-auto">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: 5.000đ/đơn */}
            <div className="bg-white rounded-3xl p-8 border-2 border-orange-300 shadow-lg flex flex-col items-center text-center hover:border-orange-500 hover:-translate-y-2 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl whitespace-nowrap">
                Cố định
              </div>
              <div className="w-20 h-20 rounded-2xl bg-orange-50/80 flex items-center justify-center mb-6 border border-orange-200 p-3 shadow-2xs">
                <div className="relative w-full h-full">
                  <Image src="/landing/icon-piggy.png" alt="Cố định" fill unoptimized className="object-contain" />
                </div>
              </div>
              <h3 className="font-black text-xl text-[#4A1F05] uppercase">{t.pricing.c1Title}</h3>
              <p className="text-sm sm:text-base text-[#6E3919] mt-3 leading-relaxed">{t.pricing.c1Desc}</p>
              <div className="mt-6 pt-4 border-t border-orange-100 w-full text-xs font-bold text-orange-600">
                {t.pricing.c1Tag}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-orange-200/80 shadow-md flex flex-col items-center text-center hover:border-orange-500 hover:-translate-y-2 transition-all">
              <div className="w-20 h-20 rounded-2xl bg-orange-50/80 flex items-center justify-center mb-6 border border-orange-200 p-3 shadow-2xs">
                <div className="relative w-full h-full">
                  <Image src="/landing/icon-phone-tap.png" alt="Thanh toán" fill unoptimized className="object-contain" />
                </div>
              </div>
              <h3 className="font-black text-xl text-[#4A1F05] uppercase">{t.pricing.c2Title}</h3>
              <p className="text-sm sm:text-base text-[#6E3919] mt-3 leading-relaxed">{t.pricing.c2Desc}</p>
              <div className="mt-6 pt-4 border-t border-orange-100 w-full text-xs font-bold text-orange-600">
                {t.pricing.c2Tag}
              </div>
            </div>

            {/* Card 3: 11:00 - 13:30 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-orange-200/80 shadow-md flex flex-col items-center text-center hover:border-orange-500 hover:-translate-y-2 transition-all">
              <div className="w-20 h-20 rounded-2xl bg-orange-50/80 flex items-center justify-center mb-6 border border-orange-200 p-3 shadow-2xs">
                <div className="relative w-full h-full">
                  <Image src="/landing/icon-calendar.png" alt="Khung giờ" fill unoptimized className="object-contain" />
                </div>
              </div>
              <h3 className="font-black text-xl text-[#4A1F05] uppercase">{t.pricing.c3Title}</h3>
              <p className="text-sm sm:text-base text-[#6E3919] mt-3 leading-relaxed">{t.pricing.c3Desc}</p>
              <div className="mt-6 pt-4 border-t border-orange-100 w-full text-xs font-bold text-orange-600">
                {t.pricing.c3Tag}
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <button
              onClick={handleCtaClick}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black text-base sm:text-lg px-10 py-4 rounded-full shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{t.pricing.cta}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. SECTION DÙNG KHI NÀO? (Strictly 1 line on desktop) */}
      <section id="use-cases" className="py-20 lg:py-24 bg-[#FFFBF7]">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <div className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2 whitespace-nowrap">
              {t.useCases.badge}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[30px] xl:text-[36px] 2xl:text-[40px] font-black uppercase tracking-tight text-[#4A1F05] leading-tight lg:whitespace-nowrap">
              <span className="block sm:inline-block">{t.useCases.clause1}&nbsp;</span>
              <span className="block sm:inline-block text-orange-600">{t.useCases.clause2}&nbsp;</span>
              <span className="block sm:inline-block">{t.useCases.clause3}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#6E3919] font-medium leading-relaxed max-w-3xl mx-auto">
              {t.useCases.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {t.useCases.items.map((item, idx) => {
              const iconSrc = useCaseImageIcons[idx];
              return (
                <div
                  key={idx}
                  className="bg-white p-5 sm:p-7 rounded-3xl border border-orange-200/80 shadow-xs hover:border-orange-400 transition-all flex items-start gap-4 sm:gap-5"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50/80 flex items-center justify-center shrink-0 border border-orange-200 shadow-xs p-2.5">
                    <div className="relative w-full h-full">
                      <Image
                        src={iconSrc}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 mb-2">
                      <h3 className="font-bold text-base sm:text-lg text-[#4A1F05] leading-snug">
                        {item.title}
                      </h3>
                      <span className="text-[11px] sm:text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full whitespace-nowrap shrink-0 self-start sm:self-auto border border-orange-200/60 shadow-2xs">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#6E3919] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <button
              onClick={handleCtaClick}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black text-base sm:text-lg px-10 py-4 rounded-full shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{t.useCases.cta}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. CLASSIC FOOTER (Enlarged typography, bigger social icons & hotline) */}
      <footer className="bg-[#FFF5EB] border-t-2 border-orange-200 text-[#4A1F05] pt-16 sm:pt-20 pb-16 mt-auto">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b-2 border-orange-200/80">
            {/* Left Brand Col */}
            <div className="md:col-span-5 space-y-6">
              <div className="relative h-16 sm:h-20 w-60 sm:w-72">
                <Image
                  src="/logoF-Lunch.png"
                  alt="F-Lunch Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <p className="text-base sm:text-lg text-[#5C2700] leading-relaxed max-w-lg font-medium">
                {t.footer.desc}
              </p>

              {/* Contact Hotline */}
              <div className="flex items-center gap-4 pt-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Phone size={28} />
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-[#7A3E1D] font-bold block leading-none mb-1.5 uppercase tracking-wider">
                    {t.footer.hotlineLabel}
                  </span>
                  <a href="tel:0932600720" className="text-orange-600 hover:text-orange-700 hover:underline font-black text-2xl sm:text-3xl tracking-wide">
                    {t.footer.hotline}
                  </a>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-3">
                <p className="text-base font-black text-[#4A1F05] mb-3 uppercase tracking-wider">{t.footer.connect}</p>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=61595625866431"
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-orange-200/90 text-[#1877F2] shadow-sm hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                    aria-label="Facebook"
                    title="Facebook F-Lunch"
                  >
                    <FacebookIcon size={26} />
                  </a>
                  <a
                    href="https://www.tiktok.com/@flunch.official"
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-orange-200/90 text-black shadow-sm hover:bg-black hover:text-white hover:border-black hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                    aria-label="TikTok"
                    title="TikTok F-Lunch"
                  >
                    <TikTokIcon size={26} />
                  </a>
                  <a
                    href="https://zalo.me/0932600720"
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-orange-200/90 text-[#0068FF] shadow-sm hover:bg-[#0068FF] hover:text-white hover:border-[#0068FF] hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                    aria-label="Zalo"
                    title="Zalo F-Lunch"
                  >
                    <ZaloIcon size={26} />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links Column 1: Về F-Lunch */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-black text-lg sm:text-xl uppercase tracking-wider text-[#4A1F05] pb-2 border-b-2 border-orange-300 inline-block mb-2">
                {t.footer.col1Title}
              </h4>
              <ul className="space-y-3 text-base sm:text-[17px] text-[#5C2700]">
                {t.footer.col1Items.map((item, idx) => (
                  <li key={idx}>
                    {item.isLoginBtn ? (
                      <button
                        onClick={() => openAuthModal('login')}
                        className="hover:text-orange-600 transition-colors cursor-pointer text-left font-medium"
                      >
                        {item.label}
                      </button>
                    ) : item.section ? (
                      <button
                        onClick={() => scrollToSection(item.section)}
                        className="hover:text-orange-600 transition-colors cursor-pointer text-left font-medium"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link href={(item as any).link || '#'} className="hover:text-orange-600 transition-colors font-medium">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links Column 2: Hướng dẫn */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-black text-lg sm:text-xl uppercase tracking-wider text-[#4A1F05] pb-2 border-b-2 border-orange-300 inline-block mb-2">
                {t.footer.col2Title}
              </h4>
              <ul className="space-y-3 text-base sm:text-[17px] text-[#5C2700]">
                {t.footer.col2Items.map((item, idx) => (
                  <li key={idx}>
                    {item.isFaqBtn ? (
                      <button
                        onClick={() => setIsFaqModalOpen(true)}
                        className="text-orange-600 hover:text-orange-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <HelpCircle size={19} />
                        <span>{item.label}</span>
                      </button>
                    ) : item.section ? (
                      <button
                        onClick={() => scrollToSection(item.section)}
                        className="hover:text-orange-600 transition-colors cursor-pointer text-left font-medium"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <a href={item.link || '#'} className="hover:text-orange-600 transition-colors font-medium">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Thông tin địa điểm & Thời gian */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-black text-lg sm:text-xl uppercase tracking-wider text-[#4A1F05] pb-2 border-b-2 border-orange-300 inline-block mb-2">
                {t.footer.col3Title}
              </h4>
              <div className="text-base sm:text-[17px] text-[#5C2700] space-y-4 leading-relaxed">
                <div>
                  <strong className="text-base sm:text-lg font-bold text-[#4A1F05] block mb-1">{t.footer.locationLabel}</strong>
                  <p>{t.footer.locationText}</p>
                </div>
                <div>
                  <strong className="text-base sm:text-lg font-bold text-[#4A1F05] block mb-1">{t.footer.hoursLabel}</strong>
                  <p>{t.footer.hoursText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Matching screenshot */}
          <div className="pt-8 text-base sm:text-lg text-[#5C2700] space-y-2.5">
            <p className="font-bold text-[#4A1F05]">{t.footer.summary}</p>
            <p className="font-bold">
              Liên hệ: <a href="tel:0932600720" className="text-orange-600 hover:underline font-black text-lg sm:text-xl">093 260 07 20</a>
            </p>
            <p className="text-[#6E3919] font-medium text-sm sm:text-base">
              <span className="font-bold text-[#4A1F05]">{t.footer.linksLabel}</span>{' '}
              <span className="hover:text-orange-600 cursor-pointer" onClick={() => scrollToSection('pain-points')}>Vấn đề</span> |{' '}
              <span className="hover:text-orange-600 cursor-pointer" onClick={() => scrollToSection('how-it-works')}>Cách hoạt động</span> |{' '}
              <span className="hover:text-orange-600 cursor-pointer" onClick={() => scrollToSection('benefits')}>Sản phẩm</span> |{' '}
              <span className="hover:text-orange-600 cursor-pointer" onClick={() => scrollToSection('use-cases')}>Ứng dụng</span> |{' '}
              <span className="hover:text-orange-600 cursor-pointer" onClick={() => scrollToSection('pricing')}>Bảng giá</span> |{' '}
              <span className="hover:text-orange-600 cursor-pointer text-orange-600 font-black" onClick={() => setIsFaqModalOpen(true)}>FAQ</span>
            </p>
            <p className="text-[#7A3E1D] pt-2 text-xs sm:text-sm font-medium">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>

      {/* 9. INTERACTIVE FAQ MODAL */}
      <AnimatePresence>
        {isFaqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFaqModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-[#FFFBF7] rounded-3xl shadow-2xl border-2 border-orange-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-start justify-between relative">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <HelpCircle size={22} className="text-amber-200" />
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                      {t.modal.title}
                    </h3>
                  </div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">
                    {t.modal.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setIsFaqModalOpen(false)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  aria-label="Close FAQ Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 sm:p-6 border-b border-orange-100 bg-[#FFF8F2]">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder={t.modal.searchPlaceholder}
                    className="w-full bg-white border border-orange-200 rounded-full pl-11 pr-4 py-2.5 text-sm text-[#4A1F05] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  {faqSearchQuery && (
                    <button
                      onClick={() => setFaqSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-orange-600 font-bold hover:underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Questions List (Scrollable) */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                {filteredFaqs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFaqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                          faq.highlight
                            ? 'border-2 border-orange-500 bg-orange-50/50 shadow-sm'
                            : 'border-orange-200/80 hover:border-orange-400'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-orange-600 font-black text-sm shrink-0 mt-0.5">Q.</span>
                          <div>
                            <h4 className="font-black text-sm sm:text-base text-[#4A1F05] leading-snug">
                              {faq.q}
                            </h4>
                            <p className="text-xs sm:text-sm text-[#6E3919] mt-2 leading-relaxed">
                              {faq.a}
                            </p>
                            <span className="inline-block mt-3 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                              {faq.cat}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#6E3919]">
                    <HelpCircle size={40} className="mx-auto text-orange-300 mb-2" />
                    <p className="text-sm font-bold">Không tìm thấy câu hỏi phù hợp với "{faqSearchQuery}"</p>
                    <p className="text-xs mt-1 text-slate-500">Hãy thử nhập từ khóa ngắn hơn như: phí, giờ, địa điểm...</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Banner */}
              <div className="p-4 sm:p-5 border-t border-orange-200 bg-[#FFF5EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="text-xs text-[#6E3919]">
                  <span>{t.modal.hotlineHelp} </span>
                  <a href="tel:0932600720" className="font-bold text-orange-600 text-sm hover:underline">
                    093 260 07 20
                  </a>
                </div>
                <button
                  onClick={() => setIsFaqModalOpen(false)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-full transition-all cursor-pointer"
                >
                  {t.modal.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Google Identity Services Script for One-Tap / Button Sign-In */}
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={handleGoogleInit}
        strategy="afterInteractive"
      />

      {/* 10. AUTH MODAL (LOGIN & REGISTER POPUP OVER BLURRED LANDING PAGE) */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Blurred Dark Backdrop (Clicking outside closes modal) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAuthModal}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-all cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-6 sm:p-8 rounded-3xl shadow-2xl z-10 text-white my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Top Navigation: Back to landing page + Close X button */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold py-1 px-2 rounded-lg hover:bg-slate-800/60"
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại trang chủ</span>
                </button>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Đóng popup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Logo & Heading */}
              <div className="text-center mb-5 flex flex-col items-center">
                <div className="mb-2 transition-transform hover:scale-105 duration-300">
                  <Image
                    src="/logoF-Lunch.png"
                    alt="F-Lunch Logo"
                    width={180}
                    height={60}
                    className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_16px_rgba(249,115,22,0.25)]"
                    priority
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  {authModal === 'login' ? authT.login_title : authT.register_title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {authT.login_subtitle}
                </p>
              </div>

              {/* Tab Switcher: Đăng nhập | Đăng ký */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => switchAuthMode('login')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authModal === 'login'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {authT.tab_login}
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('register')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authModal === 'register'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {authT.tab_register}
                </button>
              </div>

              {/* LOGIN FORM */}
              {authModal === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {authT.email_label}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={authT.email_placeholder}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {authT.password_label}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder={authT.password_placeholder}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/30 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{authT.login_loading}</span>
                      </span>
                    ) : (
                      <span>{authT.login_btn}</span>
                    )}
                  </button>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {authT.fullname_label}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder={authT.fullname_placeholder}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {authT.email_label}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder={authT.email_placeholder}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {authT.phone_label_optional}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        value={regPhoneNumber}
                        onChange={(e) => setRegPhoneNumber(e.target.value)}
                        placeholder={authT.phone_placeholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {authT.password_label}
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="≥ 6 ký tự"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {authT.confirm_password_label}
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder={authT.confirm_password_placeholder}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-orange-600/30 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {regLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{authT.register_loading}</span>
                      </span>
                    ) : (
                      <span>{authT.register_btn}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-800" />
                <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {authT.or_google}
                </span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Google Sign-in */}
              <div className="flex justify-center w-full min-h-[44px]">
                <div id="google-signin-btn-modal" className="w-full flex justify-center overflow-hidden max-w-full"></div>
              </div>

              {/* Switch links at bottom */}
              <p className="text-center text-xs text-slate-400 mt-5">
                {authModal === 'login' ? (
                  <>
                    {authT.no_account}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode('register')}
                      className="text-orange-500 hover:text-orange-400 font-bold transition-colors cursor-pointer"
                    >
                      {authT.register_link}
                    </button>
                  </>
                ) : (
                  <>
                    {authT.have_account}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode('login')}
                      className="text-orange-500 hover:text-orange-400 font-bold transition-colors cursor-pointer"
                    >
                      {authT.login_link}
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
