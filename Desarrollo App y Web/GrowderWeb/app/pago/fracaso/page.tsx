'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function FracasoContent() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get('motivo');

  // Liberar el stock reservado al fracasar o cancelarse el pago
  useEffect(() => {
    let codigo = searchParams.get('orden');
    if (!codigo && typeof window !== 'undefined') {
      const guardada = sessionStorage.getItem('somate_reserva_activa');
      if (guardada) {
        try {
          const parsed = JSON.parse(guardada);
          codigo = parsed.codigoReserva;
        } catch {
          // Ignorar
        }
      }
    }

    if (codigo) {
      fetch('/api/reserva/liberar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoReserva: codigo, motivo: 'cancelada' }),
      }).catch(console.error);

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('somate_reserva_activa');
      }
    }
  }, [searchParams]);

  let mensajeError = "Ocurrió un problema al procesar tu pago con la plataforma bancaria.";
  if (motivo === 'cancelado') mensajeError = "Cancelaste el proceso de pago en la pantalla del banco.";
  if (motivo === 'rechazado') mensajeError = "Tu pago fue rechazado por el banco o emisor de la tarjeta.";

  return (
    <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
      <header className="border-b border-[#8C7762]/20 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logocircular.png"
              alt="SuMate Logo"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">
                SuMateCL
              </span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">
                Transacción Cancelada
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 sm:p-10 text-center shadow-xl border border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>

          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="brand-serif text-3xl font-bold text-stone-900 mb-2">Pago No Realizado</h1>
          <p className="text-stone-600 text-sm mb-6 leading-relaxed">
            {mensajeError}
          </p>
          
          <p className="text-xs text-stone-500 mb-8 bg-stone-50 p-4 rounded-xl border border-stone-200">
            No se ha realizado ningún cargo a tu tarjeta ni medio de pago. Puedes intentar nuevamente.
          </p>

          <Link href="/confirmacion-pago" className="inline-block w-full bg-[#8C7762] hover:bg-[#725F4C] text-white font-bold py-3.5 px-6 rounded-full transition shadow-md text-sm">
            Volver a la caja e intentar de nuevo
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function PagoFracasoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f3e9] p-4">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-stone-600 font-bold text-sm">Cargando estado...</div>
      </div>
    }>
      <FracasoContent />
    </Suspense>
  );
}