'use client';

import { useCart } from '@/store/useCart';
import { useCheckout } from '@/store/useCheckout';
import { useLanguage } from '@/store/useLanguage';
import { DELIVERY_ZONES } from '@/constants/deliveryZones';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, HelpCircle, CreditCard, Apple, CheckCircle2, AlertCircle, Loader2, Banknote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PaymentPage() {
  const { language } = useLanguage();
  const { items, getSubTotal, clearCart } = useCart();
  const { form, resetForm } = useCheckout();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CLIQ' | 'APPLE_PAY' | 'CARD' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const selectedZone = DELIVERY_ZONES.find(z => z.id === form.selectedZoneId) || DELIVERY_ZONES[0];
  const subTotal = getSubTotal();
  const deliveryFee = form.orderType === 'DELIVERY' ? selectedZone.fee : 0;
  const serviceFee = 0.26; // Matching screenshot's 0.26
  const discountAmount = subTotal * form.discountPercent;
  const finalTotal = subTotal + deliveryFee + serviceFee - discountAmount;

  const handleOrder = async (method: 'CASH' | 'CLIQ' | 'APPLE_PAY' | 'CARD') => {
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
        setLastOrderId(data.orderId);
        setIsOrdered(true);
        clearCart();
        resetForm();
      } else {
        setErrorMsg(data.error || "An unexpected error occurred.");
      }
    } catch { 
      setErrorMsg("Connection failed, please check your internet.");
    } finally { setLoading(false); }
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-brand-red/10 p-10 rounded-full">
          <CheckCircle2 size={80} className="text-brand-red" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-brand-black">{language === 'ar' ? 'تم استلام طلبك!' : 'Order Received!'}</h1>
          <p className="text-brand-black/60">{language === 'ar' ? 'طلبك رقم' : 'Order #'}{lastOrderId.slice(-6).toUpperCase()} {language === 'ar' ? 'قيد المراجعة الآن.' : 'is being reviewed.'}</p>
        </div>
        <button onClick={() => router.push('/')} className="w-full max-w-xs bg-brand-black text-white py-4 rounded-xl font-black">
          {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </button>
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

        {/* PAYMENT OPTIONS */}
        <div className="space-y-3">
          <PaymentOption 
            id="CLIQ"
            label={language === 'ar' ? 'كليك' : 'CliQ'}
            icon={<div className="bg-white border border-gray-200 rounded-lg p-1 px-3 font-black text-sm italic">CliQ</div>}
            onClick={() => handleOrder('CLIQ')}
            loading={loading && paymentMethod === 'CLIQ'}
          />
          <PaymentOption 
            id="CARD"
            label={language === 'ar' ? 'الدفع من خلال البطاقة' : 'Pay via Card'}
            icon={
              <div className="flex gap-1">
                <div className="bg-white border border-gray-200 rounded-lg p-1.5"><CreditCard size={18} className="text-red-500" /></div>
                <div className="bg-white border border-gray-200 rounded-lg p-1.5"><CreditCard size={18} className="text-blue-600" /></div>
              </div>
            }
            onClick={() => handleOrder('CARD')}
            loading={loading && paymentMethod === 'CARD'}
          />
          <PaymentOption 
            id="APPLE_PAY"
            label={language === 'ar' ? 'أبل باي' : 'Apple Pay'}
            icon={<div className="bg-white border border-gray-200 rounded-lg p-1 px-2 flex items-center gap-1 font-black text-sm"><Apple size={16} fill="black" /> Pay</div>}
            onClick={() => handleOrder('APPLE_PAY')}
            loading={loading && paymentMethod === 'APPLE_PAY'}
          />
          <PaymentOption 
            id="CASH"
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
      </div>

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

function PaymentOption({ id, label, icon, onClick, loading }: { id: string, label: string, icon: React.ReactNode, onClick: () => void, loading: boolean }) {
  const { language } = useLanguage();
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        {language === 'ar' ? <ChevronLeft size={20} className="text-blue-500 transition-transform group-hover:-translate-x-1" /> : <ChevronRight size={20} className="text-blue-500 transition-transform group-hover:translate-x-1" />}
        {icon}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-gray-700">{label}</span>
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
