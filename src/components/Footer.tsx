'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-black text-brand-offwhite py-24 px-6 md:px-16" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24">
          
          {/* BRAND & STORY */}
          <div className="md:col-span-2 space-y-8">
            <div className="relative h-16 w-40">
              <Image 
                src="/logo.png" 
                alt="مطعم شيان" 
                fill 
                className="object-contain brightness-200"
                sizes="160px"
              />
            </div>
            <p className="text-brand-offwhite/50 text-lg leading-loose max-w-md">
              نحن في مطعم شيان نؤمن بأن المذاق هو لغة العالم، ولذلك نحضر لكم أجود المأكولات الآسيوية بلمساتٍ عصرية وشغفٍ كبير بالتقاليد.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-8">
            <h4 className="text-xl font-black luxury-heading text-brand-offwhite">روابط سريعة</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-brand-offwhite/60 hover:text-brand-red transition-all">الرئيسية</Link>
              <Link href="/about" className="text-brand-offwhite/60 hover:text-brand-red transition-all">من نحن</Link>
              <Link href="/#menu-anchor" className="text-brand-offwhite/60 hover:text-brand-red transition-all">قائمة الطعام</Link>
              <Link href="/track" className="text-brand-offwhite/60 hover:text-brand-red transition-all">تتبع طلبك</Link>
            </nav>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-8">
            <h4 className="text-xl font-black luxury-heading text-brand-offwhite">تواصل معنا</h4>
            <div className="flex flex-col gap-6 text-brand-offwhite/60">
              <div className="flex items-center gap-4">
                <Phone size={20} className="text-brand-red" />
                <span>07XX XXX XXX</span>
              </div>
              <div className="flex items-center gap-4">
                <MapPin size={20} className="text-brand-red" />
                <span>عمان، الأردن</span>
              </div>
              <div className="flex gap-6 pt-4">
                <Link href="#" className="hover:text-brand-red transition-all"><Instagram size={24} /></Link>
                <Link href="#" className="hover:text-brand-red transition-all"><Facebook size={24} /></Link>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-brand-offwhite/30 text-sm font-bold uppercase tracking-widest">
            جميع الحقوق محفوظة © {currentYear} مطعم شيان
          </p>
          <div className="flex gap-8 text-xs font-bold text-brand-offwhite/20 uppercase tracking-widest">
             <Link href="#" className="hover:text-brand-offwhite/50 transition-all">سياسة الخصوصية</Link>
             <Link href="#" className="hover:text-brand-offwhite/50 transition-all">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
