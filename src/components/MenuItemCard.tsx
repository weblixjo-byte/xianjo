'use client';
import { useCart } from '@/store/useCart';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/store/useLanguage';
import toast from 'react-hot-toast';

export interface Product {
  id: number | string;
  nameEn?: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  isAvailable: boolean;
}

export default function MenuItemCard({ item, priority = false }: { item: Product; priority?: boolean }) {
  const { language } = useLanguage();
  const { addItem } = useCart();
  const isAvailable = item.isAvailable;

  const handleAddToCart = () => {
    addItem({ 
      id: item.id.toString(), 
      name: language === 'ar' ? item.nameAr : (item.nameEn || item.nameAr), 
      price: item.price, 
      imageUrl: item.imageUrl || undefined 
    });
    const msg = language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart';
    toast.success(`${item.nameEn || item.nameAr} ${msg}`, {
      style: {
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: 'Almarai, sans-serif'
      }
    });
  };

  return (
    <motion.div 
      initial={priority ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col gap-4 group h-full"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border border-gray-100/50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:border-brand-red/10 flex items-center justify-center">
        <Image 
          src={item.imageUrl || `https://placehold.co/800x600/FFFFFF/1A1A1A.png?text=${item.nameAr}`} 
          alt={`${item.nameEn || item.nameAr} - Xian Restaurant (مطعم شيان) - Asian Food Jordan`}
          fill 
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain transition-all duration-1000 group-hover:scale-105"
          priority={priority}
          quality={60}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        />
        
        {/* CIRCULAR ADD BUTTON - ELEVATED DESIGN */}
        <button 
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          className={`absolute bottom-4 ${language === 'ar' ? 'left-4' : 'right-4'} w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border border-white/50 group/btn z-10 hover:bg-brand-red hover:text-white`}
        >
          <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300" />
        </button>

        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-brand-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              {language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}
            </span>
          </div>
        )}
      </div>

      {/* TEXT SECTION - FIXED ALIGNMENT */}
      <div className={`flex flex-col gap-2 flex-1 px-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <div className="min-h-[2.5rem] flex flex-col justify-center">
            <h3 className="text-sm md:text-base font-black !text-black line-clamp-2 leading-tight uppercase tracking-tight">
              {language === 'ar' ? item.nameAr : (item.nameEn || item.nameAr)}
            </h3>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-[10px] font-black text-brand-black/20 uppercase tracking-widest">{language === 'ar' ? 'د.أ' : 'JOD'}</span>
          <span className="text-lg font-black text-brand-red font-serif">{item.price.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
}
