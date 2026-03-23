'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  CheckCircle, RefreshCcw, User, Phone, MapPin, Trash2, Clock, 
  ShieldCheck, Box, Package, 
  Bell, Zap, Store,
  Printer, X, Plus, Edit2, Camera, DollarSign, Save, LayoutGrid,
  Layers, Search, ArrowLeft, Folder, ChevronUp, ChevronDown, ListOrdered,
  CheckSquare, MoveRight, Ticket, Power, Check
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  category: string;
  imageUrl?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isAvailable: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
}
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '@/store/useLanguage';

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

interface Customer {
  name: string;
  phone: string;
  area: string;
  email?: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  itemBreakdown: { name: string; quantity: number }[];
  orders: Order[];
}


export default function AdminDashboard() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const orderCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  type Tab = 'ORDERS' | 'HISTORY' | 'CUSTOMERS' | 'REPORTS' | 'SYSTEM' | 'PRODUCTS' | 'COUPONS';
  const [activeTab, setActiveTab] = useState<Tab>('ORDERS');

  // PRODUCTS STATE
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [productFormData, setProductFormData ] = useState({
    nameEn: '', nameAr: '', price: '', category: 'Sushi', imageUrl: '', descriptionAr: '', descriptionEn: ''
  });

  // COUPONS STATE
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // New States for expanded features
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [reportType, setReportType] = useState('daily');
  const [dateRange] = useState({ start: '', end: '' });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Initialize Audio Context to bypass browser restrictions
  const unlockAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

  const playAlarm = useCallback(() => {
    if (!isAudioUnlocked || !alarmRef.current) return;
    alarmRef.current.play().catch(e => console.error("Alarm failed:", e));
  }, [isAudioUnlocked]);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  }, []);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
        const shouldRing = data.some((o: Order) => 
          o.status === 'PENDING' || 
          (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED')
        );
        if (shouldRing && isAudioUnlocked) playAlarm();
        else stopAlarm();
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
  }, [isAudioUnlocked, playAlarm, stopAlarm]);

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    // Give state a moment to update the hidden div
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذا الطلب؟ سيبقى في السجلات ولكن سيختفي من القائمة الرئيسية.')) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id));
        orderCountRef.current -= 1;
        toast.success('تمت أرشفة الطلب بنجاح');
        
        const shouldRing = orders.some((o: Order) => 
          o.id !== id && (o.status === 'PENDING' || (o.paymentMethod === 'CLIQ' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'SHIPPED'))
        );
        if (!shouldRing) stopAlarm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('تحذير: سيتم حذف هذا الطلب نهائياً من قاعدة البيانات! هل تريد المتابعة؟')) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id));
        toast.success('تم حذف الطلب نهائياً');
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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/reports?type=all');
      const data = await res.json();
      if (res.ok) {
        setHistoryOrders(data.orders);
      } else {
        toast.error(`خطأ: ${data.error || 'فشل تحميل الأرشيف'}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل الأرشيف');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (res.ok) setCustomers(data);
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل قائمة الزبائن');
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchReports = async (type = reportType, range = dateRange) => {
    setReportsLoading(true);
    try {
      let url = `/api/admin/reports?type=${type}`;
      if (type === 'custom' && range.start && range.end) {
        url += `&start=${range.start}&end=${range.end}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setReportData(data);
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل التقارير');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleResetSystem = async () => {
    const code = prompt('لتأكيد تصفير الموقع بالكامل (حذف جميع الطلبات والزبائن)، اكتب الكلمة التالية بالضبط: RESET');
    if (code !== 'RESET') return;
    
    const loadingToast = toast.loading('جاري تصفير البيانات...');
    try {
      const res = await fetch('/api/admin/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ALL_DATA' })
      });
      if (res.ok) {
        toast.success('تم تصفير جميع بيانات الطلبات بنجاح.', { id: loadingToast });
        fetchOrders(true);
        setActiveTab('ORDERS');
      } else {
        toast.error('فشلت العملية. حاول مرة أخرى.', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء التصفير', { id: loadingToast });
    }
  };

  // NEW: PRODUCTS HANDLERS
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setProductsLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.isStoreOpen !== undefined) setIsStoreOpen(data.isStoreOpen);
      if (data.categoryOrder) setCategoryOrder(JSON.parse(data.categoryOrder));
    } catch (e) { console.error(e); }
  };

  const handleProductToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { ...p, isAvailable: !currentStatus } : p));
        toast.success(currentStatus ? 'تم إخفاء المنتج' : 'المنتج متوفر الآن');
      }
    } catch (e) { console.error(e); }
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        toast.success('تم حذف المنتج بنجاح');
      }
    } catch (e) { console.error(e); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PATCH' : 'POST';
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const loadingToast = toast.loading('جاري حفظ المنتج...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData)
      });
      if (res.ok) {
        setIsProductPanelOpen(false);
        setEditingProduct(null);
        fetchProducts();
        toast.success('تم الحفظ بنجاح', { id: loadingToast });
      } else { toast.error('فشل الحفظ', { id: loadingToast }); }
    } catch (e) { console.error(e); toast.error('خطأ غير متوقع', { id: loadingToast }); }
  };

  // NEW: COUPONS HANDLERS
  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data);
    } catch { toast.error('فشل جلب الكوبونات'); }
    finally { setCouponsLoading(false); }
  };

  const handleCouponCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponDiscount) return;
    const toastId = toast.loading('جاري إضافة الكوبون...');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, discountPercent: parseInt(couponDiscount) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`تم إنشاء الكوبون بنجاح`, { id: toastId });
        setCoupons([data, ...coupons]);
        setCouponCode('');
        setCouponDiscount('');
      } else { toast.error(data.error || 'فشل إنشاء الكوبون', { id: toastId }); }
    } catch { toast.error('حدث خطأ غير متوقع', { id: toastId }); }
  };

  const handleCouponToggle = async (id: string, currentStatus: boolean) => {
    const loadingToast = toast.loading('جاري التحديث...');
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        toast.success(!currentStatus ? 'تم تفعيل الكوبون' : 'تم تعطيل الكوبون', { id: loadingToast });
      }
    } catch { toast.error('فشل التحديث', { id: loadingToast }); }
  };

  const handleCouponDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا الكوبون نهائياً؟')) return;
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        toast.success('تم الحذف بنجاح', { id: loadingToast });
      }
    } catch { toast.error('فشل الحذف', { id: loadingToast }); }
  };


  const handleReorderSave = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrder: JSON.stringify(categoryOrder) })
      });
      if (res.ok) {
        toast.success('تم حفظ الترتيب بنجاح');
        setIsReorderModalOpen(false);
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingOrder(false); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} منتجات؟`)) return;
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/products/${id}`, { method: 'DELETE' })));
      setProducts(products.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success('تم الحذف بنجاح', { id: loadingToast });
    } catch (e) { console.error(e); toast.error('فشل الحذف الجماعي', { id: loadingToast }); }
  };

  const handleBulkMove = async () => {
    if (!bulkCategory) return;
    setIsBulkUpdating(true);
    const loadingToast = toast.loading('جاري النقل...');
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: bulkCategory })
      })));
      fetchProducts();
      setSelectedIds([]);
      setIsBulkMoveModalOpen(false);
      toast.success('تم النقل بنجاح', { id: loadingToast });
    } catch (e) { console.error(e); toast.error('فشل النقل الجماعي', { id: loadingToast }); }
    finally { setIsBulkUpdating(false); }
  };


  useEffect(() => {
    if (activeTab === 'HISTORY') fetchHistory();
    if (activeTab === 'CUSTOMERS') fetchCustomers();
    if (activeTab === 'REPORTS') fetchReports();
    if (activeTab === 'PRODUCTS') { fetchProducts(); fetchSettings(); }
    if (activeTab === 'COUPONS') fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // Check if push is supported and subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('Registering service worker...');
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
        });
    } else {
      console.warn('Push notifications are not supported in this browser.');
    }

    // Diagnostic log for VAPID key
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.warn('Warning: NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined on the client.');
    }

    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data && typeof data.isStoreOpen === 'boolean') {
        setIsStoreOpen(data.isStoreOpen);
      }
    });

    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 8000); // Aggressive 8s refresh
    return () => clearInterval(interval);
  }, [isAudioUnlocked, fetchOrders]);

  // Helper to get sorted categories based on categoryOrder
  const allUniqueCats = Array.from(new Set(products.flatMap(p => p.category ? p.category.split(',').map((c: string) => c.trim()).filter(Boolean) : [])));
  const sortedCategories = [...allUniqueCats].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col md:flex-row font-body" dir="rtl">
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
            <div className="flex justify-between"><span>رقم الطلب:</span><span className="font-black">#{printingOrder.id.slice(-6).toUpperCase()}</span></div>
            <div className="flex justify-between"><span>التاريخ:</span><span>{new Date(printingOrder.createdAt).toLocaleString('ar-JO')}</span></div>
            <div className="flex justify-between"><span>النوع:</span><span className="font-black">{printingOrder.orderType === 'DELIVERY' ? 'توصيل' : 'استلام'}</span></div>
          </div>
          <div className="border-b-2 border-black mb-4"></div>
          <div className="space-y-3 mb-6">
            {printingOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex gap-2"><span className="font-black">{item.quantity}x</span><span>{item.name}</span></div>
                <span className="font-bold">{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-black pt-4 space-y-1 text-sm">
            <div className="flex justify-between font-black"><span>الإجمالي:</span><span>{printingOrder.totalPrice.toFixed(2)} د.أ</span></div>
            <div className="flex justify-between text-[10px]"><span>طريقة الدفع:</span><span>{printingOrder.paymentMethod === 'CLIQ' ? 'كليك' : 'كاش'}</span></div>
          </div>
          <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-[10px] space-y-2">
            <p className="font-black">العميل: {printingOrder.customerName}</p>
            <p>الهاتف: {printingOrder.phoneNumber}</p>
            {printingOrder.orderType === 'DELIVERY' && <p className="leading-tight">العنوان: {printingOrder.deliveryArea} - {printingOrder.address}</p>}
          </div>
        </div>
      )}

      {/* INTERACTION OVERLAY */}
      <AnimatePresence>
        {!isAudioUnlocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-brand-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-md w-full text-center space-y-12">
              <div className="bg-brand-red p-8 rounded-[3rem] text-white shadow-2xl mx-auto w-fit animate-pulse"><Bell size={64} /></div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-white font-serif">تفعيل التنبيهات</h1>
                <p className="text-white/60">يرجى تفعيل الصوت لضمان استقبال الطلبات فور وصولها.</p>
              </div>
              <button onClick={unlockAudio} className="w-full bg-white text-brand-black py-8 rounded-[2.5rem] font-black text-xl active:scale-95 transition-all">تفعيل الآن 🔔</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-brand-black text-white flex flex-col p-6 sticky top-0 md:h-screen z-50 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-4 mb-20 px-2 mt-4">
          <div className="bg-brand-red p-3 rounded-2xl shadow-xl"><ShieldCheck size={28} /></div>
          <div>
            <h1 className="font-serif text-2xl font-black tracking-tight leading-none mb-1">إدارة شيان</h1>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {[
            { id: 'ORDERS', label: 'الطلبات الحالية', icon: Box, color: 'text-brand-red' },
            { id: 'PRODUCTS', label: 'إدارة القائمة', icon: LayoutGrid, color: 'text-brand-red' },
            { id: 'HISTORY', label: 'أرشيف الطلبات', icon: Package, color: 'text-blue-400' },
            { id: 'CUSTOMERS', label: 'الزبائن', icon: User, color: 'text-green-400' },
            { id: 'COUPONS', label: 'الكوبونات', icon: Ticket, color: 'text-purple-400' },
            { id: 'REPORTS', label: 'التقارير', icon: Printer, color: 'text-purple-400' },
            { id: 'SYSTEM', label: 'النظام', icon: Store, color: 'text-orange-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                if (tab.id === 'HISTORY') fetchHistory();
                if (tab.id === 'CUSTOMERS') fetchCustomers();
                if (tab.id === 'REPORTS') fetchReports();
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl font-black transition-all
                ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:bg-white/5 hover:text-white'}`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? tab.color : 'text-current'} />
              <span className="text-sm">{tab.label}</span>
              {tab.id === 'ORDERS' && orders.filter(o => o.status === 'PENDING').length > 0 && (
                <span className="mr-auto bg-brand-red text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                  {orders.filter(o => o.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-20 pt-10 border-t border-white/5 space-y-6 mb-4">
           {isStoreOpen !== null && (
              <button onClick={handleToggleStore} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-black transition-all ${isStoreOpen ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-brand-red/10 text-brand-red hover:bg-brand-red/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500 animate-ping' : 'bg-brand-red'}`}></div>
                  <span>{isStoreOpen ? 'المطعم مفتوح' : 'المطعم مغلق'}</span>
                </div>
              </button>
           )}
           <p className="text-[10px] text-white/20 font-medium text-center uppercase tracking-widest pb-4">Xian Ops • Stable 2.5</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-12 relative overflow-x-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-brand-black luxury-heading mb-3 tracking-tighter">
              {activeTab === 'ORDERS' ? 'لوحة المراقبة الحية' : 
               activeTab === 'HISTORY' ? 'سجل الطلبات القديمة' : 
               activeTab === 'CUSTOMERS' ? 'قاعدة بيانات الزبائن' : 
               activeTab === 'REPORTS' ? 'التقارير والمبيعات' : 
               activeTab === 'PRODUCTS' ? 'إدارة القائمة والأصناف' :
               activeTab === 'COUPONS' ? 'أكواد الخصم والكوبونات' : 'إعدادات النظام'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-brand-black/40 font-black text-xs uppercase tracking-widest">
                {activeTab === 'ORDERS' ? 'Live Monitoring Active' : 'System Secure'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => fetchOrders(true)} className="flex-1 md:flex-none btn-burgundy px-10 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-brand-red/10 group active:scale-95 transition-all">
                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                <span>تحديث</span>
             </button>
             <button onClick={() => window.print()} className="flex-1 md:flex-none bg-white border-2 border-brand-gray text-brand-black px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gray transition-all shadow-sm">
                <Printer size={20} />
                <span>طباعة</span>
             </button>
          </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'ORDERS' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                      <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
                      <p className="text-brand-black/40 font-black">جاري التحميل...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-white py-40 text-center flex flex-col items-center gap-8 rounded-[4rem] border-2 border-dashed border-brand-gray">
                      <Box size={80} className="text-brand-black/10" strokeWidth={1} />
                      <h2 className="text-3xl font-serif text-brand-black/30">لا توجد طلبات نشطة حالياً</h2>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                       {orders.map((order) => (
                         <OrderCard 
                            key={order.id} 
                            order={order} 
                            onUpdateStatus={handleUpdateStatus}
                            onArchive={handleArchive}
                            onPrint={handlePrint}
                            onPaymentReceived={handlePaymentReceived}
                          />
                       ))}
                    </div>
                  )}
              </motion.div>
            )}

            {activeTab === 'HISTORY' && (
                <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   {historyLoading ? (
                     <div className="py-20 text-center font-black">جاري تحميل السجلات...</div>
                   ) : historyOrders.length === 0 ? (
                     <div className="py-20 text-center text-gray-400">لا توجد سجلات قديمة</div>
                   ) : (
                     <div className="bg-white rounded-[2rem] overflow-hidden border border-brand-gray shadow-sm overflow-x-auto">
                        <table className="w-full text-right border-collapse min-w-[600px]">
                           <thead className="bg-brand-cream/20 border-b border-brand-gray">
                              <tr>
                                <th className="p-6 text-xs font-black uppercase text-brand-black/40">رقم الطلب</th>
                                <th className="p-6 text-xs font-black uppercase text-brand-black/40">الزبون</th>
                                <th className="p-6 text-xs font-black uppercase text-brand-black/40">التاريخ</th>
                                <th className="p-6 text-xs font-black uppercase text-brand-black/40">المبلغ</th>
                                <th className="p-6 text-xs font-black uppercase text-brand-black/40">الإجراءات</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-brand-gray">
                              {historyOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                                   <td className="p-6 font-black text-xs text-brand-red">#{order.id.slice(-6).toUpperCase()}</td>
                                   <td className="p-6">
                                      <p className="font-black text-xs">{order.customerName}</p>
                                      <p className="text-[10px] text-gray-400">{order.phoneNumber}</p>
                                   </td>
                                   <td className="p-6 text-[10px] font-bold">{new Date(order.createdAt).toLocaleDateString('ar-JO')}</td>
                                   <td className="p-6 font-black text-xs text-green-600">{order.totalPrice.toFixed(2)} د.أ</td>
                                   <td className="p-6">
                                      <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handlePrint(order); }} className="p-2 text-brand-black hover:text-brand-red transition-all"><Printer size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePermanent(order.id); }} className="p-2 text-gray-300 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                                      </div>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                   )}
                </motion.div>
            )}

            {activeTab === 'CUSTOMERS' && (
                <motion.div key="customers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   {customersLoading ? (
                     <div className="py-20 text-center font-black">جاري التحميل...</div>
                   ) : (
                     <div className="bg-white rounded-[2rem] overflow-hidden border border-brand-gray shadow-sm overflow-x-auto">
                        <table className="w-full text-right border-collapse min-w-[600px]">
                           <thead className="bg-brand-cream/20 border-b border-brand-gray">
                              <tr>
                                <th className="p-6 text-xs font-black text-brand-black/40">الاسم</th>
                                <th className="p-6 text-xs font-black text-brand-black/40">الهاتف</th>
                                <th className="p-6 text-xs font-black text-brand-black/40 text-left">آخر طلب</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-brand-gray">
                              {customers.map((c, j) => (
                                <tr key={j} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setSelectedCustomer(c)}>
                                   <td className="p-6 font-black text-xs text-brand-black">{c.name}</td>
                                   <td className="p-6 text-xs font-bold text-brand-black/60" dir="ltr">{c.phone}</td>
                                   <td className="p-6 text-xs font-bold text-gray-400 text-left whitespace-nowrap">
                                     {new Date(c.lastOrder).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')} @ {new Date(c.lastOrder).toLocaleTimeString(language === 'ar' ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                   </td>
                                </tr>
                              ))}
                              {customers.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="p-20 text-center font-black text-brand-black/20">لا يوجد زبائن حالياً</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}
                </motion.div>
            )}

               {activeTab === 'REPORTS' && (
                 <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-brand-gray shadow-sm">
                       {['daily', 'weekly', 'monthly', 'all'].map(t => (
                         <button 
                           key={t}
                           onClick={() => { setReportType(t); fetchReports(t); }}
                           className={`px-8 py-4 rounded-xl text-xs font-black transition-all ${reportType === t ? 'bg-brand-red text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                         >
                           {t === 'daily' ? 'اليوم لفواتير 24 ساعة' : t === 'weekly' ? 'أسبوعي' : t === 'monthly' ? 'شهري' : 'الكل'}
                         </button>
                       ))}
                    </div>

                    {reportsLoading ? (
                      <div className="py-20 text-center font-black">جاري إنشاء التقرير...</div>
                    ) : reportData && (
                      <>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-brand-black text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-bl-[8rem]"></div>
                             <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Gross Revenue</h4>
                             <p className="text-6xl font-black font-serif tracking-tighter mb-2">{reportData.totalRevenue.toFixed(2)} <small className="text-xs opacity-30 font-sans tracking-normal font-medium">JOD</small></p>
                             <p className="text-green-400 text-xs font-bold flex items-center gap-2">إجمالي مبيعات الفترة</p>
                          </div>
                          <div className="bg-white p-12 rounded-[3rem] border-2 border-brand-gray shadow-sm">
                             <h4 className="text-brand-black/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Total Orders</h4>
                             <p className="text-6xl font-black text-brand-black font-serif tracking-tighter mb-2">{reportData.totalOrders}</p>
                             <p className="text-brand-red text-xs font-bold">عدد الطلبات المكتملة</p>
                          </div>
                       </div>

                       <div className="bg-white rounded-[3rem] border-2 border-brand-gray shadow-sm overflow-hidden mt-8">
                          <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between">
                             <h4 className="text-xl font-black text-brand-black">{language === 'ar' ? 'الأكثر مبيعاً للفترة المختارة' : 'Sales by Product'}</h4>
                             <span className="text-xs font-bold text-brand-black/40">{reportData.itemBreakdown?.length} {language === 'ar' ? 'صنفاً' : 'Products'}</span>
                          </div>
                          <div className="overflow-x-auto">
                             <table className="w-full text-right border-collapse">
                                <thead className="bg-brand-gray/5 border-b border-brand-gray">
                                   <tr>
                                      <th className="p-6 text-xs font-black uppercase text-brand-black/40">الصنف</th>
                                      <th className="p-6 text-xs font-black uppercase text-brand-black/40">الكمية المباعة</th>
                                      <th className="p-6 text-xs font-black uppercase text-brand-black/40">الأداء</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {reportData.itemBreakdown?.map((item, idx) => (
                                      <tr key={idx} className="border-b border-brand-gray last:border-0 hover:bg-gray-50 transition-all">
                                         <td className="p-6 font-black text-xs text-brand-black">{item.name}</td>
                                         <td className="p-6">
                                            <div className="flex items-center gap-2">
                                               <span className="font-black text-lg text-brand-red">{item.quantity}</span>
                                               <span className="text-[10px] font-bold text-brand-black/20">طلبات</span>
                                            </div>
                                         </td>
                                         <td className="p-6">
                                            <div className="w-48 bg-brand-gray/20 h-2 rounded-full overflow-hidden">
                                               <div 
                                                  className="bg-brand-red h-full rounded-full transition-all duration-1000"
                                                  style={{ width: `${Math.min(100, (item.quantity / (reportData.itemBreakdown[0]?.quantity || 1)) * 100)}%` }}
                                               />
                                            </div>
                                         </td>
                                      </tr>
                                   ))}
                                   {(!reportData.itemBreakdown || reportData.itemBreakdown.length === 0) && (
                                      <tr>
                                         <td colSpan={3} className="p-12 text-center text-brand-black/20 font-bold">{language === 'ar' ? 'لا يوجد بيانات مبيعات لهذه الفترة' : 'No sales data for this period'}</td>
                                      </tr>
                                   )}
                                </tbody>
                             </table>
                          </div>
                       </div>
                      </>
                    )}
                 </motion.div>
               )}

                {activeTab === 'PRODUCTS' && (
                  <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                       <div className="flex items-center gap-4">
                          {selectedCategory && (
                            <button
                              onClick={() => { setSelectedCategory(null); setProductSearchQuery(''); }}
                              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-brand-gray/50 text-brand-black/40 hover:text-brand-red transition-all shadow-sm group font-bold text-sm"
                            >
                              <ArrowLeft size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                              <span>الرجوع للمجلدات</span>
                            </button>
                          )}
                          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                             <button
                                onClick={() => {
                                  setCategoryOrder(sortedCategories);
                                  setIsReorderModalOpen(true);
                                }}
                                className="flex-1 md:flex-none bg-white border-2 border-brand-gray text-brand-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gray transition-all shadow-sm"
                              >
                                <ListOrdered size={20} />
                                <span className="text-xs">ترتيب الأقسام</span>
                              </button>
                             <button 
                                onClick={() => { setEditingProduct(null); setProductFormData({ nameEn: '', nameAr: '', price: '', category: selectedCategory === 'الكل' ? (categoryOrder[0] || 'Sushi') : (selectedCategory || categoryOrder[0] || 'Sushi'), imageUrl: '', descriptionAr: '', descriptionEn: '' }); setIsProductPanelOpen(true); }}
                                className="flex-1 md:flex-none bg-brand-black text-white px-10 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all group"
                              >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-xs">إضافة منتج</span>
                             </button>
                          </div>
                       </div>
                       <div className="bg-white px-8 py-5 rounded-[2rem] border border-brand-gray/40 shadow-sm flex items-center gap-6">
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black uppercase tracking-widest text-brand-black/20">إجمالي الأصناف</span>
                           <span className="text-2xl font-black font-serif text-brand-black leading-none mt-1">{products.length}</span>
                         </div>
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                      <div className="relative flex-1 group">
                        <Search size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20 group-focus-within:text-brand-red transition-colors" />
                        <input
                          type="text"
                          placeholder={(selectedCategory && selectedCategory !== 'الكل') ? `البحث في ${selectedCategory}...` : "البحث في جميع المنتجات..."}
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="w-full bg-white border-2 border-brand-gray/40 rounded-[2rem] py-5 pr-14 pl-8 outline-none focus:border-brand-red/20 transition-all font-bold text-sm shadow-sm"
                        />
                      </div>
                      {(selectedCategory || productSearchQuery) && (
                        <button
                          onClick={() => {
                            const ids = products.filter(p => (p.nameAr.includes(productSearchQuery) || p.nameEn.toLowerCase().includes(productSearchQuery.toLowerCase())) && (!selectedCategory || selectedCategory === 'الكل' || p.category.includes(selectedCategory))).map(p => p.id);
                            if (selectedIds.length === ids.length) setSelectedIds([]);
                            else setSelectedIds(ids);
                          }}
                          className="flex items-center gap-3 bg-brand-black text-white px-8 py-5 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-black text-xs"
                        >
                          <CheckSquare size={18} />
                          <span>تحديد الكل ({selectedIds.length})</span>
                        </button>
                      )}
                    </div>

                    {productsLoading ? (
                      <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                      <>
                        {!selectedCategory && !productSearchQuery ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {sortedCategories.map((cat: string) => (
                              <button key={cat} onClick={() => setSelectedCategory(cat)} className="group relative h-64 bg-white rounded-[3rem] p-10 border-2 border-brand-gray/30 shadow-sm hover:border-brand-red/20 hover:shadow-2xl transition-all text-right flex flex-col justify-between overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 text-brand-red/5 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-0"><Folder size={180} strokeWidth={1} /></div>
                                <div className="relative z-10 w-16 h-16 bg-brand-cream rounded-[1.5rem] flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all duration-500 shadow-inner"><Folder size={28} /></div>
                                <div className="relative z-10">
                                  <h3 className="text-3xl font-black text-brand-black mb-1 font-serif group-hover:text-brand-red transition-colors">{cat}</h3>
                                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-black/20">{products.filter(p => p.category.includes(cat)).length} أصناف</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {products.filter(p => (p.nameAr.includes(productSearchQuery) || p.nameEn.toLowerCase().includes(productSearchQuery.toLowerCase())) && (!selectedCategory || selectedCategory === 'الكل' || p.category.includes(selectedCategory))).map(product => (
                              <div key={product.id} className={`group bg-white rounded-[2.5rem] p-6 lg:p-8 border-2 transition-all duration-500 cursor-pointer flex flex-col lg:flex-row gap-8 items-center ${selectedIds.includes(product.id) ? 'border-brand-red ring-8 ring-brand-red/5 shadow-2xl scale-[1.01]' : 'border-brand-gray hover:border-brand-red/20 shadow-sm'}`} onClick={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(i => i !== product.id) : [...prev, product.id])}>
                                <div className="flex items-center gap-8 flex-1">
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2 flex-shrink-0 ${selectedIds.includes(product.id) ? 'bg-brand-red border-brand-red text-white' : 'bg-brand-cream border-brand-gray/50 text-transparent'}`}><Check size={18} strokeWidth={4} /></div>
                                   <div className="relative w-24 h-24 flex-shrink-0 rounded-[2rem] overflow-hidden border-2 border-brand-gray/50 shadow-inner bg-brand-cream ring-4 ring-white">
                                      {product.imageUrl && <Image src={product.imageUrl} fill className="object-cover" alt={product.nameAr}/>}
                                   </div>
                                   <div>
                                      <h4 className="font-black text-2xl text-brand-black mb-1">{product.nameAr}</h4>
                                      <p className="text-[11px] font-bold text-brand-black/20 uppercase tracking-[0.2em]">{product.nameEn}</p>
                                   </div>
                                </div>
                                <div className="text-3xl font-black text-brand-red font-serif tracking-tighter">{product.price.toFixed(2)} <span className="text-[10px] text-brand-black/20 uppercase">JOD</span></div>
                                <div className="flex items-center gap-4">
                                   <button onClick={(e) => { e.stopPropagation(); handleProductToggle(product.id, product.isAvailable); }} className={`flex items-center gap-5 p-2 rounded-full transition-colors ${product.isAvailable ? 'text-green-600' : 'text-gray-300'}`}>
                                      <span className="text-[11px] font-black uppercase tracking-widest">{product.isAvailable ? 'نشط' : 'معطل'}</span>
                                      <div className={`w-14 h-7 rounded-full relative transition-all duration-500 flex items-center px-1 ${product.isAvailable ? 'bg-green-600' : 'bg-gray-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-xl transition-all ${product.isAvailable ? 'translate-x-7' : ''}`}/></div>
                                   </button>
                                   <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setProductFormData({ nameEn: product.nameEn, nameAr: product.nameAr, price: product.price.toString(), category: product.category, imageUrl: product.imageUrl || '', descriptionAr: product.descriptionAr || '', descriptionEn: product.descriptionEn || '' }); setIsProductPanelOpen(true); }} className="p-4 bg-brand-cream text-brand-black/30 hover:text-brand-red hover:bg-white rounded-2xl transition-all shadow-sm"><Edit2 size={20} /></button>
                                   <button onClick={(e) => { e.stopPropagation(); handleProductDelete(product.id); }} className="p-4 bg-brand-cream text-brand-black/30 hover:text-brand-red hover:bg-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'COUPONS' && (
                  <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                    <div className="bg-white p-12 rounded-[3.5rem] border-2 border-brand-gray shadow-sm">
                       <h2 className="text-2xl font-black mb-8 font-serif text-brand-black">إضافة كوبون خصم جديد</h2>
                       <form onSubmit={handleCouponCreate} className="flex flex-col md:flex-row gap-6">
                         <div className="flex-1 relative">
                            <Ticket size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20" />
                            <input 
                              type="text" placeholder="رمز الكوبون (مثال: FREE10)" 
                              value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                              className="w-full bg-brand-cream/30 border-2 border-brand-gray/50 focus:border-brand-red/30 rounded-3xl p-6 pr-14 outline-none font-black text-xl transition-all" required
                            />
                         </div>
                         <div className="flex-1 flex gap-4">
                            <input 
                              type="number" placeholder="نسبة الخصم %" 
                              value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)}
                              className="flex-1 bg-brand-cream/30 border-2 border-brand-gray/50 focus:border-brand-red/30 rounded-3xl p-6 outline-none font-black text-xl transition-all" required
                            />
                            <button type="submit" className="bg-brand-black text-white px-12 py-6 rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">إنشاء</button>
                         </div>
                       </form>
                    </div>

                    {couponsLoading ? (
                      <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {coupons.map(coupon => (
                          <div key={coupon.id} className={`bg-white p-10 rounded-[3rem] border-2 transition-all relative overflow-hidden ${coupon.isActive ? 'border-brand-gray shadow-sm' : 'opacity-60 border-brand-gray/30 grayscale'}`}>
                             <div className="flex justify-between items-start mb-10">
                                <div>
                                   <h3 className="text-4xl font-black font-serif text-brand-black tracking-tight">{coupon.code}</h3>
                                   <p className={`text-[10px] font-black uppercase mt-2 ${coupon.isActive ? 'text-green-600' : 'text-gray-400'}`}>{coupon.isActive ? 'Active' : 'Disabled'}</p>
                                </div>
                                <div className="text-4xl font-black text-brand-red font-serif">%{coupon.discountPercent}</div>
                             </div>
                             <div className="flex items-center justify-between pt-10 border-t border-brand-gray/10">
                                <button onClick={() => handleCouponToggle(coupon.id, coupon.isActive)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs transition-all ${coupon.isActive ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                   <Power size={18} /> {coupon.isActive ? 'تعطيل' : 'تفعيل'}
                                </button>
                                <button onClick={() => handleCouponDelete(coupon.id)} className="p-3 text-brand-black/20 hover:text-brand-red transition-all"><Trash2 size={22}/></button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

               {activeTab === 'SYSTEM' && (
                 <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl bg-white p-12 rounded-[3rem] border border-brand-gray shadow-sm">
                     <h3 className="text-2xl font-black text-brand-black mb-6">أدوات النظام المتقدمة</h3>
                     <div className="space-y-8">
                        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] space-y-4">
                           <h4 className="font-black text-brand-red flex items-center gap-2"><Trash2 size={20}/> تصفير الموقع (Data Reset)</h4>
                           <p className="text-xs text-red-600 font-bold">سيؤدي هذا الإجراء إلى حذف جميع الطلبات والزبائن بشكل نهائي وبدء الموقع ببيانات نظيفة. لا يمكن التراجع عن هذا الفعل.</p>
                           <button onClick={handleResetSystem} className="bg-brand-red text-white px-8 py-4 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-lg active:scale-95">تصفير بالكامل الآن</button>
                        </div>
                        
                        <div className="p-8 bg-gray-50 border border-brand-gray rounded-[2rem] space-y-4 opacity-50">
                           <h4 className="font-black text-brand-black">تصدير قاعدة البيانات (قريباً)</h4>
                           <p className="text-xs text-brand-black/40">بإمكانك قريباً تحميل نسخة من بيانات الطلبات بصيغة Excel.</p>
                        </div>
                     </div>
                 </motion.div>
               )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* PRODUCT ADD/EDIT PANEL (SIDE DRAWER) */}
        {isProductPanelOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductPanelOpen(false)} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col">
              <div className="p-8 border-b border-brand-gray flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-brand-black">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                   <p className="text-[10px] font-black uppercase text-brand-black/20 tracking-widest mt-1">{editingProduct ? 'Update existing item' : 'Create new menu item'}</p>
                </div>
                <button onClick={() => setIsProductPanelOpen(false)} className="p-4 bg-brand-gray/50 rounded-2xl text-brand-black/40 hover:text-brand-red transition-all"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">اسم المنتج (عربي)</label>
                   <input type="text" value={productFormData.nameAr} onChange={e => setProductFormData({...productFormData, nameAr: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" required />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">Product Name (EN)</label>
                   <input type="text" value={productFormData.nameEn} onChange={e => setProductFormData({...productFormData, nameEn: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" dir="ltr" required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">السعر (د.أ)</label>
                      <div className="relative">
                         <DollarSign size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" />
                         <input type="number" step="0.01" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 pr-12 outline-none font-black text-lg transition-all" required />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">القسم</label>
                      <select value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-black text-sm appearance-none cursor-pointer transition-all">
                         {Array.from(new Set(products.flatMap(p => p.category ? p.category.split(',').map((c: string) => c.trim()).filter(Boolean) : []))).sort().map(cat => <option key={cat as string} value={cat as string}>{cat as string}</option>)}
                         <option value="NEW">+ إضافة قسم جديد...</option>
                      </select>
                   </div>
                </div>
                {productFormData.category === 'NEW' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-red px-2">اسم القسم الجديد</label>
                    <input type="text" placeholder="مثال: مشروبات" onChange={e => setProductFormData({...productFormData, category: e.target.value})} className="w-full bg-brand-red/5 border-2 border-brand-red/20 focus:border-brand-red/40 focus:bg-white rounded-3xl p-5 outline-none font-black text-lg transition-all" required />
                  </div>
                )}
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">وصف المنتج (اختياري)</label>
                   <textarea value={productFormData.descriptionAr} onChange={e => setProductFormData({...productFormData, descriptionAr: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 outline-none font-bold text-sm min-h-[120px] resize-none transition-all" />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 px-2">رابط الصورة (URL)</label>
                   <div className="relative">
                      <Camera size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-black/20" />
                      <input type="text" value={productFormData.imageUrl} onChange={e => setProductFormData({...productFormData, imageUrl: e.target.value})} className="w-full bg-brand-gray/10 border-2 border-transparent focus:border-brand-red/20 focus:bg-white rounded-3xl p-5 pr-12 outline-none font-bold text-sm transition-all" />
                   </div>
                </div>
              </form>

              <div className="p-8 border-t border-brand-gray bg-gray-50 flex gap-4">
                 <button type="button" onClick={() => setIsProductPanelOpen(false)} className="flex-1 bg-white border-2 border-brand-gray p-5 rounded-3xl font-black text-brand-black/40 hover:bg-brand-gray transition-all">إلغاء</button>
                 <button onClick={handleProductSubmit} className="flex-[2] bg-brand-black text-white p-5 rounded-3xl font-black shadow-xl shadow-brand-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Save size={20} />
                    <span>حفظ التعديلات</span>
                 </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CATEGORY REORDER MODAL */}
        {isReorderModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReorderModalOpen(false)} className="absolute inset-0 bg-brand-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-10 border-b border-brand-gray flex justify-between items-center bg-brand-cream/30">
                 <div>
                    <h3 className="text-3xl font-black text-brand-black font-serif uppercase tracking-tighter">ترتيب الأقسام</h3>
                    <p className="text-[10px] font-black text-brand-black/30 uppercase tracking-[0.3em] mt-1">Order management</p>
                 </div>
                 <button onClick={() => setIsReorderModalOpen(false)} className="p-4 bg-white rounded-2xl text-brand-black/20 hover:text-brand-red transition-all shadow-sm"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-4 no-scrollbar">
                 <p className="text-[11px] font-black text-brand-red/60 text-center mb-6 bg-brand-red/5 p-4 rounded-2xl">استخدم الأسهم لتغيير ترتيب ظهور الأقسام في القائمة الرئيسية</p>
                 {categoryOrder.map((cat, idx) => (
                   <div key={cat} className="flex items-center justify-between bg-white p-6 rounded-3xl border-2 border-brand-gray/50 shadow-sm group hover:border-brand-red/30 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-red font-black text-xs shadow-inner">{idx + 1}</div>
                         <span className="font-black text-xl text-brand-black">{cat}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { const newOrder = [...categoryOrder]; if (idx > 0) { [newOrder[idx], newOrder[idx-1]] = [newOrder[idx-1], newOrder[idx]]; setCategoryOrder(newOrder); } }} className="p-3 bg-brand-cream rounded-xl text-brand-black/40 hover:text-brand-red hover:bg-white border border-transparent hover:border-brand-red/20 transition-all"><ChevronUp size={20}/></button>
                         <button onClick={() => { const newOrder = [...categoryOrder]; if (idx < categoryOrder.length - 1) { [newOrder[idx], newOrder[idx+1]] = [newOrder[idx+1], newOrder[idx]]; setCategoryOrder(newOrder); } }} className="p-3 bg-brand-cream rounded-xl text-brand-black/40 hover:text-brand-red hover:bg-white border border-transparent hover:border-brand-red/20 transition-all"><ChevronDown size={20}/></button>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-10 border-t border-brand-gray bg-gray-50">
                 <button onClick={handleReorderSave} disabled={isSavingOrder} className="w-full bg-brand-black text-white p-6 rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                    {isSavingOrder ? <RefreshCcw className="animate-spin" /> : <Save size={24} />}
                    <span>{isSavingOrder ? 'جاري الحفظ...' : 'حفظ الترتيب الجديد'}</span>
                 </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* BULK ACTIONS BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[130] w-full max-w-4xl px-6">
               <div className="bg-brand-black text-white rounded-[3rem] p-4 lg:p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-6 ring-1 ring-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-6 px-4">
                     <div className="w-14 h-14 bg-brand-red rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-brand-red/20 animate-pulse">{selectedIds.length}</div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">أصناف مختارة</p>
                        <h4 className="font-black text-lg">التحكم الجماعي النشط</h4>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <button onClick={() => setIsBulkMoveModalOpen(true)} className="flex items-center gap-3 bg-white/10 hover:bg-white hover:text-brand-black px-8 py-4 rounded-2xl font-black text-xs transition-all border border-white/5 shadow-inner">
                        <Layers size={18} /> نقل للقسم
                     </button>
                     <button onClick={handleBulkDelete} className="flex items-center gap-3 bg-brand-red hover:bg-red-700 px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95">
                        <Trash2 size={18} /> حذف مجمع
                     </button>
                     <button onClick={() => setSelectedIds([])} className="p-4 bg-white/5 hover:bg-white/20 rounded-2xl text-white/40 hover:text-white transition-all"><X size={20}/></button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BULK MOVE MODAL */}
        {isBulkMoveModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkMoveModalOpen(false)} className="absolute inset-0 bg-brand-black/90 backdrop-blur-lg" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl">
               <h3 className="text-3xl font-black text-brand-black mb-10 font-serif tracking-tighter">نقل {selectedIds.length} منتجات إلى...</h3>
               <div className="space-y-4 mb-10">
                  {Array.from(new Set(products.flatMap(p => p.category ? p.category.split(',').map((c: string) => c.trim()).filter(Boolean) : []))).sort().map(cat => (
                    <button key={cat as string} onClick={() => setBulkCategory(cat as string)} className={`w-full p-6 rounded-3xl text-right font-black text-lg transition-all flex items-center justify-between group ${bulkCategory === cat ? 'bg-brand-red text-white shadow-xl scale-[1.02]' : 'bg-brand-gray/30 text-brand-black hover:bg-brand-cream'}`}>
                       <span>{cat as string}</span>
                       <MoveRight size={20} className={`transition-transform ${bulkCategory === cat ? 'translate-x-2' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setIsBulkMoveModalOpen(false)} className="flex-1 p-5 rounded-2xl font-black text-brand-black/30 bg-brand-gray/20 hover:bg-brand-gray/40 transition-all">إلغاء</button>
                  <button onClick={handleBulkMove} disabled={!bulkCategory || isBulkUpdating} className="flex-[2] bg-brand-black text-white p-5 rounded-2xl font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all">
                     {isBulkUpdating ? 'جاري النقل...' : 'تأكيد النقل'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between bg-brand-cream/30">
                <div>
                  <h3 className="text-2xl font-black text-brand-black tracking-tight">{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
                  <p className="text-brand-red font-bold">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white rounded-2xl shadow-sm border border-brand-gray/20 text-brand-black/40 hover:text-brand-red transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                   <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${selectedOrder.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : 'bg-brand-gray/10 text-brand-black'}`}>
                      {selectedOrder.status}
                   </div>
                   <div className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-brand-red/5 text-brand-red">
                      {selectedOrder.paymentMethod}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">{language === 'ar' ? 'معلومات الزبون' : 'Customer Info'}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-brand-black font-bold text-sm"><User size={16} className="text-brand-red"/> {selectedOrder.customerName}</div>
                      <div className="flex items-center gap-3 text-brand-black font-bold text-sm"><Phone size={16} className="text-brand-red"/> {selectedOrder.phoneNumber}</div>
                      <div className="flex items-center gap-3 text-brand-black font-bold text-xs"><MapPin size={16} className="text-brand-red"/> {selectedOrder.address || (language === 'ar' ? 'لا يوجد عنوان' : 'No Address')}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">{language === 'ar' ? 'التوقيت' : 'Timing'}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-brand-black font-bold text-xs"><Clock size={16} className="text-brand-red"/> {new Date(selectedOrder.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
                      {selectedOrder.pickupTime && <div className="flex items-center gap-3 text-brand-red font-black text-sm"><Store size={16}/> {selectedOrder.pickupTime}</div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">{language === 'ar' ? 'الأصناف المطلوبة' : 'Order Items'}</h4>
                  <div className="bg-brand-gray/5 rounded-3xl p-6 space-y-4 border border-brand-gray/10">
                    {selectedOrder.items?.map((item: OrderItem) => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-brand-gray/5">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-brand-cream flex items-center justify-center font-black text-brand-red text-xs">{item.quantity}x</div>
                          <span className="font-bold text-brand-black text-sm">{item.name}</span>
                        </div>
                        <span className="font-black text-brand-red text-sm">{item.price.toFixed(2)} د.أ</span>
                      </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-brand-gray/10 flex justify-between items-center px-2">
                       <span className="font-black text-brand-black text-lg">{language === 'ar' ? 'الإجمالي' : 'Total Amount'}</span>
                       <span className="font-black text-brand-red text-2xl">{selectedOrder.totalPrice.toFixed(2)} JOD</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-amber-900 font-bold text-sm italic">&quot;{selectedOrder.notes}&quot;</div>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between bg-brand-red text-white">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-brand-red font-black text-3xl shadow-xl">{selectedCustomer.name[0]}</div>
                   <div>
                      <h3 className="text-3xl font-black tracking-tight">{selectedCustomer.name}</h3>
                      <p className="text-white/80 font-bold flex items-center gap-2 mt-1"><Phone size={16}/> {selectedCustomer.phone}</p>
                      {selectedCustomer.email && (
                        <p className="text-white/60 text-xs font-bold flex items-center gap-2 mt-1 lowercase"><X size={14} className="rotate-45" /> {selectedCustomer.email}</p>
                      )}
                   </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-brand-gray/5 p-6 rounded-3xl text-center border border-brand-gray/10">
                      <p className="text-[10px] font-black uppercase text-brand-black/20 mb-1">{language === 'ar' ? 'عدد الطلبات' : 'Total Orders'}</p>
                      <p className="text-3xl font-black text-brand-red">{selectedCustomer.orderCount}</p>
                   </div>
                   <div className="bg-brand-black p-6 rounded-3xl text-center shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-bl-3xl group-hover:scale-150 transition-transform"/>
                      <p className="text-[10px] font-black uppercase text-white/30 mb-1">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Spent'}</p>
                      <p className="text-2xl font-black text-white">{selectedCustomer.totalSpent.toFixed(2)} <small className="text-[10px] font-sans">JD</small></p>
                   </div>
                   <div className="bg-brand-gray/5 p-6 rounded-3xl border border-brand-gray/10 flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase text-brand-black/20 mb-1">{language === 'ar' ? 'المنطقة' : 'Region'}</p>
                      <p className="text-sm font-black text-brand-black truncate">{selectedCustomer.area || (language === 'ar' ? 'غير محدد' : 'Unknown')}</p>
                   </div>
                </div>

                <div className="bg-brand-cream/10 p-6 rounded-3xl border border-brand-cream/20">
                   <p className="text-[10px] font-black uppercase text-brand-black/20 mb-3">{language === 'ar' ? 'آخر نشاط ونوع الحساب' : 'Last Activity & Account Type'}</p>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Clock size={16} className="text-brand-red"/>
                         <span className="text-sm font-bold text-brand-black">{new Date(selectedCustomer.lastOrder).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedCustomer.email ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                         {selectedCustomer.email ? (language === 'ar' ? 'حساب مسجل' : 'Registered') : (language === 'ar' ? 'طلب زائر' : 'Guest')}
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">{language === 'ar' ? 'سجل الطلبات' : 'Order History'}</h4>
                   <div className="space-y-3">
                      {historyOrders.filter(o => o.phoneNumber === selectedCustomer.phone).slice(0, 5).map(o => (
                         <div key={o.id} className="bg-white p-5 rounded-2xl border border-brand-gray/20 flex items-center justify-between hover:border-brand-red transition-all cursor-pointer group" onClick={() => { setSelectedOrder(o); setSelectedCustomer(null); }}>
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-red"><Package size={20}/></div>
                               <div>
                                  <p className="font-black text-brand-black text-sm">#{o.id.slice(-6).toUpperCase()}</p>
                                  <p className="text-[10px] font-bold text-brand-black/40">{new Date(o.createdAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-brand-red text-lg">{o.totalPrice.toFixed(2)} د.أ</p>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-brand-black/20 group-hover:text-brand-red transition-colors">{language === 'ar' ? 'عرض التفاصيل' : 'View Details'} →</p>
                            </div>
                         </div>
                      ))}
                      {historyOrders.filter(o => o.phoneNumber === selectedCustomer.phone).length === 0 && (
                         <div className="text-center py-10 text-brand-black/20 font-bold italic">{language === 'ar' ? 'لم يتم تحميل سجل الطلبات الكامل بعد..' : 'Full history not loaded in memory..'}</div>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus, onArchive, onPrint, onPaymentReceived }: { 
  order: Order, 
  onUpdateStatus: (id: string, status: string) => void, 
  onArchive: (id: string) => void, 
  onPrint: (order: Order) => void,
  onPaymentReceived: (id: string, e: React.MouseEvent) => void
}) {
  return (
    <div className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-brand-gray flex flex-col group relative
      ${order.status === 'PENDING' ? 'ring-2 ring-brand-red ring-inset' : ''}`}>
      
      <div className="p-6 pb-3 flex justify-between items-center bg-brand-cream/5 border-b border-brand-gray/30">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-brand-black/20">Ref: #{order.id.slice(-6).toUpperCase()}</span>
          <span className="font-black text-brand-black text-sm flex items-center gap-2">
            <Clock size={14} className="text-brand-red" />
            {new Date(order.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border shadow-sm
          ${order.orderType === 'PICKUP' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
             {order.orderType === 'PICKUP' ? 'استلام' : 'توصيل'}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 flex flex-col">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><User size={18} /></div>
              <span className="font-black text-brand-black text-sm">{order.customerName}</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><Phone size={18} /></div>
              <span className="font-bold text-brand-black text-sm tracking-tight" dir="ltr">{order.phoneNumber}</span>
           </div>
           {order.orderType === 'DELIVERY' && order.deliveryArea && (
              <div className="flex items-center gap-3">
                <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><MapPin size={18} /></div>
                <span className="font-bold text-brand-black text-xs">{order.deliveryArea}</span>
              </div>
           )}
        </div>

        <div className="bg-brand-black/5 p-4 rounded-2xl space-y-3">
           {order.items.map((item, idx) => (
             <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-black text-gray-500">{item.quantity}x {item.name}</span>
                <span className="font-bold text-gray-400">{(item.price * item.quantity).toFixed(2)}</span>
             </div>
           ))}
        </div>

        {order.notes && (
          <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
             <p className="text-[11px] font-black text-brand-black italic">&quot;{order.notes}&quot;</p>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-brand-gray/30">
          <div className="flex justify-between items-center mb-6">
             <span className="text-[10px] font-black text-brand-black/30">المجموع</span>
             <span className="text-2xl font-black text-brand-red font-serif tracking-tighter">{order.totalPrice.toFixed(2)} <small className="text-[9px] tracking-normal font-sans uppercase">JD</small></span>
          </div>

          <div className="flex flex-col gap-3">
             {order.paymentMethod === 'CLIQ' && order.paymentStatus === 'PENDING' && (
               <button 
                 onClick={(e) => onPaymentReceived(order.id, e)}
                 className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <CheckCircle size={16} /> تأكيد استلام التحويل كليك
               </button>
             )}
             {order.status === 'PENDING' && (
               <button onClick={() => onUpdateStatus(order.id, 'PREPARING')} className="w-full bg-brand-red text-white py-4 rounded-xl font-black shadow-lg shadow-brand-red/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                 <Zap size={16} /> قبول الطلب
               </button>
             )}
             {order.status === 'PREPARING' && (
               <button onClick={() => onUpdateStatus(order.id, 'READY')} className="w-full bg-brand-black text-white py-4 rounded-xl font-black active:scale-95 transition-all">
                  جاهز للتسليم
               </button>
             )}
             {order.status === 'READY' && (
               <button onClick={() => onUpdateStatus(order.id, 'SHIPPED')} className="w-full bg-green-600 text-white py-4 rounded-xl font-black active:scale-95 transition-all">
                  تم الاستلام ✅
               </button>
             )}
             
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onPrint(order)} className="p-3 bg-gray-50 text-gray-600 rounded-xl border border-brand-gray flex items-center justify-center gap-2 font-black text-[10px] hover:bg-gray-100 transition-all"><Printer size={14}/> طباعة</button>
                <button onClick={() => onArchive(order.id)} className="p-3 bg-gray-50 text-gray-400 rounded-xl border border-brand-gray flex items-center justify-center gap-2 font-black text-[10px] hover:text-brand-red transition-all"><Trash2 size={14}/> أرشفة</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}