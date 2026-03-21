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
      className="flex flex-col gap-3 group"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F9F7F2] border border-gray-100 shadow-sm">
        <Image 
          src={item.imageUrl || `https://placehold.co/800x600/F9F7F2/000000.png?text=${item.nameAr}`} 
          alt={item.nameEn || item.nameAr}
          fill 
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-700 group-hover:scale-110"
          priority={priority}
          quality={90}
        />
        
        {/* CIRCULAR ADD BUTTON - MATCHING IMAGE EXACTLY */}
        <button 
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-gray-100 group/btn"
        >
          <Plus size={20} className="text-[#E67E22] stroke-[3px]" />
        </button>

        {!isAvailable && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-bold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* TEXT SECTION */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-sm md:text-base font-bold text-black line-clamp-2 leading-snug">
          {item.nameEn || item.nameAr}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500">JOD</span>
          <span className="text-sm font-bold text-black">{item.price.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
}
