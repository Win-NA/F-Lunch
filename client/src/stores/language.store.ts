import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'vi' | 'en';

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'vi',
      setLang: (newLang: Language) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('flunch_lang', newLang);
          } catch (e) {}
        }
        set({ lang: newLang });
      },
      toggleLang: () => {
        const next = get().lang === 'vi' ? 'en' : 'vi';
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('flunch_lang', next);
          } catch (e) {}
        }
        set({ lang: next });
      },
    }),
    {
      name: 'flunch_lang_store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as any))),
      onRehydrateStorage: () => (state) => {
        // Synchronize with legacy 'flunch_lang' key if present
        if (typeof window !== 'undefined' && state) {
          const legacy = localStorage.getItem('flunch_lang') as Language;
          if (legacy === 'vi' || legacy === 'en') {
            state.lang = legacy;
          }
        }
      },
    },
  ),
);
