'use client';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
import { Order } from '@/types/admin';

interface HistoryTabProps {
  historyOrders: Order[];
  loading: boolean;
  onExport: () => void;
  onSelectOrder: (order: Order) => void;
  onDeletePermanent: (id: string) => void;
}

export default function HistoryTab({
  historyOrders,
  loading,
  onExport,
  onSelectOrder,
  onDeletePermanent
}: HistoryTabProps) {
  return (
    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-brand-black">سجل الطلبات</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-3 bg-white border-2 border-brand-gray/50 hover:border-brand-red/30 hover:bg-brand-red/5 px-6 py-3 rounded-2xl font-black text-xs transition-all text-brand-black shadow-sm group"
        >
          <FileSpreadsheet size={18} className="text-green-600" />
          <span className="group-hover:translate-x-1 transition-transform">تصدير إكسيل</span>
        </button>
      </div>
      {loading ? (
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
                <tr key={order.id} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => onSelectOrder(order)}>
                  <td className="p-6 font-black text-xs text-brand-red">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="p-6">
                    <p className="font-black text-xs">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400">{order.phoneNumber}</p>
                  </td>
                  <td className="p-6 text-[10px] font-bold">{new Date(order.createdAt).toLocaleDateString('ar-JO')}</td>
                  <td className="p-6 font-black text-xs text-green-600">{order.totalPrice.toFixed(2)} د.أ</td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeletePermanent(order.id); }} 
                        className="p-2 text-gray-300 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
