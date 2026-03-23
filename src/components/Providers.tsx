'use client';
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from 'react';

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
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '1rem',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
          },
        }}
      />
    </SessionProvider>
  );
}
