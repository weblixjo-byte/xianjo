'use client';
import { LayoutDashboard, History, Users, BarChart3, Package, Ticket, MapPin, LogOut, LucideIcon, ShieldCheck, MessageSquare } from 'lucide-react';
import { AdminTab } from '@/types/admin';
import { BRANDING } from '@/constants/branding';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: AdminTab) => void;
  pendingCount: number;
  onLogout: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  onLogout
}: AdminSidebarProps) {
  const menuItems: { id: AdminTab; label: string; icon: LucideIcon; badge?: number | null }[] = [
    { id: 'ORDERS', label: 'الطلبات الحالية', icon: LayoutDashboard, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'HISTORY', label: 'سجل الطلبات', icon: History },
    { id: 'CUSTOMERS', label: 'الزبائن', icon: Users },
    { id: 'REPORTS', label: 'التقارير والمبيعات', icon: BarChart3 },
    { id: 'PRODUCTS', label: 'إدارة المنيو', icon: Package },
    { id: 'COUPONS', label: 'الكوبونات', icon: Ticket },
    { id: 'ZONES', label: 'مناطق التوصيل', icon: MapPin },
    { id: 'SUPPORT', label: 'الدعم', icon: ShieldCheck },
    { id: 'REVIEWS', label: 'التقييمات', icon: MessageSquare },
  ];

  return (
    <div className="w-full lg:w-64 xl:w-80 shrink-0 bg-white border-b lg:border-b-0 lg:border-l border-brand-gray flex flex-col h-auto lg:h-screen sticky top-0 z-50">
      <div className="p-6 lg:p-10 xl:p-12">
        <div className="flex items-center gap-4 mb-12 group">
          <div className="w-14 h-14 bg-brand-red rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-red/20 group-hover:rotate-12 transition-transform duration-500">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black tracking-tighter">{BRANDING.admin.titleAr}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/20">{BRANDING.shortNameEn} Admin v{BRANDING.admin.version}</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-4 rounded-2xl font-black text-sm whitespace-nowrap transition-all duration-300 relative group
                ${activeTab === item.id 
                  ? 'bg-brand-black text-white shadow-2xl shadow-brand-black/20 translate-x-[-8px]' 
                  : 'text-brand-black/40 hover:bg-brand-gray hover:text-brand-black'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-brand-red' : 'group-hover:text-brand-red transition-colors'} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute left-4 bg-brand-red text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 lg:p-10 xl:p-12 border-t border-brand-gray bg-brand-cream/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-brand-black/40 hover:bg-brand-red hover:text-white transition-all group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
