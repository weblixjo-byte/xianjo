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
          duration: 4000,
          style: {
            background: '#1a1a1a', // Xian Black
            color: '#f9f7f2', // Xian Cream
            borderRadius: '2rem',
            padding: '16px 28px',
            fontSize: '15px',
            fontWeight: '900',
            border: '1px solid rgba(146, 39, 36, 0.2)', // Subtle Brand Red
            boxShadow: '0 25px 50px -12px rgba(146, 39, 36, 0.25)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          },
          success: {
            iconTheme: {
              primary: '#922724', // Xian Red
              secondary: '#fff',
            },
          },
        }}
      />
    </SessionProvider>
  );
}
