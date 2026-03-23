'use client';
import { useEffect, useState, use } from 'react';
import Header from '@/components/Header';
import { Clock, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/store/useLanguage';

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
  createdAt: string;
  items: OrderItem[];
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { language } = useLanguage();
  const isAr = language === 'ar';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const cleanId = id.replace('#', '');
        const res = await fetch(`/api/order/${cleanId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const t = {
    notFound: isAr ? 'الطلب غير موجود' : 'Order Not Found',
    notFoundDesc: isAr ? 'تأكد من إدخال رقم الطلب بشكل صحيح' : 'Make sure you entered the correct order number',
    backToTrack: isAr ? 'العودة لصفحة التتبع' : 'Back to Tracking',
    details: isAr ? 'تفاصيل الطلب' : 'Order Details',
    orderId: isAr ? 'رقم الطلب (ID)' : 'Order ID',
    preparing: isAr ? 'جاري التحضير بالمطبخ 👨‍🍳' : 'Preparing in kitchen 👨‍🍳',
    completed: isAr ? 'مكتمل وتم التسليم ✔️' : 'Completed and Delivered ✔️',
    orderTime: isAr ? 'وقت استلام الطلب' : 'Order Received Time',
    invoice: isAr ? 'فاتورة الأصناف' : 'Items Invoice',
    total: isAr ? 'المجموع الصافي:' : 'Net Total:',
    backToHome: isAr ? 'العودة للقائمة الرئيسية' : 'Back to Main Menu'
  };

  if (loading) {
    return (
      <div className="bg-brand-cream min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-brand-cream min-h-screen pb-28 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
        <Header />
        <div className="text-center mt-32 flex flex-col items-center gap-4">
          <PackageOpen size={80} className="text-gray-300" strokeWidth={1} />
          <h1 className="text-4xl font-black text-brand-black">{t.notFound}</h1>
          <p className="text-gray-500 font-medium">{t.notFoundDesc}</p>
          <Link href="/track" className="mt-4 bg-brand-black hover:bg-brand-red text-white px-6 py-3 rounded-xl font-bold transition-colors">
            {t.backToTrack}
          </Link>
        </div>
      </div>
    );
  }

  const isPending = order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY';

  return (
    <div className="bg-brand-cream min-h-screen pb-28 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />
      <div className="max-w-2xl mx-auto mt-8 md:mt-16 p-4 md:p-6">
        <h1 className="text-3xl font-black text-brand-black mb-6 flex items-center gap-3">
          <div className="w-2 h-8 bg-brand-red rounded-full"></div>
          {t.details}
        </h1>
        
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-gray relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gray-50 rounded-br-[100px] -z-10"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
            <div>
              <p className="text-gray-400 font-bold mb-1 text-sm">{t.orderId}</p>
              <h2 className="text-2xl font-black text-brand-black uppercase tracking-tight font-mono">{order.id.split('-')[0]}</h2>
            </div>
            <div className={`px-6 py-2.5 rounded-full font-black text-sm flex items-center gap-2 shadow-sm ${isPending ? 'bg-yellow-400 text-yellow-900 border border-yellow-300' : 'bg-green-400 text-green-900 border border-green-300'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isPending ? 'bg-yellow-900' : 'bg-green-900'}`}></div>
              {isPending ? t.preparing : t.completed}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <div className="bg-white p-2 rounded-xl text-brand-red shadow-sm"><Clock size={20} /></div>
                 <div className={isAr ? 'text-right' : 'text-left'}>
                   <p className="text-xs text-gray-500 font-bold mb-0.5">{t.orderTime}</p>
                   <p className="font-bold text-sm" dir="ltr">{new Date(order.createdAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}</p>
                 </div>
               </div>
            </div>

            <div className="pt-4">
              <h3 className="font-black text-xl mb-6 text-brand-black">{t.invoice}</h3>
              <div className="bg-brand-cream border border-brand-gray rounded-2xl p-5 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                    <span className="font-bold text-gray-700 flex items-center gap-3">
                      <span className="bg-brand-gray text-brand-black px-2 py-1 border border-gray-200 rounded-lg text-xs leading-none">x{item.quantity}</span> 
                      {item.name}
                    </span>
                    <span className="font-black text-brand-red">{item.price.toFixed(2)} {isAr ? 'د.أ' : 'JOD'}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-6 border-t-[2px] border-dashed border-gray-200 px-2">
                <span className="font-black text-gray-500 text-lg">{t.total}</span>
                <span className="text-3xl font-black text-brand-red">{order.totalPrice.toFixed(2)} <span className="text-base text-gray-500">{isAr ? 'د.أ' : 'JOD'}</span></span>
              </div>
            </div>
            
            <Link href="/" className="block w-full text-center mt-8 bg-brand-gray hover:bg-gray-200 text-brand-black font-bold py-4 rounded-xl transition-colors">
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
