'use client';
import { motion } from 'framer-motion';
import { Trash2, FileSpreadsheet } from 'lucide-react';

interface SystemTabProps {
  onReset: () => void;
  onExportOrders: () => void;
  onExportCustomers: () => void;
}

export default function SystemTab({
  onReset,
  onExportOrders,
  onExportCustomers
}: SystemTabProps) {
  return (
    <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl bg-white p-12 rounded-[3rem] border border-brand-gray shadow-sm">
      <h3 className="text-2xl font-black text-brand-black mb-6">أدوات النظام المتقدمة</h3>
      <div className="space-y-8">
        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] space-y-4">
          <h4 className="font-black text-brand-red flex items-center gap-2"><Trash2 size={20} /> تصفير الموقع (Data Reset)</h4>
          <p className="text-xs text-red-600 font-bold">سيؤدي هذا الإجراء إلى حذف جميع الطلبات والزبائن بشكل نهائي وبدء الموقع ببيانات نظيفة. لا يمكن التراجع عن هذا الفعل.</p>
          <button onClick={onReset} className="bg-brand-red text-white px-8 py-4 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-lg active:scale-95">تصفير بالكامل الآن</button>
        </div>

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
