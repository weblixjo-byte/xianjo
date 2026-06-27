'use client';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MenuItemCard, { Product } from '@/components/MenuItemCard';
import CartSidebar from '@/components/CartSidebar';
import { useLanguage } from '@/store/useLanguage';

export default function HomeClient({ 
  initialData = [], 
  initialSettings = null 
}: { 
  initialData?: Product[], 
  initialSettings?: { categoryOrder?: string } | null 
}) {
  const { language } = useLanguage();
  const { items, getTotalPrice } = useCart();
  const products = initialData;
  const categoryOrder = (() => {
    if (initialSettings?.categoryOrder) {
      try {
        const parsed = JSON.parse(initialSettings.categoryOrder);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en');
  const menuLoading = false; 
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate categories from CURRENT products and categoryOrder
  const allCategoriesSet = new Set<string>();
  products.forEach(p => {
    if (p.category) {
      p.category.split(',').forEach((c: string) => {
        const trimmed = c.trim();
        if (trimmed) allCategoriesSet.add(trimmed);
      });
    }
  });

  const categories = Array.from(allCategoriesSet).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const activeCategory = selectedCategory || categories[0] || '';

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setActiveLanguage(language);
    }, 0);
    return () => clearTimeout(timer);
  }, [language]);

  // Swipe hint effect is replaced with permanent side animation chevron arrow

  // Scroll active category into view smoothly
  useEffect(() => {
    if (activeCategory) {
      const el = document.getElementById(`cat-${activeCategory}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  const filteredData = products.filter((item) => {
    return (item.category && activeCategory)
      ? item.category.split(',').map((c: string) => c.trim()).includes(activeCategory)
      : false;
  });

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotalPrice();

  return (
    <div className="bg-white min-h-screen font-body" dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <Header onCartOpen={() => setIsSidebarOpen(true)} />
      
      <div className="pt-24 pb-32">
        <div className="sticky top-20 z-40 bg-white border-b border-gray-100 mb-8 pt-4">
          {/* Categories bar stretching from edge to edge (Full Screen Width) */}
          <div className="relative w-full overflow-hidden">
             {/* Small animated red arrow next to categories scroll edge indicating movement without text */}
             {mounted && (
               <motion.div
                 animate={{
                   x: language === 'ar' ? [4, -2, 4] : [-4, 2, -4]
                 }}
                 transition={{
                   duration: 1.5,
                   repeat: Infinity,
                   ease: "easeInOut"
                 }}
                 className={`absolute top-1/2 -translate-y-1/2 z-30 text-brand-red flex items-center justify-center pointer-events-none
                   ${language === 'ar' ? 'right-2' : 'left-2'}`}
               >
                  {language === 'ar' ? (
                    <ChevronLeft size={22} strokeWidth={4.5} />
                  ) : (
                    <ChevronRight size={22} strokeWidth={4.5} />
                  )}
               </motion.div>
             )}

             <div 
               ref={scrollContainerRef}
               className="overflow-x-auto no-scrollbar flex items-center py-4 px-8 scroll-smooth"
             >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    id={`cat-${cat}`}
                    onClick={() => {
                      setSelectedCategory(cat || '');
                    }}
                    className={`text-sm font-bold uppercase whitespace-nowrap relative py-2 mx-6 flex-shrink-0 transition-all
                      ${activeCategory === cat ? 'text-brand-red font-extrabold scale-105' : 'text-gray-800 hover:text-brand-red'}`}
                  >
                    {cat}
                    {activeCategory === cat && (
                      <motion.div 
                        layoutId="activeUnderline"
                        className="absolute -bottom-[2px] left-0 right-0 h-1 bg-brand-red rounded-full"
                      />
                    )}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
           <h2 className="text-3xl font-bold text-black luxury-heading mb-2">{activeCategory}</h2>
           <p className="text-gray-500 text-sm font-medium">
             {activeLanguage === 'ar' ? 'أطباق مختارة بعناية خصيصاً لك' : 'Carefully selected premium dishes just for you'}
           </p>
        </div>

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
      </div>

      <AnimatePresence>
        {mounted && totalPrice > 0 && !isSidebarOpen ? (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-6 flex items-center justify-between"
          >
            <div className={`flex-1 flex flex-col ${activeLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
               <span className="text-xs font-bold text-gray-400">
                 {activeLanguage === 'ar' ? 'إجمالي الطلب' : 'Current Order Total'}
               </span>
               <span className="text-xl font-bold text-black">{totalPrice.toFixed(2)} {activeLanguage === 'ar' ? 'د.أ' : 'JOD'}</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 active:scale-95 transition-all shadow-lg"
            >
              <ShoppingCart size={20} />
              <span>{activeLanguage === 'ar' ? `عرض السلة (${cartCount})` : `View Cart (${cartCount})`}</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CartSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
