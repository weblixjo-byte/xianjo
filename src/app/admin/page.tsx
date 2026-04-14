'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Bell, Store } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/store/useLanguage';
import { AnimatePresence } from 'framer-motion';

// Types
import {
  Order, Product, DeliveryZone, Coupon, Customer, ReportSummary, AdminTab
} from '@/types/admin';

// Components
import AdminSidebar from '@/components/admin/AdminSidebar';
import OrdersTab from '@/components/admin/OrdersTab';
import HistoryTab from '@/components/admin/HistoryTab';
import CustomersTab from '@/components/admin/CustomersTab';
import ReportsTab from '@/components/admin/ReportsTab';
import ProductsTab from '@/components/admin/ProductsTab';
import CouponsTab from '@/components/admin/CouponsTab';
import ZonesTab from '@/components/admin/ZonesTab';
import SupportTab from '@/components/admin/SupportTab';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import CustomerDetailsModal from '@/components/admin/CustomerDetailsModal';
import ProductFormModal from '@/components/admin/ProductFormModal';
import CategoryReorderModal from '@/components/admin/CategoryReorderModal';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import BulkMoveModal from '@/components/admin/BulkMoveModal';
import AudioUnlockOverlay from '@/components/admin/AudioUnlockOverlay';
import OrderInvoice from '@/components/admin/OrderInvoice';
import SalesReport from '@/components/admin/SalesReport';
import { generatePassPrntUrl } from '@/lib/passprnt';
import { BRANDING } from '@/constants/branding';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const orderCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('ORDERS');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ACTIVE' | 'REJECTED'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Customers State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Reports State
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    nameEn: '', nameAr: '', price: '', category: '', imageUrl: '', descriptionAr: '', descriptionEn: ''
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Derive sorted categories from products and the custom categoryOrder
  const sortedCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.flatMap((p: Product) => 
      p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : []
    ))) as string[];
    
    return [...uniqueCats].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [products, categoryOrder]);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');

  // Zones State
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneForm, setZoneForm] = useState({ nameEn: '', nameAr: '', fee: '' });

  // --- Handlers ---

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  };

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  }, []);

  const playAlarm = useCallback(() => {
    if (alarmRef.current && isAudioUnlocked) {
      alarmRef.current.play().catch(_e => console.error("Audio error", _e));
    }
  }, [isAudioUnlocked]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data = await res.json();
      setOrders(data);

      const pendingOrders = data.filter((o: Order) => o.status === 'PENDING').length;
      if (pendingOrders > orderCountRef.current && isAudioUnlocked) {
        playAlarm();
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-in fade-in zoom-in slide-in-from-top-4' : 'animate-out fade-out zoom-out shadow-none'} max-w-md w-full bg-brand-black/95 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(146,39,36,0.6)] rounded-[2.5rem] pointer-events-auto flex flex-col border-2 border-brand-red/30 overflow-hidden`}>
            <div className="p-8">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-brand-red rounded-full blur-xl opacity-40 animate-pulse"></div>
                  <div className="relative bg-brand-red p-4 rounded-2xl text-white shadow-lg">
                    <Bell className="h-8 w-8 animate-tada" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-black text-white leading-tight">طلب جديد وارد!</p>
                  <p className="mt-1 text-sm font-bold text-white/40 uppercase tracking-widest">لديك {pendingOrders} طلبات بانتظار الموافقة</p>
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => { toast.dismiss(t.id); setActiveTab('ORDERS'); }}
                className="flex-1 bg-brand-red text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-red/80 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-red/20"
              >
                فتح الطلبات
              </button>
              <button
                onClick={() => { toast.dismiss(t.id); }}
                className="px-6 bg-white/5 text-white/40 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
              >
                تجاهل
              </button>
            </div>
          </div>
        ), { duration: 15000, position: 'top-right' });
      }
      orderCountRef.current = pendingOrders;
    } catch (_error) {
      console.error('Fetch orders error:', _error);
    } finally {
      setLoading(false);
    }
  }, [isAudioUnlocked, playAlarm]);

  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        if (typeof data.isStoreOpen === 'boolean') {
          setIsStoreOpen(data.isStoreOpen);
        }
        if (data.categoryOrder) {
          try {
            const parsed = JSON.parse(data.categoryOrder);
            if (Array.isArray(parsed)) setCategoryOrder(parsed);
          } catch {
            console.error("Error parsing category order");
          }
        }
      }
    } catch (_error) {
      console.error('Fetch store status error:', _error);
    }
  }, []);

  const toggleStoreStatus = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: !isStoreOpen })
      });
      if (res.ok) {
        setIsStoreOpen(!isStoreOpen);
        toast.success(isStoreOpen ? 'تم إغلاق المطعم' : 'تم فتح المطعم');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success('تم تحديث الحالة');
        fetchOrders();
        stopAlarm();
      }
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });
      if (res.ok) {
        toast.success('تمت الأرشفة');
        fetchOrders();
        stopAlarm();
      }
    } catch {
      toast.error('خطأ في الأرشفة');
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
        toast.success('تم تأكيد الدفع');
        fetchOrders();
        stopAlarm();
      }
    } catch {
      toast.error('خطأ');
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/history');
      const data = await res.json();
      setHistoryOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('حذف نهائي؟')) return;
    try {
      await fetch(`/api/admin/history?id=${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (error) { console.error(error); }
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, []);

  const fetchReports = useCallback(async (type: string) => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${type}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) { console.error(error); }
    finally { setReportLoading(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const body = editingProduct ? { ...productFormData, id: editingProduct.id } : productFormData;
    try {
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, price: parseFloat(productFormData.price) })
      });
      if (res.ok) {
        toast.success('تم الحفظ');
        setIsProductModalOpen(false);
        fetchProducts();
      }
    } catch { toast.error('خطأ'); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('حذف؟')) return;
    try {
      await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (error) { console.error(error); }
  };

  const handleToggleProduct = async (id: string, current: boolean) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAvailable: !current })
      });
      fetchProducts();
    } catch (_error) { console.error(_error); }
  };

  const handleBulkToggle = async (available: boolean) => {
    try {
      await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, isAvailable: available })
      });
      setSelectedIds([]);
      fetchProducts();
    } catch (_error) { console.error(_error); }
  };

  const handleBulkMove = async (category: string) => {
    try {
      await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, category })
      });
      setIsBulkMoveOpen(false);
      setSelectedIds([]);
      fetchProducts();
    } catch (_error) { console.error(_error); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`حذف ${selectedIds.length} منتجات؟`)) return;
    try {
      await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      setSelectedIds([]);
      fetchProducts();
    } catch (_error) { console.error(_error); }
  };

  const saveCategoryOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryOrder: JSON.stringify(categoryOrder) 
        })
      });
      if (res.ok) {
        toast.success('تم حفظ الترتيب');
        setIsReorderModalOpen(false);
        fetchProducts();
      } else {
        toast.error('فشل حفظ الترتيب');
      }
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setIsSavingOrder(false); }
  };

  // Coupons / Zones Handlers
  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data);
    } catch (_error) { console.error(_error); }
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, discountPercent: parseInt(couponDiscount) })
      });
      if (res.ok) {
        fetchCoupons();
        setCouponCode(''); setCouponDiscount('');
        toast.success('تم الإنشاء');
      }
    } catch { toast.error('خطأ'); }
  };

  const handleToggleCoupon = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current })
      });
      fetchCoupons();
    } catch (_error) { console.error(_error); }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (_error) { console.error(_error); }
  };

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-zones');
      const data = await res.json();
      setZones(data);
    } catch (_error) { console.error(_error); }
  }, []);

  const handleAddZone = async () => {
    try {
      const res = await fetch('/api/admin/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...zoneForm, fee: parseFloat(zoneForm.fee) })
      });
      if (res.ok) {
        fetchZones();
        setZoneForm({ nameEn: '', nameAr: '', fee: '' });
      }
    } catch (_error) { console.error(_error); }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await fetch(`/api/admin/delivery-zones?id=${id}`, { method: 'DELETE' });
      fetchZones();
    } catch (_error) { console.error(_error); }
  };


  const handlePassPrnt = async (order: Order) => {
    setPrintingOrder(order);
    const loadingToast = toast.loading('جاري تجهيز الفاتورة للطباعة...');
    
    try {
      // Delay slightly to ensure OrderInvoice is rendered in the hidden div
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const url = await generatePassPrntUrl('global-printable-invoice');
      window.location.href = url;
      toast.success('تم إرسال الطلب للطابعة', { id: loadingToast });
    } catch (error) {
      console.error('PassPRNT Error:', error);
      toast.error('فشل تجهيز الفاتورة للطباعة', { id: loadingToast });
    } finally {
      setPrintingOrder(null);
    }
  };

  const handlePassPrntReport = async () => {
    if (!reportData) return;
    setIsPrintingReport(true);
    const loadingToast = toast.loading('جاري تجهيز تقرير المبيعات للطباعة...');
    
    try {
      // Delay to ensure SalesReport is rendered in the hidden div
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const url = await generatePassPrntUrl('printable-sales-report');
      window.location.href = url;
      toast.success('تم إرسال التقرير للطابعة', { id: loadingToast });
    } catch (error) {
      console.error('PassPRNT Report Error:', error);
      toast.error('فشل تجهيز التقرير للطباعة', { id: loadingToast });
    } finally {
      setIsPrintingReport(false);
    }
  };

  const handleSystemReset = async (supportPassword?: string) => {
    if (!confirm('تحذير: هذا سيحذف كل شيء!')) return;
    try {
      const res = await fetch('/api/admin/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'RESET_ALL_DATA',
          supportPassword 
        })
      });
      if (res.ok) {
        toast.success('تم تصفير النظام بنجاح');
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل التصفير');
      }
    } catch { toast.error('خطأ'); }
  };

  const handleMenuReset = async (supportPassword?: string) => {
    if (!confirm('تحذير: سيتم حذف جميع الأقسام والوجبات!')) return;
    try {
      const res = await fetch('/api/admin/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'RESET_MENU',
          supportPassword 
        })
      });
      if (res.ok) {
        toast.success('تم حذف المنيو بالكامل');
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل الحذف');
      }
    } catch { toast.error('خطأ في الاتصال'); }
  };

  // --- Exports ---
  const exportToExcel = (data: Record<string, unknown>[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleExportOrders = () => {
    const data = historyOrders.map(o => ({
      ID: o.id,
      Date: o.createdAt,
      Customer: o.customerName,
      Phone: o.phoneNumber,
      Total: o.totalPrice,
      Type: o.orderType,
      Status: o.status
    }));
    exportToExcel(data, `${BRANDING.shortNameEn}_Orders_${new Date().toLocaleDateString()}`);
  };

  const handleExportReport = () => {
    if (!reportData) return;
    
    // 1. Summary Rows
    const summary = [
      { Category: 'Summary', Metric: 'Total Orders', Value: reportData.totalOrders },
      { Category: 'Summary', Metric: 'Total Revenue', Value: reportData.totalRevenue.toFixed(2) },
      { Category: '', Metric: '', Value: '' }, // Spacer
    ];

    // 2. Item Breakdown Rows
    const breakdown = reportData.itemBreakdown.map(item => ({
      Category: 'Item Breakdown',
      Metric: item.name,
      Value: `Qty: ${item.quantity} | Total: ${item.revenue.toFixed(2)}`
    }));

    const data = [...summary, ...breakdown];
    exportToExcel(data, `${BRANDING.shortNameEn}_SalesReport_${reportType}_${new Date().toLocaleDateString()}`);
  };

  const handleExportCustomers = () => {
    const data = customers.map(c => ({
      Name: c.name,
      Phone: c.phone,
      Email: c.email || 'N/A',
      Area: c.area,
      Orders: c.orderCount,
      Spent: c.totalSpent,
      Last: c.lastOrder
    }));
    exportToExcel(data, `${BRANDING.shortNameEn}_Customers_${new Date().toLocaleDateString()}`);
  };

  // --- Audio ------
  const unlockAudio = () => {
    setIsAudioUnlocked(true);
    const Win = window as unknown as Window & { webkitAudioContext?: typeof AudioContext };
    audioContextRef.current = new (window.AudioContext || Win.webkitAudioContext)();
    alarmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    alarmRef.current.loop = true;
    audioContextRef.current.resume();
  };


  // --- Effects ---
  useEffect(() => {
    fetchOrders();
    fetchStoreStatus();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStoreStatus]);

  useEffect(() => {
    if (activeTab === 'HISTORY') fetchHistory();
    if (activeTab === 'CUSTOMERS') fetchCustomers();
    if (activeTab === 'REPORTS') fetchReports('daily');
    if (activeTab === 'PRODUCTS') fetchProducts();
    if (activeTab === 'COUPONS') fetchCoupons();
    if (activeTab === 'ZONES') fetchZones();
  }, [activeTab, fetchHistory, fetchCustomers, fetchReports, fetchProducts, fetchCoupons, fetchZones]);

  if (loading && orders.length === 0) {
    return (
      <div className="h-screen bg-brand-cream flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-brand-black/40 animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col lg:flex-row font-sans overflow-x-hidden" dir="rtl">
      <Toaster position="top-right" />

      {!isAudioUnlocked && <AudioUnlockOverlay onUnlock={unlockAudio} />}

      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={orders.filter(o => o.status === 'PENDING').length} onLogout={handleLogout} />

      <main className="flex-1 lg:max-h-screen lg:overflow-y-auto w-full">
        <div className="p-6 lg:p-8 xl:p-12 pb-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-black font-serif tracking-tighter">
                {BRANDING.admin.titleAr}
              </h2>
              <p className="text-brand-black/40 font-bold mt-2 text-sm lg:text-base">تتم الآن إدارة مطعم {BRANDING.shortNameAr} بشكل آلي وآمن بالكامل.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 lg:p-5 xl:p-6 rounded-[2.5rem] border border-brand-gray shadow-sm">
              <div className="flex flex-col text-left mr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/20">حالة المطعم</span>
                <span className={`text-sm font-black ${isStoreOpen ? 'text-green-600' : 'text-brand-red'}`}>
                  {isStoreOpen ? 'المطعم مفتوح ويستقبل الطلبات' : 'المطعم مغلق حالياً'}
                </span>
              </div>
              <button
                onClick={toggleStoreStatus}
                className={`w-16 h-16 lg:w-18 xl:w-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl
                  ${isStoreOpen ? 'bg-green-600 text-white hover:bg-green-700 hover:rotate-12' : 'bg-brand-red text-white animate-pulse'}`}
              >
                <Store size={32} />
              </button>
            </div>
          </div>

          <div className="space-y-12">
            <AnimatePresence mode="wait">
               {activeTab === 'ORDERS' && (
                <OrdersTab
                  orders={orders} loading={loading} orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter}
                  handleUpdateStatus={handleUpdateStatus} handleArchive={handleArchive} handlePaymentReceived={handlePaymentReceived} 
                  onPassPrnt={handlePassPrnt} language={language}
                />
              )}

               {activeTab === 'HISTORY' && (
                <HistoryTab historyOrders={historyOrders} loading={historyLoading} onExport={handleExportOrders} onSelectOrder={setSelectedOrder} onDeletePermanent={handleDeletePermanent} onPassPrnt={handlePassPrnt} />
              )}

              {activeTab === 'CUSTOMERS' && (
                <CustomersTab customers={customers} loading={loading} onExport={handleExportCustomers} onSelectCustomer={setSelectedCustomer} language={language} />
              )}

              {activeTab === 'REPORTS' && (
                <ReportsTab reportData={reportData} reportType={reportType} setReportType={setReportType} fetchReports={fetchReports} loading={reportLoading} onExport={handleExportReport} onPassPrnt={handlePassPrntReport} />
              )}

              {activeTab === 'PRODUCTS' && (
                <ProductsTab
                  products={products} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                  productSearchQuery={productSearchQuery} setProductSearchQuery={setProductSearchQuery} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
                  onAddProduct={() => { setEditingProduct(null); setProductFormData({ nameEn: '', nameAr: '', price: '', category: products[0]?.category || '', imageUrl: '', descriptionAr: '', descriptionEn: '' }); setIsProductModalOpen(true); }}
                  onEditProduct={(p) => { setEditingProduct(p); setProductFormData({ nameAr: p.nameAr, nameEn: p.nameEn, price: p.price.toString(), category: p.category, imageUrl: p.imageUrl || '', descriptionAr: p.descriptionAr || '', descriptionEn: p.descriptionEn || '' }); setIsProductModalOpen(true); }}
                  onDeleteProduct={handleDeleteProduct} onToggleProduct={handleToggleProduct} onReorder={() => setIsReorderModalOpen(true)}
                  sortedCategories={sortedCategories}
                />
              )}

              {activeTab === 'COUPONS' && (
                <CouponsTab coupons={coupons} loading={loading} couponCode={couponCode} setCouponCode={setCouponCode} couponDiscount={couponDiscount} setCouponDiscount={setCouponDiscount} onCreate={handleCreateCoupon} onToggle={handleToggleCoupon} onDelete={handleDeleteCoupon} />
              )}

              {activeTab === 'ZONES' && (
                <ZonesTab zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} onAdd={handleAddZone} onDelete={handleDeleteZone} />
              )}

              {activeTab === 'SUPPORT' && (
                <SupportTab onResetData={handleSystemReset} onResetMenu={handleMenuReset} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} onArchive={handleArchive} onPaymentReceived={handlePaymentReceived} onPassPrnt={handlePassPrnt} language={language} />
        <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSelectOrder={setSelectedOrder} orderHistory={historyOrders} />
        <ProductFormModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} editingProduct={editingProduct} productFormData={productFormData} setProductFormData={(data: Partial<Record<string, string>>) => setProductFormData(prev => ({ ...prev, ...data }))} onSubmit={handleSaveProduct} products={products} />
        <CategoryReorderModal isOpen={isReorderModalOpen} onClose={() => setIsReorderModalOpen(false)} categoryOrder={sortedCategories} setCategoryOrder={setCategoryOrder} onSave={saveCategoryOrder} isSaving={isSavingOrder} />
        <BulkActionsBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onToggleAvailability={handleBulkToggle} onMoveToCategory={() => setIsBulkMoveOpen(true)} onDelete={handleBulkDelete} />
        <BulkMoveModal isOpen={isBulkMoveOpen} onClose={() => setIsBulkMoveOpen(false)} categories={sortedCategories} onMove={handleBulkMove} />
      </AnimatePresence>

      {/* Hidden Invoice for Global Printing (Card level) */}
      <div id="global-printable-invoice" className="hidden">
        {printingOrder && <OrderInvoice order={printingOrder} />}
      </div>

      {/* Hidden Sales Report for Printing */}
      <div id="printable-sales-report" className="hidden">
        {isPrintingReport && reportData && <SalesReport reportData={reportData} reportType={reportType} />}
      </div>
    </div>
  );
}