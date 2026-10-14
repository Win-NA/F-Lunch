# Đề Xuất & Tài Liệu Kỹ Thuật: Landing Page F-Lunch (FPTU)

> **Trạng thái:** Bản thảo lưu trữ (Draft Spec - Chưa áp dụng vào mã nguồn chính).  
> **Mục đích:** Lưu lại toàn bộ thảo luận, cấu trúc nội dung và logic kỹ thuật điều hướng mượt mà (anti-flicker) để áp dụng ngay khi nhóm hoàn thành mẫu thiết kế (Figma/Mockup).

---

## 1. Bối cảnh & Mục tiêu

- **Hiện trạng:** Khi người dùng chưa đăng nhập truy cập vào trang chủ (`/`), hệ thống tự động `router.replace('/login')`.
- **Hạn chế:** Người dùng mới (sinh viên FPTU, khách vãng lai từ mạng xã hội) không hiểu rõ dịch vụ F-Lunch là gì, cơ chế nhận hộ đồ ăn ra sao, dễ bỏ đi (Bounce Rate cao).
- **Mục tiêu:** 
  1. Thêm **Landing Page** tại `/` để giới thiệu giải pháp, truyền thông thương hiệu, hướng dẫn 3 bước và tuyển dụng Receiver.
  2. Giữ trải nghiệm thông minh: Nếu người dùng **đã đăng nhập**, tự động chuyển hướng vào Dashboard (`/student`, `/receiver`, `/admin`) mà **không bị giật/nháy giao diện (flicker)**.

---

## 2. Cấu trúc Nội dung Landing Page Đề xuất

| Thứ tự | Khối (Section) | Mục tiêu nội dung | Gợi ý CTA / Visual |
| :--- | :--- | :--- | :--- |
| **1** | **Hero Section** | Gây ấn tượng đầu tiên: *"Không còn cảnh chạy nắng ra cổng nhận đồ ăn — F-Lunch giao tận sảnh FPTU!"* | 2 nút: `Đặt nhận hộ ngay` & `Trở thành Receiver (Kiếm thêm thu nhập)`. Mockup app + bản đồ FPTU. |
| **2** | **Nỗi đau & Giải pháp** | Sinh viên đang học lỡ cuộc gọi shipper, trưa nắng/mưa ngại ra cổng chính, thất lạc đồ ăn ➔ F-Lunch giải quyết tận gốc. | 3 cards đối chiếu trực quan (Trước & Sau khi dùng F-Lunch). |
| **3** | **Quy trình 3 bước (How It Works)** | 1. Đặt đồ ăn ngoài cổng ➔ 2. Tạo yêu cầu nhận hộ ➔ 3. Quét QR nhận đồ tại Sảnh (Trống Đồng/toà nhà). | Minh hoạ icon & flow trực quan. |
| **4** | **Phân luồng 2 đối tượng** | • **Người đặt:** Tiết kiệm thời gian, bảo vệ bữa trưa.<br>• **Receiver:** Tận dụng giờ rảnh giữa ca học, tăng thu nhập ngay trong trường. | 2 cột so sánh quyền lợi & thu nhập ước tính. |
| **5** | **Tính năng bảo đảm niềm tin** | Quét mã QR nhận đồ, Chụp ảnh xác thực đơn hàng, Ví nạp/rút tiền điện tử minh bạch, Đánh giá 5 sao. | Huy hiệu bảo đảm & review thực tế. |
| **6** | **Bảng giá & Khu vực hỗ trợ** | Phí chỉ từ **5.000đ/đơn**. Điểm nhận: Cổng chính ➔ Sảnh Trống Đồng, Sảnh Alpha, Beta, Gamma... | Bảng giá minh bạch. |
| **7** | **FAQ & Footer** | Giải đáp câu hỏi thường gặp (hỏng/đổ thức ăn, cách rút tiền, cách nhận đơn) + Liên hệ hỗ trợ. | Accordion câu hỏi & links mạng xã hội. |

---

## 3. Khung Logic Điều Hướng Mượt Mà (Anti-Flicker)

File áp dụng trong tương lai: `client/src/app/page.tsx`  
Kết hợp cùng Zustand store hiện tại (`useAuthStore` trong `client/src/stores/auth.store.ts`):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import LandingPage from '@/components/landing/LandingPage';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Kiểm tra session từ zustand persist trong localStorage hoặc auth state
    const authStorage = localStorage.getItem('f-lunch-auth');
    let hasValidToken = false;
    let savedRole: string | null = null;

    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.accessToken && parsed?.state?.user) {
          hasValidToken = true;
          savedRole = parsed.state.user.role;
        }
      } catch (e) {
        console.error('Lỗi đọc auth storage:', e);
      }
    }

    const currentRole = user?.role || savedRole;

    if (hasValidToken || user) {
      // Chuyển hướng trực tiếp vào màn hình tương ứng
      if (currentRole === 'STUDENT') {
        router.replace('/student');
      } else if (currentRole === 'RECEIVER') {
        router.replace('/receiver');
      } else if (currentRole === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/student');
      }
    } else {
      // Không có phiên đăng nhập -> Dừng loading và hiển thị Landing Page
      setCheckingAuth(false);
    }
  }, [user, router]);

  // Trong lúc check auth, giữ màn hình nền tối giản để không bị nháy giao diện
  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // Chưa đăng nhập -> Render Landing Page quảng bá sản phẩm
  return <LandingPage />;
}
```

---

## 4. Hướng dẫn Kích hoạt Khi Đã Có Thiết Kế

Khi nhóm thiết kế xong (gửi file ảnh, Figma, HTML/CSS hoặc mô tả chi tiết), bạn chỉ cần gửi yêu cầu cho AI trợ lý với nội dung:

> *"Tôi đã có mẫu thiết kế cho Landing Page (đính kèm/mô tả). Hãy đọc tài liệu tại `docs/LANDING_PAGE_PROPOSAL.md` và tiến hành code các component trong `client/src/components/landing/` và cập nhật `client/src/app/page.tsx`."*

---
*Tài liệu này được tạo và lưu trữ an toàn trong repository dự án F-Lunch.*
