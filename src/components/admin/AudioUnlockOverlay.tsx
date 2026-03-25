'use client';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface AudioUnlockOverlayProps {
  onUnlock: () => void;
}

export default function AudioUnlockOverlay({ onUnlock }: AudioUnlockOverlayProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-brand-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-brand-red rounded-full blur-[100px] opacity-20 animate-pulse"></div>
        <div className="relative w-32 h-32 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red border-2 border-brand-red/20 shadow-[0_0_50px_-10px_rgba(255,59,48,0.5)]">
          <Volume2 size={60} strokeWidth={1} className="animate-bounce" />
        </div>
      </div>
      <h2 className="text-4xl font-black text-white mb-4 font-serif">تفعيل نظام التنبيهات الصوتية</h2>
      <p className="text-white/40 text-lg font-bold mb-12 max-w-md leading-relaxed">يجب التفاعل مع الصفحة لمرة واحدة لتتمكن المتصفح من تشغيل صوت التنبيه عند وصول طلبات جديدة.</p>
      <button onClick={onUnlock} className="bg-brand-red text-white px-16 py-8 rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_-10px_rgba(255,59,48,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
        <span>ابدأ الآن</span>
        <div className="w-8 h-[2px] bg-white/30 group-hover:w-12 transition-all"></div>
      </button>
    </motion.div>
  );
}
