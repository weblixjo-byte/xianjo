'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldAlert, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

interface SupportTabProps {
  onResetData: (pwd: string) => void;
  onResetMenu: (pwd: string) => void;
}

export default function SupportTab({ onResetData, onResetMenu }: SupportTabProps) {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default support password
    if (password === 'support99') {
      setIsUnlocked(true);
      toast.success('تم فتح صلاحيات الدعم');
    } else {
      toast.error('كلمة مرور الدعم غير صحيحة');
    }
  };

  if (!isUnlocked) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="max-w-md mx-auto bg-white p-12 rounded-[3rem] border border-brand-gray shadow-2xl space-y-8 text-center"
      >
        <div className="w-20 h-20 bg-brand-red/5 rounded-full flex items-center justify-center mx-auto text-brand-red">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-brand-black">منطقة الدعم الفني</h3>
          <p className="text-xs text-brand-black/40 font-bold">يرجى إدخال كلمة مرور الدعم للوصول للأدوات المتقدمة</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password" 
            placeholder="كلمة مرور الدعم"
            className="w-full bg-brand-gray/5 border border-brand-gray/20 rounded-2xl px-6 py-4 text-center font-black text-lg focus:ring-2 focus:ring-brand-red outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-brand-black text-white py-4 rounded-2xl font-black hover:bg-brand-red transition-all shadow-lg active:scale-95">
            دخول للمنطقة المحظورة
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl"><Unlock size={24} /></div>
          <div>
            <h3 className="font-black text-emerald-900">وضع الدعم نشط</h3>
            <p className="text-xs text-emerald-700 font-bold">لديك الآن صلاحيات المسح العميق وتصفير النظام.</p>
          </div>
        </div>
        <button onClick={() => setIsUnlocked(false)} className="text-[10px] font-black bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all">إغلاق الجلسة</button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Reset Business Data */}
        <div className="bg-white p-10 rounded-[3rem] border border-brand-gray shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-brand-red/5 rounded-2xl flex items-center justify-center text-brand-red">
              <Trash2 size={28} />
            </div>
            <h4 className="text-xl font-black text-brand-black">تصفير المبيعات والزبائن</h4>
            <p className="text-xs text-brand-black/50 font-medium leading-relaxed">
              سيقوم هذا الإجراء بحذف جميع الطلبات، الأصناف المرتبطة بها، قائمة الزبائن، والتقارير المالية بشكل نهائي. 
              <br/><br/>
              <span className="text-brand-red font-bold">تنبيه: لا يمكن التراجع عن هذا الفعل.</span>
            </p>
          </div>
          <button 
            onClick={() => onResetData(password)}
            className="w-full py-4 bg-brand-red/10 text-brand-red rounded-2xl font-black text-sm hover:bg-brand-red hover:text-white transition-all active:scale-95 border-2 border-transparent hover:shadow-xl hover:shadow-brand-red/20"
          >
            تصفير المبيعات الآن
          </button>
        </div>

        {/* Reset Menu Data */}
        <div className="bg-white p-10 rounded-[3rem] border border-brand-gray shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-brand-red/5 rounded-2xl flex items-center justify-center text-brand-red">
              <ShieldAlert size={28} />
            </div>
            <h4 className="text-xl font-black text-brand-black">مسح المنيو بالكامل</h4>
            <p className="text-xs text-brand-black/50 font-medium leading-relaxed">
              سيقوم هذا الإجراء بحذف جميع &quot;الكاتيجوري&quot; وكافة &quot;الأصناف&quot; المضافة للمنيو حالياً لتقديم منيو جديد تماماً.
              <br/><br/>
              <span className="text-brand-red font-bold">تنبيه: سيخلو الموقع من أي وجبات بعد هذا الإجراء.</span>
            </p>
          </div>
          <button 
            onClick={() => onResetMenu(password)}
            className="w-full py-4 bg-brand-red/10 text-brand-red rounded-2xl font-black text-sm hover:bg-brand-red hover:text-white transition-all active:scale-95 border-2 border-transparent hover:shadow-xl hover:shadow-brand-red/20"
          >
            مسح المنيو والكاتيجوري
          </button>
        </div>
      </div>
    </motion.div>
  );
}
