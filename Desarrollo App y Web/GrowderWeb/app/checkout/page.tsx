'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/confirmacion-pago');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f3e9]">
      <p className="text-stone-600 font-semibold text-sm animate-pulse">
        Cargando confirmación de pago...
      </p>
    </div>
  );
}
