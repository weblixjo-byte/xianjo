'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("تم الدخول بنجاح! جاري التوجيه...");
        setTimeout(() => {
          router.push('/admin');
          router.refresh(); // Force middleware re-evaluation
        }, 1000);
      } else {
        toast.error(data.error || "كلمة المرور خاطئة");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("فشل الاتصال بالخادم");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center p-4 font-body" dir="rtl">
      <Toaster position="top-center" />
      <div className="bg-white rounded-[2rem] shadow-xl border border-brand-red/10 p-8 md:p-12 w-full max-w-md animate-fade-in relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-brand-red" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-brand-black luxury-heading mb-2">بوابة الإدارة</h1>
          <p className="text-brand-gray/80 text-sm font-bold">يرجى تأكيد هويتك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="text-sm font-bold text-brand-black/70 mb-2 block">كلمة المرور الإدارية</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full bg-brand-cream/50 text-brand-black pr-12 pl-4 py-4 rounded-2xl border border-brand-gray/30 focus:outline-none focus:border-brand-red focus:bg-white font-bold transition-all text-left"
                placeholder="••••••••••••••"
                dir="ltr"
              />
              <Lock size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-solid py-4 text-lg justify-center flex items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                تسجيل الدخول
                <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
