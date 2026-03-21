'use client';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import CartSidebar from '@/components/CartSidebar';

export default function HomePage() {
  const { items, getTotalPrice } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('مختاراتنا 🔥');

  useEffect(() => {
    setMounted(true);
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (e) {
        console.error("Failed to fetch menu", e);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const categories = ['مختاراتنا 🔥', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredData = products.filter((item) => {
    const isAll = selectedCategory === 'مختاراتنا 🔥';
    return isAll || item.category === selectedCategory;
  });

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotalPrice();
  const minOrder = 5; // Theoretical min order

  if (!mounted) return null;

  return (
    <div className="bg-white min-h-screen font-body" dir="rtl">
      <Header onCartOpen={() => setIsSidebarOpen(true)} />
      
      <main className="pt-24 pb-32">
        {/* CATEGORY SEARCH & NAV BAR - MATCHING IMAGE */}
        <div className="sticky top-20 z-40 bg-white border-b border-gray-100 mb-8">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
             {/* HAMBURGER */}
             <button className="flex-shrink-0 text-black p-2">
                <Menu size={24} strokeWidth={2.5} />
             </button>

             {/* SCROLLABLE CATEGORIES */}
             <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-10 py-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-sm font-bold uppercase whitespace-nowrap relative py-2 transition-all
                      ${selectedCategory === cat ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                  >
                    {cat}
                    {selectedCategory === cat && (
                      <motion.div 
                        layoutId="activeUnderline"
                        className="absolute -bottom-[2px] left-0 right-0 h-1 bg-black rounded-full"
                      />
                    )}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* SECTION HEADER */}
        <div className="max-w-7xl mx-auto px-6 mb-10">
           <h2 className="text-3xl font-bold text-black luxury-heading mb-2">{selectedCategory}</h2>
           <p className="text-gray-500 text-sm font-medium">أصناف مميزة وممتازة اخترناها لك بعناية فائقة</p>
        </div>

        {/* MENU GRID - 2 COL MOBILE / 4 COL DESKTOP */}
        <section className="max-w-7xl mx-auto px-6">
          {menuLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => (
                 <div key={i} className="space-y-4 animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-2xl" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                 </div>
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
               <AnimatePresence mode="popLayout">
                {filteredData.map((item, index) => (
                  <MenuItemCard key={item.id} item={item} priority={index < 4} />
                ))}
               </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* MINIMAL BOTTOM CART BAR - MATCHING IMAGE FOOTER */}
      <AnimatePresence>
        {totalPrice > 0 ? (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-6 flex items-center justify-between"
          >
            <div className="flex-1 flex flex-col">
               <span className="text-xs font-bold text-gray-400">سعر الطلب الحالي</span>
               <span className="text-xl font-bold text-black">{totalPrice.toFixed(2)} JOD</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 active:scale-95 transition-all shadow-lg"
            >
              <ShoppingBag size={20} />
              <span>عرض الحقيبة ({cartCount})</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CartSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}