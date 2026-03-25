'use client';
import { motion } from 'framer-motion';
import { X, DollarSign, Camera, Save } from 'lucide-react';
import { Product } from '@/types/admin';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  productFormData: {
    nameEn: string;
    nameAr: string;
    price: string;
    category: string;
    imageUrl: string;
    descriptionAr: string;
    descriptionEn: string;
  };
  setProductFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  products: Product[];
}

export default function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  productFormData,
  setProductFormData,
  onSubmit,
  products
}: ProductFormModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(products.flatMap(p => p.category ? p.category.split(',').map((c: string) => c.trim()).filter(Boolean) : []))).sort();

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col">
        <div className="p-8 border-b border-brand-gray flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-brand-black">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
            <p className="text-[10px] font-black uppercase text-brand-black/20 tracking-widest mt-1">{editingProduct ? 'تحديث الصنف الحالي' : 'إنشاء صنف جديد'}</p>
          </div>
          <button onClick={onClose} className="p-4 bg-brand-gray/50 rounded-2xl text-brand-black/40 hover:text-brand-red transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">اسم المنتج (عربي)</label>
            <input type="text" value={productFormData.nameAr} onChange={e => setProductFormData({ ...productFormData, nameAr: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" required />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">اسم المنتج (International Name)</label>
            <input type="text" value={productFormData.nameEn} onChange={e => setProductFormData({ ...productFormData, nameEn: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">السعر (د.أ)</label>
              <div className="relative">
                <DollarSign size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" />
                <input type="number" step="0.01" value={productFormData.price} onChange={e => setProductFormData({ ...productFormData, price: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 pr-12 outline-none font-black text-lg transition-all" required />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">القسم</label>
              <select value={productFormData.category} onChange={e => setProductFormData({ ...productFormData, category: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-sm appearance-none cursor-pointer transition-all">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="NEW">+ إضافة قسم جديد...</option>
              </select>
            </div>
          </div>
          {productFormData.category === 'NEW' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-red px-2">اسم القسم الجديد</label>
              <input type="text" placeholder="مثال: مشروبات" onChange={e => setProductFormData({ ...productFormData, category: e.target.value })} className="w-full bg-brand-red/5 border-2 border-brand-red/20 focus:border-brand-red/40 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" required />
            </div>
          )}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">وصف المنتج (اختياري)</label>
            <textarea value={productFormData.descriptionAr} onChange={e => setProductFormData({ ...productFormData, descriptionAr: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-bold text-sm min-h-[120px] resize-none transition-all" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">رابط الصورة (URL)</label>
            <div className="relative">
              <Camera size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" />
              <input type="text" value={productFormData.imageUrl} onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 pr-12 outline-none font-bold text-sm transition-all" />
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-brand-gray bg-gray-50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 bg-white border-2 border-brand-gray p-5 rounded-3xl font-black text-brand-black/40 hover:bg-brand-gray transition-all">إلغاء</button>
          <button onClick={onSubmit} className="flex-[2] bg-brand-black text-white p-5 rounded-3xl font-black shadow-xl shadow-brand-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Save size={20} />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
