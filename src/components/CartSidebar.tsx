'use client';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, User, CheckCircle2, Trash2, ArrowRight, AlertCircle, ShoppingCart, Clock, Store, Zap, Locate, ChevronDown, Bike } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { useLanguage } from '@/store/useLanguage';
import { DELIVERY_ZONES, DeliveryZone } from '@/constants/deliveryZones';

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const { items, getSubTotal, getTotalPrice, clearCart, removeItem } = useCart();
  const [isOrdered, setIsOrdered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', deliveryArea: '', notes: '', pickupTime: '' });
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CLIQ'>('CASH');
  const [mounted, setMounted] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(DELIVERY_ZONES[0]);

  // Promo Code State
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if(data && typeof data.isStoreOpen === 'boolean') {
        setIsStoreOpen(data.isStoreOpen);
      }
    }).catch(() => {});
  }, []);

  const currentTotal = getTotalPrice();
  const getDeliveryFee = () => orderType === 'DELIVERY' ? selectedZone.fee : 0;
  const getFinalPrice = () => {
    const total = currentTotal + getDeliveryFee();
    if (discountPercent > 0) return total * (1 - discountPercent);
    return total;
  };

  const handleValidateCoupon = async (codeToValidate: string = couponCode) => {
    if (!codeToValidate.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountPercent(data.discountPercent);
        setCouponSuccess(data.message);
      } else {
        setDiscountPercent(0);
        setCouponError(data.error);
      }
    } catch {
      setDiscountPercent(0);
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (session?.user?.name && !form.name) {
      setForm(prev => ({ ...prev, name: session.user?.name || '' }));
    }
  }, [session, form.name]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en,ar`);
          const data = await res.json();
          
          const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setForm(prev => ({ 
            ...prev, 
            address: googleMapsUrl 
          }));
        } catch (err) {
          console.error("Location error:", err);
          setErrorMsg("Could not detect address, please enter it manually.");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetecting(false);
        if (error.code === 1) {
          setErrorMsg("Please enable location permissions in your browser.");
        } else {
          setErrorMsg("Failed to detect location.");
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleOrder = async () => {
    if (!session) {
      setErrorMsg("Please sign in first to place an order");
      return;
    }
    if (form.name.trim().length < 2) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (form.phone.trim().length < 9) {
      setErrorMsg("Please enter a valid phone number");
      return;
    }
    if (orderType === 'DELIVERY' && form.address.trim().length < 5) {
      setErrorMsg("Please enter your full address");
      return;
    }
    if (orderType === 'PICKUP' && !form.pickupTime) {
      setErrorMsg("Please select a pickup time");
      return;
    }
    
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          address: orderType === 'DELIVERY' ? form.address : 'Store Pickup',
          deliveryArea: orderType === 'DELIVERY' ? form.deliveryArea : '',
          pickupTime: orderType === 'PICKUP' ? form.pickupTime : '',
          orderType: orderType,
          paymentMethod: paymentMethod,
          notes: form.notes,
          totalPrice: getFinalPrice(),
          userId: session?.user?.id,
          couponCode: discountPercent > 0 ? couponCode : null,
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
      } else {
        setErrorMsg(data.error || "An unexpected error occurred, please try again.");
      }
    } catch { 
      setErrorMsg("Connection failed, please check your internet.");
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-[200]"
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white z-[250] shadow-2xl flex flex-col"
            dir="ltr"
          >
            {isOrdered ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-10">
                <div className="bg-white p-10 rounded-full shadow-lg border border-brand-gray/50">
                  <CheckCircle2 size={80} className="text-brand-red" strokeWidth={1.5} />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-brand-black">
                    {language === 'ar' ? 'تم استلام طلبك!' : 'Order Received!'}
                  </h2>
                  <p className="text-brand-black/60 font-medium">
                    {language === 'ar' 
                      ? 'شكراً لثقتك بـ شيان. طلبك قيد المراجعة الآن وسيتواصل معك فريقنا قريباً.' 
                      : 'Thank you for trusting Xian. Your order is under review and our team will contact you shortly.'}
                  </p>
                </div>
                
                {lastOrderId && (
                   <div className="w-full bg-brand-cream/30 p-6 rounded-2xl border border-brand-gray/50 flex flex-col items-center gap-3">
                     <p className="text-brand-black/60 text-xs font-black uppercase tracking-widest">{language === 'ar' ? 'رقم التتبع المباشر' : 'Your Secret Tracking Number'}</p>
                     <div className="flex w-full mt-2">
                       <input 
                         readOnly 
                         value={`#${lastOrderId.slice(-6).toUpperCase()}`} 
                         className="flex-1 bg-white border border-brand-gray border-l-0 rounded-r-xl outline-none px-4 font-black text-brand-red text-center tracking-widest text-lg"
                       />
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(`#${lastOrderId.slice(-6).toUpperCase()}`);
                           const btn = document.getElementById('copy-btn');
                           if(btn) {
                             btn.innerText = 'Copied!';
                             btn.classList.add('bg-green-600', 'border-green-600', 'text-white');
                             setTimeout(() => {
                               btn.innerText = 'Copy';
                               btn.classList.remove('bg-green-600', 'border-green-600', 'text-white');
                             }, 2000);
                           }
                         }}
                         id="copy-btn"
                         className="bg-brand-black text-white px-6 rounded-l-xl font-bold hover:bg-brand-red transition-colors min-w-[80px]"
                       >
                         {language === 'ar' ? 'نسخ' : 'Copy'}
                       </button>
                     </div>
                     <p className="text-[10px] font-bold text-brand-black/40 mt-1">{language === 'ar' ? 'يمكنك استخدام هذا الكود لتتبع طلبك لاحقاً' : 'You can use this code to track your order later'}</p>
                     
                     <Link 
                       href={`/order-status/${lastOrderId}`} 
                       onClick={onClose} 
                       className="btn-matte w-full justify-center mt-3 shadow-sm"
                     >
                       {language === 'ar' ? 'تتبع الطلب المباشر' : 'Live Order Tracking'}
                     </Link>
                   </div>
                )}
                
                <button onClick={onClose} className="text-brand-black/40 font-bold hover:text-brand-red transition-all">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div className="p-8 border-b border-brand-gray/30 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-4">
                    <ShoppingCart size={28} className="text-brand-black" />
                    <h2 className="text-2xl font-black text-brand-black luxury-heading">
                      {language === 'ar' ? 'سلة الطلبات' : 'Shopping Cart'}
                    </h2>
                  </div>
                  <button onClick={onClose} className="p-2 text-brand-black/20 hover:text-brand-red transition-all"><X size={24} /></button>
                </div>
                
                {/* SCROLLABLE VIEWPORT FOR ITEMS AND FORM */}
                <div className="flex-1 overflow-y-auto flex flex-col w-full">
                  {/* ITEMS SECTION */}
                  <div className="p-4 md:p-8 space-y-4 flex-shrink-0">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-black/10 py-20 space-y-6">
                      <ShoppingCart size={48} strokeWidth={1} />
                      <p className="text-lg font-bold">
                        {language === 'ar' ? 'سلة المشتريات فارغة..' : 'Your cart is empty..'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/30">
                          {language === 'ar' ? 'محتويات السلة' : 'Review Items'}
                        </span>
                        <span className="bg-brand-gray/20 px-2 py-0.5 rounded text-[10px] font-black">
                          {items.length} {language === 'ar' ? 'أصناف' : 'Items'}
                        </span>
                      </div>
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-white p-3 md:p-5 rounded-2xl border border-brand-gray/50 flex gap-3 md:gap-4 items-center group relative shadow-sm"
                        >
                          <div className="h-14 w-14 md:h-20 md:w-20 bg-brand-cream rounded-xl overflow-hidden flex-shrink-0 relative">
                            <Image 
                              src={item.imageUrl || `https://placehold.co/200x200/F9F7F2/1A1A1A.png?text=Xian`} 
                              alt={item.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-brand-black text-sm md:text-lg truncate">{item.name}</h4>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-brand-red font-black text-xs md:text-base">{item.price.toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                              <span className="text-brand-black/30 font-bold text-[10px] md:text-xs">{language === 'ar' ? 'الكمية' : 'Qty'}: {item.quantity}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-brand-black/10 hover:text-brand-red transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                
                  {/* CHECKOUT SECTION */}
                  {items.length > 0 && (
                    <div className="p-8 bg-white border-t border-brand-gray/30 mt-auto">
                    {!isStoreOpen ? (
                       <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center bg-red-50 rounded-3xl border-2 border-dashed border-red-200 p-6">
                           <div className="bg-white p-6 rounded-full shadow-sm text-brand-red">
                             <Store size={40} />
                           </div>
                           <div className="space-y-3">
                              <h3 className="text-2xl font-black text-brand-red">{language === 'ar' ? 'المطعم مغلق حالياً 🛑' : 'Store Currently Closed 🛑'}</h3>
                              <p className="text-sm text-brand-red/80 font-bold leading-relaxed px-4">{language === 'ar' ? 'عذراً، لا يمكننا استقبال طلبات جديدة حالياً. يرجى المحاولة مرة أخرى عندما يكون المطعم مفتوحاً.' : 'Sorry, we cannot accept new orders at this time. Please try again when the store is open.'}</p>
                           </div>
                       </div>
                    ) : !session ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-8 text-center bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-gray/50 p-6">
                        <div className="bg-white p-6 rounded-full shadow-sm">
                           <AlertCircle size={40} className="text-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-xl font-black text-brand-black">{language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}</h3>
                           <p className="text-sm text-brand-black/40 font-medium">{language === 'ar' ? 'خطوة واحدة تفصلك عن إكمال طلبك ومشاركة التجربة معنا.' : 'One step away from completing your order and sharing the experience with us.'}</p>
                        </div>
                        <button 
                          onClick={() => signIn('google')}
                          className="w-full bg-white text-brand-black border-2 border-brand-gray px-6 py-5 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-brand-red hover:text-white hover:border-brand-red transition-all shadow-xl active:scale-95 group"
                        >
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          <span>{language === 'ar' ? 'سجل دخول بجوجل للمتابعة' : 'Sign in with Google to continue'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* STEP 1: CONTACT DETAILS */}
                        <div className="bg-brand-cream/10 p-4 md:p-6 rounded-[2rem] border border-brand-gray/30 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-6 h-6 rounded-full bg-brand-black text-white text-[10px] font-black flex items-center justify-center">1</div>
                             <h3 className="font-black text-lg text-brand-black">
                               {language === 'ar' ? 'تفاصيل التواصل' : 'Contact Details'}
                             </h3>
                          </div>
                          <div className="space-y-3">
                            <div className="relative group">
                              <User className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                              <input 
                                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} 
                                className={`w-full bg-white ${language === 'ar' ? 'pr-12 pl-6 text-right' : 'pl-12 pr-6 text-left'} py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px]`}
                                value={form.name}
                                onChange={(e) => setForm({...form, name: e.target.value})}
                              />
                            </div>
                            <div className="relative group">
                              <Phone className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                              <input 
                                placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} 
                                className={`w-full bg-white ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px]`}
                                dir="ltr"
                                value={form.phone}
                                onChange={(e) => setForm({...form, phone: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>

                        {/* STEP 2: FULFILLMENT */}
                        <div className="bg-brand-cream/10 p-4 md:p-6 rounded-[2rem] border border-brand-gray/30 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 rounded-full bg-brand-black text-white text-[10px] font-black flex items-center justify-center">2</div>
                               <h3 className="font-black text-lg text-brand-black">
                                 {language === 'ar' ? 'طريقة الاستلام' : 'Fulfillment'}
                               </h3>
                            </div>
                            
                            <div className="flex bg-white p-1 rounded-xl border border-brand-gray/30">
                               <button 
                                 onClick={() => setOrderType('DELIVERY')}
                                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${orderType === 'DELIVERY' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400'}`}
                               >
                                 {language === 'ar' ? 'توصيل' : 'Delivery'}
                               </button>
                               <button 
                                 onClick={() => setOrderType('PICKUP')}
                                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${orderType === 'PICKUP' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400'}`}
                               >
                                 {language === 'ar' ? 'استلام' : 'Pickup'}
                               </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {orderType === 'DELIVERY' ? (
                              <>
                                {/* ZONE SELECTION */}
                                <div className="relative group">
                                  <Bike className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                                  <select 
                                    className={`w-full appearance-none bg-white ${language === 'ar' ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px] cursor-pointer`}
                                    value={selectedZone.id}
                                    onChange={(e) => {
                                      const zone = DELIVERY_ZONES.find(z => z.id === e.target.value);
                                      if (zone) setSelectedZone(zone);
                                    }}
                                  >
                                    {DELIVERY_ZONES.map(zone => (
                                      <option key={zone.id} value={zone.id}>
                                        {language === 'ar' ? zone.nameAr : zone.nameEn} (+{zone.fee.toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'})
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className={`absolute ${language === 'ar' ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-brand-black/20 pointer-events-none`} size={18} />
                                </div>

                                <div className="relative group">
                                  <MapPin className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                                  <input 
                                    placeholder={language === 'ar' ? 'العنوان بالتفصيل (بناء، شقة)' : 'Detailed Address (Bldg, Apt)'} 
                                    className={`w-full bg-white ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px]`}
                                    value={form.address}
                                    onChange={(e) => setForm({...form, address: e.target.value})}
                                  />
                                </div>
                                
                                <button 
                                  type="button"
                                  onClick={handleDetectLocation}
                                  disabled={isDetecting}
                                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all border-2 
                                    ${isDetecting 
                                      ? 'bg-brand-red text-white border-brand-red animate-pulse' 
                                      : 'bg-white text-brand-red border-brand-red/20 hover:border-brand-red hover:bg-brand-red/5'}`}
                                >
                                  <Locate size={14} />
                                  <span>{isDetecting 
                                    ? (language === 'ar' ? 'جاري التحديد...' : 'Detecting...') 
                                    : (language === 'ar' ? 'تحديد موقعي التلقائي' : 'Auto-detect Location')}</span>
                                </button>
                              </>
                            ) : (
                              <div className="relative group">
                                <Clock className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                                <input 
                                  type="time"
                                  className={`w-full bg-white ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px]`}
                                  value={form.pickupTime}
                                  onChange={(e) => setForm({...form, pickupTime: e.target.value})}
                                />
                              </div>
                            )}

                            <textarea 
                              placeholder={language === 'ar' ? 'ملاحظات إضافية (اختياري)...' : 'Additional Notes (Optional)...'} 
                              className={`w-full bg-white px-6 py-4 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[15px] min-h-[70px] resize-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                              value={form.notes}
                              onChange={(e) => setForm({...form, notes: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* STEP 3: PAYMENT & PROMO */}
                        <div className="bg-brand-cream/10 p-4 md:p-6 rounded-[2rem] border border-brand-gray/30 space-y-5">
                          <div className="flex items-center gap-3 mb-1">
                             <div className="w-6 h-6 rounded-full bg-brand-black text-white text-[10px] font-black flex items-center justify-center">3</div>
                             <h3 className="font-black text-lg text-brand-black">
                               {language === 'ar' ? 'الدفع والخصومات' : 'Payment & Discounts'}
                             </h3>
                          </div>

                          {/* PROMO CODE SECTION */}
                          <div className="space-y-2">
                            <div className="flex gap-2 relative">
                              <input 
                                placeholder={language === 'ar' ? 'كود الخصم (اختياري)' : 'Promo Code (Optional)'} 
                                className={`w-full bg-white px-4 py-3 rounded-xl border border-brand-gray/40 focus:border-brand-red/30 outline-none transition-all font-bold text-[14px] uppercase ${language === 'ar' ? 'text-right' : 'text-left'}`}
                                value={couponCode}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setCouponCode(val);
                                  if (val === 'WELCOME30') {
                                    handleValidateCoupon(val);
                                  } else if (val.length === 0) {
                                    setDiscountPercent(0);
                                    setCouponSuccess('');
                                    setCouponError('');
                                  }
                                }}
                                disabled={discountPercent > 0}
                              />
                              {discountPercent === 0 && (
                                <button 
                                  onClick={() => handleValidateCoupon()}
                                  disabled={validatingCoupon || !couponCode.trim()}
                                  className="bg-brand-black text-white px-4 py-3 rounded-xl font-black text-[10px] hover:bg-brand-red transition-all disabled:opacity-50 min-w-[70px]"
                                >
                                  {validatingCoupon ? '...' : (language === 'ar' ? 'تطبيق' : 'Apply')}
                                </button>
                              )}
                            </div>
                            {couponError && <p className="text-brand-red text-[10px] font-bold px-2">{couponError}</p>}
                            {couponSuccess && <p className="text-green-600 text-[10px] font-bold px-2 flex items-center gap-1"><CheckCircle2 size={12}/> {couponSuccess}</p>}
                          </div>

                          {/* PAYMENT METHOD */}
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                               onClick={() => setPaymentMethod('CASH')}
                               className={`border-2 rounded-2xl py-3 px-2 font-black text-[11px] transition-all flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'border-brand-red bg-white text-brand-red shadow-md' : 'border-transparent bg-white/50 text-brand-black/40 hover:border-brand-gray/20'}`}
                             >
                               <Store size={16} />
                               {language === 'ar' ? 'عند الاستلام' : 'Cash on Delivery'}
                             </button>
                             <button 
                               onClick={() => setPaymentMethod('CLIQ')}
                               className={`border-2 rounded-2xl py-3 px-2 font-black text-[11px] transition-all flex flex-col items-center gap-1 ${paymentMethod === 'CLIQ' ? 'border-purple-600 bg-white text-purple-700 shadow-md' : 'border-transparent bg-white/50 text-brand-black/40 hover:border-brand-gray/20'}`}
                             >
                               <Zap size={16} className={paymentMethod === 'CLIQ' ? 'text-purple-600' : 'text-gray-400'}/>
                               {language === 'ar' ? 'دفع عبر كليك' : 'Pay via CliQ'}
                             </button>
                          </div>

                          {paymentMethod === 'CLIQ' && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="bg-purple-600 text-white p-4 rounded-2xl text-center space-y-2"
                             >
                               <p className="text-[10px] font-black uppercase tracking-tighter opacity-80">
                                 {language === 'ar' ? 'حوّل إلى الاسم المستعار:' : 'Transfer to Alias:'}
                               </p>
                               <span className="block text-2xl font-black tracking-widest select-all">XIAN99</span>
                               <p className="text-[9px] font-bold opacity-70 leading-tight">
                                 {language === 'ar' ? 'سنقوم بتأكيد طلبك فور استلام الإشعار.' : 'We will confirm your order upon receiving notification.'}
                               </p>
                             </motion.div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-brand-gray/20">
                          <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                                <span className="text-brand-black/40 font-bold">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                {orderType === 'DELIVERY' && (
                                  <span className="text-brand-black/40 font-bold text-xs">
                                    {language === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'} ({language === 'ar' ? selectedZone.nameAr : selectedZone.nameEn})
                                  </span>
                                )}
                                {discountPercent > 0 && <span className="text-green-600 text-xs font-black">{language === 'ar' ? 'خصم ترحيبي' : 'Welcome Discount'} ({(discountPercent * 100).toFixed(0)}%)</span>}
                              </div>
                              <div className="flex flex-col items-end">
                                {discountPercent > 0 ? (
                                  <>
                                    <span className="font-bold text-sm text-brand-black/30 line-through">{(currentTotal + (orderType === 'DELIVERY' ? selectedZone.fee : 0)).toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                                    <span className="font-black text-lg text-green-600">{getFinalPrice().toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                                  </>
                                ) : (
                                  <span className="font-black text-lg">{getFinalPrice().toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                                )}
                             </div>
                          </div>
                          <button 
                            onClick={handleOrder}
                            disabled={loading}
                            className="w-full btn-matte justify-center h-20"
                          >
                            {loading ? (
                              <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>{language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'} • {getFinalPrice().toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                                <ArrowRight size={20} className={language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
