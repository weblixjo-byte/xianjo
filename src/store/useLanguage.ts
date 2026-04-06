'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BRANDING } from '@/constants/branding';

type Language = 'ar' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => 
        set((state) => ({ 
          language: state.language === 'ar' ? 'en' : 'ar' 
        })),
    }),
    {
      name: `${BRANDING.shortNameEn.toLowerCase()}-language-storage`,
    }
  )
);
