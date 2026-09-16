'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FracasoContent() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get('motivo');

  let mensajeError = "Ocurrió un problema al procesar tu pago con Webpay.";
  if (motivo === 'cancelado') mensajeError = "Cancelaste el proceso de pago en la pantalla de Transbank.";
  if (motivo === 'rechazado') mensajeError = "Tu pago fue rechazado por el banco o emisor de la tarjeta.";

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-200">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="brand-serif text-3xl font-bold text-stone-900 mb-2">Pago No Realizado</h1>
      <p className="text-stone-600 text-sm mb-6 leading-relaxed">
        {mensajeError}
      </p>
      
      <p className="text-xs text-stone-500 mb-8">
        No se ha realizado ningún cargo a tu tarjeta. Puedes intentar nuevamente con otro método de pago.
      </p>

      <Link href="/checkout" className="inline-block w-full bg-[#a75632] hover:bg-[#884326] text-white font-bold py-3.5 px-6 rounded-full transition shadow-md text-sm">
        Volver al Carrito y Reintentar
      </Link>
    </div>
  );
}

export default function PagoFracasoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f3e9] p-4">
      <Suspense fallback={<div className="text-stone-600 font-bold">Cargando estado...</div>}>
        <FracasoContent />
      </Suspense>
    </div>
  );
}