'use client';
import { motion } from 'framer-motion';
import { Ticket, Power, Trash2 } from 'lucide-react';
import { Coupon } from '@/types/admin';

interface CouponsTabProps {
  coupons: Coupon[];
  loading: boolean;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponDiscount: string;
  setCouponDiscount: (val: string) => void;
  onCreate: (e: React.FormEvent) => void;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export default function CouponsTab({
  coupons,
  loading,
  couponCode,
  setCouponCode,
  couponDiscount,
  setCouponDiscount,
  onCreate,
  onToggle,
  onDelete
}: CouponsTabProps) {
  return (
    <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
      <div className="bg-white p-12 rounded-[3.5rem] border-2 border-brand-gray shadow-sm">
        <h2 className="text-2xl font-black mb-8 font-serif text-brand-black">إضافة كوبون خصم جديد</h2>
        <form onSubmit={onCreate} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Ticket size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-black/20" />
            <input
              type="text" placeholder="رمز الكوبون (مثال: FREE10)"
              value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              className="w-full bg-brand-cream/30 border-2 border-brand-gray/50 focus:border-brand-red/30 rounded-3xl p-6 pr-14 outline-none font-black text-xl transition-all" required
            />
          </div>
          <div className="flex-1 flex gap-4">
            <input
              type="number" placeholder="نسبة الخصم %"
              value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)}
              className="flex-1 bg-brand-cream/30 border-2 border-brand-gray/50 focus:border-brand-red/30 rounded-3xl p-6 outline-none font-black text-xl transition-all" required
            />
            <button type="submit" className="bg-brand-black text-white px-12 py-6 rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">إنشاء</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coupons.map(coupon => (
            <div key={coupon.id} className={`bg-white p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden flex flex-col justify-between ${coupon.isActive ? 'border-brand-gray shadow-sm hover:shadow-md' : 'opacity-65 border-brand-gray/30 grayscale'}`}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${coupon.isActive ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-gray-100 text-gray-500 border border-gray-200/50'}`}>
                    {coupon.isActive ? 'نشط' : 'معطل'}
                  </span>
                  <div className="text-2xl md:text-3xl font-black text-brand-red font-heading shrink-0">%{coupon.discountPercent}</div>
                </div>
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-black text-brand-black tracking-tight uppercase break-words w-full" title={coupon.code}>
                    {coupon.code}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-brand-gray/10">
                <button onClick={() => onToggle(coupon.id, coupon.isActive)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${coupon.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  <Power size={14} /> <span>{coupon.isActive ? 'تعطيل' : 'تفعيل'}</span>
                </button>
                <button onClick={() => onDelete(coupon.id)} className="p-2.5 text-brand-black/20 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
