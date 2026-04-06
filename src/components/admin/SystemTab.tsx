'use client';
import { motion } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';

interface SystemTabProps {
  onExportOrders: () => void;
  onExportCustomers: () => void;
}

export default function SystemTab({
  onExportOrders,
  onExportCustomers
}: SystemTabProps) {
  return (
    <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl bg-white p-12 rounded-[3rem] border border-brand-gray shadow-sm">
      <h3 className="text-2xl font-black text-brand-black mb-6">أدوات النظام المتقدمة</h3>
      <div className="space-y-8">
        <div className="p-8 bg-green-50 border-2 border-green-100 rounded-[2rem] space-y-4">
          <h4 className="font-black text-green-700 flex items-center gap-2"><FileSpreadsheet size={20} /> تصدير البيانات الكاملة</h4>
          <p className="text-xs text-green-600 font-bold">بإمكانك تصدير كافة بيانات الطلبات والزبائن إلى ملفات Excel للمراجعة المحاسبية أو الأرشفة.</p>
          <div className="flex gap-4">
            <button onClick={onExportOrders} className="bg-white border-2 border-green-200 text-green-700 px-6 py-3 rounded-xl font-black text-xs hover:bg-green-100 transition-all shadow-sm group flex items-center gap-2">
              <FileSpreadsheet size={14} />
              <span>تصدير الطلبات</span>
            </button>
            <button onClick={onExportCustomers} className="bg-white border-2 border-green-200 text-green-700 px-6 py-3 rounded-xl font-black text-xs hover:bg-green-100 transition-all shadow-sm group flex items-center gap-2">
              <FileSpreadsheet size={14} />
              <span>تصدير الزبائن</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
