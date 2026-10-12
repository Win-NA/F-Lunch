'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth.store';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') {
        router.replace('/student');
      } else if (user.role === 'RECEIVER') {
        router.replace('/receiver');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      }
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center mx-auto mb-3">
          <Image
            src="/logoF-Lunch.png"
            alt="F-Lunch"
            width={160}
            height={55}
            className="h-12 w-auto object-contain animate-pulse"
            priority
          />
        </div>
        <p className="text-sm text-slate-500 font-medium animate-pulse">Navigating F-Lunch...</p>
      </div>
    </div>
  );
}
