'use client';

import { useEffect, Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usarCarrito } from '@/app/datoscarro/estadocarro';

function ExitoContent() {
  const searchParams = useSearchParams();
  const orden = searchParams.get('orden');
  const monto = searchParams.get('monto');
  const tokenWs = searchParams.get('token_ws');
  const paymentId = searchParams.get('payment_id');

  const { limpiarCarrito } = usarCarrito();
  const carritoYaLimpiado = useRef(false);
  const [metodoPago, setMetodoPago] = useState("Webpay Plus");

  useEffect(() => {
    if (limpiarCarrito && !carritoYaLimpiado.current) {
      limpiarCarrito();
      carritoYaLimpiado.current = true;
    }

    if (orden) {
      fetch('/api/reserva/completar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoReserva: orden }),
      }).catch(console.error);

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sumate_reserva_activa');
      }
    }

    if (paymentId && !tokenWs) {
      setMetodoPago("Mercado Pago");
    }
  }, [limpiarCarrito, orden, paymentId, tokenWs]);

  const formatearPrecio = (valor: string | null) => {
    if (!valor) return '';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(valor));
  };

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
                Transacción Aprobada
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 sm:p-10 text-center shadow-xl border border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#314235]"></div>

          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="brand-serif text-3xl font-bold text-stone-900 mb-2">¡Pago Exitoso!</h1>
          <p className="text-stone-600 text-sm mb-6 leading-relaxed">
            Tu compra ha sido procesada correctamente a través de <strong>{metodoPago}</strong>.
          </p>

          <div className="bg-[#f8f3e9] rounded-2xl p-5 border border-[#8C7762]/20 text-xs space-y-3 mb-8">
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">N° de Orden:</span>
              <span className="font-bold text-stone-800">{orden || 'SM-000000'}</span>
            </div>
            {(tokenWs || paymentId) && (
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">ID Transacción:</span>
                <span className="font-mono text-stone-800 truncate max-w-[150px]">
                  {tokenWs || paymentId}
                </span>
              </div>
            )}
            {monto && (
              <div className="flex justify-between font-bold text-[#314235] pt-1 text-sm">
                <span>Monto Pagado:</span>
                <span>{formatearPrecio(monto)}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/mis-compras${orden ? `?pedido=${orden}` : ''}`}
              className="flex items-center justify-center w-full bg-[#314235] hover:bg-[#243127] text-white font-bold py-3.5 px-6 rounded-full transition shadow-md text-sm"
            >
              Hacer seguimiento de mi pedido
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center w-full border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold py-3.5 px-6 rounded-full transition text-sm"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f3e9] p-4">
        <div className="w-10 h-10 border-4 border-[#314235] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-stone-600 font-bold text-sm">Confirmando pago...</div>
      </div>
    }>
      {/* Esta es la línea que corregimos para que llame al contenido y no genere un bucle infinito */}
      <ExitoContent />
    </Suspense>
  );
}