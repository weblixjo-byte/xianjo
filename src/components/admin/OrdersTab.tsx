'use client';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/types/admin';

interface OrdersTabProps {
  orders: Order[];
  loading: boolean;
  orderStatusFilter: 'ACTIVE' | 'REJECTED';
  setOrderStatusFilter: (filter: 'ACTIVE' | 'REJECTED') => void;
  handleUpdateStatus: (id: string, status: string) => void;
  handleArchive: (id: string) => void;
  handlePaymentReceived: (id: string, e: React.MouseEvent) => void;
  language: string;
}

export default function OrdersTab({
  orders,
  loading,
  orderStatusFilter,
  setOrderStatusFilter,
  handleUpdateStatus,
  handleArchive,
  handlePaymentReceived,
  language
}: OrdersTabProps) {
  const filteredOrders = orders.filter(o => 
    orderStatusFilter === 'ACTIVE' ? o.status !== 'REJECTED' : o.status === 'REJECTED'
  );

  return (
    <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setOrderStatusFilter('ACTIVE')} 
          className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${
            orderStatusFilter === 'ACTIVE' ? 'bg-brand-black text-white shadow-xl' : 'bg-white border-2 border-brand-gray/50 text-brand-black/40 hover:bg-brand-gray/10'
          }`}
        >
          الطلبات النشطة
        </button>
        <button 
          onClick={() => setOrderStatusFilter('REJECTED')} 
          className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${
            orderStatusFilter === 'REJECTED' ? 'bg-brand-red text-white shadow-xl' : 'bg-white border-2 border-brand-gray/50 text-brand-black/40 hover:bg-brand-red/5 hover:text-brand-red'
          }`}
        >
          المرفوضة
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
          <p className="text-brand-black/40 font-black">جاري التحميل...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white py-40 text-center flex flex-col items-center gap-8 rounded-[4rem] border-2 border-dashed border-brand-gray">
          <Box size={80} className="text-brand-black/10" strokeWidth={1} />
          <h2 className="text-3xl font-serif text-brand-black/30">
            {orderStatusFilter === 'ACTIVE' ? 'لا توجد طلبات نشطة حالياً' : 'لا توجد طلبات مرفوضة'}
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onArchive={handleArchive}
              onPaymentReceived={handlePaymentReceived}
              language={language}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
