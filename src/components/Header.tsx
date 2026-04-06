'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ShoppingCart, User, LogOut, Globe } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/store/useLanguage';
import { BRANDING } from '@/constants/branding';

export default function Header({ onCartOpen }: { onCartOpen?: () => void }) {
  const { language, toggleLanguage } = useLanguage();
  const { data: session } = useSession();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.isStoreOpen === 'boolean') {
          setIsStoreOpen(data.isStoreOpen);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md h-20 md:h-24 flex items-center justify-between px-4 md:px-12 border-b border-gray-100"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* LEFT SECTION */}
      <div className="flex-1 flex justify-start items-center">
        {/* Desktop: Logo */}
        <Link href="/" className="hidden md:block relative w-56 h-20 transition-transform active:scale-95">
          <Image src={BRANDING.logo.url} alt={BRANDING.nameEn} fill className="object-contain object-left" priority sizes="224px" />
        </Link>
        
        {/* Mobile: Auth */}
        <div className="md:hidden">
          {session ? (
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-brand-gray/50 shadow-sm cursor-pointer" onClick={() => signOut()}>
                <Image src={session.user?.image || 'https://placehold.co/100x100/F9F7F2/1A1A1A.png?text=U'} alt="User" fill className="object-cover" />
              </div>
              <Link 
                href="/my-orders" 
                className="p-2 text-brand-black/60 hover:text-brand-red bg-brand-cream rounded-full border border-gray-200" 
                title={language === 'ar' ? 'طلباتي' : 'My Orders'}
              >
                <ShoppingBag size={18} />
              </Link>
            </div>
          ) : (
            <button onClick={() => signIn('google')} className="flex items-center justify-center w-10 h-10 bg-brand-cream border border-brand-gray text-brand-black rounded-full hover:bg-brand-red hover:text-white shadow-sm active:scale-95">
              <User size={18} />
            </button>
          )}
        </div>
      </div>

      {/* CENTER SECTION */}
      <div className="flex-1 flex justify-center items-center">
        {/* Mobile: Logo */}
        <Link href="/" className="md:hidden relative w-32 h-14 transition-transform active:scale-95">
          <Image src={BRANDING.logo.url} alt={BRANDING.nameEn} fill className="object-contain object-center" priority sizes="128px" />
        </Link>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex-1 flex items-center justify-end gap-3 md:gap-6">
         {/* Store Status Badge */}
         {!isStoreOpen && (
           <div className="flex items-center gap-1.5 md:gap-2 bg-red-50 text-brand-red px-2 py-1 md:px-4 md:py-2 rounded-full border border-red-200 shadow-sm animate-pulse">
             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-red shadow-[0_0_5px_rgba(146,39,36,0.6)]" />
             <span className="text-[8px] md:text-xs font-black tracking-widest uppercase hidden sm:block">
               {language === 'ar' ? 'المطعم مغلق' : 'Store Closed'}
             </span>
             <span className="text-[8px] font-black tracking-widest uppercase sm:hidden">
               {language === 'ar' ? 'مغلق' : 'Closed'}
             </span>
           </div>
         )}

         {/* Language Toggle */}
         <button 
           onClick={toggleLanguage}
           className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 bg-brand-cream/30"
           title={language === 'ar' ? 'Change to English' : 'تغيير للغة العربية'}
         >
           <Globe size={14} className="text-brand-red" />
           <span>{language === 'ar' ? 'ENGLISH' : 'عربي'}</span>
         </button>

         {/* Desktop Auth */}
         <div className="hidden md:flex">
          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/my-orders" className="flex items-center gap-1 text-brand-black/60 hover:text-brand-red transition-all font-bold text-xs" title={language === 'ar' ? 'طلباتي' : 'My Orders'}>
                <ShoppingBag size={18} className="w-4 h-4" /> 
                <span>{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
              </Link>
              <button 
                onClick={() => signOut()} 
                className="flex items-center gap-1 text-brand-black/40 hover:text-brand-red transition-all font-bold text-xs ml-2" 
                title={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              >
                <LogOut size={18} className="w-4 h-4" /> 
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gray/50 shadow-sm ml-2">
                <Image src={session.user?.image || 'https://placehold.co/100x100/F9F7F2/1A1A1A.png?text=User'} alt="User" fill className="object-cover" />
              </div>
            </div>
          ) : (
            <button onClick={() => signIn('google')} className="flex items-center gap-2 px-6 py-3 bg-brand-cream border border-brand-gray text-brand-black rounded-full transition-all hover:bg-brand-red hover:text-white hover:border-brand-red shadow-sm active:scale-95 font-black text-sm">
              <User size={18} />
              <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>
          )}
         </div>

         {/* CART BUTTON (Hidden on Mobile/Tablet due to redundancy with bottom bar) */}
         <button onClick={onCartOpen} className="hidden lg:flex relative p-2.5 md:p-3 bg-black text-white rounded-full transition-all hover:bg-[#C40012] shadow-sm active:scale-90 flex-shrink-0">
           <ShoppingCart size={18} className="md:w-5 md:h-5" strokeWidth={2} />
           <AnimatePresence>
              {cartCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-1 -right-1 bg-[#C40012] text-white text-[8px] md:text-[9px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </motion.span>
              )}
           </AnimatePresence>
         </button>
      </div>
    </header>
  );
}