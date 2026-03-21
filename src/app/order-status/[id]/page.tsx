'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Clock, CheckCircle2, UtensilsCrossed, Bike, PackageSearch, ArrowLeft, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { supabase } from '@/utils/supabaseClient';

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
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async (showLoading = false) => {
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
  };

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
  }, [id]);

  if (loading) {
    return (
      <div className="bg-brand-cream min-h-screen font-body flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
          <p className="font-black text-brand-red animate-pulse">جاري جلب حالة الطلب..</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-brand-cream min-h-screen font-body" dir="rtl">
        <Header />
        <div className="text-center mt-32 flex flex-col items-center gap-6 p-6">
          <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-brand-gray/50 max-w-lg">
            <PackageSearch size={80} className="text-brand-red/20 mx-auto mb-8" strokeWidth={1} />
            <h1 className="text-4xl font-black text-brand-black luxury-heading mb-4">الطلب غير موجود</h1>
            <p className="text-brand-black/40 font-bold max-w-xs mx-auto mb-10 leading-relaxed">عذراً، لم نتمكن من العثور على هذا الطلب. يرجى التأكد من الرقم الصحيح.</p>
            <Link href="/" className="btn-matte w-full justify-center">
              <ArrowLeft size={20} /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPickup = order.orderType === 'PICKUP';

  if (order.status === 'CANCELLED') {
    return (
      <div className="bg-brand-cream min-h-screen font-body pb-20" dir="rtl">
        <Header />
        <main className="max-w-4xl mx-auto p-6 md:p-12 pt-32 animate-fade-in text-center">
          <div className="bg-white rounded-[2rem] shadow-sm border border-brand-red/20 overflow-hidden p-12 md:p-20">
            <div className="inline-flex items-center justify-center p-8 rounded-full mb-8 bg-red-50 text-brand-red border-4 border-red-100">
              <XCircle size={64} strokeWidth={2} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-brand-black luxury-heading mb-4">
              نعتذر، تم رفض طلبك
            </h1>
            <p className="text-brand-black/60 font-bold max-w-md mx-auto mb-10 leading-relaxed text-lg">
              للأسف لم نتمكن من الموافقة على طلبك في الوقت الحالي. قد يكون ذلك بسبب زحمة شديدة أو عدم توفر بعض المكونات. يرجى التواصل معنا للاستفسار.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <Link href="/" className="btn-matte flex-1 justify-center">
                إغلاق والعودة للرئيسية
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statusSteps = [
    { key: 'PENDING', label: 'بانتظار التأكيد', icon: Clock, percent: 15 },
    { key: 'PREPARING', label: 'جاري التحضير', icon: UtensilsCrossed, percent: 45 },
    { key: 'READY', label: isPickup ? 'جاهز للاستلام' : 'جاهز للتوصيل', icon: isPickup ? PackageSearch : CheckCircle2, percent: 75 },
    { key: 'SHIPPED', label: isPickup ? 'تم التسليم' : 'تم التوصيل بنجاح', icon: isPickup ? CheckCircle2 : Bike, percent: 100 },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const currentStep = statusSteps[currentStepIndex] || statusSteps[0];

  return (
    <div className="bg-brand-cream min-h-screen font-body pb-20" dir="rtl">
      <Header />
      
      <main className="max-w-4xl mx-auto p-6 md:p-12 pt-32 animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-sm border border-brand-gray/50 overflow-hidden">
          
          {/* Status Header */}
          <div className="p-12 md:p-20 text-center border-b border-brand-gray/30 relative">
            {isPickup && (
              <div className="absolute top-6 left-6 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                استلام من المطعم
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
                 طلب رقم: #{order.id.slice(-6).toUpperCase()}
               </span>
               {isPickup && order.pickupTime && (
                 <span className="text-orange-600 font-bold text-sm">وقت الاستلام المحدد: {order.pickupTime}</span>
               )}
               {order.paymentMethod === 'CLIQ' && (
                 <div className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-purple-100 text-purple-700 animate-pulse border border-purple-200'}`}>
                   <Zap size={14} className={order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-purple-600'} />
                   {order.paymentStatus === 'COMPLETED' ? 'تم تأكيد استلام الحوالة بنجاح' : 'جاري التحقق من حوالة كليك...'}
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
                    <div key={step.key} className="flex flex-col items-center gap-4 w-1/4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 
                        ${isPassed || isCurrent ? 'bg-brand-black text-white shadow-lg scale-110' : 
                          'bg-white border border-brand-gray text-brand-black/10'}`}>
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <span className={`text-[10px] font-bold text-center transition-colors duration-500 whitespace-nowrap
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
                <h3 className="font-black text-2xl text-brand-black luxury-heading">تفاصيل الطلب</h3>
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
                    <span className="font-black text-brand-black">{item.price.toFixed(2)} د.أ</span>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-brand-gray/30 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="w-full md:w-auto">
                  <p className="text-[10px] text-brand-black/30 font-bold uppercase mb-2">المجموع الكلي</p>
                  <div className="text-5xl font-black text-brand-red luxury-heading">
                    {order.totalPrice.toFixed(2)} <span className="text-xl text-brand-black/20 font-bold">د.أ</span>
                  </div>
                </div>
                
                <Link href="/" className="btn-matte">
                  العودة للقائمة الرئيسية 🥢
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
