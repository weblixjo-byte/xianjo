'use client';
import { useCart } from '@/store/useCart';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
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
  const { addItem } = useCart();
  const isAvailable = item.isAvailable;

  const handleAddToCart = () => {
    addItem({ 
      id: item.id.toString(), 
      name: item.nameAr, 
      price: item.price, 
      imageUrl: item.imageUrl || undefined 
    });
    toast.success(`${item.nameEn || item.nameAr} added to cart`, {
      style: {
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: 'Almarai, sans-serif'
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col gap-4 group h-full"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-[#F9F7F2] border border-gray-100/50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:border-brand-red/10 flex items-center justify-center">
        <Image 
          src={item.imageUrl || `https://placehold.co/800x600/F9F7F2/1A1A1A.png?text=${item.nameAr}`} 
          alt={item.nameEn || item.nameAr}
          fill 
          sizes="(max-width: 640px) 100vw, (max-width: 1014px) 50vw, 300px"
          className="object-contain transition-all duration-1000 group-hover:scale-105"
          priority={priority}
          quality={100}
        />
        
        {/* CIRCULAR ADD BUTTON - ELEVATED DESIGN */}
        <button 
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border border-white/50 group/btn z-10 hover:bg-brand-red hover:text-white"
        >
          <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300" />
        </button>

        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-brand-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Sold Out</span>
          </div>
        )}
      </div>

      {/* TEXT SECTION - FIXED ALIGNMENT */}
      <div className="flex flex-col gap-2 flex-1 px-1">
        <div className="min-h-[2.5rem] flex flex-col justify-center">
            <h3 className="text-sm md:text-base font-black text-brand-black line-clamp-2 leading-tight uppercase tracking-tight">
              {item.nameEn || item.nameAr}
            </h3>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-[10px] font-black text-brand-black/20 uppercase tracking-widest">JOD</span>
          <span className="text-lg font-black text-brand-red font-serif">{item.price.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
}
