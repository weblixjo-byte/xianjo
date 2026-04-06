'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, EyeOff, MessageSquare, User, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  customerName: string;
  isPublic: boolean;
  createdAt: string;
  order?: {
    items: { name: string }[];
  };
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {
      toast.error('فشل جلب التقييمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublic: !isPublic })
      });
      if (res.ok) {
        toast.success(isPublic ? 'تم إخفاء التقييم' : 'تم تفعيل التقييم للعامة');
        fetchReviews();
      }
    } catch {
      toast.error('خطأ');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم نهائياً؟')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم الحذف');
        fetchReviews();
      }
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-brand-red font-black animate-pulse">جاري تحميل المراجعات..</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-brand-black flex items-center gap-3">
          <MessageSquare className="text-brand-red" size={32} />
          تقييمات الزبائن
        </h2>
        <div className="bg-brand-red/10 text-brand-red px-6 py-2 rounded-full font-black text-xs">
          إجمالي التقييمات: {reviews.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {reviews.map((review) => (
            <motion.div 
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 overflow-hidden relative ${review.isPublic ? 'border-brand-red/20 shadow-xl' : 'border-brand-gray/30 opacity-75'}`}
            >
              {review.isPublic && (
                <div className="absolute top-0 right-10 bg-brand-red text-white px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-tighter">
                  منشور للعامة
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-black font-black">
                    <User size={16} className="text-brand-red" />
                    {review.customerName}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={review.rating >= s ? '#EAB308' : 'none'} color={review.rating >= s ? '#EAB308' : '#D1D5DB'} />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-brand-black/30 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(review.createdAt).toLocaleDateString('ar-JO')}
                </div>
              </div>

              <div className="bg-brand-cream/30 p-6 rounded-2xl mb-6 min-h-[80px]">
                <p className="text-sm font-bold text-brand-black leading-relaxed italic">
                  &quot;{review.comment || 'لا يوجد تعليق'}&quot;
                </p>
                {review.order && (
                   <div className="mt-4 pt-4 border-t border-brand-gray/20 text-[10px] text-brand-black/40 font-bold overflow-hidden whitespace-nowrap text-ellipsis">
                     الطلبات: {review.order.items.map(i => i.name).join('، ')}
                   </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => toggleVisibility(review.id, review.isPublic)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${review.isPublic ? 'bg-brand-black text-white hover:bg-gray-800' : 'bg-brand-red text-white hover:bg-red-700 shadow-lg shadow-brand-red/20'}`}
                >
                  {review.isPublic ? <><EyeOff size={16} /> إخفاء</> : <><CheckCircle size={16} /> قبول النشر</>}
                </button>
                <button 
                  onClick={() => deleteReview(review.id)}
                  className="w-12 h-12 bg-white border-2 border-brand-gray/10 text-brand-black/20 hover:text-red-600 hover:border-red-100 rounded-xl flex items-center justify-center transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {reviews.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-brand-gray/30">
          <MessageSquare size={64} className="text-brand-gray/20 mx-auto mb-4" />
          <p className="text-brand-black/30 font-black">لا توجد تقييمات بانتظار المراجعة حالياً.</p>
        </div>
      )}
    </div>
  );
}
