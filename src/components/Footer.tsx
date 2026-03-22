'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Phone, MapPin } from 'lucide-react';
import { useCart } from '@/store/useCart';

import { useLanguage } from '@/store/useLanguage';

export default function Footer() {
  const { language } = useLanguage();
  const { items } = useCart();
  const hasItems = items.length > 0;
  const currentYear = new Date().getFullYear();

  const t = {
    story: language === 'ar' 
      ? 'في شيان، نؤمن بأن المذاق لغة عالمية. نقدم لكم أرقى المأكولات الآسيوية بلمسة عصرية وشغف عميق بالتقاليد.' 
      : 'At Xian, we believe taste is a universal language. We bring you the finest Asian cuisine with a modern touch and deep passion for tradition.',
    quickLinks: language === 'ar' ? 'روابط سريعة' : 'Quick Links',
    home: language === 'ar' ? 'الرئيسية' : 'Home',
    menu: language === 'ar' ? 'قائمة الطعام' : 'Menu',
    track: language === 'ar' ? 'تتبع الطلب' : 'Track Order',
    contact: language === 'ar' ? 'اتصل بنا' : 'Contact Us',
    rights: language === 'ar' ? `جميع الحقوق محفوظة © ${currentYear} مطعم شيان` : `All Rights Reserved © ${currentYear} Xian Restaurant`,
    created: language === 'ar' ? 'تم التصميم والتطوير بواسطة' : 'Created by weblix-jo'
  };

  return (
    <footer className={`bg-brand-black text-brand-offwhite pt-24 ${hasItems ? 'pb-56 md:pb-32' : 'pb-24'} px-6 md:px-16 transition-all duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 w-full text-center">
          
          {/* BRAND & STORY */}
          <div className="flex flex-col items-center space-y-8">
            <div className="relative h-16 w-40">
              <Image 
                src="/logo.png" 
                alt="Xian Restaurant" 
                fill 
                className="object-contain brightness-200"
                sizes="160px"
              />
            </div>
            <p className="text-brand-offwhite/50 text-lg leading-loose max-w-sm mx-auto">
              {t.story}
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-8">
            <h4 className="text-xl font-black luxury-heading text-brand-offwhite">{t.quickLinks}</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-brand-offwhite/60 hover:text-brand-red transition-all">{t.home}</Link>
              <Link href="/#menu-anchor" className="text-brand-offwhite/60 hover:text-brand-red transition-all">{t.menu}</Link>
              <Link href="/track" className="text-brand-offwhite/60 hover:text-brand-red transition-all">{t.track}</Link>
            </nav>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-8">
            <h4 className="text-xl font-black luxury-heading text-brand-offwhite">{t.contact}</h4>
            <div className="flex flex-col items-center gap-6 text-brand-offwhite/60">
              <div className="flex items-center gap-4">
                <Phone size={20} className="text-brand-red" />
                <span dir="ltr">+962 7 7999 0504</span>
              </div>
              <div className="flex items-center gap-4">
                <MapPin size={20} className="text-brand-red" />
                <span>{language === 'ar' ? 'عمان، الأردن' : 'Amman, Jordan'}</span>
              </div>
              <div className="flex gap-6 pt-4">
                <Link href="https://www.instagram.com/xianjordan" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-all"><Instagram size={24} /></Link>
                <Link href="https://facebook.com/xianrestaura" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-all"><Facebook size={24} /></Link>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-24 pt-12 border-t border-white/5 w-full flex flex-col items-center gap-6 text-center">
          <p className="text-brand-offwhite/30 text-sm font-bold uppercase tracking-widest">
            {t.rights}
          </p>
          <div className="text-xs font-bold text-brand-offwhite/20 uppercase tracking-widest flex items-center gap-2">
            <span>{t.created}</span>
            <Link 
              href="https://weblix-jo.com/en/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-offwhite/40 hover:text-brand-red transition-all no-underline"
            >
              weblix-jo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
