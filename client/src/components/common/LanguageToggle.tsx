'use client';

import React, { useEffect, useState } from 'react';
import { useLanguageStore } from '@/stores/language.store';

interface LanguageToggleProps {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md';
}

export default function LanguageToggle({
  variant = 'auto',
  className = '',
  size = 'sm',
}: LanguageToggleProps) {
  const { lang, setLang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch while reading localStorage
    return (
      <div
        className={`flex items-center rounded-full p-0.5 opacity-0 ${
          size === 'sm' ? 'text-[11px]' : 'text-xs'
        } ${className}`}
      >
        <span className="px-2 py-0.5">VN</span>
        <span className="px-2 py-0.5">EN</span>
      </div>
    );
  }

  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className={`inline-flex items-center rounded-full p-0.5 transition-all select-none ${
        isDark
          ? 'bg-slate-900/90 border border-slate-800 shadow-inner'
          : 'bg-orange-50/90 border border-orange-200/80 shadow-sm'
      } ${size === 'sm' ? 'text-[11px] font-bold' : 'text-xs font-bold'} ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang('vi')}
        aria-pressed={lang === 'vi'}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
          lang === 'vi'
            ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-extrabold'
            : isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            : 'text-stone-500 hover:text-stone-800 hover:bg-orange-100/50'
        }`}
      >
        <span>VN</span>
      </button>

      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
          lang === 'en'
            ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-extrabold'
            : isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            : 'text-stone-500 hover:text-stone-800 hover:bg-orange-100/50'
        }`}
      >
        <span>EN</span>
      </button>
    </div>
  );
}
