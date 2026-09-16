'use client';

import { useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usarCarrito } from '@/app/datoscarro/estadocarro';

function ExitoContent() {
  const searchParams = useSearchParams();
  const orden = searchParams.get('orden');
  const monto = searchParams.get('monto');
  const { limpiarCarrito } = usarCarrito();

  // Creamos una referencia para saber si ya limpiamos el carrito
  const carritoYaLimpiado = useRef(false);

  // Limpiar el carrito SOLO una vez
  useEffect(() => {
    if (limpiarCarrito && !carritoYaLimpiado.current) {
      limpiarCarrito();
      carritoYaLimpiado.current = true; // Marcamos como limpio para evitar el bucle
    }
  }, [limpiarCarrito]);

  const formatearPrecio = (valor: string | null) => {
    if (!valor) return '';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(valor));
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-200">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="brand-serif text-3xl font-bold text-stone-900 mb-2">¡Pago Exitoso!</h1>
      <p className="text-stone-600 text-sm mb-6 leading-relaxed">
        Tu compra ha sido procesada correctamente a través de Webpay Plus.
      </p>

      <div className="bg-[#f8f3e9] rounded-2xl p-4 border border-[#8C7762]/20 text-xs space-y-3 mb-8">
        <div className="flex justify-between border-b border-stone-200 pb-2">
          <span className="text-stone-500">N° de Orden:</span>
          <span className="font-bold text-stone-800">{orden || 'SM-000000'}</span>
        </div>
        <div className="flex justify-between font-bold text-[#314235] pt-1 text-sm">
          <span>Monto Pagado:</span>
          <span>{formatearPrecio(monto)}</span>
        </div>
      </div>

      <Link href="/" className="inline-block w-full bg-[#314235] hover:bg-[#243127] text-white font-bold py-3.5 px-6 rounded-full transition shadow-md text-sm">
        Volver a la tienda
      </Link>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f3e9] p-4">
      <Suspense fallback={<div className="text-stone-600 font-bold">Cargando confirmación...</div>}>
        <ExitoContent />
      </Suspense>
    </div>
  );
}