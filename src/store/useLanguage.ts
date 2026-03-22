'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => 
        set((state) => ({ 
          language: state.language === 'ar' ? 'en' : 'ar' 
        })),
    }),
    {
      name: 'xian-language-storage',
    }
  )
);
