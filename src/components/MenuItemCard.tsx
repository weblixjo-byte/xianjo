'use client';
import { useCart } from '@/store/useCart';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/store/useLanguage';
import toast from 'react-hot-toast';
import { BRANDING } from '@/constants/branding';
import { useState } from 'react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        background: BRANDING.colors.secondary,
        color: BRANDING.colors.accent,
        fontFamily: 'Almarai, sans-serif'
      }
    });
  };

  return (
    <>
      <motion.div 
        initial={priority ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col gap-4 group h-full cursor-pointer"
      >
        {/* IMAGE CONTAINER */}
        <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border border-gray-100/50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:border-brand-red/10 flex items-center justify-center">
          <Image 
            src={(item.imageUrl && item.imageUrl !== 'no') ? item.imageUrl : '/OG-IMG.png'} 
            alt={`${item.nameEn || ''} ${item.nameAr || ''} - ${BRANDING.nameEn}, Amman Chinese Food & Sushi`.trim()}
            fill 
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-all duration-1000 group-hover:scale-105"
            priority={priority}
            quality={60}
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

      {/* DETAILED MODAL POPUP */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-50 p-3 bg-white/90 backdrop-blur-md rounded-full border border-gray-100 text-brand-black hover:text-brand-red hover:bg-white shadow-md active:scale-95 transition-all`}
              >
                <X size={20} />
              </button>

              {/* Dish Image */}
              <div className="relative w-full aspect-[16/10] bg-brand-cream overflow-hidden border-b border-gray-100 flex items-center justify-center">
                <Image 
                  src={(item.imageUrl && item.imageUrl !== 'no') ? item.imageUrl : '/OG-IMG.png'} 
                  alt={language === 'ar' ? item.nameAr : (item.nameEn || item.nameAr)}
                  fill 
                  className="object-contain p-6"
                  quality={80}
                />
              </div>

              {/* Dish Details */}
              <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/30">
                    {item.category}
                  </span>
                  <div className="flex justify-between items-start gap-4 mt-2">
                    <h3 className="text-xl md:text-2xl font-black text-brand-black leading-tight uppercase tracking-tight">
                      {language === 'ar' ? item.nameAr : (item.nameEn || item.nameAr)}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 bg-brand-cream px-4 py-2 rounded-2xl border border-brand-gray/30">
                      <span className="text-[9px] font-black text-brand-black/30 uppercase tracking-wider">
                        {language === 'ar' ? 'د.أ' : 'JOD'}
                      </span>
                      <span className="text-lg font-black text-brand-red font-serif">
                        {item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Block */}
                {((language === 'ar' ? item.descriptionAr : item.descriptionEn) || (language === 'ar' ? item.descriptionEn : item.descriptionAr)) && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-black/20">
                      {language === 'ar' ? 'التفاصيل والمكونات' : 'Details & Ingredients'}
                    </h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      {language === 'ar' ? item.descriptionAr : (item.descriptionEn || item.descriptionAr)}
                    </p>
                  </div>
                )}
              </div>

              {/* Add to Cart Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button 
                  disabled={!isAvailable}
                  onClick={() => {
                    handleAddToCart();
                    setIsModalOpen(false);
                  }}
                  className="w-full bg-brand-black text-white py-5 rounded-2xl font-black shadow-xl hover:bg-brand-red active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:scale-100"
                >
                  <ShoppingCart size={20} />
                  <span>{language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

