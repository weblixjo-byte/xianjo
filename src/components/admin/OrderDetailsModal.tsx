'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, ExternalLink, Copy, Clock, Store, CheckCircle, Zap, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderItem } from '@/types/admin';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onArchive: (id: string) => void;
  onPaymentReceived: (id: string, e: React.MouseEvent) => void;
  language: string;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onArchive,
  onPaymentReceived,
  language
}: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-brand-gray/20 flex items-center justify-between bg-brand-cream/30">
          <div>
            <h3 className="text-2xl font-black text-brand-black tracking-tight">تفاصيل الطلب</h3>
            <p className="text-brand-red font-bold">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm border border-brand-gray/20 text-brand-black/40 hover:text-brand-red transition-all"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${order.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : 'bg-brand-gray/10 text-brand-black'}`}>
              {order.status === 'PENDING' ? 'بانتظار الموافقة' :
                order.status === 'PREPARING' ? 'قيد التجهيز' :
                  order.status === 'READY' ? 'جاهز للتسليم' :
                    order.status === 'SHIPPED' ? 'تم التوصيل' :
                      order.status === 'REJECTED' ? 'مرفوض' : order.status}
            </div>
            <div className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-brand-red/5 text-brand-red">
              {order.paymentMethod === 'CLIQ' ? 'كليك' : 'كاش'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">معلومات الزبون</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-brand-black font-bold text-sm"><User size={16} className="text-brand-red" /> {order.customerName}</div>
                <div className="flex items-center gap-3 text-brand-black font-bold text-sm"><Phone size={16} className="text-brand-red" /> {order.phoneNumber}</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3 text-brand-black font-bold text-xs">
                    <MapPin size={16} className="text-brand-red shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {order.address?.replace(/\(https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+\)/, '').trim() || 'لا يوجد عنوان مفصل'}
                    </span>
                  </div>
                  {order.address?.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/) && (
                    <div className="flex items-center gap-2 mt-1 px-8">
                      <a
                        href={order.address.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/)?.[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <ExternalLink size={12} /> فتح في الخرائط
                      </a>
                      <button
                        onClick={() => {
                          const url = order.address?.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/)?.[0];
                          if (url) {
                            navigator.clipboard.writeText(url);
                            toast.success(language === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied!');
                          }
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-brand-black/40 hover:text-brand-black bg-brand-gray/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Copy size={12} /> نسخ الرابط
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">التوقيت</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-brand-black font-bold text-xs"><Clock size={16} className="text-brand-red" /> {new Date(order.createdAt).toLocaleString('ar-JO')}</div>
                {order.pickupTime && <div className="flex items-center gap-3 text-brand-red font-black text-sm"><Store size={16} /> {order.pickupTime}</div>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">الأصناف المطلوبة</h4>
            <div className="bg-brand-gray/5 rounded-3xl p-6 space-y-4 border border-brand-gray/10">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-brand-gray/5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-cream flex items-center justify-center font-black text-brand-red text-xs">{item.quantity}x</div>
                    <span className="font-bold text-brand-black text-sm">{item.name}</span>
                  </div>
                  <span className="font-black text-brand-red text-sm">{item.price.toFixed(2)} د.أ</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-brand-gray/10 flex justify-between items-center px-2">
                <span className="font-black text-brand-black text-lg">المجموع الكلي</span>
                <span className="font-black text-brand-red text-2xl">{order.totalPrice.toFixed(2)} د.أ</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-black/20">ملاحظات</h4>
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-amber-900 font-bold text-sm italic">&quot;{order.notes}&quot;</div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-8 border-t border-brand-gray/20 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {order.paymentMethod === 'CLIQ' && order.paymentStatus === 'PENDING' && (
                <button
                  onClick={(e) => onPaymentReceived(order.id, e)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} /> تأكيد استلام التحويل كليك
                </button>
              )}

              {order.status === 'PENDING' && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                    className="w-full bg-brand-red text-white py-5 rounded-2xl font-black shadow-xl shadow-brand-red/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Zap size={20} /> قبول الطلب وتجهيزه
                  </button>
                  <button
                    onClick={() => onUpdateStatus(order.id, 'REJECTED')}
                    className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                  >
                    <X size={18} /> رفض الطلب وإلغاؤه
                  </button>
                </div>
              )}

              {order.status === 'PREPARING' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'READY')}
                  className="w-full bg-brand-black text-white py-5 rounded-2xl font-black active:scale-95 transition-all"
                >
                  جاهز للتسليم الآن
                </button>
              )}

              {order.status === 'READY' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                  className="w-full bg-green-600 text-white py-5 rounded-2xl font-black active:scale-95 transition-all"
                >
                  تم التسليم النهائي ✅
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => onArchive(order.id)}
                className="p-4 bg-brand-gray/20 text-brand-black/40 rounded-2xl flex items-center justify-center gap-3 font-black text-xs hover:text-brand-red hover:bg-red-50 transition-all border border-brand-gray/10"
              >
                <Trash2 size={18} /> أرشفة الطلب نهائياً
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
