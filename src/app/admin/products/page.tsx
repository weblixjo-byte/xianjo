'use client';
import { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, Camera, Tag, DollarSign, Package, 
  Check, X, ArrowRight, Save, LayoutGrid, AlertCircle, 
  Layers, Search, MoreVertical, ChevronLeft, ArrowLeft,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';

interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  descriptionAr?: string;
  descriptionEn?: string;
}

export default function ProductsDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    price: '',
    category: 'Sushi',
    imageUrl: '',
    descriptionAr: '',
    descriptionEn: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { ...p, isAvailable: !currentStatus } : p));
        toast.success(currentStatus ? 'تم إخفاء المنتج' : 'المنتج متوفر الآن', {
            style: { borderRadius: '20px', background: '#1A1A1A', color: '#fff' }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        toast.success('تم حذف المنتج بنجاح');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PATCH' : 'POST';
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsPanelOpen(false);
        setEditingProduct(null);
        setFormData({ nameEn: '', nameAr: '', price: '', category: 'Sushi', imageUrl: '', descriptionAr: '', descriptionEn: '' });
        fetchProducts();
        toast.success(editingProduct ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح', {
            style: { borderRadius: '20px', background: '#922724', color: '#fff' }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditPanel = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl || '',
      descriptionAr: product.descriptionAr || '',
      descriptionEn: product.descriptionEn || ''
    });
    setIsPanelOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.nameAr.includes(searchQuery) || 
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: products.length,
    outOfStock: products.filter(p => !p.isAvailable).length,
    categories: new Set(products.map(p => p.category)).size
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] p-6 lg:p-12 mb-20 font-sans" dir="rtl">
      <Toaster position="bottom-center" />
      <div className="max-w-7xl mx-auto">
        
        <AdminHeader 
          title="إدارة قائمة الطعام" 
          subtitle="Boutique Inventory Suite • Live Sync" 
          icon={<LayoutGrid size={40} strokeWidth={1.5} />}
          actions={
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <Link href="/admin" className="inline-flex items-center gap-2 text-brand-black/30 hover:text-brand-red transition-colors text-xs font-bold uppercase tracking-widest bg-white h-[68px] px-8 rounded-full border border-brand-gray">
                 <ArrowRight size={14} /> الإدارة
              </Link>
              <button 
                onClick={() => { setEditingProduct(null); setFormData({ nameEn: '', nameAr: '', price: '', category: 'Sushi', imageUrl: '', descriptionAr: '', descriptionEn: '' }); setIsPanelOpen(true); }}
                className="bg-[#1A1A1A] text-white px-8 py-5 rounded-full font-black flex items-center gap-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group w-full md:w-auto justify-center"
              >
                <div className="bg-white/10 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Plus size={18} />
                </div>
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'إجمالي المنتجات', value: stats.total, icon: Layers, color: 'text-brand-black' },
            { label: 'غير متوفر حالياً', value: stats.outOfStock, icon: AlertCircle, color: 'text-brand-red' },
            { label: 'تصنيفات نشطة', value: stats.categories, icon: LayoutGrid, color: 'text-brand-black' },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              key={stat.label} 
              className="bg-white p-8 rounded-[2.5rem] border border-brand-gray/40 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-black/30 mb-2">{stat.label}</p>
                <p className={`text-4xl font-black font-serif ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="bg-[#F9F7F2] p-4 rounded-3xl">
                <stat.icon size={26} className={stat.color} strokeWidth={1.5} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-10 max-w-md">
          <Search size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20" />
          <input 
            type="text" 
            placeholder="البحث عن منتج بالاسم..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-brand-gray/50 rounded-2xl py-4 pr-14 pl-6 outline-none focus:border-brand-red/30 transition-all font-bold text-sm"
          />
        </div>

        {/* Modern List/Card Hybrid */}
        {loading ? (
          <div className="flex justify-center py-40">
             <div className="w-10 h-10 border-2 border-brand-red/10 border-t-brand-red rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="hidden lg:grid grid-cols-12 px-10 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-brand-black/20">
                <div className="col-span-5">المنتج والتصنيف</div>
                <div className="col-span-2 text-center">السعر</div>
                <div className="col-span-3 text-center">الحالة</div>
                <div className="col-span-2 text-left">الإجراءات</div>
             </div>

             <div className="space-y-4">
               <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layoutId={product.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`bg-white rounded-[2rem] p-4 lg:p-6 border border-brand-gray/40 shadow-sm transition-all duration-300 hover:border-brand-red/10 group
                      ${!product.isAvailable ? 'bg-brand-cream/40 px-6 blur-[0.3px]' : ''}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-4 text-right lg:text-right">
                      
                      {/* Thumbnail & Info */}
                      <div className="col-span-1 lg:col-span-5 flex items-center gap-6">
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-brand-gray/50 shadow-inner bg-[#F9F7F2]">
                          <Image 
                            src={product.imageUrl || 'https://placehold.co/100x100/F9F7F2/1A1A1A.png?text=Xian'} 
                            alt={product.nameAr}
                            fill
                            className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!product.isAvailable ? 'grayscale opacity-60' : ''}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-brand-black mb-1 group-hover:text-brand-red transition-colors">{product.nameAr}</h4>
                          <p className="text-[10px] font-bold text-brand-black/20 uppercase tracking-widest">{product.nameEn}</p>
                          <div className="lg:hidden mt-2 flex items-center gap-2">
                             <span className="bg-brand-cream px-2 py-0.5 rounded text-[8px] font-black text-brand-black/40 uppercase tracking-widest">{product.category}</span>
                             {!product.isAvailable && <span className="bg-brand-red/10 text-brand-red px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none pt-[1px]">Out of Stock</span>}
                          </div>
                        </div>
                      </div>

                      {/* Category - Hidden on mobile, grouped above */}
                      <div className="hidden lg:col-span-2 flex justify-center items-center">
                         <span className="bg-brand-cream border border-brand-gray/40 px-4 py-1.5 rounded-full text-[9px] font-black text-brand-black/30 uppercase tracking-[0.15em]">
                           {product.category}
                         </span>
                      </div>

                      {/* Price */}
                      <div className="col-span-1 lg:col-span-2 text-right lg:text-center">
                        <div className="text-xl font-black text-brand-red font-serif">
                          {product.price.toFixed(2)} <span className="text-[9px] text-brand-black/20 font-sans tracking-normal uppercase">JOD</span>
                        </div>
                      </div>

                      {/* Availability Toggle */}
                      <div className="col-span-1 lg:col-span-3 flex lg:justify-center items-center gap-4">
                         {/* Sleek Toggle Switch */}
                         <button 
                            onClick={() => handleToggleAvailability(product.id, product.isAvailable)}
                            className="flex items-center gap-4 group/toggle cursor-pointer bg-transparent border-none p-0 outline-none"
                         >
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors
                               ${product.isAvailable ? 'text-green-600' : 'text-brand-black/20'}`}>
                               {product.isAvailable ? 'نشط' : 'معطل'}
                            </span>
                            <div className={`w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1
                               ${product.isAvailable ? 'bg-green-600' : 'bg-brand-black/10'}`}>
                               <motion.div 
                                  layout
                                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  initial={false}
                                  animate={{ x: product.isAvailable ? 23 : 0 }}
                               />
                            </div>
                         </button>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 lg:col-span-2 flex justify-start lg:justify-end items-center gap-1 border-t lg:border-none pt-6 lg:pt-0">
                         <button 
                            onClick={() => openEditPanel(product)}
                            className="p-3 text-brand-black/20 hover:text-brand-red transition-all"
                         >
                            <Edit2 size={18} strokeWidth={1.5} />
                         </button>
                         <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-3 text-brand-black/20 hover:text-brand-red transition-all"
                         >
                            <Trash2 size={18} strokeWidth={1.5} />
                         </button>
                         <button className="p-3 text-brand-black/10 hidden lg:block">
                            <MoreVertical size={18} strokeWidth={1.5} />
                         </button>
                      </div>

                    </div>
                  </motion.div>
                ))}
               </AnimatePresence>
               
               {filteredProducts.length === 0 && (
                 <div className="py-32 text-center bg-white rounded-[3rem] border border-brand-gray/40">
                    <Package size={60} className="mx-auto text-brand-black/10 mb-6" strokeWidth={1} />
                    <h3 className="text-xl font-serif text-brand-black/30">لم يتم العثور على منتجات</h3>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* Slide-over Panel (Add/Edit) */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-brand-black/40 backdrop-blur-[2px]"
              onClick={() => setIsPanelOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1 }}
              className="fixed top-0 bottom-0 left-0 lg:left-auto lg:right-0 z-[60] w-full lg:w-[480px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] border-r border-brand-gray/40 flex flex-col"
            >
              <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-12">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-brand-red font-serif">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-black/30">Inventory Management Drawer</p>
                   </div>
                   <button onClick={() => setIsPanelOpen(false)} className="bg-[#F9F7F2] p-3 rounded-2xl text-brand-black/30 hover:text-brand-red transition-all">
                      <ChevronLeft size={20} />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                   <div className="space-y-8">
                     {/* Basic Info */}
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">الاسم (عربي)</label>
                           <input 
                              required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})}
                              className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">Name (English)</label>
                           <input 
                              required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})}
                              className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all"
                              dir="ltr"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3 relative">
                           <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">السعر (JOD)</label>
                           <div className="relative">
                              <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/20" />
                              <input 
                                 required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                                 className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 pl-10 outline-none focus:border-brand-red/30 font-bold transition-all"
                              />
                           </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">التصنيف</label>
                            <div className="relative">
                               <select 
                                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                                  className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all appearance-none"
                               >
                                  <option>Sushi</option>
                                  <option>Signature</option>
                                  <option>Noodles</option>
                                  <option>Vegetarian</option>
                                  <option>Drinks</option>
                               </select>
                               <Layers size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/20 pointer-events-none" />
                            </div>
                         </div>
                      </div>
 
                      {/* Image URL with Live Preview */}
                      <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">رابط صورة المنتج (Live Preview)</label>
                        <div className="space-y-4">
                           <input 
                              placeholder="أدخل رابط الصورة هنا..." 
                              value={formData.imageUrl} 
                              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                              className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all text-sm"
                              dir="ltr"
                           />
                           
                           {/* Elegant Preview Box */}
                           <div className="relative group">
                              <div className="w-full h-48 rounded-[2rem] border-2 border-dashed border-brand-gray/50 bg-[#F9F7F2] flex flex-col items-center justify-center overflow-hidden relative group-hover:border-brand-red/20 transition-all">
                                 {formData.imageUrl ? (
                                   <div className="relative w-full h-full">
                                      <Image 
                                         src={formData.imageUrl} 
                                         alt="Preview" 
                                         fill 
                                         className="object-cover" 
                                         onError={(e) => {
                                           (e.target as any).src = 'https://placehold.co/400x400/F9F7F2/922724.png?text=رابط+غير+صالح';
                                         }}
                                      />
                                      <div className="absolute inset-0 bg-brand-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <Link2 size={32} className="text-white" />
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="flex flex-col items-center gap-3 text-brand-black/20">
                                      <Camera size={32} strokeWidth={1.5} />
                                     <p className="text-[10px] font-black uppercase tracking-widest">معاينة الصورة ستظهر هنا</p>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>
 
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">وصف الطبق (اختياري)</label>
                         <textarea 
                            rows={3} value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})}
                            className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all resize-none"
                         />
                      </div>
                   </div>
 
                   <div className="pt-10 border-t border-brand-gray/40">
                      <button className="w-full bg-[#1A1A1A] text-white py-6 rounded-3xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group">
                         <Save size={20} className="group-hover:rotate-12 transition-transform" />
                         <span>{editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج للقائمة'}</span>
                      </button>
                      <button 
                        type="button" onClick={() => setIsPanelOpen(false)}
                        className="w-full mt-4 text-brand-black/20 font-bold text-[10px] uppercase tracking-widest hover:text-brand-black transition-colors"
                      >
                        إلغاء وإغلاق
                      </button>
                   </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
