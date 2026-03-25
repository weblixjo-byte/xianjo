'use client';
import { motion } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Save, RefreshCcw } from 'lucide-react';

interface CategoryReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryOrder: string[];
  setCategoryOrder: (order: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function CategoryReorderModal({
  isOpen,
  onClose,
  categoryOrder,
  setCategoryOrder,
  onSave,
  isSaving
}: CategoryReorderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-brand-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-10 border-b border-brand-gray flex justify-between items-center bg-brand-cream/30">
          <div>
            <h3 className="text-3xl font-black text-brand-black font-serif uppercase tracking-tighter">ترتيب الأقسام</h3>
            <p className="text-[10px] font-black text-brand-black/30 uppercase tracking-[0.3em] mt-1">إدارة الترتيب</p>
          </div>
          <button onClick={onClose} className="p-4 bg-white rounded-2xl text-brand-black/20 hover:text-brand-red transition-all shadow-sm"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-4 no-scrollbar">
          <p className="text-[11px] font-black text-brand-red/60 text-center mb-6 bg-brand-red/5 p-4 rounded-2xl">استخدم الأسهم لتغيير ترتيب ظهور الأقسام في القائمة الرئيسية</p>
          {categoryOrder.map((cat, idx) => (
            <div key={cat} className="flex items-center justify-between bg-white p-6 rounded-3xl border-2 border-brand-gray/50 shadow-sm group hover:border-brand-red/30 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-red font-black text-xs shadow-inner">{idx + 1}</div>
                <span className="font-black text-xl text-brand-black">{cat}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { 
                    const newOrder = [...categoryOrder]; 
                    if (idx > 0) { 
                      [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]]; 
                      setCategoryOrder(newOrder); 
                    } 
                  }} 
                  className="p-3 bg-brand-cream rounded-xl text-brand-black/40 hover:text-brand-red hover:bg-white border border-transparent hover:border-brand-red/20 transition-all"
                >
                  <ChevronUp size={20} />
                </button>
                <button 
                  onClick={() => { 
                    const newOrder = [...categoryOrder]; 
                    if (idx < categoryOrder.length - 1) { 
                      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]; 
                      setCategoryOrder(newOrder); 
                    } 
                  }} 
                  className="p-3 bg-brand-cream rounded-xl text-brand-black/40 hover:text-brand-red hover:bg-white border border-transparent hover:border-brand-red/20 transition-all"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-10 border-t border-brand-gray bg-gray-50">
          <button onClick={onSave} disabled={isSaving} className="w-full bg-brand-black text-white p-6 rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
            {isSaving ? <RefreshCcw className="animate-spin" /> : <Save size={24} />}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الترتيب الجديد'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
