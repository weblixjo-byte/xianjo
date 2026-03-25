'use client';
import { motion } from 'framer-motion';
import { Plus, ListOrdered, Search, Folder, CheckSquare, Check, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/admin';

interface ProductsTabProps {
  products: Product[];
  loading: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  productSearchQuery: string;
  setProductSearchQuery: (query: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleProduct: (id: string, current: boolean) => void;
  onReorder: () => void;
  sortedCategories: string[];
}

export default function ProductsTab({
  products,
  loading,
  selectedCategory,
  setSelectedCategory,
  productSearchQuery,
  setProductSearchQuery,
  selectedIds,
  setSelectedIds,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProduct,
  onReorder,
  sortedCategories
}: ProductsTabProps) {
  const filteredProducts = products.filter(p => 
    (p.nameAr.includes(productSearchQuery) || p.nameEn.toLowerCase().includes(productSearchQuery.toLowerCase())) && 
    (!selectedCategory || selectedCategory === 'الكل' || p.category.includes(selectedCategory))
  );

  const handleSelectAll = () => {
    const ids = filteredProducts.map(p => p.id);
    if (selectedIds.length === ids.length) setSelectedIds([]);
    else setSelectedIds(ids);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          {selectedCategory && (
            <button
              onClick={() => { setSelectedCategory(null); setProductSearchQuery(''); }}
              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-brand-gray/50 text-brand-black/40 hover:text-brand-red transition-all shadow-sm group font-bold text-sm"
            >
              <ArrowLeft size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span>الرجوع للمجلدات</span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <button
              onClick={onReorder}
              className="flex-1 md:flex-none bg-white border-2 border-brand-gray text-brand-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gray transition-all shadow-sm"
            >
              <ListOrdered size={20} />
              <span className="text-xs">ترتيب الأقسام</span>
            </button>
            <button
              onClick={onAddProduct}
              className="flex-1 md:flex-none bg-brand-black text-white px-10 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="text-xs">إضافة منتج</span>
            </button>
          </div>
        </div>
        <div className="bg-white px-8 py-5 rounded-[2rem] border border-brand-gray/40 shadow-sm flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-black/20">إجمالي الأصناف</span>
            <span className="text-2xl font-black font-serif text-brand-black leading-none mt-1">{products.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors" />
          <input
            type="text"
            placeholder="البحث في القسم..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-brand-gray/40 rounded-[2rem] py-5 pr-14 pl-8 outline-none focus:border-brand-red/20 transition-all font-bold text-sm shadow-sm"
          />
        </div>
        {(selectedCategory || productSearchQuery) && (
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-3 bg-brand-black text-white px-8 py-5 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-black text-xs"
          >
            <CheckSquare size={18} />
            <span>تحديد الكل ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {!selectedCategory && !productSearchQuery ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedCategories.map((cat: string) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className="group relative h-64 bg-white rounded-[3rem] p-10 border-2 border-brand-gray/30 shadow-sm hover:border-brand-red/20 hover:shadow-2xl transition-all text-right flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 text-brand-red/5 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-0"><Folder size={180} strokeWidth={1} /></div>
                  <div className="relative z-10 w-16 h-16 bg-brand-cream rounded-[1.5rem] flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all duration-500 shadow-inner"><Folder size={28} /></div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-brand-black mb-1 font-serif group-hover:text-brand-red transition-colors">{cat}</h3>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-black/20">{products.filter(p => p.category.includes(cat)).length} أصناف</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProducts.map(product => (
                <div key={product.id} className={`group bg-white rounded-[2.5rem] p-6 lg:p-8 border-2 transition-all duration-500 cursor-pointer flex flex-col lg:flex-row gap-8 items-center ${selectedIds.includes(product.id) ? 'border-brand-red ring-8 ring-brand-red/5 shadow-2xl scale-[1.01]' : 'border-brand-gray hover:border-brand-red/20 shadow-sm'}`} onClick={() => handleSelectOne(product.id)}>
                  <div className="flex items-center gap-8 flex-1">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2 flex-shrink-0 ${selectedIds.includes(product.id) ? 'bg-brand-red border-brand-red text-white' : 'bg-brand-cream border-brand-gray/50 text-transparent'}`}><Check size={18} strokeWidth={4} /></div>
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-[2rem] overflow-hidden border-2 border-brand-gray/50 shadow-inner bg-brand-cream ring-4 ring-white">
                      {product.imageUrl && <Image src={product.imageUrl} fill className="object-cover" alt={product.nameAr} />}
                    </div>
                    <div>
                      <h4 className="font-black text-2xl text-brand-black mb-1">{product.nameAr}</h4>
                      <p className="text-[11px] font-bold text-brand-black/20 uppercase tracking-[0.2em]">{product.nameEn}</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-brand-red font-serif tracking-tighter">{product.price.toFixed(2)} <span className="text-[10px] text-brand-black/20 uppercase">د.أ</span></div>
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); onToggleProduct(product.id, product.isAvailable); }} className={`flex items-center gap-5 p-2 rounded-full transition-colors ${product.isAvailable ? 'text-green-600' : 'text-gray-300'}`}>
                      <span className="text-[11px] font-black uppercase tracking-widest">{product.isAvailable ? 'نشط' : 'معطل'}</span>
                      <div className={`w-14 h-7 rounded-full relative transition-all duration-500 flex items-center px-1 ${product.isAvailable ? 'bg-green-600' : 'bg-gray-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-xl transition-all ${product.isAvailable ? 'translate-x-7' : ''}`} /></div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEditProduct(product); }} className="p-4 bg-brand-cream text-brand-black/30 hover:text-brand-red hover:bg-white rounded-2xl transition-all shadow-sm"><Edit2 size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }} className="p-4 bg-brand-cream text-brand-black/30 hover:text-brand-red hover:bg-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
