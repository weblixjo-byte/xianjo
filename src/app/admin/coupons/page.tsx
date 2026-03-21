'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Ticket, Plus, Trash2, Power, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Coupon = {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
};

export default function CouponsDashboard() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Coupon Form
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data);
    } catch {
      toast.error('فشل جلب الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;
    
    const toastId = toast.loading('جاري إضافة الكوبون...');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discountPercent: parseInt(discount) })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`تم إنشاء الكوبون بنجاح`, { id: toastId });
        setCoupons([data, ...coupons]);
        setCode('');
        setDiscount('');
      } else {
        toast.error(data.error || 'فشل إنشاء الكوبون', { id: toastId });
      }
    } catch {
      toast.error('حدث خطأ غير متوقع', { id: toastId });
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const loadingToast = toast.loading('جاري التحديث...');
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        toast.success(!currentStatus ? 'تم تفعيل الكوبون' : 'تم تعطيل الكوبون', { id: loadingToast });
      }
    } catch {
      toast.error('فشل التحديث', { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا الكوبون نهائياً؟')) return;
    
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        toast.success('تم الحذف بنجاح', { id: loadingToast });
      }
    } catch {
      toast.error('فشل الحذف', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] p-6 lg:p-12 mb-20" dir="rtl">
      <Toaster position="bottom-center" />
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-brand-gray/30">
          <div className="flex items-center gap-4">
             <div className="bg-brand-red text-white p-4 rounded-3xl">
                <Ticket size={32} />
             </div>
             <div>
               <h1 className="text-3xl font-black text-brand-black">إدارة الكوبونات</h1>
               <p className="text-brand-black/50 font-bold mt-1">إنشاء وتعديل أكواد الخصم الديناميكية المتكررة</p>
             </div>
          </div>
          <Link href="/admin" className="text-brand-black/50 hover:text-brand-red flex items-center gap-2 font-black transition-colors px-6 py-3 rounded-full hover:bg-red-50">
             <ArrowRight size={20} />
             <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Create Form */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-gray/30">
           <h2 className="text-xl font-black mb-6">إضافة كوبون جديد</h2>
           <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
             <input 
               type="text" 
               placeholder="رمز الكوبون (مثال: WINTER20)" 
               value={code} 
               onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
               className="flex-1 bg-gray-50 border border-brand-gray/50 focus:border-brand-red rounded-2xl px-6 py-4 font-black text-xl md:text-right uppercase tracking-wider outline-none transition-all"
               required
             />
             <div className="flex items-center gap-4 flex-1">
               <input 
                 type="number" 
                 placeholder="نسبة الخصم %" 
                 min="1" max="100"
                 value={discount} 
                 onChange={e => setDiscount(e.target.value)}
                 className="flex-1 bg-gray-50 border border-brand-gray/50 focus:border-brand-red rounded-2xl px-6 py-4 font-black text-xl outline-none transition-all"
                 required
               />
               <button 
                 type="submit" 
                 className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#A3000E] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-brand-red/20 shrink-0"
               >
                 <Plus size={24} />
                 <span className="hidden md:inline">إنشاء الكوبون</span>
               </button>
             </div>
           </form>
           <p className="text-xs text-brand-black/40 font-bold mt-4">
             ملاحظة: الكوبون الذي يتم مضافته هنا يوفر خصماً مئوياً ويمكن للعملاء استخدامه أكثر من مرة بحرية مطلقة (تفضل بإيقافه يدوياً عندما ترغب بإنهاء العرض).
           </p>
        </div>

        {/* Coupons List */}
        <div>
           {loading ? (
             <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
           ) : coupons.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-3xl border border-gray-100 text-brand-black/40 font-bold">لا يوجد كوبونات حالياً. يمكنك التفضل بإنشاء واحد.</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {coupons.map((coupon) => (
                 <div key={coupon.id} className={`p-6 rounded-3xl border-2 transition-all ${coupon.isActive ? 'bg-white border-green-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                   <div className="flex justify-between items-start mb-6">
                     <div>
                       <h3 className="text-3xl font-black text-brand-black tracking-widest uppercase">{coupon.code}</h3>
                       <p className={`font-bold mt-2 text-sm ${coupon.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                         {coupon.isActive ? 'نشط ويتم تطبيقه' : 'معطل مؤقتاً'}
                       </p>
                     </div>
                     <div className="bg-brand-red/10 text-brand-red px-4 py-2 rounded-2xl font-black text-xl">
                       {coupon.discountPercent}%
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                     <button 
                       onClick={() => handleToggle(coupon.id, coupon.isActive)}
                       className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-colors ${coupon.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                     >
                       <Power size={18} />
                       {coupon.isActive ? 'إيقاف مؤقت' : 'تفعيل الكوبون'}
                     </button>
                     <button 
                       onClick={() => handleDelete(coupon.id)}
                       className="p-3 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
