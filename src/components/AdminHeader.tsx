'use client';
import { useState, useEffect } from 'react';
import { Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, icon, actions }: AdminHeaderProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('xian_admin_audio_enabled');
    if (saved === 'true') setIsAudioEnabled(true);
  }, []);

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    localStorage.setItem('xian_admin_audio_enabled', newState.toString());
    
    // Play a test sound to confirm it's working and give browser permission
    if (newState) {
       const testAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
       testAudio.volume = 0.5;
       testAudio.play().catch(e => console.error("Test sound blocked", e));
    }

    // Dispatch custom event for the NotificationHandler to pick up
    window.dispatchEvent(new Event('xian_notification_toggle'));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-16 bg-white p-10 lg:p-12 rounded-[3.5rem] border-2 border-brand-gray shadow-sm relative overflow-hidden transition-all">
      <div className="flex items-center gap-6">
        <div className="bg-brand-red p-5 rounded-3xl text-white shadow-xl shadow-brand-red/10 animate-pulse-slow">
          {icon || <ShieldCheck size={40} strokeWidth={1.5} />}
        </div>
        <div>
          <h1 className="text-4xl font-black text-brand-red font-serif mb-2">{title}</h1>
          <p className="text-brand-black/30 font-bold uppercase tracking-[0.3em] text-xs leading-none">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
        {/* LOUDER Toggle Audio Notifications */}
        <button 
          onClick={toggleAudio}
          className={`w-full lg:w-auto px-10 py-6 rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95
            ${isAudioEnabled 
              ? 'bg-green-600 text-white shadow-green-200' 
              : 'bg-brand-black text-white hover:bg-brand-red shadow-brand-black/10'}`}
        >
          {isAudioEnabled ? <Volume2 size={22} className="animate-bounce" /> : <VolumeX size={22} />}
          <span>{isAudioEnabled ? 'جرس التنبيه: نشط ✅' : 'تفعيل جرس التنبيه 🔔'}</span>
        </button>
        
        {actions}
      </div>
    </div>
  );
}
