'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, ArrowRightLeft, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onToggleAvailability: (available: boolean) => void;
  onMoveToCategory: () => void;
  onDelete: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onClear,
  onToggleAvailability,
  onMoveToCategory,
  onDelete
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] w-full max-w-4xl px-4">
          <div className="bg-brand-black text-white p-6 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-between border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-8">
              <button onClick={onClear} className="p-3 bg-white/10 rounded-2xl hover:bg-brand-red transition-all"><X size={20} /></button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">تحديد متعدد</span>
                <span className="text-xl font-black">{selectedCount} منتجات مختارة</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onToggleAvailability(true)} className="px-6 py-4 bg-white/5 hover:bg-green-600 rounded-2xl transition-all font-black text-[11px] flex items-center gap-2 group"><Power size={16} className="text-green-400 group-hover:text-white" /> تفعيل</button>
              <button onClick={() => onToggleAvailability(false)} className="px-6 py-4 bg-white/5 hover:bg-orange-600 rounded-2xl transition-all font-black text-[11px] flex items-center gap-2 group"><Power size={16} className="text-orange-400 group-hover:text-white" /> تعطيل</button>
              <button onClick={onMoveToCategory} className="px-6 py-4 bg-white/5 hover:bg-blue-600 rounded-2xl transition-all font-black text-[11px] flex items-center gap-2 group"><ArrowRightLeft size={16} className="text-blue-400 group-hover:text-white" /> نقل لقسم</button>
              <div className="w-[1px] h-10 bg-white/10 mx-2" />
              <button onClick={onDelete} className="px-6 py-4 bg-brand-red text-white rounded-2xl transition-all font-black text-[11px] flex items-center gap-2 hover:scale-105 active:scale-95"><Trash2 size={16} /> حذف النهائي</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
