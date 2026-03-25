'use client';
import { motion } from 'framer-motion';
import { X, Phone, Clock, Package } from 'lucide-react';
import { Customer, Order } from '@/types/admin';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
  orderHistory: Order[];
}

export default function CustomerDetailsModal({
  customer,
  onClose,
  onSelectOrder,
  orderHistory
}: CustomerDetailsModalProps) {
  if (!customer) return null;

  const customerOrders = orderHistory.filter(o => o.phoneNumber === customer.phone);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between bg-brand-red text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-brand-red font-black text-3xl shadow-xl">{customer.name[0]}</div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">{customer.name}</h3>
              <p className="text-white/80 font-bold flex items-center gap-2 mt-1"><Phone size={16} /> {customer.phone}</p>
              {customer.email && (
                <p className="text-white/60 text-xs font-bold flex items-center gap-2 mt-1 lowercase"><X size={14} className="rotate-45" /> {customer.email}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-gray/5 p-6 rounded-3xl text-center border border-brand-gray/10">
              <p className="text-[10px] font-black uppercase text-brand-black/20 mb-1">عدد الطلبات</p>
              <p className="text-3xl font-black text-brand-red">{customer.orderCount}</p>
            </div>
            <div className="bg-brand-black p-6 rounded-3xl text-center shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-bl-3xl group-hover:scale-150 transition-transform" />
              <p className="text-[10px] font-black uppercase text-white/30 mb-1">إجمالي المشتريات</p>
              <p className="text-2xl font-black text-white">{customer.totalSpent.toFixed(2)} <small className="text-[10px] font-sans">د.أ</small></p>
            </div>
            <div className="bg-brand-gray/5 p-6 rounded-3xl border border-brand-gray/10 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-brand-black/20 mb-1">المنطقة</p>
              <p className="text-sm font-black text-brand-black truncate">{customer.area || 'غير محدد'}</p>
            </div>
          </div>

          <div className="bg-brand-cream/10 p-6 rounded-3xl border border-brand-cream/20">
            <p className="text-[10px] font-black uppercase text-brand-black/20 mb-3">آخر نشاط ونوع الحساب</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-brand-red" />
                <span className="text-sm font-bold text-brand-black">{new Date(customer.lastOrder).toLocaleString('ar-JO')}</span>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${customer.email ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {customer.email ? ('حساب مسجل') : ('طلب زائر')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">سجل الطلبات</h4>
            <div className="space-y-3">
              {customerOrders.slice(0, 5).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-2xl border border-brand-gray/20 flex items-center justify-between hover:border-brand-red transition-all cursor-pointer group" onClick={() => onSelectOrder(o)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-red"><Package size={20} /></div>
                    <div>
                      <p className="font-black text-brand-black text-sm">#{o.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-brand-black/40">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-brand-red text-lg">{o.totalPrice.toFixed(2)} د.أ</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-black/20 group-hover:text-brand-red transition-colors">{'عرض التفاصيل'} →</p>
                  </div>
                </div>
              ))}
              {customerOrders.length === 0 && (
                <div className="text-center py-10 text-brand-black/20 font-bold italic">{'لم يتم تحميل سجل الطلبات الكامل بعد..'}</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
