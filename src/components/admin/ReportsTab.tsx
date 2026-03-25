'use client';
import { motion } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';
import { ReportSummary } from '@/types/admin';

interface ReportsTabProps {
  reportData: ReportSummary | null;
  reportType: string;
  setReportType: (type: string) => void;
  fetchReports: (type: string) => void;
  loading: boolean;
  onExport: () => void;
}

export default function ReportsTab({
  reportData,
  reportType,
  setReportType,
  fetchReports,
  loading,
  onExport
}: ReportsTabProps) {
  return (
    <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-brand-gray shadow-sm">
        <div className="flex flex-wrap gap-4">
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
        <div className="flex gap-4">
          <button
            onClick={onExport}
            className="flex items-center gap-3 bg-brand-black text-white px-8 py-4 rounded-xl font-black text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xl group"
          >
            <FileSpreadsheet size={18} className="text-green-400" />
            <span>تصدير تقرير إكسيل</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black">جاري إنشاء التقرير...</div>
      ) : reportData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-black text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-bl-[8rem]"></div>
              <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-4">إجمالي الإيرادات</h4>
              <p className="text-6xl font-black font-serif tracking-tighter mb-2">{reportData.totalRevenue.toFixed(2)} <small className="text-xs opacity-30 font-sans tracking-normal font-medium">د.أ</small></p>
              <p className="text-green-400 text-xs font-bold flex items-center gap-2">إجمالي مبيعات الفترة</p>
            </div>
            <div className="bg-white p-12 rounded-[3rem] border-2 border-brand-gray shadow-sm">
              <h4 className="text-brand-black/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">إجمالي الطلبات</h4>
              <p className="text-6xl font-black text-brand-black font-serif tracking-tighter mb-2">{reportData.totalOrders}</p>
              <p className="text-brand-red text-xs font-bold">عدد الطلبات المكتملة</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border-2 border-brand-gray shadow-sm overflow-hidden mt-8">
            <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between">
              <h4 className="text-xl font-black text-brand-black">المبيعات حسب الصنف للفترة المختارة</h4>
              <span className="text-xs font-bold text-brand-black/40">{reportData.itemBreakdown?.length} صنفاً</span>
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
                      <td colSpan={3} className="p-12 text-center text-brand-black/20 font-bold">لا يوجد بيانات مبيعات لهذه الفترة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
