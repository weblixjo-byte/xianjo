'use client';
import { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, Camera, Tag, DollarSign, Package, 
  Check, X, ArrowRight, Save, LayoutGrid, AlertCircle, 
  Layers, Search, MoreVertical, ChevronLeft, ArrowLeft,
  Link2, Folder, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, ListOrdered,
  CheckSquare, Square, MoveRight
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
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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
  
  const existingCategories = Array.from(new Set(
    products.flatMap(p => p.category ? p.category.split(',').map((c: string) => c.trim()).filter(Boolean) : [])
  )).sort();

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

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !bulkCategory) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, category: bulkCategory })
      });
      if (res.ok) {
        toast.success(`تمت إضافة ${selectedIds.length} منتجات إلى قسم ${bulkCategory}`);
        setSelectedIds([]);
        setIsBulkMoveModalOpen(false);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
      toast.error('فشل في النقل الجماعي');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.categoryOrder) {
        setCategoryOrder(JSON.parse(data.categoryOrder));
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  const handleSaveOrder = async (newOrder: string[]) => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrder: JSON.stringify(newOrder) })
      });
      if (res.ok) {
        setCategoryOrder(newOrder);
        toast.success('تم حفظ ترتيب الأصناف بنجاح', {
            style: { borderRadius: '20px', background: '#1A1A1A', color: '#fff' }
        });
        setIsReorderModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('فشل في حفظ الترتيب');
    } finally {
      setIsSavingOrder(false);
    }
  };

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
        setFormData({ nameEn: '', nameAr: '', price: '', category: selectedCategory || existingCategories[0] || 'Sushi', imageUrl: '', descriptionAr: '', descriptionEn: '' });
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nameAr.includes(searchQuery) || 
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If a category is selected, filter by it. A product can have multiple categories (csv)
    const matchesCategory = !selectedCategory || selectedCategory === 'الكل' || (p.category && p.category.split(',').map(c => c.trim()).includes(selectedCategory));
    
    return matchesSearch && matchesCategory;
  });

  const getProductCountByCategory = (category: string) => {
    return products.filter(p => p.category && p.category.split(',').map(c => c.trim()).includes(category)).length;
  };

  const stats = {
    total: products.length,
    outOfStock: products.filter(p => !p.isAvailable).length,
    categories: existingCategories.length
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] p-6 lg:p-12 mb-20 font-sans" dir="rtl">
      <Toaster position="bottom-center" />
      <div className="max-w-7xl mx-auto">
        
        <AdminHeader 
          title="إدارة القائمة" 
          subtitle={(selectedCategory && selectedCategory !== 'الكل') ? `قسم: ${selectedCategory}` : "Boutique Inventory Suite • Live Sync"} 
          icon={(selectedCategory && selectedCategory !== 'الكل') ? <Folder size={40} className="text-brand-red" strokeWidth={1} /> : <LayoutGrid size={40} strokeWidth={1.5} />}
          actions={
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <Link href="/admin" className="inline-flex items-center gap-2 text-brand-black/30 hover:text-brand-red transition-colors text-xs font-bold uppercase tracking-widest bg-white h-[68px] px-8 rounded-full border border-brand-gray">
                 <ArrowRight size={14} /> الإدارة
              </Link>
              <button 
                onClick={() => {
                    const cats = Array.from(new Set(products.flatMap(p => p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : []))).sort();
                    // Merge existing order with any new categories
                    const mergedOrder = [...categoryOrder];
                    cats.forEach(c => { if(!mergedOrder.includes(c)) mergedOrder.push(c); });
                    // Remove categories that no longer exist
                    const finalOrder = mergedOrder.filter(c => cats.includes(c));
                    setCategoryOrder(finalOrder);
                    setIsReorderModalOpen(true);
                }}
                className="inline-flex items-center gap-2 text-brand-black/30 hover:text-brand-red transition-colors text-xs font-bold uppercase tracking-widest bg-white h-[68px] px-8 rounded-full border border-brand-gray"
              >
                 <ListOrdered size={14} /> ترتيب الأقسام
              </button>
              <button 
                onClick={() => { setEditingProduct(null); setFormData({ nameEn: '', nameAr: '', price: '', category: selectedCategory === 'الكل' ? (existingCategories[0] || 'Sushi') : (selectedCategory || existingCategories[0] || 'Sushi'), imageUrl: '', descriptionAr: '', descriptionEn: '' }); setIsPanelOpen(true); }}
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

        {/* Stats and Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
               {selectedCategory && (
                 <button 
                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                    className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-brand-gray/50 text-brand-black/40 hover:text-brand-red transition-all shadow-sm group font-bold text-sm"
                 >
                    <ArrowLeft size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span>الرجوع للمجلدات</span>
                 </button>
               )}
               {selectedCategory && (
                 <div className="hidden md:flex items-center gap-4 text-brand-black/20 text-xs font-black uppercase tracking-[0.2em]">
                    <span>القائمة</span>
                    <ChevronRight size={14} className="rotate-180" />
                    <span className="text-brand-red">{selectedCategory}</span>
                 </div>
               )}
            </div>

            {/* Compact Stats Grid */}
            <div className="flex gap-4">
                {[
                    { label: 'الكل', value: stats.total, color: 'text-brand-black' },
                    { label: 'نواقص', value: stats.outOfStock, color: 'text-brand-red' },
                ].map((s) => (
                    <div key={s.label} className="bg-white px-6 py-4 rounded-2xl border border-brand-gray/40 shadow-sm flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-black/20">{s.label}</span>
                        <span className={`text-xl font-black font-serif ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Search & Bulk Selection */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20" />
            <input 
              type="text" 
              placeholder={(selectedCategory && selectedCategory !== 'الكل') ? `البحث في ${selectedCategory}...` : "البحث في جميع المنتجات..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-brand-gray/50 rounded-2xl py-4 pr-14 pl-6 outline-none focus:border-brand-red/30 transition-all font-bold text-sm"
            />
          </div>

          {(selectedCategory || searchQuery) && (
            <button 
              onClick={() => toggleSelectAll(filteredProducts.map(p => p.id))}
              className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-brand-gray/50 text-brand-black/40 hover:text-brand-red transition-all shadow-sm font-bold text-sm"
            >
              {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                <CheckSquare size={18} className="text-brand-red" />
              ) : (
                <Square size={18} />
              )}
              <span>تحديد الكل ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Dynamic Content View */}
        {loading ? (
          <div className="flex justify-center py-40">
             <div className="w-10 h-10 border-2 border-brand-red/10 border-t-brand-red rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedCategory && !searchQuery ? (
                // Category Folders View
                <motion.div 
                    key="categories"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {existingCategories.map((cat, i) => (
                        <motion.button
                            key={cat}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedCategory(cat)}
                            className="bg-white group p-8 rounded-[2.5rem] border border-brand-gray/40 shadow-sm hover:border-brand-red/20 hover:shadow-xl transition-all text-right flex flex-col justify-between h-56 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 text-brand-red/5 -mr-4 -mt-4">
                                <Folder size={120} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 w-14 h-14 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all duration-500">
                                <Folder size={24} strokeWidth={1.5} />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-brand-black mb-1 font-serif group-hover:text-brand-red transition-colors">{cat}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/20">
                                    {getProductCountByCategory(cat)} {getProductCountByCategory(cat) === 1 ? 'صنف' : 'أصناف'}
                                </p>
                            </div>
                        </motion.button>
                    ))}

                    {/* All Products Folder */}
                    <motion.button
                        onClick={() => setSelectedCategory('الكل')}
                        className="bg-brand-black group p-8 rounded-[2.5rem] border border-transparent shadow-xl hover:scale-[1.02] transition-all text-right flex flex-col justify-between h-56 relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 p-8 text-white/5 -mr-4 -mt-4">
                            <Layers size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                            <Layers size={24} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white mb-1 font-serif">جميع الأصناف</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">مشاهدة القائمة كاملة</p>
                        </div>
                    </motion.button>
                </motion.div>
            ) : (
                // Products List View (Categorized or Searched)
                <motion.div 
                    key="products"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
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
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => toggleSelect(product.id)}
                                    className={`bg-white rounded-[2rem] p-4 lg:p-6 border transition-all duration-300 group cursor-pointer
                                    ${selectedIds.includes(product.id) ? 'border-brand-red ring-2 ring-brand-red/5' : 'border-brand-gray/40 shadow-sm hover:border-brand-red/10'}
                                    ${!product.isAvailable ? 'bg-brand-cream/40 blur-[0.3px]' : ''}`}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-4 text-right">
                                        
                                        {/* Selection & Thumbnail */}
                                        <div className="col-span-1 lg:col-span-1 flex justify-center items-center">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border
                                                ${selectedIds.includes(product.id) ? 'bg-brand-red border-brand-red text-white' : 'bg-brand-cream border-brand-gray/50 text-transparent group-hover:border-brand-red/30'}`}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>

                                        {/* Thumbnail & Info */}
                                        <div className="col-span-1 lg:col-span-4 flex items-center gap-6">
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
                                                <div className="lg:hidden mt-2 flex items-center gap-2 flex-wrap">
                                                    <span className="bg-brand-cream px-2 py-0.5 rounded text-[8px] font-black text-brand-black/40 tracking-widest">{product.category ? product.category.split(',').map((c: string) => c.trim()).join(' • ') : 'بدون تصنيف'}</span>
                                                    {!product.isAvailable && <span className="bg-brand-red/10 text-brand-red px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none pt-[1px]">Out of Stock</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden lg:col-span-2 flex justify-center items-center">
                                            <span className="bg-brand-cream border border-brand-gray/40 px-4 py-1.5 rounded-full text-[9px] font-black text-brand-black/30 tracking-[0.15em] text-center">
                                                {product.category ? product.category.split(',').map((c: string) => c.trim()).join(' • ') : 'بدون تصنيف'}
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
                                <h3 className="text-xl font-serif text-brand-black/30">لا توجد أصناف في هذا القسم</h3>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Bulk Action Floating Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
               initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
               className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-brand-black text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center font-black text-lg">
                    {selectedIds.length}
                  </div>
                  <span className="text-xs font-bold opacity-60">منتجات مختارة</span>
               </div>
               <div className="w-px h-8 bg-white/10" />
               <button 
                  onClick={() => setIsBulkMoveModalOpen(true)}
                  className="flex items-center gap-3 text-sm font-black hover:text-brand-red transition-colors group"
               >
                 <MoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
                 <span>إضافة إلى قسم</span>
               </button>
               <button 
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] font-bold opacity-40 hover:opacity-100 transition-opacity"
               >
                 إلغاء
               </button>
            </motion.div>
          )}
        </AnimatePresence>
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
                        <div className="space-y-3 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">
                                تصنيفات المنتج (يمكن اختيار أكثر من واحد)
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                               {existingCategories.map((cat: string) => {
                                  const selectedCats = formData.category.split(',').map((c: string) => c.trim()).filter(Boolean);
                                  const isSelected = selectedCats.includes(cat);
                                  return (
                                     <button 
                                        key={cat} type="button"
                                        onClick={() => {
                                           if (isSelected) {
                                              setFormData({...formData, category: selectedCats.filter(c => c !== cat).join(', ')});
                                           } else {
                                              setFormData({...formData, category: [...selectedCats, cat].join(', ')});
                                           }
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 
                                           ${isSelected ? 'bg-brand-red text-white border-brand-red shadow-md' : 'bg-white text-brand-black/60 border-brand-gray/50 hover:border-brand-black/20 hover:bg-brand-gray/10'}`}
                                     >
                                        {cat}
                                     </button>
                                  );
                               })}
                            </div>

                            <div className="relative flex items-center gap-2">
                               <input 
                                  placeholder="إضافة تصنيفات مخصصة أو تعديلها (مفصولة بفاصلة , )..."
                                  value={formData.category} 
                                  onChange={e => setFormData({...formData, category: e.target.value})}
                                  className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all text-sm"
                                  dir="ltr"
                                />
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
                              <div className="w-full aspect-[4/3] rounded-[2rem] border-2 border-dashed border-brand-gray/50 bg-white flex flex-col items-center justify-center overflow-hidden relative group-hover:border-brand-red/20 transition-all">
                                 {formData.imageUrl ? (
                                   <div className="relative w-full h-full">
                                      <Image 
                                         src={formData.imageUrl} 
                                         alt="Preview" 
                                         fill 
                                         className="object-contain" 
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

      {/* Reorder Categories Modal */}
      <AnimatePresence>
        {isReorderModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-brand-black/40 backdrop-blur-[2px]"
              onClick={() => setIsReorderModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-brand-gray/50"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-brand-red font-serif">ترتيب الأصناف</h2>
                  <button onClick={() => setIsReorderModalOpen(false)} className="bg-[#F9F7F2] p-2 rounded-xl text-brand-black/20 hover:text-brand-red">
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-xs font-bold text-brand-black/40 mb-6 leading-relaxed">اسحب الأصناف للأعلى أو الأسفل لتغيير ترتيب ظهورها في القائمة الرئيسية للعملاء.</p>

                <div className="space-y-3 mb-10 max-h-[400px] overflow-y-auto no-scrollbar">
                  {categoryOrder.map((cat, index) => (
                    <div key={cat} className="flex items-center gap-4 bg-[#F9F7F2] p-4 rounded-2xl border border-brand-gray/40">
                       <span className="w-6 h-6 bg-brand-red/10 text-brand-red text-[10px] font-black flex items-center justify-center rounded-lg">{index + 1}</span>
                       <span className="flex-1 font-bold text-brand-black">{cat}</span>
                       <div className="flex gap-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                               const newOrder = [...categoryOrder];
                               [newOrder[index], newOrder[index-1]] = [newOrder[index-1], newOrder[index]];
                               setCategoryOrder(newOrder);
                            }}
                            className="p-2 bg-white rounded-lg text-brand-black/20 hover:text-brand-red disabled:opacity-20 transition-all shadow-sm"
                          >
                             <ChevronUp size={16} />
                          </button>
                          <button 
                            disabled={index === categoryOrder.length - 1}
                            onClick={() => {
                               const newOrder = [...categoryOrder];
                               [newOrder[index], newOrder[index+1]] = [newOrder[index+1], newOrder[index]];
                               setCategoryOrder(newOrder);
                            }}
                            className="p-2 bg-white rounded-lg text-brand-black/20 hover:text-brand-red disabled:opacity-20 transition-all shadow-sm"
                          >
                             <ChevronDown size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleSaveOrder(categoryOrder)}
                  disabled={isSavingOrder}
                  className="w-full bg-brand-black text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSavingOrder ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>حفظ الترتيب الجديد</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Move Modal */}
      <AnimatePresence>
        {isBulkMoveModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-brand-black/40 backdrop-blur-[2px]"
              onClick={() => setIsBulkMoveModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-brand-gray/50"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-brand-red font-serif">إضافة إلى قسم ({selectedIds.length})</h2>
                  <button onClick={() => setIsBulkMoveModalOpen(false)} className="bg-[#F9F7F2] p-2 rounded-xl text-brand-black/20 hover:text-brand-red">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">اختر القسم المستهدف</label>
                      <div className="flex flex-wrap gap-2">
                         {existingCategories.map(cat => (
                            <button 
                              key={cat}
                              onClick={() => setBulkCategory(cat)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 
                                ${bulkCategory === cat ? 'bg-brand-red text-white border-brand-red shadow-md' : 'bg-brand-cream text-brand-black/60 border-transparent hover:border-brand-gray'}`}
                            >
                              {cat}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">أو اكتب اسماً جديداً</label>
                      <input 
                        placeholder="اسم القسم الجديد..."
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="w-full bg-[#F9F7F2] border border-brand-gray/50 rounded-2xl p-4 outline-none focus:border-brand-red/30 font-bold transition-all text-sm"
                      />
                   </div>

                   <button 
                      onClick={handleBulkUpdate}
                      disabled={isBulkUpdating || !bulkCategory}
                      className="w-full bg-brand-black text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                   >
                      {isBulkUpdating ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>تطبيق الإضافة الجماعية</span>
                        </>
                      )}
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
