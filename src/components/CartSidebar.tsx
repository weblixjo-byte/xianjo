'use client';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, User, CheckCircle2, Trash2, ArrowRight, AlertCircle, ShoppingCart, Clock, Store, Zap, Locate } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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
  const getFinalPrice = () => {
    if (discountPercent > 0) return currentTotal * (1 - discountPercent);
    return currentTotal;
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
          
          if (data && data.display_name) {
            setForm(prev => ({ ...prev, address: data.display_name }));
          } else {
            setForm(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
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
                  <h2 className="text-4xl font-black text-brand-black">Order Received!</h2>
                  <p className="text-brand-black/60 font-medium">Thank you for trusting Xian. Your order is under review and our team will contact you shortly.</p>
                </div>
                
                {lastOrderId && (
                   <div className="w-full bg-brand-cream/30 p-6 rounded-2xl border border-brand-gray/50 flex flex-col items-center gap-3">
                     <p className="text-brand-black/60 text-xs font-black uppercase tracking-widest">Your Secret Tracking Number</p>
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
                         Copy
                       </button>
                     </div>
                     <p className="text-[10px] font-bold text-brand-black/40 mt-1">You can use this code to track your order later</p>
                     
                     <Link 
                       href={`/order-status/${lastOrderId}`} 
                       onClick={onClose} 
                       className="btn-matte w-full justify-center mt-3 shadow-sm"
                     >
                       Live Order Tracking
                     </Link>
                   </div>
                )}
                
                <button onClick={onClose} className="text-brand-black/40 font-bold hover:text-brand-red transition-all">Back to Home</button>
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div className="p-8 border-b border-brand-gray/30 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-4">
                    <ShoppingCart size={28} className="text-brand-black" />
                    <h2 className="text-2xl font-black text-brand-black luxury-heading">Shopping Cart</h2>
                  </div>
                  <button onClick={onClose} className="p-2 text-brand-black/20 hover:text-brand-red transition-all"><X size={24} /></button>
                </div>
                
                {/* SCROLLABLE VIEWPORT FOR ITEMS AND FORM */}
                <div className="flex-1 overflow-y-auto flex flex-col w-full">
                  {/* ITEMS */}
                  <div className="p-8 space-y-6 flex-shrink-0">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-black/10 space-y-6">
                      <ShoppingCart size={60} strokeWidth={1} />
                      <p className="text-xl font-bold">Your cart is empty..</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white p-5 rounded-2xl border border-brand-gray/50 flex gap-4 items-center group relative shadow-sm"
                      >
                        <div className="h-20 w-20 bg-brand-cream rounded-xl overflow-hidden flex-shrink-0 relative">
                          <Image 
                            src={item.imageUrl || `https://placehold.co/200x200/F9F7F2/1A1A1A.png?text=Xian`} 
                            alt={item.name} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-brand-black text-lg">{item.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-brand-red font-black">{item.price.toFixed(2)} JOD</span>
                            <span className="text-brand-black/30 font-bold text-xs">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-brand-black/10 hover:text-brand-red transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
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
                              <h3 className="text-2xl font-black text-brand-red">Store Currently Closed 🛑</h3>
                              <p className="text-sm text-brand-red/80 font-bold leading-relaxed px-4">Sorry, we cannot accept new orders at this time. Please try again when the store is open.</p>
                           </div>
                       </div>
                    ) : !session ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-8 text-center bg-brand-cream/30 rounded-3xl border-2 border-dashed border-brand-gray/50 p-6">
                        <div className="bg-white p-6 rounded-full shadow-sm">
                           <AlertCircle size={40} className="text-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-xl font-black text-brand-black">Sign In Required</h3>
                           <p className="text-sm text-brand-black/40 font-medium">One step away from completing your order and sharing the experience with us.</p>
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
                          <span>Sign in with Google to continue</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 mb-2">
                           <h3 className="font-black text-xl text-brand-black">Order Options</h3>
                           
                           {/* TOGGLE PICKUP/DELIVERY */}
                           <div className="flex bg-gray-100 p-1 rounded-xl">
                              <button 
                                onClick={() => setOrderType('DELIVERY')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'DELIVERY' ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
                              >Delivery</button>
                              <button 
                                onClick={() => setOrderType('PICKUP')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${orderType === 'PICKUP' ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
                              >Pickup</button>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="relative">
                            <User className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" size={18} />
                            <input 
                              placeholder="Full Name" 
                              className="w-full bg-brand-cream/50 pr-12 pl-6 py-5 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px]"
                              value={form.name}
                              onChange={(e) => setForm({...form, name: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" size={18} />
                            <input 
                              placeholder="Phone Number" 
                              className="w-full bg-brand-cream/50 pr-12 pl-6 py-5 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px]"
                              dir="ltr"
                              value={form.phone}
                              onChange={(e) => setForm({...form, phone: e.target.value})}
                            />
                          </div>
  
                          {orderType === 'DELIVERY' ? (
                            <>
                                <div className="relative group">
                                  <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" size={18} />
                                  <input 
                                    placeholder="Address (Area, Street, Building)" 
                                    className="w-full bg-brand-cream/50 pr-12 pl-14 py-5 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px]"
                                    value={form.address}
                                    onChange={(e) => setForm({...form, address: e.target.value})}
                                  />
                                  <button 
                                    type="button"
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting}
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all flex items-center gap-1.5 ${isDetecting ? 'bg-brand-red text-white' : 'text-brand-black/40 hover:text-brand-red hover:bg-brand-cream/80'}`}
                                    title="Detect my location"
                                  >
                                    <Locate size={16} className={isDetecting ? 'animate-pulse' : ''} />
                                    {isDetecting ? (
                                      <span className="text-[10px] font-black uppercase tracking-tighter">Locating...</span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase tracking-tighter hidden group-hover:block transition-all">Detect</span>
                                    )}
                                  </button>
                                </div>
                            </>
                          ) : (
                            <div className="relative">
                              <Clock className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" size={18} />
                              <input 
                                type="time"
                                placeholder="Pickup Time" 
                                className="w-full bg-brand-cream/50 pr-12 pl-6 py-5 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px]"
                                value={form.pickupTime}
                                onChange={(e) => setForm({...form, pickupTime: e.target.value})}
                              />
                            </div>
                          )}
  
                          <textarea 
                            placeholder="Additional Notes (Optional)..." 
                            className="w-full bg-brand-cream/50 px-6 py-5 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px] min-h-[80px] resize-none"
                            value={form.notes}
                            onChange={(e) => setForm({...form, notes: e.target.value})}
                          />
                        </div>
  
                        {/* PROMO CODE SECTION */}
                        <div className="pt-4 border-t border-brand-gray/20">
                          <label className="text-[10px] font-black text-brand-black/40 uppercase tracking-widest mb-2 block">Promo Code (Optional)</label>
                          <div className="flex gap-2 relative">
                            <input 
                              placeholder="Enter promo code (WELCOME30)" 
                              className="w-full bg-brand-cream/50 pl-4 pr-4 py-3 rounded-xl border border-brand-gray/40 focus:bg-white focus:border-brand-red/30 outline-none transition-all font-bold text-[16px] uppercase"
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
                                className="bg-brand-black text-white px-4 py-3 rounded-xl font-black text-xs hover:bg-brand-red transition-all disabled:opacity-50 min-w-[80px]"
                              >
                                {validatingCoupon ? '...' : 'Apply'}
                              </button>
                            )}
                          </div>
                          {couponError && <p className="text-brand-red text-xs font-bold mt-2">{couponError}</p>}
                          {couponSuccess && <p className="text-green-600 text-xs font-bold mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> {couponSuccess}</p>}
                        </div>

                        {errorMsg && (
                          <p className="text-brand-red text-xs font-black text-center animate-pulse pt-2">{errorMsg}</p>
                        )}
  
                        {/* PAYMENT METHOD SELECTION */}
                        <div className="pt-6 border-t border-brand-gray/20">
                          <h4 className="font-black text-brand-black mb-3">Payment Method</h4>
                          <div className="grid grid-cols-2 gap-3 pb-2">
                             <button 
                               onClick={() => setPaymentMethod('CASH')}
                               className={`border-2 rounded-xl py-3 font-bold transition-all ${paymentMethod === 'CASH' ? 'border-brand-red bg-red-50 text-brand-red shadow-sm' : 'border-brand-gray/30 text-brand-black/50 hover:border-brand-gray'}`}
                             >
                               Cash on Delivery
                             </button>
                             <button 
                               onClick={() => setPaymentMethod('CLIQ')}
                               className={`border-2 rounded-xl py-3 font-bold transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'CLIQ' ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm' : 'border-brand-gray/30 text-brand-black/50 hover:border-brand-gray'}`}
                             >
                               <span className="flex items-center gap-1"><Zap size={14} className={paymentMethod === 'CLIQ' ? 'text-purple-600' : 'text-gray-400'}/> CliQ</span>
                             </button>
                          </div>
                          {paymentMethod === 'CLIQ' && (
                             <div className="bg-purple-100/50 p-4 rounded-xl border border-purple-200 text-center mb-2 animate-fade-in text-sm mt-3">
                               <p className="text-purple-800 font-bold mb-1">Please transfer to the following Alias:</p>
                               <span className="bg-white px-3 py-1 rounded-md border border-purple-200 font-black text-purple-900 tracking-widest text-lg inline-block my-1 shadow-sm select-all">XIANREST</span>
                               <p className="text-purple-600/80 font-bold mt-1 text-xs px-2 leading-relaxed">We will verify the transfer and approve your order in real-time.</p>
                             </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-brand-gray/20">
                          <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                               <span className="text-brand-black/40 font-bold">Subtotal</span>
                               {discountPercent > 0 && <span className="text-green-600 text-xs font-black">Welcome Discount ({(discountPercent * 100).toFixed(0)}%)</span>}
                             </div>
                             <div className="flex flex-col items-end">
                               {discountPercent > 0 ? (
                                 <>
                                   <span className="font-bold text-sm text-brand-black/30 line-through">{currentTotal.toFixed(2)} JOD</span>
                                   <span className="font-black text-lg text-green-600">{getFinalPrice().toFixed(2)} JOD</span>
                                 </>
                               ) : (
                                 <span className="font-black text-lg">{currentTotal.toFixed(2)} JOD</span>
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
                                <span>Confirm Order • {getFinalPrice().toFixed(2)} JOD</span>
                                <ArrowRight size={20} className="mr-2" />
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
