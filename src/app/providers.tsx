'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as SonnerToaster } from 'sonner';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <SonnerToaster 
        position="top-right" 
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'var(--font-geist-sans), sans-serif',
            borderRadius: '8px',
            fontSize: '0.875rem',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            margin: '8px',
            maxWidth: '380px',
          },
          duration: 5000,
          className: 'sonner-toast',
        }}
      />
    </QueryClientProvider>
  );
}
