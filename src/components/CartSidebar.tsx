'use client';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, User, Trash2, ArrowRight, AlertCircle, ShoppingCart, Clock, Store, Locate, ChevronDown, Bike, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { useLanguage } from '@/store/useLanguage';
import { useCheckout } from '@/store/useCheckout';
import { useRouter } from 'next/navigation';

interface DeliveryZone {
  id: string;
  nameAr: string;
  nameEn: string;
  fee: number;
}


export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const { items, clearCart, removeItem } = useCart();
  const { form, setForm } = useCheckout();
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>(form.orderType || 'DELIVERY');
  const [mounted, setMounted] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);

  useEffect(() => {
    fetch('/api/delivery-zones')
      .then(res => res.json())
      .then(data => setDeliveryZones(data))
      .catch(() => {});
  }, []);


  // Promo Code State
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if(data && typeof data.isStoreOpen === 'boolean') {
        setIsStoreOpen(data.isStoreOpen);
      }
    }).catch(() => {});
  }, []);

  // Sync orderType changes back to store
  useEffect(() => {
    setForm({ orderType });
  }, [orderType, setForm]);

  // Auto-fill name from session
  useEffect(() => {
    if (session?.user?.name && !form.name) {
      const timer = setTimeout(() => {
        setForm({ name: session?.user?.name || '' });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session?.user?.name, form.name, setForm]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'ar' ? 'متصفحك لا يدعم تحديد الموقع' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setForm({ address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${mapsUrl})` });
        setIsDetecting(false);
        
        // Optional: Try reverse geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language}`);
          const data = await res.json();
          if (data && data.display_name) {
            setForm({ address: `${data.display_name} (${mapsUrl})` });
          }
        } catch (e) {
          console.error("Geocoding error:", e);
        }
      },
      (error) => {
        setIsDetecting(false);
        console.error("Geolocation error:", error);
        alert(language === 'ar' ? 'تعذر تحديد الموقع. يرجى التأكد من تفعيل الخاصية.' : 'Unable to retrieve location. Please ensure GPS is enabled.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const currentTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* OVERLAY */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-[100]"
          />

          {/* SIDEBAR PANEL */}
          <motion.div 
            initial={{ x: language === 'ar' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'ar' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 1 }}
            className={`fixed inset-0 md:inset-y-0 ${language === 'ar' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'} w-full md:w-[500px] bg-white z-[200] shadow-2xl flex flex-col h-[100dvh] md:h-screen`}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* HEADER - STICKY TOP */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-brand-gray/20 bg-white sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-brand-gray/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex flex-col">
                  <h2 className="text-xl md:text-2xl font-black text-brand-black tracking-tight">{language === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}</h2>
                  {items.length > 0 && (
                    <span className="text-xs font-bold text-brand-black/40">
                      {items.length} {language === 'ar' ? 'أصناف مختارة' : 'Selected Items'}
                    </span>
                  )}
                </div>
              </div>
              {items.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-xs font-black text-brand-red uppercase tracking-widest px-3 py-1.5 hover:bg-brand-red/5 rounded-lg transition-all"
                >
                  {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                </button>
              )}
            </div>

            {/* MAIN CONTENT - SINGLE SCROLLBAR */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
              {items.length === 0 ? (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center text-brand-black/10 py-20 space-y-6 min-h-full">
                  <ShoppingCart size={48} strokeWidth={1} />
                  <p className="text-lg font-bold">
                    {language === 'ar' ? 'سلة المشتريات فارغة..' : 'Your cart is empty..'}
                  </p>
                  <button onClick={onClose} className="bg-brand-black text-white px-8 py-4 rounded-xl font-black">{language === 'ar' ? 'تصفح المنيو الآن' : 'Browse Menu Now'}</button>
                </div>
              ) : (
                // ACTIVE CART FLOW
                <div className="flex flex-col">
                  {/* ITEMS SUMMARY */}
                  <div className="p-4 md:p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/30">
                          {language === 'ar' ? 'محتويات السلة' : 'Items Summary'}
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
                  </div>

                  {/* CHECKOUT SECTION */}
                  <div className="p-4 md:p-8 bg-white border-t border-brand-gray/30 shadow-[0_-8px_40px_-15px_rgba(0,0,0,0.08)]">
                    {!isStoreOpen ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center bg-red-50 rounded-3xl border-2 border-dashed border-red-200 p-6">
                        <Store size={40} className="text-brand-red" />
                        <div className="space-y-2">
                           <h3 className="text-xl font-black text-brand-red">{language === 'ar' ? 'المطعم مغلق حالياً 🛑' : 'Store Currently Closed 🛑'}</h3>
                           <p className="text-sm text-brand-red/80 font-bold">{language === 'ar' ? 'عذراً لا يمكن استقبال طلبات الآن' : 'Sorry, not accepting orders'}</p>
                        </div>
                      </div>
                    ) : !session ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-8 text-center bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-gray/50 p-6">
                        <AlertCircle size={40} className="text-brand-red" />
                        <h3 className="text-xl font-black text-brand-black">{language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}</h3>
                        <p className="text-sm text-brand-black/40 font-medium">{language === 'ar' ? 'يرجى تسجيل الدخول لإتمام طلبك' : 'Please sign in to complete your order'}</p>
                        <button 
                          onClick={() => signIn('google')}
                          className="w-full bg-white text-brand-black border-2 border-brand-gray px-6 py-5 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-brand-red hover:text-white transition-all shadow-xl active:scale-95 group"
                        >
                          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                          <span>{language === 'ar' ? 'سجل دخول بجوجل للمتابعة' : 'Sign in with Google'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div 
                              key="step1" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.2 }}
                              className="space-y-4"
                            >
                              <div className="bg-white p-5 md:p-6 rounded-3xl border border-brand-gray/30 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-brand-gray/10">
                                  <div className="w-6 h-6 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">1</div>
                                  <h3 className="font-black text-lg text-brand-black">{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="relative group">
                                      <User className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                                      <input 
                                        placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} 
                                        className={`w-full bg-brand-gray/5 text-brand-black ${language === 'ar' ? 'pr-12 pl-6 text-right' : 'pl-12 pr-6 text-left'} py-4 rounded-xl border border-brand-gray/20 focus:border-brand-red/30 focus:bg-white outline-none transition-all font-bold text-[15px] placeholder:text-brand-black/30`}
                                        value={form.name} onChange={(e) => setForm({ name: e.target.value })}
                                      />
                                    </div>
                                    <div className="relative group">
                                      <Phone className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors`} size={18} />
                                      <input 
                                        placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} 
                                        className={`w-full bg-brand-gray/5 text-brand-black ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/20 focus:border-brand-red/30 focus:bg-white outline-none transition-all font-bold text-[15px] placeholder:text-brand-black/30`}
                                        dir="ltr" value={form.phone} onChange={(e) => setForm({ phone: e.target.value })}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex bg-brand-gray/5 p-1 rounded-2xl border border-brand-gray/10">
                                     <button onClick={() => setOrderType('DELIVERY')} className={`flex-1 py-3 rounded-xl text-[12px] font-black transition-all ${orderType === 'DELIVERY' ? 'bg-white text-brand-red shadow-sm border border-brand-gray/10' : 'text-brand-black/30'}`}>{language === 'ar' ? 'توصيل' : 'Delivery'}</button>
                                     <button onClick={() => setOrderType('PICKUP')} className={`flex-1 py-3 rounded-xl text-[12px] font-black transition-all ${orderType === 'PICKUP' ? 'bg-white text-brand-red shadow-sm border border-brand-gray/10' : 'text-brand-black/30'}`}>{language === 'ar' ? 'استلام' : 'Pickup'}</button>
                                  </div>

                                  <div className="space-y-3">
                                    {orderType === 'DELIVERY' ? (
                                      <>
                                        <div className="relative group">
                                          <Bike className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20`} size={18} />
                                          <select 
                                            className={`w-full appearance-none bg-brand-gray/5 text-brand-black ${language === 'ar' ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-4 rounded-xl border border-brand-gray/20 outline-none font-bold text-[15px] cursor-pointer`} 
                                            value={form.selectedZoneId} 
                                            onChange={(e) => setForm({ selectedZoneId: e.target.value })}
                                          >
                                            <option value="" disabled>{language === 'ar' ? '--- يرجى تحديد المنطقة ---' : '--- Please select region ---'}</option>
                                            {deliveryZones.map((zone: DeliveryZone) => (
                                              <option key={zone.id} value={zone.id}>
                                                {language === 'ar' ? zone.nameAr : zone.nameEn}
                                              </option>
                                            ))}
                                          </select>
                                          <ChevronDown className={`absolute ${language === 'ar' ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-brand-black/20`} size={18} />
                                        </div>
                                        <div className="relative group">
                                          <MapPin className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20`} size={18} />
                                          <input placeholder={language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'} className={`w-full bg-brand-gray/5 text-brand-black ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/20 focus:bg-white transition-all font-bold text-[15px]`} value={form.address} onChange={(e) => setForm({ address: e.target.value })} />
                                        </div>
                                        <button 
                                          onClick={handleDetectLocation}
                                          disabled={isDetecting}
                                          className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-2 bg-white text-brand-red border-brand-red/10 hover:bg-brand-red/5 transition-all disabled:opacity-50"
                                        >
                                          {isDetecting ? <Loader2 size={14} className="animate-spin" /> : <Locate size={14} />} 
                                          <span>{isDetecting ? (language === 'ar' ? 'جاري التحديد...' : 'Detecting...') : (language === 'ar' ? 'تحديد موقعي التلقائي' : 'Auto-detect Location')}</span>
                                        </button>
                                      </>
                                    ) : (
                                      <div className="relative group">
                                        <Clock className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-brand-black/20`} size={18} />
                                        <input type="time" className={`w-full bg-brand-gray/5 text-brand-black ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 rounded-xl border border-brand-gray/20 font-bold text-[15px]`} value={form.pickupTime} onChange={(e) => setForm({ pickupTime: e.target.value })} />
                                      </div>
                                    )}
                                    <textarea placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional Notes...'} className={`w-full bg-brand-gray/5 text-brand-black px-6 py-4 rounded-xl border border-brand-gray/20 focus:bg-white outline-none transition-all font-bold text-[15px] min-h-[90px] resize-none ${language === 'ar' ? 'text-right' : 'text-left'}`} value={form.notes} onChange={(e) => setForm({ notes: e.target.value })} />
                                  </div>
                                </div>

                                {/* ORDER SUMMARY */}
                                <div className="bg-brand-gray/5 p-6 rounded-3xl border border-brand-gray/10 space-y-3">
                                  <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-brand-black/40">{language === 'ar' ? 'المجموع' : 'Total'}</span>
                                    <span className="text-brand-black">{currentTotal.toFixed(2)} {language === 'ar' ? 'د.أ' : 'JOD'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  if(!form.name.trim() || !form.phone.trim()) {
                                    alert(language === 'ar' ? 'يرجى إكمال البيانات' : 'Please complete fields'); 
                                    return;
                                  }
                                  if(orderType === 'DELIVERY' && !form.selectedZoneId) {
                                    alert(language === 'ar' ? 'يرجى تحديد منطقة التوصيل' : 'Please select a delivery zone'); 
                                    return;
                                  }
                                  if(orderType === 'DELIVERY' && !form.address.trim()) {
                                    alert(language === 'ar' ? 'يرجى كتابة العنوان بالتفصيل' : 'Please provide detailed address'); 
                                    return;
                                  }
                                  onClose();
                                  router.push('/checkout/payment');
                                }} 
                                className="w-full bg-brand-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-brand-red transition-all group"
                              >
                                {language === 'ar' ? 'التالي' : 'Next'} <ArrowRight size={20} className={language === 'ar' ? 'rotate-180 group-hover:-translate-x-2' : 'group-hover:translate-x-2'} />
                              </button>
                            </motion.div>
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
