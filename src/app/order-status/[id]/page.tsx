'use client';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { Clock, CheckCircle2, UtensilsCrossed, Bike, PackageSearch, ArrowLeft, XCircle, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { use } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useLanguage } from '@/store/useLanguage';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  totalPrice: number;
  status: string;
  orderType: string;
  pickupTime?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items: OrderItem[];
  deliveryFee: number;
  serviceFee: number;
  discountAmount: number;
  couponCode?: string | null;
  review?: {
    id: string;
    rating: number;
    comment?: string | null;
  } | null;
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);

  const fetchStatus = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/order/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error("Failed to fetch order status:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus(true);
    
    // Defensive check: If Supabase keys are missing in .env, gracefully fallback to HTTP polling
    if (!supabase) {
      console.warn("Falling back to HTTP polling because Supabase client is null (missing keys).");
      const interval = setInterval(() => fetchStatus(false), 8000);
      return () => clearInterval(interval);
    }

    // Supabase Realtime Subscription for zero UI refresh drops
    const channel = supabase.channel(`public:Order:id=eq.${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setOrder((prev) => prev ? { 
            ...prev, 
            status: payload.new.status, 
            paymentStatus: payload.new.paymentStatus 
          } : null);
        }
      )
      .subscribe();

    // Slow backup polling just in case socket drops quietly
    const interval = setInterval(() => fetchStatus(false), 15000);

    return () => {
      clearInterval(interval);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [id, fetchStatus]);

  const handleSubmitReview = async () => {
    if (!order) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment,
          customerName: order.customerName
        })
      });

      if (res.ok) {
        toast.success(isAr ? 'شكراً لتقييمك! سيظهر بعد المراجعة.' : 'Thank you! Your review will appear after moderation.');
        setReviewSent(true);
        fetchStatus(false);
      } else {
        toast.error(isAr ? 'فشل إرسال التقييم' : 'Failed to send review');
      }
    } catch (err) {
      console.error("Review Error:", err);
      toast.error('Error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const t = {
    fetching: isAr ? 'جاري جلب حالة الطلب..' : 'Fetching order status..',
    notFound: isAr ? 'الطلب غير موجود' : 'Order Not Found',
    notFoundDesc: isAr ? 'عذراً، لم نتمكن من العثور على هذا الطلب. يرجى التأكد من الرقم.' : "Sorry, we couldn't find this order. Please make sure the number is correct.",
    backHome: isAr ? 'العودة للرئيسية' : 'Back to Home',
    rejected: isAr ? 'عذراً، تم رفض طلبك' : 'Sorry, your order was rejected',
    rejectedDesc: isAr ? 'للأسف، لم نتمكن من الموافقة على طلبك في الوقت الحالي. قد يكون ذلك بسبب ضغط الطلبات أو عدم توفر بعض المكونات.' : "Unfortunately, we couldn't approve your order at this time. This might be due to heavy traffic or unavailability of some ingredients.",
    closeHome: isAr ? 'إغلاق والعودة للرئيسية' : 'Close and Return Home',
    pickup: isAr ? 'استلام من المطعم' : 'Store Pickup',
    orderNum: isAr ? 'رقم الطلب:' : 'Order #:',
    pickupAssigned: isAr ? 'وقت الاستلام المحدد:' : 'Assigned Pickup Time:',
    cliqVerified: isAr ? 'تم التحقق من تحويل كليك بنجاح' : 'CliQ transfer verified successfully',
    cliqVerifying: isAr ? 'جاري التحقق من تحويل كليك...' : 'Verifying CliQ transfer...',
    orderDetails: isAr ? 'تفاصيل الطلب' : 'Order Details',
    total: isAr ? 'المجموع' : 'TOTAL',
    backMenu: isAr ? 'العودة للقائمة الرئيسية 🥢' : 'Back to Main Menu 🥢',
  };

  const statusLabels = {
    PENDING: isAr ? 'بانتظار التأكيد' : 'Confirmed',
    PREPARING: isAr ? 'يتم التحضير' : 'Preparing',
    READY_PICKUP: isAr ? 'جاهز للاستلام' : 'Ready',
    READY_DELIVERY: isAr ? 'جاهز للتوصيل' : 'Ready',
    SHIPPED_PICKUP: isAr ? 'تم الاستلام ✅' : 'Picked Up ✅',
    SHIPPED_DELIVERY: isAr ? 'جاري التوصيل..' : 'On the Way..',
  };

  if (loading) {
    return (
      <div className="bg-brand-cream min-h-screen font-body flex items-center justify-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
          <p className="font-black text-brand-red animate-pulse">{t.fetching}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-brand-cream min-h-screen font-body" dir={isAr ? 'rtl' : 'ltr'}>
        <Header />
        <div className="text-center mt-32 flex flex-col items-center gap-6 p-6">
          <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-brand-gray/50 max-w-lg">
            <PackageSearch size={80} className="text-brand-red/20 mx-auto mb-8" strokeWidth={1} />
            <h1 className="text-4xl font-black text-brand-black luxury-heading mb-4">{t.notFound}</h1>
            <p className="text-brand-black/40 font-bold max-w-xs mx-auto mb-10 leading-relaxed">{t.notFoundDesc}</p>
            <Link href="/" className="btn-matte w-full justify-center">
              <ArrowLeft size={20} className={isAr ? 'rotate-180' : ''} /> {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPickup = order.orderType === 'PICKUP';
  const isTable = order.orderType === 'TABLE';
  const isStoreVisit = isPickup || isTable;

  if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
    return (
      <div className="bg-brand-cream min-h-screen font-body pb-20" dir={isAr ? 'rtl' : 'ltr'}>
        <Header />
        <main className="max-w-4xl mx-auto p-6 md:p-12 pt-32 animate-fade-in text-center">
          <div className="bg-white rounded-[2rem] shadow-sm border border-brand-red/20 overflow-hidden p-12 md:p-20">
            <div className="inline-flex items-center justify-center p-8 rounded-full mb-8 bg-red-50 text-brand-red border-4 border-red-100">
              <XCircle size={64} strokeWidth={2} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-brand-black luxury-heading mb-4">
              {t.rejected}
            </h1>
            <p className="text-brand-black/60 font-bold max-w-md mx-auto mb-10 leading-relaxed text-lg">
              {t.rejectedDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <Link href="/" className="btn-matte flex-1 justify-center">
                {t.closeHome}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 🔄 Conditional Status Steps based on Order Type
  const statusSteps = isStoreVisit ? [
    { key: 'PENDING', label: statusLabels.PENDING, icon: Clock, percent: 33 },
    { key: 'PREPARING', label: statusLabels.PREPARING, icon: UtensilsCrossed, percent: 66 },
    { key: 'READY', label: isTable ? (isAr ? 'طلبك جاهز' : 'Served') : statusLabels.READY_PICKUP, icon: CheckCircle2, percent: 100 },
  ] : [
    { key: 'PENDING', label: statusLabels.PENDING, icon: Clock, percent: 15 },
    { key: 'PREPARING', label: statusLabels.PREPARING, icon: UtensilsCrossed, percent: 45 },
    { key: 'READY', label: statusLabels.READY_DELIVERY, icon: PackageSearch, percent: 75 },
    { key: 'SHIPPED', label: statusLabels.SHIPPED_DELIVERY, icon: Bike, percent: 100 },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status || (isStoreVisit && order.status === 'SHIPPED' && s.key === 'READY'));
  const currentStep = statusSteps[currentStepIndex] || statusSteps[0];

  return (
    <div className="bg-brand-cream min-h-screen font-body pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="max-w-4xl mx-auto p-6 md:p-12 pt-32 animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-sm border border-brand-gray/50 overflow-hidden">
          
          {/* Status Header */}
          <div className="p-12 md:p-20 text-center border-b border-brand-gray/30 relative">
            {isPickup && (
              <div className={`absolute top-6 ${isAr ? 'right-6' : 'left-6'} bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md`}>
                {t.pickup}
              </div>
            )}
            <div className="inline-flex items-center justify-center p-8 rounded-3xl mb-8 bg-brand-cream text-brand-red border border-brand-gray/30 shadow-inner">
              <currentStep.icon size={64} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-brand-black luxury-heading mb-4">
              {currentStep.label}
            </h1>
            <div className="flex flex-col items-center gap-2">
               <span className="inline-block px-4 py-1 rounded-full bg-brand-gray/30 text-brand-black/40 text-[10px] font-bold">
                 {t.orderNum} #{order.id.slice(-6).toUpperCase()}
               </span>
               {isPickup && order.pickupTime && (
                 <span className="text-orange-600 font-bold text-sm">{t.pickupAssigned} {order.pickupTime}</span>
               )}
               {order.paymentMethod === 'CLIQ' && (
                 <div className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-purple-100 text-purple-700 animate-pulse border border-purple-200'}`}>
                   <Zap size={14} className={order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-purple-600'} />
                   {order.paymentStatus === 'COMPLETED' ? t.cliqVerified : t.cliqVerifying}
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 md:p-16 space-y-16">
            {/* Progress visualization */}
            <div className="relative max-w-2xl mx-auto">
              <div className="h-1.5 w-full bg-brand-gray/30 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-[2000ms] ease-out bg-brand-red"
                  style={{ width: `${currentStep.percent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-8 relative">
                {statusSteps.map((step, idx) => {
                  const isPassed = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 
                        ${isPassed || isCurrent ? 'bg-brand-black text-white shadow-lg scale-110' : 
                          'bg-white border border-brand-gray text-brand-black/10'}`}>
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <span className={`text-[9.5px] font-bold text-center transition-colors duration-500 leading-tight px-1
                        ${isCurrent ? 'text-brand-red' : isPassed ? 'text-brand-black' : 'text-brand-black/20'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-brand-cream/40 rounded-3xl p-8 md:p-12 border border-brand-gray/30">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-brand-gray/20">
                <h3 className="font-black text-2xl text-brand-black luxury-heading">{t.orderDetails}</h3>
              </div>
              
              <div className="space-y-6 mb-12">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-brand-red text-sm border border-brand-gray/30">
                        {item.quantity}
                      </div>
                      <p className="font-bold text-brand-black">{item.name}</p>
                    </div>
                    <span className="font-black text-brand-black">{item.price.toFixed(2)} {isAr ? 'د.أ' : 'JOD'}</span>
                  </div>
                ))}
              </div>

              {(order.deliveryFee > 0 || order.serviceFee > 0 || order.discountAmount > 0) && (
                <div className="pt-6 border-t border-brand-gray/20 space-y-3">
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold text-brand-black/40">
                      <span>{isAr ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
                      <span>+{order.deliveryFee.toFixed(2)} {isAr ? 'د.أ' : 'JOD'}</span>
                    </div>
                  )}
                  {order.serviceFee > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold text-brand-black/40">
                      <span>{isAr ? 'رسوم إضافية:' : 'Additional Fees:'}</span>
                      <span>+{order.serviceFee.toFixed(2)} {isAr ? 'د.أ' : 'JOD'}</span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm font-black text-brand-red">
                      <span>{isAr ? 'خصم:' : 'Discount:'} {order.couponCode ? `(${order.couponCode})` : ''}</span>
                      <span>-{order.discountAmount.toFixed(2)} {isAr ? 'د.أ' : 'JOD'}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-10 border-t border-brand-gray/30 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="w-full md:w-auto">
                  <p className="text-[10px] text-brand-black/30 font-bold uppercase mb-2">{t.total}</p>
                  <div className="text-5xl font-black text-brand-red luxury-heading">
                    {order.totalPrice.toFixed(2)} <span className="text-xl text-brand-black/20 font-bold">{isAr ? 'د.أ' : 'JOD'}</span>
                  </div>
                </div>
                
                <Link href="/" className="btn-matte">
                  {t.backMenu}
                </Link>
              </div>
            </div>

            {/* ⭐ Rating Section - Only if Completed & No Review Yet */}
            {((order.status === (isStoreVisit ? 'READY' : 'SHIPPED'))) && !order.review && !reviewSent && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 bg-white rounded-[3rem] p-10 md:p-16 border-4 border-brand-red/10 shadow-2xl space-y-10 text-center"
              >
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-brand-red/5 rounded-full flex items-center justify-center mx-auto text-brand-red">
                    <Star size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-brand-black luxury-heading">
                    {isAr ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
                  </h3>
                  <p className="text-brand-black/40 font-bold max-w-xs mx-auto">
                    {isAr ? 'رأيك يهمنا جداً لتحسين خدماتنا.' : 'Your feedback means the world to us.'}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-10">
                  {/* Star Picker */}
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setRating(star)}
                        className={`transition-all duration-300 transform active:scale-90 ${rating >= star ? 'text-yellow-400 scale-125' : 'text-brand-gray'}`}
                      >
                        <Star size={48} fill={rating >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>

                  <div className="w-full space-y-6">
                    <textarea 
                      placeholder={isAr ? 'اكتب رأيك هنا (اختياري)..' : 'Write your review here (optional)..'}
                      className="w-full bg-brand-cream/40 border border-brand-gray/30 rounded-[2rem] p-8 text-lg font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all placeholder:text-brand-black/20 min-h-[160px] text-brand-black"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    
                    <button 
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="w-full py-6 bg-brand-red text-white rounded-3xl font-black text-xl hover:bg-red-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                    >
                      {submittingReview ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>{isAr ? 'إرسال التقييم 🥢' : 'Submit Review 🥢'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thank you message if reviewSent */}
            {(reviewSent || order.review) && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mt-12 bg-green-50 rounded-[3rem] p-10 border-2 border-green-100 text-center"
               >
                 <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                   <Star size={32} fill="currentColor" />
                 </div>
                 <h4 className="text-2xl font-black text-green-900 mb-2">
                   {isAr ? 'شكراً لمشاركتنا رأيك!' : 'Thank you for your feedback!'}
                 </h4>
                 <p className="text-green-700 font-bold text-sm">
                   {isAr ? 'تم استلام تقييمك بنجاح. نحن نقدر وقتك واهتمامك.' : 'Your review was received. We appreciate your time.'}
                 </p>
               </motion.div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
