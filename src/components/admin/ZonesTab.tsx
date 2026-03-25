'use client';
import { motion } from 'framer-motion';
import { MapPin, Trash2 } from 'lucide-react';
import { DeliveryZone } from '@/types/admin';

interface ZonesTabProps {
  zones: DeliveryZone[];
  zoneForm: { nameEn: string; nameAr: string; fee: string };
  setZoneForm: (form: { nameEn: string; nameAr: string; fee: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function ZonesTab({
  zones,
  zoneForm,
  setZoneForm,
  onAdd,
  onDelete
}: ZonesTabProps) {
  return (
    <motion.div key="zones" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
      <div className="bg-white p-10 rounded-[3rem] border border-brand-gray shadow-sm">
        <h3 className="text-2xl font-black text-brand-black mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center"><MapPin size={24} /></div>
          إضافة منطقة توصيل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input type="text" placeholder="الاسم بالعربي (مثال: اللويبدة)" className="bg-brand-gray/10 p-5 rounded-3xl outline-none font-bold placeholder:text-gray-400" value={zoneForm.nameAr} onChange={e => setZoneForm({ ...zoneForm, nameAr: e.target.value })} />
          <input type="text" placeholder="الاسم بالإنجليزي" className="bg-brand-gray/10 p-5 rounded-3xl outline-none font-bold placeholder:text-gray-400" value={zoneForm.nameEn} onChange={e => setZoneForm({ ...zoneForm, nameEn: e.target.value })} />
          <input type="number" step="0.1" placeholder="سعر التوصيل" className="bg-brand-gray/10 p-5 rounded-3xl outline-none font-bold placeholder:text-gray-400" value={zoneForm.fee} onChange={e => setZoneForm({ ...zoneForm, fee: e.target.value })} />
          <button onClick={onAdd} className="bg-brand-black text-white p-5 rounded-3xl font-black shadow-xl hover:bg-brand-red transition-all">حفظ المنطقة</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-brand-gray shadow-sm overflow-hidden">
        <table className="w-full text-right" dir="rtl">
          <thead className="bg-brand-gray/10 text-brand-black/40 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6">المنطقة</th>
              <th className="px-10 py-6">الاسم الدولي</th>
              <th className="px-10 py-6 text-center">السعر</th>
              <th className="px-10 py-6 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray/40">
            {zones.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-300 font-bold">لا توجد مناطق مضافة حالياً</td></tr>
            ) : zones.map(z => (
              <tr key={z.id} className="hover:bg-brand-cream/5 transition-colors">
                <td className="px-10 py-8 font-black text-xl">{z.nameAr}</td>
                <td className="px-10 py-8 font-bold text-brand-black/30">{z.nameEn}</td>
                <td className="px-10 py-8 text-center font-black text-brand-red">{z.fee.toFixed(2)} د.أ</td>
                <td className="px-10 py-8 text-center">
                  <button onClick={() => onDelete(z.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
