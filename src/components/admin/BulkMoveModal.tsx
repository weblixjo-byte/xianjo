'use client';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';

interface BulkMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onMove: (category: string) => void;
}

export default function BulkMoveModal({
  isOpen,
  onClose,
  categories,
  onMove
}: BulkMoveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-brand-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-brand-gray bg-brand-cream/30 flex justify-between items-center">
          <h3 className="text-2xl font-black text-brand-black">نقل إلى قسم آخر</h3>
          <button onClick={onClose} className="p-3 bg-white/50 rounded-xl text-brand-black/20 hover:text-brand-red transition-all"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => onMove(cat)} className="w-full p-6 text-right font-black text-lg bg-gray-50 border-2 border-transparent hover:border-brand-red/30 hover:bg-white rounded-2xl transition-all flex items-center justify-between group">
              <span>{cat}</span>
              <ArrowRightLeft size={20} className="text-brand-black/10 group-hover:text-brand-red transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
