'use client';

import { useCart } from '@/store/useCart';
import { useCheckout } from '@/store/useCheckout';
import { useLanguage } from '@/store/useLanguage';
import { DELIVERY_ZONES } from '@/constants/deliveryZones';
import { ChevronRight, ChevronLeft, HelpCircle, CreditCard, Apple, CheckCircle2, AlertCircle, Loader2, Banknote, X, Info, ClipboardCheck, RefreshCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
  const { language } = useLanguage();
  const { items, getSubTotal, clearCart } = useCart();
  const { form, resetForm } = useCheckout();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CLIQ' | 'APPLE_PAY' | 'CARD' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showCliQModal, setShowCliQModal] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verificationPolling, setVerificationPolling] = useState(false);

  const selectedZone = DELIVERY_ZONES.find(z => z.id === form.selectedZoneId) || DELIVERY_ZONES[0];
  const subTotal = getSubTotal();
  const deliveryFee = form.orderType === 'DELIVERY' ? selectedZone.fee : 0;
  const serviceFee = 0.26; // Matching screenshot's 0.26
  const discountAmount = subTotal * form.discountPercent;
  const finalTotal = subTotal + deliveryFee + serviceFee - discountAmount;

  const pollOrderStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/order/${id}`);
      if (res.ok) {
        const order = await res.json();
        if (order.paymentStatus === 'COMPLETED') {
          setIsPaymentVerified(true);
          setVerificationPolling(false);
          return true;
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
    return false;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verificationPolling && orderId) {
      interval = setInterval(async () => {
        const verified = await pollOrderStatus(orderId);
        if (verified) clearInterval(interval);
      }, 4000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [verificationPolling, orderId, pollOrderStatus]);

  const handleOrder = async (method: 'CASH' | 'CLIQ' | 'APPLE_PAY' | 'CARD') => {
    if (method === 'CARD' || method === 'APPLE_PAY') {
      toast.error(language === 'ar' ? 'عذراً، هذه الخدمة غير متوفرة حالياً' : 'Sorry, this service is currently unavailable');
      return;
    }
    if (method === 'CLIQ' && !showCliQModal && !orderId) {
      setShowCliQModal(true);
      return;
    }
    setPaymentMethod(method);
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          address: form.orderType === 'DELIVERY' ? form.address : 'Store Pickup',
          deliveryArea: form.orderType === 'DELIVERY' ? selectedZone.nameEn : '',
          pickupTime: form.orderType === 'PICKUP' ? form.pickupTime : '',
          orderType: form.orderType,
          paymentMethod: method,
          notes: form.notes,
          totalPrice: finalTotal,
          userId: null, // Assuming anonymous for now or fetch from session if needed
          couponCode: form.discountPercent > 0 ? form.couponCode : null,
          items: items.map(item => ({
            productId: item.id.toString(),
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        if (method === 'CLIQ') {
          setVerificationPolling(true);
          setShowCliQModal(false);
        }
        clearCart();
        resetForm();
      } else {
        setErrorMsg(data.error || "An unexpected error occurred.");
      }
    } catch { 
      setErrorMsg("Connection failed, please check your internet.");
    } finally { setLoading(false); }
  };

  if (orderId && (paymentMethod !== 'CLIQ' || isPaymentVerified)) {
    return (
      <div className="min-h-screen bg-brand-cream/20 flex flex-col items-center justify-center p-6 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-brand-gray/20 max-w-md w-full space-y-8">
          <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-inner">
            <CheckCircle2 size={56} strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-brand-black">
              {isPaymentVerified ? (language === 'ar' ? 'تم تأكيد الدفع!' : 'Payment Verified!') : (language === 'ar' ? 'تم استلام طلبك!' : 'Order Received!')}
            </h1>
            <p className="text-brand-black/60 font-bold leading-relaxed">
              {isPaymentVerified 
                ? (language === 'ar' ? 'شكراً لك، تم تأكيد استلام المبلغ بنجاح. سنبدأ بتجهيز طلبك الآن.' : 'Thank you! We have successfully received your payment. We will start preparing your order now.')
                : (language === 'ar' ? 'شكراً لثقتك بنا. طلبك قيد المراجعة الآن.' : 'Thank you for your trust! Your order is being reviewed.')}
            </p>
          </div>
          <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-gray/50 flex flex-col items-center gap-3">
            <p className="text-brand-black/40 text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'رقم الطلب' : 'Order Reference'}</p>
            <p className="text-2xl font-black text-brand-red tracking-[4px]">#{orderId.slice(-6).toUpperCase()}</p>
          </div>
          <button 
            onClick={() => router.push(`/order-status/${orderId}`)}
            className="w-full bg-brand-black text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-brand-red transition-all flex items-center justify-center gap-3 group"
          >
            {language === 'ar' ? 'تتبع الطلب المباشر' : 'Live Order Tracking'} <ArrowRight size={20} className={language === 'ar' ? 'rotate-180 group-hover:-translate-x-2' : 'group-hover:translate-x-2'} />
          </button>
        </div>
      </div>
    );
  }

  if (orderId && paymentMethod === 'CLIQ' && !isPaymentVerified) {
    return (
      <div className="min-h-screen bg-brand-cream/20 flex flex-col items-center justify-center p-6 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-brand-gray/20 max-w-md w-full space-y-10">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
               <Loader2 size={48} className="animate-spin" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-blue-100">
               <ShieldCheck size={24} className="text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-brand-black">{language === 'ar' ? 'بانتظار التأكيد...' : 'Waiting for Confirmation...'}</h1>
            <p className="text-brand-black/60 font-bold leading-relaxed px-4">
              {language === 'ar' 
                ? 'لقد سجلنا طلبك برقم' 
                : 'We have registered your order with ID'} <span className="text-brand-red">#{orderId.slice(-6).toUpperCase()}</span>. {language === 'ar' ? 'نحن نتحقق الآن من وصول حوالة كليك الخاصة بك. يرجى عدم إغلاق هذه الصفحة.' : 'We are currently verifying your CliQ transfer. Please do not close this page.'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-3 rounded-xl font-black text-xs animate-pulse">
                <RefreshCcw size={14} className="animate-spin" />
                <span>{language === 'ar' ? 'يتم التحديث تلقائياً' : 'Updating Automatically'}</span>
             </div>
             <button onClick={() => pollOrderStatus(orderId)} className="text-brand-black/40 font-bold text-sm hover:text-brand-black transition-colors underline underline-offset-4">
                {language === 'ar' ? 'تحديث يدوي' : 'Manual Refresh'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            {language === 'ar' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          <h1 className="text-xl font-black text-brand-black">{language === 'ar' ? 'إختر طريقة الدفع' : 'Choose Payment Method'}</h1>
        </div>
        <button className="text-brand-red font-bold text-sm flex items-center gap-1">
          {language === 'ar' ? 'مساعدة؟' : 'Help?'}
        </button>
      </div>

      <div className="flex-1 p-6 space-y-8 max-w-2xl mx-auto w-full">
        {/* ORDER NUMBER INFO */}
        <div className="text-center space-y-1">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{language === 'ar' ? 'رقم الطلب' : 'Order Number'}</p>
          <p className="text-brand-black font-black text-lg">152718113</p>
        </div>

        <div className="space-y-3">
          <PaymentOption 
            label={language === 'ar' ? 'كليك' : 'CliQ'}
            icon={<div className="bg-white border border-gray-200 rounded-lg p-1 px-3 font-black text-sm italic">CliQ</div>}
            onClick={() => handleOrder('CLIQ')}
            loading={loading && paymentMethod === 'CLIQ'}
          />
          <PaymentOption 
            label={language === 'ar' ? 'الدفع من خلال البطاقة' : 'Pay via Card'}
            sublabel={language === 'ar' ? 'غير متوفر مؤقتاً' : 'Temporarily Unavailable'}
            disabled={true}
            icon={
              <div className="flex gap-1 opacity-50">
                <div className="bg-white border border-gray-200 rounded-lg p-1.5"><CreditCard size={18} className="text-red-500" /></div>
                <div className="bg-white border border-gray-200 rounded-lg p-1.5"><CreditCard size={18} className="text-blue-600" /></div>
              </div>
            }
            onClick={() => handleOrder('CARD')}
            loading={loading && paymentMethod === 'CARD'}
          />
          <PaymentOption 
            label={language === 'ar' ? 'أبل باي' : 'Apple Pay'}
            sublabel={language === 'ar' ? 'غير متوفر مؤقتاً' : 'Temporarily Unavailable'}
            disabled={true}
            icon={<div className="bg-white border border-gray-200 rounded-lg p-1 px-2 flex items-center gap-1 font-black text-sm opacity-50"><Apple size={16} fill="black" /> Pay</div>}
            onClick={() => handleOrder('APPLE_PAY')}
            loading={loading && paymentMethod === 'APPLE_PAY'}
          />
          <PaymentOption 
            label={language === 'ar' ? 'كاش عند الوصول' : 'Cash on Delivery'}
            icon={<div className="bg-white border border-gray-200 rounded-lg p-1 px-2"><Banknote size={20} className="text-green-600" /></div>}
            onClick={() => handleOrder('CASH')}
            loading={loading && paymentMethod === 'CASH'}
          />
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <button 
          onClick={() => router.back()}
          className="w-full py-4 text-brand-black/40 font-black text-sm hover:text-brand-black transition-colors"
        >
          {language === 'ar' ? 'الرجوع لتعديل البيانات' : 'Back to Edit Details'}
        </button>
      </div>

      {/* CliQ Instruction Modal */}
      <AnimatePresence>
        {showCliQModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCliQModal(false)} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-8 md:p-10 space-y-8">
               <div className="flex justify-between items-center">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Info size={24} /></div>
                  <button onClick={() => setShowCliQModal(false)} className="p-2 text-brand-black/20 hover:text-brand-red transition-all"><X size={24} /></button>
               </div>

               <div className="space-y-3">
                  <h3 className="text-2xl font-black text-brand-black">{language === 'ar' ? 'الدفع عبر كليك (CliQ)' : 'Payment via CliQ'}</h3>
                  <p className="text-brand-black/60 font-bold text-sm leading-relaxed">
                     {language === 'ar' 
                       ? `يرجى إرسال مبلغ ${finalTotal.toFixed(2)} د.أ إلى الاسم المستعار (Alias) التالي:` 
                       : `Please send ${finalTotal.toFixed(2)} JOD to the following Alias:`}
                  </p>
               </div>

               <div className="bg-brand-cream/40 p-8 rounded-[2rem] border-2 border-dashed border-brand-gray/50 flex flex-col items-center gap-4 group relative">
                  <span className="text-[10px] font-black uppercase tracking-[4px] text-brand-black/30">CliQ Alias</span>
                  <p className="text-5xl font-black text-brand-red tracking-tight">XIAN99</p>
                  <button onClick={() => { navigator.clipboard.writeText('XIAN99'); toast.success(language === 'ar' ? 'تم النسخ!' : 'Copied!'); }} className="flex items-center gap-2 text-[10px] font-black text-brand-black/40 hover:text-brand-black transition-colors border-t border-brand-gray/20 pt-4 w-full justify-center">
                     <ClipboardCheck size={14} /> {language === 'ar' ? 'نسخ الاسم المستعار' : 'Copy Alias'}
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-3 items-start">
                     <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">!</div>
                     <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                        {language === 'ar' 
                          ? 'بمجرد الضغط على الزر أدناه، سنقوم بمراجعة طلبك وتأكيده خلال أقل من دقيقة.' 
                          : 'As soon as you click the button below, we will review and confirm your order in less than a minute.'}
                     </p>
                  </div>
                  
                  <button 
                    onClick={() => handleOrder('CLIQ')}
                    disabled={loading}
                    className="w-full bg-brand-black text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-red transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                    <span>{language === 'ar' ? 'لقد قمت بالتحويل' : 'I have transferred'}</span>
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PURCHASE SUMMARY */}
      <div className="p-6 bg-gray-50/50">
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-black text-brand-black">{language === 'ar' ? 'ملخص الشراء' : 'Purchase Summary'}</h3>
          <div className="space-y-3">
            <SummaryRow label={language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'} value={`${subTotal.toFixed(2)} ${language === 'ar' ? 'دينار' : 'JOD'}`} />
            <SummaryRow label={language === 'ar' ? 'الخصم' : 'Discount'} value={`${discountAmount.toFixed(2)} ${language === 'ar' ? 'دينار' : 'JOD'}`} valueClass="text-brand-red" />
            <SummaryRow label={language === 'ar' ? 'رسوم الخدمة' : 'Service Fee'} value={`${serviceFee.toFixed(2)} ${language === 'ar' ? 'دينار' : 'JOD'}`} info />
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xl font-black text-brand-black">{language === 'ar' ? 'المجموع' : 'Total'}</span>
              <span className="text-xl font-black text-brand-black">{finalTotal.toFixed(2)} {language === 'ar' ? 'دينار' : 'JOD'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({ label, sublabel, icon, onClick, loading, disabled = false }: { label: string, sublabel?: string, icon: React.ReactNode, onClick: () => void, loading: boolean, disabled?: boolean }) {
  const { language } = useLanguage();
  return (
    <button 
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors group ${disabled ? 'cursor-not-allowed grayscale-[0.5]' : ''}`}
    >
      <div className="flex items-center gap-4">
        {!disabled && (language === 'ar' ? <ChevronLeft size={20} className="text-blue-500 transition-transform group-hover:-translate-x-1" /> : <ChevronRight size={20} className="text-blue-500 transition-transform group-hover:translate-x-1" />)}
        {icon}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`font-bold ${disabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{label}</span>
        {sublabel && <span className="text-[10px] font-black text-brand-red uppercase tracking-tighter animate-pulse">{sublabel}</span>}
        {loading && <Loader2 size={18} className="animate-spin text-brand-red" />}
      </div>
    </button>
  );
}

function SummaryRow({ label, value, valueClass = "text-brand-black", info = false }: { label: string, value: string, valueClass?: string, info?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm font-bold">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">{label}</span>
        {info && <HelpCircle size={14} className="text-gray-300" />}
      </div>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
