'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Search, PackageSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/store/useLanguage';

export default function TrackSearchPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [orderId, setOrderId] = useState('');
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if(orderId.trim()) {
      const cleanId = orderId.trim().replace('#', '');
      router.push(`/track/${cleanId}`);
    }
  }

  const t = {
    title: isAr ? 'تتبع طلبك' : 'Track Your Order',
    desc: isAr ? 'أدخل رمز تتبع طلبك للبقاء على اطلاع من مطبخنا حتى باب منزلك.' : 'Enter your order tracking code to stay updated from our kitchen to your door.',
    placeholder: isAr ? 'رقم الطلب (مثلاً c9b2-4x...)' : 'Order Number (e.g. c9b2-4x...)',
    button: isAr ? 'تتبع' : 'Track'
  };

  return (
    <div className="bg-brand-cream min-h-screen pb-28 font-sans selection:bg-brand-red selection:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mt-20 p-6"
      >
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-brand-gray text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-red rounded-full blur-[60px] opacity-10"></div>
          
          <div className="bg-brand-gray border border-gray-200 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-black rotate-12 shadow-sm">
            <PackageSearch size={48} strokeWidth={1.5} className="-rotate-12" />
          </div>
          
          <h1 className="text-4xl font-black text-brand-black mb-3 tracking-tight">{t.title}</h1>
          <p className="text-gray-500 mb-10 font-medium text-lg">{t.desc}</p>
          
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder={t.placeholder} 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 bg-brand-cream px-6 py-4 rounded-2xl border-[2px] border-brand-gray focus:border-brand-red outline-none transition-colors text-center sm:text-left text-lg font-mono font-bold placeholder:font-sans placeholder:font-medium text-brand-black" 
              dir="ltr"
            />
            <button 
              type="submit" 
              className="bg-brand-red text-white p-4 sm:px-8 rounded-2xl font-black text-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(211,26,26,0.2)]"
            >
              <Search size={22} /> {t.button}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
