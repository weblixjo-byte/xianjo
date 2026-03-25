'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
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
import SystemTab from '@/components/admin/SystemTab';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import CustomerDetailsModal from '@/components/admin/CustomerDetailsModal';
import ProductFormModal from '@/components/admin/ProductFormModal';
import CategoryReorderModal from '@/components/admin/CategoryReorderModal';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import BulkMoveModal from '@/components/admin/BulkMoveModal';
import AudioUnlockOverlay from '@/components/admin/AudioUnlockOverlay';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
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
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex ring-4 ring-brand-red/10 border-2 border-brand-red overflow-hidden`}>
            <div className="flex-1 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1 text-brand-red"><Bell className="h-10 w-10 animate-tada" /></div>
                <div className="mr-5 flex-1">
                  <p className="text-xl font-black text-brand-black">طلب جديد وارد!</p>
                  <p className="mt-1 text-sm font-bold text-brand-black/40">لديك {pendingOrders} طلبات بانتظار الموافقة</p>
                </div>
              </div>
            </div>
            <div className="flex border-r border-gray-200">
              <button 
                onClick={() => { toast.dismiss(t.id); stopAlarm(); setActiveTab('ORDERS'); }} 
                className="w-full border border-transparent rounded-none rounded-r-lg p-6 flex items-center justify-center text-sm font-black text-brand-red hover:bg-brand-red/5 active:bg-brand-red/10 transition-all uppercase tracking-widest"
              >
                فتح الطلبات
              </button>
            </div>
          </div>
        ), { duration: 10000, position: 'top-right' });
      }
      orderCountRef.current = pendingOrders;
    } catch (_error) {
      console.error('Fetch orders error:', _error);
    } finally {
      setLoading(false);
    }
  }, [isAudioUnlocked, playAlarm, stopAlarm]);

  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/store-status');
      const data = await res.json();
      setIsStoreOpen(data.isOpen);
    } catch (_error) {
      console.error('Fetch store status error:', _error);
    }
  }, []);

  const toggleStoreStatus = async () => {
    try {
      const res = await fetch('/api/admin/store-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !isStoreOpen })
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
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
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
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast.success('تمت الأرشفة');
        fetchOrders();
      }
    } catch {
      toast.error('خطأ في الأرشفة');
    }
  };

  const handlePaymentReceived = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: 'COMPLETED' })
      });
      if (res.ok) {
        toast.success('تم تأكيد الدفع');
        fetchOrders();
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
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      const uniqueCats = Array.from(new Set(data.flatMap((p: Product) => p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : []))) as string[];
      setCategoryOrder(uniqueCats);
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
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: categoryOrder })
      });
      if (res.ok) {
        toast.success('تم حفظ الترتيب');
        setIsReorderModalOpen(false);
        fetchProducts();
      }
    } catch { toast.error('خطأ'); }
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
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current })
      });
      fetchCoupons();
    } catch (_error) { console.error(_error); }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/admin/zones', {
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
      await fetch(`/api/admin/zones?id=${id}`, { method: 'DELETE' });
      fetchZones();
    } catch (_error) { console.error(_error); }
  };

  const handleSystemReset = async () => {
    if (!confirm('تحذير: هذا سيحذف كل شيء!')) return;
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) window.location.reload();
    } catch { toast.error('خطأ'); }
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
    exportToExcel(data, `Xian_Orders_${new Date().toLocaleDateString()}`);
  };

  const handleExportCustomers = () => {
    const data = customers.map(c => ({
      Name: c.name,
      Phone: c.phone,
      OrdersCount: c.orderCount,
      TotalSpent: c.totalSpent,
      LastOrder: c.lastOrder,
      Area: c.area
    }));
    exportToExcel(data, `Xian_Customers_${new Date().toLocaleDateString()}`);
  };

  // --- Audio ---
  const unlockAudio = () => {
    setIsAudioUnlocked(true);
    const Win = window as unknown as Window & { webkitAudioContext?: typeof AudioContext };
    audioContextRef.current = new (window.AudioContext || Win.webkitAudioContext)();
    alarmRef.current = new Audio('/alarm.mp3');
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
        <div className="p-6 lg:p-12 pb-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black text-brand-black font-serif tracking-tighter">
                أهلاً بك يا مدير شيان 👋
              </h2>
              <p className="text-brand-black/40 font-bold mt-2 text-sm lg:text-base">تتم الآن إدارة مطعم شيان بشكل آلي وآمن بالكامل.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-4 lg:p-6 rounded-[2.5rem] border border-brand-gray shadow-sm">
              <div className="flex flex-col text-left mr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/20">حالة المطعم</span>
                <span className={`text-sm font-black ${isStoreOpen ? 'text-green-600' : 'text-brand-red'}`}>
                  {isStoreOpen ? 'المطعم مفتوح ويستقبل الطلبات' : 'المطعم مغلق حالياً'}
                </span>
              </div>
              <button 
                onClick={toggleStoreStatus}
                className={`w-16 h-16 lg:w-20 lg:h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl
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
                  handleUpdateStatus={handleUpdateStatus} handleArchive={handleArchive} handlePaymentReceived={handlePaymentReceived} language={language}
                />
              )}

              {activeTab === 'HISTORY' && (
                <HistoryTab historyOrders={historyOrders} loading={historyLoading} onExport={handleExportOrders} onSelectOrder={setSelectedOrder} onDeletePermanent={handleDeletePermanent} />
              )}

              {activeTab === 'CUSTOMERS' && (
                <CustomersTab customers={customers} loading={loading} onExport={handleExportCustomers} onSelectCustomer={setSelectedCustomer} language={language} />
              )}

              {activeTab === 'REPORTS' && (
                <ReportsTab reportData={reportData} reportType={reportType} setReportType={setReportType} fetchReports={fetchReports} loading={reportLoading} onExport={handleExportOrders} />
              )}

              {activeTab === 'PRODUCTS' && (
                <ProductsTab 
                  products={products} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                  productSearchQuery={productSearchQuery} setProductSearchQuery={setProductSearchQuery} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
                  onAddProduct={() => { setEditingProduct(null); setProductFormData({ nameEn: '', nameAr: '', price: '', category: products[0]?.category || '', imageUrl: '', descriptionAr: '', descriptionEn: '' }); setIsProductModalOpen(true); }}
                  onEditProduct={(p) => { setEditingProduct(p); setProductFormData({ nameAr: p.nameAr, nameEn: p.nameEn, price: p.price.toString(), category: p.category, imageUrl: p.imageUrl || '', descriptionAr: p.descriptionAr || '', descriptionEn: p.descriptionEn || '' }); setIsProductModalOpen(true); }}
                  onDeleteProduct={handleDeleteProduct} onToggleProduct={handleToggleProduct} onReorder={() => setIsReorderModalOpen(true)}
                  sortedCategories={categoryOrder}
                />
              )}

              {activeTab === 'COUPONS' && (
                <CouponsTab coupons={coupons} loading={loading} couponCode={couponCode} setCouponCode={setCouponCode} couponDiscount={couponDiscount} setCouponDiscount={setCouponDiscount} onCreate={handleCreateCoupon} onToggle={handleToggleCoupon} onDelete={handleDeleteCoupon} />
              )}

              {activeTab === 'ZONES' && (
                <ZonesTab zones={zones} zoneForm={zoneForm} setZoneForm={setZoneForm} onAdd={handleAddZone} onDelete={handleDeleteZone} />
              )}

              {activeTab === 'SYSTEM' && (
                <SystemTab onReset={handleSystemReset} onExportOrders={handleExportOrders} onExportCustomers={handleExportCustomers} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} onArchive={handleArchive} onPaymentReceived={handlePaymentReceived} language={language} />
        <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSelectOrder={setSelectedOrder} orderHistory={historyOrders} />
        <ProductFormModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} editingProduct={editingProduct} productFormData={productFormData} setProductFormData={(data: Partial<Record<string, string>>) => setProductFormData(prev => ({ ...prev, ...data }))} onSubmit={handleSaveProduct} products={products} />
        <CategoryReorderModal isOpen={isReorderModalOpen} onClose={() => setIsReorderModalOpen(false)} categoryOrder={categoryOrder} setCategoryOrder={setCategoryOrder} onSave={saveCategoryOrder} isSaving={isSavingOrder} />
        <BulkActionsBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onToggleAvailability={handleBulkToggle} onMoveToCategory={() => setIsBulkMoveOpen(true)} onDelete={handleBulkDelete} />
        <BulkMoveModal isOpen={isBulkMoveOpen} onClose={() => setIsBulkMoveOpen(false)} categories={categoryOrder} onMove={handleBulkMove} />
      </AnimatePresence>
    </div>
  );
}