'use client';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Clock } from 'lucide-react';
import { Customer } from '@/types/admin';

interface CustomersTabProps {
  customers: Customer[];
  loading: boolean;
  onExport: () => void;
  onSelectCustomer: (customer: Customer) => void;
  language: string;
}

export default function CustomersTab({
  customers,
  loading,
  onExport,
  onSelectCustomer,
  language
}: CustomersTabProps) {
  return (
    <motion.div key="customers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-brand-black">قاعدة بيانات الزبائن</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-3 bg-white border-2 border-brand-gray/50 hover:border-brand-red/30 hover:bg-brand-red/5 px-6 py-3 rounded-2xl font-black text-xs transition-all text-brand-black shadow-sm group"
        >
          <FileSpreadsheet size={18} className="text-green-600" />
          <span className="group-hover:translate-x-1 transition-transform">تصدير القائمة</span>
        </button>
      </div>
      {loading ? (
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
                <tr key={j} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => onSelectCustomer(c)}>
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
  );
}
