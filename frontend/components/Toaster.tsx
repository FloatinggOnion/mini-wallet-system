'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          theme: {
            primary: '#4aed88',
          },
        },
        error: {
          duration: 4000,
          theme: {
            primary: '#ff4b4b',
          },
        },
      }}
    />
  );
} 