'use client';
import { 
  CheckCircle, User, Phone, MapPin, Trash2, Clock, 
  ExternalLink, Copy, Zap, X, Users2, Smartphone 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderItem } from '@/types/admin';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: string) => void;
  onArchive: (id: string) => void;
  onPaymentReceived: (id: string, e: React.MouseEvent) => void;
    onPassPrnt?: (order: Order) => void;
  language: string;
}

export default function OrderCard({ order, onUpdateStatus, onArchive, onPaymentReceived, onPassPrnt, language }: OrderCardProps) {
  return (
    <div className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-brand-gray flex flex-col group relative
      ${order.status === 'PENDING' ? 'ring-2 ring-brand-red ring-inset' : ''}`}>

      <div className="p-4 lg:p-5 xl:p-6 pb-3 flex justify-between items-center bg-brand-cream/5 border-b border-brand-gray/30">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-brand-black/20">المعرف: #{order.id.slice(-6).toUpperCase()}</span>
              {onPassPrnt && (
              <button 
                onClick={(e) => { e.stopPropagation(); onPassPrnt(order); }}
                className="w-full h-full p-2 bg-brand-red text-white rounded-xl transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 group/print"
                title="طباعة (PassPRNT)"
              >
                <Smartphone size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">طباعة الفاتورة</span>
              </button>
            )}
          </div>
          <span className="font-black text-brand-black text-sm flex items-center gap-2">
            <Clock size={14} className="text-brand-red" />
            {new Date(order.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border shadow-sm
          ${order.orderType === 'PICKUP' ? 'bg-orange-500 text-white' : 
            order.orderType === 'TABLE' ? 'bg-emerald-600 text-white' : 'bg-blue-500 text-white'}`}>
          {order.orderType === 'PICKUP' ? 'استلام' : 
           order.orderType === 'TABLE' ? 'حجز طاولة' : 'توصيل'}
        </div>
      </div>

      <div className="p-4 lg:p-5 xl:p-6 space-y-6 flex-1 flex flex-col">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><User size={18} /></div>
            <span className="font-black text-brand-black text-sm">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><Phone size={18} /></div>
            <span className="font-bold text-brand-black text-sm tracking-tight" dir="ltr">{order.phoneNumber}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="bg-brand-red/5 p-2 rounded-xl text-brand-red"><MapPin size={18} /></div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {order.deliveryArea && <span className="font-black text-brand-black text-[10px] uppercase tracking-wider opacity-30">{order.deliveryArea}</span>}
                <span className="font-bold text-brand-black text-xs leading-relaxed">
                  {order.address?.replace(/\(https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+\)/, '').trim() || ('لا يوجد عنوان مفصل')}
                </span>

                {order.address?.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/) && (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={order.address.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/)?.[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[9px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-all active:scale-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} /> خرائط جوجل
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = order.address?.match(/https:\/\/www\.google\.com\/maps\?q=[-0-9.,]+/)?.[0];
                        if (url) {
                          navigator.clipboard.writeText(url);
                          toast.success(language === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied!');
                        }
                      }}
                      className="flex items-center gap-2 text-[9px] font-black text-brand-black/40 hover:text-brand-black bg-brand-gray/5 px-2.5 py-1.5 rounded-lg border border-brand-gray/10 transition-all active:scale-95"
                    >
                      <Copy size={10} /> نسخ الرابط
                    </button>
                  </div>
                )}

                {order.orderType === 'TABLE' && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <Users2 size={12} />
                      {order.reservationPeople} {language === 'ar' ? 'أشخاص' : 'People'}
                    </div>
                    {order.reservationTime && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <Clock size={12} />
                        {order.reservationTime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-black/5 p-4 rounded-2xl space-y-3">
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="font-black text-gray-500">{item.quantity}x {item.name}</span>
              <span className="font-bold text-gray-400">{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          {/* التحليل المالي المصغر */}
          {(order.deliveryFee > 0 || order.serviceFee > 0 || order.discountAmount > 0) && (
            <div className="pt-2 mt-2 border-t border-brand-gray/20 space-y-1.5">
              {order.deliveryFee > 0 && (
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span>رسوم التوصيل:</span>
                  <span>+{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.serviceFee > 0 && (
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span>رسوم إضافية:</span>
                  <span>+{order.serviceFee.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-[10px] font-black text-brand-red">
                  <span>خصم {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>-{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {order.notes && (
          <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
            <p className="text-[11px] font-black text-brand-black italic">&quot;{order.notes}&quot;</p>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-brand-gray/30">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-brand-black/30">المجموع الكلي</span>
            <span className="text-2xl font-black text-brand-red font-serif tracking-tighter">{order.totalPrice.toFixed(2)} <small className="text-[9px] tracking-normal font-sans uppercase">د.أ</small></span>
          </div>

          <div className="flex flex-col gap-3">
            {order.paymentMethod === 'CLIQ' && order.paymentStatus === 'PENDING' && (
              <button
                onClick={(e) => onPaymentReceived(order.id, e)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> تأكيد استلام التحويل كليك
              </button>
            )}
            {order.status === 'PENDING' && (
              <div className="flex flex-col gap-2">
                <button onClick={() => onUpdateStatus(order.id, 'PREPARING')} className="w-full bg-brand-red text-white py-4 rounded-xl font-black shadow-lg shadow-brand-red/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Zap size={16} /> قبول الطلب
                </button>
                <button onClick={() => onUpdateStatus(order.id, 'REJECTED')} className="w-full bg-gray-50 text-brand-black/40 py-4 rounded-xl font-black hover:bg-red-50 hover:text-brand-red border border-brand-gray/10 transition-all flex items-center justify-center gap-2 text-xs">
                  <X size={16} /> رفض وإلغاء الطلب
                </button>
              </div>
            )}
            {order.status === 'PREPARING' && (
              <button onClick={() => onUpdateStatus(order.id, 'READY')} className="w-full bg-brand-black text-white py-4 rounded-xl font-black active:scale-95 transition-all">
                جاهز للتسليم
              </button>
            )}
            {order.status === 'READY' && (
              <button onClick={() => onUpdateStatus(order.id, 'SHIPPED')} className="w-full bg-green-600 text-white py-4 rounded-xl font-black active:scale-95 transition-all">
                تم الاستلام ✅
              </button>
            )}

            <div className="flex flex-col gap-2">
              <button onClick={() => onArchive(order.id)} className="w-full p-3 bg-gray-50 text-gray-400 rounded-xl border border-brand-gray flex items-center justify-center gap-2 font-black text-xs hover:text-brand-red transition-all"><Trash2 size={16} /> أرشفة الطلب</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
