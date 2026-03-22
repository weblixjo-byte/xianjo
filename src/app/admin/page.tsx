'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminHeader from '@/components/AdminHeader';
import { 
  CheckCircle, RefreshCcw, User, Phone, MapPin, Trash2, Clock, 
  ShieldCheck, Box, ChevronRight, Package, Volume2, VolumeX, 
  Bell, ExternalLink, AlertCircle, CheckCircle2, Zap, Store, Ticket,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  phoneNumber: string;
  address?: string;
  deliveryArea?: string;
  pickupTime?: string;
  orderType?: 'DELIVERY' | 'PICKUP';
  notes?: string;
  totalPrice: number;
  status: string;
  couponCode?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  items: OrderItem[];
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const orderCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Context to bypass browser restrictions
  const unlockAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Play a silent buffer to unlock
    const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);

    // Initialize the looping alarm object
    if (!alarmRef.current) {
      alarmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      alarmRef.current.loop = true;
    }

    setIsAudioUnlocked(true);
    toast.success('تم تفعيل جرس التنبيهات بنجاح 🔔', {
      style: { borderRadius: '20px', background: '#1A1A1A', color: '#fff', fontWeight: 'bold' }
    });
  };

  const playAlarm = () => {
    if (!isAudioUnlocked || !alarmRef.current) return;
    alarmRef.current.play().catch(e => console.error("Alarm failed:", e));
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  const fetchOrders = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const data = await res.json();
      
      if (res.ok) {
        setOrders(data);
        
        // Check for ANY pending orders or Unverified CliQ Payments to trigger/keep alarm going
        const shouldRing = data.some((o: Order) => 
          o.status === 'PENDING' || 
          (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED')
        );
        
        if (shouldRing && isAudioUnlocked) {
          playAlarm();
        } else {
          stopAlarm();
        }

        // Specific toast for NEW arrivals (only if count increased)
        if (!isInitial && data.length > orderCountRef.current) {
          const newOrder = data[0]; 
          toast(`🔥 طلب جديد وصل! رقم: #${newOrder.id.slice(-4)}`, {
            duration: 8000,
            icon: '🚨',
            style: { borderRadius: '20px', background: '#922724', color: '#fff', border: 'none', fontWeight: 'black' }
          });
        }
        orderCountRef.current = data.length;
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    // Give state a moment to update the hidden div
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذا الطلب؟')) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id));
        orderCountRef.current -= 1;
        toast.success('تمت أرشفة الطلب بنجاح');
        
        // Check if we should stop alarm after removal
        const shouldRing = orders.some((o: Order) => 
          o.id !== id && (o.status === 'PENDING' || (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED'))
        );
        if (!shouldRing) stopAlarm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedOrders = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);
        toast.success('تم تحديث حالة الطلب');

        // If no more pending or unverified payments, stop the noise
        const shouldRing = updatedOrders.some(o => 
          o.status === 'PENDING' || (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED')
        );
        if (!shouldRing) stopAlarm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaymentReceived = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'COMPLETED' })
      });
      if (res.ok) {
        const updatedOrders = orders.map(o => o.id === id ? { ...o, paymentStatus: 'COMPLETED' } : o);
        setOrders(updatedOrders);
        toast.success('تم التأكيد! تم إيقاف الإنذار وتحديث حالة العميل.');

        const shouldRing = updatedOrders.some(o => 
          o.status === 'PENDING' || (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED')
        );
        if (!shouldRing) stopAlarm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStore = async () => {
    if (isStoreOpen === null) return;
    const newState = !isStoreOpen;
    setIsStoreOpen(newState);
    const loadingToast = toast.loading('جاري التحديث...');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: newState })
      });
      if (res.ok) {
        toast.success(newState ? 'المطعم الآن يستقبل الطلبات' : 'تم إغلاق المطعم وإيقاف الطلبات', { id: loadingToast });
      } else {
        throw new Error();
      }
    } catch {
      toast.error('فشل التحديث', { id: loadingToast });
      setIsStoreOpen(!newState); // revert
    }
  };

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data && typeof data.isStoreOpen === 'boolean') {
        setIsStoreOpen(data.isStoreOpen);
      }
    });

    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 8000); // Aggressive 8s refresh
    return () => clearInterval(interval);
  }, [isAudioUnlocked]);

  return (
    <div className="min-h-screen bg-[#F9F7F2] relative" dir="rtl">
      <Toaster position="bottom-center" />

      {/* HIDDEN PRINT AREA */}
      {printingOrder && (
        <div id="print-area" className="hidden print:block">
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h1 className="text-2xl font-black uppercase">Xian Restaurant</h1>
            <p className="text-xs font-bold">مطعم شيان</p>
            <p className="text-[10px] mt-1">عمان، الأردن • Amman, Jordan</p>
            <p className="text-[10px]">+962 77 999 0504</p>
          </div>

          <div className="space-y-2 mb-4 text-xs">
            <div className="flex justify-between">
              <span>رقم الطلب:</span>
              <span className="font-black">#{printingOrder.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>التاريخ:</span>
              <span>{new Date(printingOrder.createdAt).toLocaleString('ar-JO')}</span>
            </div>
            <div className="flex justify-between">
              <span>النوع:</span>
              <span className="font-black">{printingOrder.orderType === 'DELIVERY' ? 'توصيل' : 'استلام'}</span>
            </div>
          </div>

          <div className="border-b-2 border-black mb-4"></div>

          <div className="space-y-3 mb-6">
            {printingOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex gap-2">
                  <span className="font-black">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-black pt-4 space-y-1 text-sm">
            <div className="flex justify-between font-black">
              <span>الإجمالي:</span>
              <span>{printingOrder.totalPrice.toFixed(2)} د.أ</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>طريقة الدفع:</span>
              <span>{printingOrder.paymentMethod === 'CLIQ' ? 'كليك' : 'كاش'}</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-[10px] space-y-2">
            <p className="font-black">العميل: {printingOrder.customerName}</p>
            <p>الهاتف: {printingOrder.phoneNumber}</p>
            {printingOrder.orderType === 'DELIVERY' && (
              <p className="leading-tight">العنوان: {printingOrder.deliveryArea} - {printingOrder.address}</p>
            )}
            {printingOrder.notes && (
              <p className="bg-gray-100 p-2 italic">ملاحظة: {printingOrder.notes}</p>
            )}
          </div>

          <div className="mt-10 text-center text-[8px] uppercase tracking-widest opacity-50">
            Thank you for choosing Xian!
          </div>
        </div>
      )}

      {/* FORCE INTERACTION OVERLAY - Aggressive Mode */}
      <AnimatePresence>
        {!isAudioUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full text-center space-y-12"
            >
              <div className="flex justify-center">
                <div className="bg-brand-red p-8 rounded-[3rem] text-white shadow-[0_0_50px_rgba(146,39,36,0.5)] animate-pulse">
                  <Bell size={64} strokeWidth={1} />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-white font-serif leading-tight">نظام التنبيهات الفوري</h1>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Security Protocol • Audio Init Required</p>
                <p className="text-white/60 text-lg font-medium leading-relaxed">يرجى تفعيل الصوت لضمان استقبال الطلبات فور وصولها. سينطلق الإنذار تلقائياً عند أي طلب جديد.</p>
              </div>
              <button 
                onClick={unlockAudio}
                className="w-full bg-white text-brand-black hover:bg-brand-red hover:text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
              >
                <span>تفعيل الإنذار الآن 🔔</span>
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-7xl">
          
          {/* Admin Header */}
          <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-16 bg-white p-10 lg:p-12 rounded-[3.5rem] border-2 border-brand-gray shadow-sm relative overflow-hidden transition-all">
            <div className="flex items-center gap-6">
              <div className="bg-brand-red p-5 rounded-3xl text-white shadow-xl shadow-brand-red/10">
                <ShieldCheck size={40} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-brand-red font-serif mb-2">إدارة شيان</h1>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                   <p className="text-brand-black/30 font-bold uppercase tracking-[0.3em] text-xs">Live Monitoring Active</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
              {isStoreOpen !== null && (
                <button 
                  onClick={handleToggleStore}
                  className={`flex flex-col md:flex-row items-center justify-center gap-3 px-8 py-4 rounded-3xl font-black transition-all shadow-sm border-2 ${isStoreOpen ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-brand-red border-red-200 hover:bg-red-100'} hover:scale-[1.02] active:scale-95`}
                >
                  <Store size={24} />
                  <span>{isStoreOpen ? 'المطعم يعمل حالياً ✅' : 'المطعم مغلق 🛑'}</span>
                </button>
              )}

              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                 <Link 
                    href="/admin/coupons"
                    className="flex-1 lg:flex-none bg-brand-cream text-brand-black border border-brand-gray px-6 xl:px-8 py-4 xl:py-5 rounded-full font-black shadow-sm transition-all flex items-center justify-center gap-3 hover:border-brand-red/20 hover:scale-105"
                  >
                    <Ticket size={24} className="text-brand-red" />
                    <span className="hidden lg:inline text-lg">الكوبونات</span>
                  </Link>
                  
                 <Link 
                    href="/admin/products"
                    className="flex-1 lg:flex-none bg-white text-brand-black border border-brand-gray px-6 xl:px-8 py-4 xl:py-5 rounded-full font-black shadow-sm transition-all flex items-center justify-center gap-3 hover:border-brand-red/20 hover:scale-105"
                  >
                    <Package size={24} />
                    <span className="hidden lg:inline text-lg">المنتجات</span>
                  </Link>
                  
                  <button 
                    onClick={() => fetchOrders(true)}
                    className="flex-none btn-burgundy px-10 py-4 xl:py-5 rounded-full font-black shadow-xl shadow-brand-red/10 transition-all flex items-center justify-center gap-3"
                  >
                    <RefreshCcw size={24} />
                  </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-8">
               <div className="relative">
                  <div className="w-20 h-20 border-2 border-brand-red/10 border-t-brand-red rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Box size={24} className="text-brand-red animate-pulse" />
                  </div>
               </div>
               <p className="text-brand-red font-black text-xl tracking-widest animate-pulse font-serif">جاري المزامنة..</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-10">
              {orders.length === 0 ? (
                 <div className="col-span-full bg-white py-40 text-center flex flex-col items-center gap-8 rounded-[4rem] border-2 border-dashed border-brand-gray">
                   <Box size={80} className="text-brand-black/10" strokeWidth={1} />
                   <h2 className="text-3xl font-serif text-brand-black/30">لا توجد طلبات حالياً</h2>
                   <p className="text-brand-black/10 font-bold uppercase tracking-[0.4em] text-[10px]">Waiting for new gastro inquiries</p>
                 </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-[3rem] overflow-hidden shadow-sm border border-brand-gray hover:shadow-xl transition-all duration-700 flex flex-col group relative
                    ${order.status === 'PENDING' ? 'ring-4 ring-brand-red ring-inset animate-pulse' : ''}`}>
                    
                    {/* Status Header */}
                    <div className="p-8 pb-4 flex justify-between items-center bg-brand-cream/10 border-b border-brand-gray">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-black/20">Ref: #{order.id.slice(-6).toUpperCase()}</span>
                        <span className="font-black text-brand-black text-xl font-serif flex items-center gap-2">
                          <Clock size={16} className="text-brand-red" />
                          {new Date(order.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border 
                          ${order.orderType === 'PICKUP' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-blue-500 text-white border-blue-500 shadow-md'}`}>
                          {order.orderType === 'PICKUP' ? (
                            <>
                              <Clock size={12} />
                              <span>استلام</span>
                            </>
                          ) : (
                            <>
                              <Package size={12} />
                              <span>توصيل</span>
                            </>
                          )}
                        </div>
                        {order.paymentMethod === 'CLIQ' && (
                          <div className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border shadow-md
                            ${order.paymentStatus === 'COMPLETED' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-600 text-white border-purple-600 animate-pulse'}`}>
                            <Zap size={12} />
                            <span>كليك</span>
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border 
                          ${order.status === 'PENDING' ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20' : 
                            order.status === 'PREPARING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            order.status === 'READY' ? 'bg-brand-red/5 text-brand-red border-brand-red/10' :
                            'bg-green-50 text-green-600 border-green-100'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'PENDING' ? 'bg-white animate-ping' : 'bg-current'}`}></div>
                          {order.status === 'PENDING' ? 'طلب جديد • عاجل' : 
                           order.status === 'PREPARING' ? 'تحت التجهيز' :
                           order.status === 'READY' ? 'جاهز للتسليم' :
                           'تم الاستلام'}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-brand-black border-2 border-brand-gray rounded-2xl hover:bg-brand-black hover:text-white transition-all shadow-sm active:scale-95 group/print"
                        >
                          <Printer size={16} className="text-brand-red group-hover/print:text-white" />
                          <span className="text-[10px] font-black uppercase tracking-widest">طباعة الفاتورة</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-8 pt-6 space-y-10 flex-1 flex flex-col">
                      
                      {/* SECTION A: Customer Info */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                           <h5 className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] border-r-4 border-brand-red pr-3">A. بيانات العميل</h5>
                           {order.user && (
                             <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                               <ShieldCheck size={10} /> حساب موثق (Google)
                             </div>
                           )}
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl border border-brand-gray relative overflow-hidden">
                            {order.user?.image && (
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full overflow-hidden border border-brand-gray/50 shadow-sm opacity-50">
                                <Image src={order.user.image} alt="User" fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-2 rounded-xl text-brand-red shadow-sm"><User size={20} /></div>
                              <div className="flex flex-col">
                                <span className="font-black text-brand-black text-lg">{order.customerName}</span>
                                {order.user?.email && <span className="text-[10px] text-brand-black/40 font-bold">{order.user.email}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl border border-brand-gray group/link hover:border-brand-red/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-2 rounded-xl text-brand-red shadow-sm"><Phone size={20} /></div>
                              <span className="font-bold text-brand-black text-lg tracking-tight" dir="ltr">{order.phoneNumber}</span>
                            </div>
                            <a href={`tel:${order.phoneNumber}`} className="bg-brand-red text-white p-2 rounded-xl shadow-lg shadow-brand-red/20 hover:scale-110 transition-all">
                              <Phone size={14} fill="currentColor" />
                            </a>
                          </div>

                          {/* PAYMENT METHOD UI DISPLAY */}
                          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all
                            ${order.paymentMethod === 'CLIQ' ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl shadow-sm flex items-center justify-center ${order.paymentMethod === 'CLIQ' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white w-9 h-9'}`}>
                                {order.paymentMethod === 'CLIQ' ? <Zap size={20} /> : <span className="font-extrabold text-sm">$</span>}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${order.paymentMethod === 'CLIQ' ? 'text-purple-600' : 'text-green-600'}`}>طريقة الدفع المختارة</span>
                                <span className="font-black text-brand-black text-sm">{order.paymentMethod === 'CLIQ' ? 'حوالة بنكية (CliQ)' : 'كاش عند الاستلام'}</span>
                              </div>
                            </div>
                            {order.paymentMethod === 'CLIQ' && (
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black shadow-sm border ${order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-purple-200 text-purple-800 border-purple-300 animate-pulse'}`}>
                                {order.paymentStatus === 'COMPLETED' ? 'تم الاستلام' : 'بانتظار التحويل'}
                              </span>
                            )}
                          </div>

                          {order.orderType === 'DELIVERY' ? (
                            <div className="flex items-start justify-between p-4 bg-[#F9F7F2] rounded-2xl border border-brand-gray group/link hover:border-brand-red/30 transition-all">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="bg-white p-2 rounded-xl text-brand-red shadow-sm"><MapPin size={20} /></div>
                                <div className="flex flex-col flex-1 min-w-0">
                                   <span className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-2 px-1">{order.deliveryArea || 'منطقة التوصيل'}</span>
                                   {order.address?.startsWith('http') ? (
                                     <div className="flex flex-col gap-3">
                                       <button 
                                         onClick={() => {
                                           navigator.clipboard.writeText(order.address || '');
                                           toast.success('تم نسخ الرابط الموقع!');
                                         }}
                                         className="w-full bg-brand-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                       >
                                         <MapPin size={16} className="text-brand-red" />
                                         <span>نسخ رابط الموقع (Copy Link)</span>
                                       </button>
                                       <div className="px-1 flex items-center gap-1.5 opacity-30">
                                         <div className="w-1.5 h-1.5 bg-brand-red rounded-full"></div>
                                         <p className="text-[9px] font-bold truncate">رابط قوقل ماب مفعل</p>
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="p-4 bg-white/50 rounded-2xl border border-brand-gray/50">
                                        <p className="font-bold text-brand-black text-sm leading-relaxed whitespace-pre-line">{order.address}</p>
                                     </div>
                                   )}
                                </div>
                              </div>
                              <a 
                                href={order.address?.startsWith('http') ? order.address : `https://maps.google.com/?q=${encodeURIComponent(order.address || '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-brand-black text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-all flex-shrink-0"
                              >
                                <MapPin size={14} fill="currentColor" />
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border-2 border-orange-200 group/link transition-all">
                              <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-xl text-orange-600 shadow-sm border border-orange-100"><Clock size={20} /></div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">وقت الاستلام المفضل</span>
                                   <span className="font-black text-brand-black text-2xl tracking-tighter">{order.pickupTime}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SECTION B: Order Content */}
                      <div className="space-y-6">
                        <h5 className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] mb-4 border-r-4 border-brand-red pr-3">B. تفاصيل الطلب</h5>
                        <div className={`rounded-[2.5rem] p-6 space-y-4 border transition-all duration-500
                          ${order.status === 'PENDING' ? 'bg-brand-red text-white border-brand-red shadow-2xl scale-[1.02]' : 'bg-brand-black/5 border-brand-gray/50'}`}>
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm py-1">
                              <div className="flex items-center gap-4">
                                <span className={`${order.status === 'PENDING' ? 'bg-white text-brand-red' : 'bg-brand-red text-white'} px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg`}>{item.quantity}x</span>
                                <span className={`font-black text-lg ${order.status === 'PENDING' ? 'text-white' : 'text-brand-black/80'}`}>{item.name}</span>
                              </div>
                              <span className={`font-serif font-black tracking-tighter ${order.status === 'PENDING' ? 'text-white/80' : 'text-brand-black/30'}`}>{item.price.toFixed(2)} <small className="text-[8px] tracking-normal font-sans uppercase">JD</small></span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECTION C: Kitchen Notes */}
                      {order.notes && (
                        <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] mb-4 border-r-4 border-brand-red pr-3">C. ملاحظات المطبخ</h5>
                          <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-3xl relative overflow-hidden group/notes">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200/40 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover/notes:scale-150" />
                            <div className="relative flex items-start gap-4">
                              <div className="bg-white p-3 rounded-2xl shadow-sm border border-yellow-200 text-yellow-600">
                                 <AlertCircle size={24} />
                              </div>
                              <p className="text-brand-black font-black text-xl italic leading-relaxed pt-1">"{order.notes}"</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer & Actions */}
                      <div className="pt-10 mt-auto border-t border-brand-gray flex flex-col gap-8">
                        <div className="flex justify-between items-center bg-brand-red/5 p-6 rounded-3xl border border-brand-red/10">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-brand-red uppercase tracking-[0.4em]">صافي المبلغ</span>
                              <span className="text-brand-black/20 text-[10px] uppercase font-bold tracking-widest mt-1">Order Final Value</span>
                           </div>
                           <div className="flex flex-col items-end">
                             {order.couponCode && (
                               <span className="text-[10px] font-black text-green-600 bg-green-100 px-3 py-1.5 rounded-lg mb-2 uppercase tracking-widest border border-green-200 shadow-sm">
                                 كوبون الترحيب: {order.couponCode}
                               </span>
                             )}
                             <div className="text-4xl font-black text-brand-red font-serif tracking-tighter">
                               {order.totalPrice.toFixed(2)} <span className="text-xs text-brand-black/20 tracking-normal font-sans uppercase">JD</span>
                             </div>
                           </div>
                        </div>

                        {order.paymentMethod === 'CLIQ' && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && order.status !== 'SHIPPED' && (
                           <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 relative overflow-hidden mb-2 shadow-inner">
                              <div className="absolute top-0 left-0 w-2 h-full bg-purple-500 animate-pulse"></div>
                              <h4 className="text-purple-800 font-black mb-2 flex items-center gap-2"><Zap size={18} /> بانتظار حوالة كليك!</h4>
                              <p className="text-purple-600 text-xs font-bold mb-4">يرجى التأكد من وصول الحوالة المالية، هذا الإجراء سيوقف الإنذار فوراً ويحدث شاشة العميل بالوقت الفعلي.</p>
                              <button 
                                onClick={(e) => handlePaymentReceived(order.id, e)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                              >
                                تأكيد الاستلام • إيقاف الإنذار
                              </button>
                           </div>
                         )}

                         <div className="flex flex-col gap-4">
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                              className="w-full bg-brand-red text-white py-8 rounded-2xl flex items-center justify-center gap-4 font-black shadow-[0_20px_40px_rgba(146,39,36,0.3)] transition-all hover:scale-[1.02] active:scale-95 text-xl group"
                            >
                              <Zap size={24} className="animate-bounce" />
                              <span>قبول الطلب • ابدأ المطبخ</span>
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'READY')}
                              className="w-full bg-brand-black text-white py-6 rounded-2xl flex items-center justify-center gap-4 font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-lg"
                            >
                              تم الانتهاء • الطلب جاهز <CheckCircle size={20} />
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                              className="w-full bg-green-600 text-white py-6 rounded-2xl flex items-center justify-center gap-4 font-black shadow-2xl shadow-green-200 transition-all hover:scale-[1.02] active:scale-95 text-lg"
                            >
                              استلام وتسليم الطلب <Box size={20} />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => (order.status === 'PENDING' ? handleUpdateStatus(order.id, 'CANCELLED') : handleDelete(order.id))}
                            className={`w-full mt-4 flex items-center justify-center gap-2 font-black transition-all text-[10px] font-bold uppercase tracking-[0.2em]
                              ${order.status === 'PENDING' ? 'text-brand-red hover:bg-brand-red/5 p-4 rounded-xl' : 'text-brand-black/20 hover:text-brand-red'}`}
                          >
                            <Trash2 size={14} /> {order.status === 'PENDING' ? 'رفض الطلب وإلغاء' : 'أرشيف الطلب'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}