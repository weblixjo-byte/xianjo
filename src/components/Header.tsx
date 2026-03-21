'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Header({ onCartOpen }: { onCartOpen?: () => void }) {
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
      className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md h-20 md:h-24 flex items-center justify-between px-6 md:px-12 border-b border-gray-100"
      dir="rtl"
    >
      {/* RIGHT: LOGO - Optimized scaling and positioning */}
      <Link
        href="/"
        className="relative w-40 h-14 md:w-56 md:h-20 transition-transform active:scale-95"
      >
        <Image
          src="/logo.png" 
          alt="مطعم شيان - Xian Restaurant"
          fill
          className="object-contain object-right"
          sizes="(max-width: 768px) 160px, 224px"
          priority
        />
      </Link>

      {/* LEFT: STORE STATUS, AUTH & CART */}
      <div className="flex items-center gap-2 md:gap-6">
         {/* STORE STATUS BADGE */}
         {!isStoreOpen && (
           <div className="flex items-center gap-1.5 md:gap-2 bg-red-50 text-brand-red px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-red-200 shadow-sm animate-pulse">
             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-red shadow-[0_0_5px_rgba(146,39,36,0.6)]" />
             <span className="text-[9px] md:text-xs font-black tracking-widest uppercase hidden sm:block">المطعم مغلق حالياً</span>
             <span className="text-[9px] font-black tracking-widest uppercase sm:hidden">مغلق</span>
           </div>
         )}

          {/* AUTH BUTTON */}
          {session ? (
            <div className="flex items-center gap-2 md:gap-3">
              <Link 
                href="/my-orders"
                className="flex items-center gap-1 text-brand-black/60 hover:text-brand-red transition-all font-bold text-[10px] md:text-xs"
                title="طلباتي"
              >
                <ShoppingBag size={18} className="md:w-4 md:h-4" /> 
                <span className="hidden sm:inline">طلباتي</span>
              </Link>
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-1 text-brand-black/40 hover:text-brand-red transition-all font-bold text-[10px] md:text-xs"
                title="تسجيل الخروج"
              >
                <LogOut size={18} className="md:w-4 md:h-4" /> 
                <span className="hidden sm:inline">خروج</span>
              </button>
              <div className="relative w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-brand-gray/50 shadow-sm ml-1 md:ml-0">
                <Image 
                  src={session.user?.image || 'https://placehold.co/100x100/F9F7F2/1A1A1A.png?text=User'} 
                  alt={session.user?.name || 'User'} 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
         ) : (
           <button 
             onClick={() => signIn('google')}
             className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 bg-brand-cream border border-brand-gray text-brand-black rounded-full transition-all hover:bg-brand-red hover:text-white hover:border-brand-red shadow-sm active:scale-95 font-black text-xs md:text-sm"
           >
             <User size={18} />
             <span>دخول</span>
           </button>
         )}

         {/* CART BUTTON */}
         <button 
           onClick={onCartOpen}
           className="relative p-3 bg-black text-white rounded-full transition-all hover:bg-[#C40012] shadow-sm active:scale-90"
         >
           <ShoppingBag size={20} strokeWidth={2} />
           <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-[#C40012] text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {cartCount}
                </motion.span>
              )}
           </AnimatePresence>
         </button>
      </div>
    </header>
  );
}