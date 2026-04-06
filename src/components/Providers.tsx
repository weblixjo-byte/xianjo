'use client';
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from 'react';
import { BRANDING } from '@/constants/branding';

export function Providers({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<'top-center' | 'bottom-center'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'top-center' : 'bottom-center'
  );

  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth < 768 ? 'top-center' : 'bottom-center');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster 
        position={position} 
        containerStyle={{
          top: position === 'top-center' ? 40 : 20,
        }}
        toastOptions={{
          duration: 2000,
          style: {
            background: BRANDING.colors.secondary, // Dynamic Black
            color: BRANDING.colors.accent, // Dynamic Cream
            borderRadius: '2rem',
            padding: '16px 28px',
            fontSize: '15px',
            fontWeight: '900',
            border: `1px solid ${BRANDING.colors.primary}33`, // Subtle Brand Red (20% opacity)
            boxShadow: `0 25px 50px -12px ${BRANDING.colors.primary}40`, // Brand Red Glow
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          },
          success: {
            iconTheme: {
              primary: BRANDING.colors.primary, // Dynamic Red
              secondary: '#fff',
            },
          },
        }}
      />
    </SessionProvider>
  );
}
