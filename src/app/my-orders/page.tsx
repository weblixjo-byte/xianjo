'use client';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { PackageSearch, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/store/useLanguage';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  orderType: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  captainPhone?: string | null;
}

export default function MyOrdersPage() {
  const { language } = useLanguage();
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/my-orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();

      let channel: RealtimeChannel | null = null;
      if (supabase) {
        channel = supabase.channel('my-orders-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Order'
            },
            () => {
              fetchOrders();
            }
          )
          .subscribe();
      }

      const interval = setInterval(fetchOrders, supabase ? 10000 : 5000);

      return () => {
        clearInterval(interval);
        if (supabase && channel) {
          supabase.removeChannel(channel);
        }
      };
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, fetchOrders]);

  const getStatusDisplay = (status: string, orderType: string) => {
    const isAr = language === 'ar';
    switch (status) {
      case 'PENDING': return { label: isAr ? 'بانتظار التأكيد' : 'Awaiting Confirmation', color: 'bg-brand-red text-white' };
      case 'PREPARING': return { label: isAr ? 'يتم التحضير' : 'Preparing', color: 'bg-orange-100 text-orange-700' };
      case 'READY': return { label: orderType === 'PICKUP' ? (isAr ? 'جاهز للاستلام' : 'Ready for Pickup') : (isAr ? 'جاهز للتوصيل' : 'Ready for Delivery'), color: 'bg-yellow-100 text-yellow-700' };
      case 'SHIPPED': return { label: orderType === 'PICKUP' ? (isAr ? 'تم الاستلام' : 'Picked Up') : (isAr ? 'تم التوصيل' : 'Delivered'), color: 'bg-green-100 text-green-700' };
      case 'CANCELLED': return { label: isAr ? 'ملغي' : 'Cancelled', color: 'bg-gray-100 text-gray-500' };
      default: return { label: isAr ? 'غير معروف' : 'Unknown', color: 'bg-gray-100 text-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="bg-brand-cream min-h-screen font-body pb-20 flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-brand-cream min-h-screen font-body pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header />
        <div className="text-center mt-32 flex flex-col items-center gap-6 p-6">
          <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-brand-gray/50 max-w-lg">
            <h1 className="text-3xl font-black text-brand-black mb-4">
              {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}
            </h1>
            <p className="text-brand-black/60 font-bold mb-8">
              {language === 'ar' ? 'لرؤية وتتبع طلباتك السابقة والحالية، يرجى تسجيل الدخول.' : 'To view and track your past and active orders, please sign in.'}
            </p>
            <Link href="/" className="btn-matte w-full justify-center">
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen font-body pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      <main className="max-w-5xl mx-auto p-6 md:p-12 pt-32 md:pt-40 lg:pt-48 animate-fade-in">
         <div className="flex items-center justify-between mb-10">
           <h1 className="text-4xl font-black text-brand-black luxury-heading">
             {language === 'ar' ? 'طلباتي' : 'My Orders'}
           </h1>
           <span className="bg-white px-4 py-2 rounded-full font-bold text-sm shadow-sm">
             {orders.length} {language === 'ar' ? 'طلبات' : 'Orders'}
           </span>
         </div>

         {orders.length === 0 ? (
           <div className="bg-white rounded-[2rem] p-16 text-center border border-brand-gray flex flex-col items-center">
              <PackageSearch size={64} className="text-brand-black/20 mb-6" strokeWidth={1}/>
              <h2 className="text-2xl font-black mb-2">
                {language === 'ar' ? 'لا توجد طلبات سابقة' : 'No Past Orders'}
              </h2>
              <p className="text-brand-black/50 font-bold mb-8">
                {language === 'ar' 
                  ? 'يبدو أنك لم تقم بأي طلبات بعد. استكشف قائمتنا وابدأ رحلتك!' 
                  : "It seems you haven't placed any orders yet. Discover our menu and start your journey!"}
              </p>
              <Link href="/" className="btn-burgundy">
                {language === 'ar' ? 'اطلب الآن' : 'Order Now'}
              </Link>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {orders.map((order) => {
               const display = getStatusDisplay(order.status, order.orderType);
               const isComplete = order.status === 'SHIPPED' || order.status === 'CANCELLED';
               return (
                 <div 
                   onClick={() => router.push(`/order-status/${order.id}`)} 
                   key={order.id}
                   className="cursor-pointer bg-white rounded-[2rem] p-8 border border-brand-gray/50 shadow-sm hover:shadow-xl hover:border-brand-red/30 transition-all group relative overflow-hidden"
                 >
                   {!isComplete && (
                     <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-brand-red to-orange-400 animate-pulse" />
                   )}
                   <div className="flex justify-between items-start mb-6">
                     <div className={`flex flex-col gap-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-black/30">
                         #{order.id.slice(-6).toUpperCase()}
                       </span>
                       <span className="font-bold text-brand-black text-sm text-brand-black/50">
                         {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </span>
                     </div>
                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${display.color}`}>
                       {display.label}
                     </span>
                   </div>

                    <div className="space-y-4 mb-6">
                      {order.items.slice(0, 3).map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-brand-black flex items-center gap-2">
                            <span className="text-brand-black/40 text-xs">{item.quantity}x</span> {item.name}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-brand-black/40 font-bold">
                          + {order.items.length - 3} {language === 'ar' ? 'أصناف أخرى' : 'more items'}
                        </p>
                      )}
                    </div>

                    {order.captainPhone && (
                      <div 
                        className={`mb-6 p-4 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100 flex items-center justify-between text-xs font-bold gap-2`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="shrink-0">{language === 'ar' ? '🚚 هاتف كابتن التوصيل:' : '🚚 Captain Phone:'}</span>
                        <a 
                          href={`tel:${order.captainPhone}`} 
                          className="bg-brand-red text-white px-3 py-1.5 rounded-xl font-black shadow-md hover:bg-brand-red/80 active:scale-95 transition-all text-[11px]"
                        >
                          {order.captainPhone}
                        </a>
                      </div>
                    )}

                   <div className="pt-6 border-t border-brand-gray/30 flex justify-between items-center mt-auto">
                     <span className="font-black text-brand-red text-xl">
                       {order.totalPrice.toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}
                     </span>
                     <div className="flex items-center gap-2 text-xs font-black text-brand-black/40 group-hover:text-brand-red transition-all">
                       {language === 'ar' ? 'تتبع' : 'Track'} <ArrowUpRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
      </main>
    </div>
  );
}
