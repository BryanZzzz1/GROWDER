'use client';

import React from 'react';

interface TimerReservaProps {
  segundosRestantes: number;
  totalSegundos?: number;
  estaExpirado: boolean;
  cargandoReserva: boolean;
  codigoReserva: string | null;
  onReintentarReserva: () => void;
  onVolverTienda: () => void;
}

export function TimerReserva({
  segundosRestantes,
  totalSegundos = 120,
  estaExpirado,
  cargandoReserva,
  codigoReserva,
  onReintentarReserva,
  onVolverTienda,
}: TimerReservaProps) {
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const textoTiempo = `${minutos.toString().padStart(2, '0')}:${segundos
    .toString()
    .padStart(2, '0')}`;

  const porcentaje = Math.max(
    0,
    Math.min(100, (segundosRestantes / totalSegundos) * 100)
  );

  // Esquema de colores según urgencia (2 minutos = 120s)
  const esCritico = segundosRestantes <= 30;
  const esAdvertencia = segundosRestantes > 30 && segundosRestantes <= 60;

  const colorBadge = esCritico
    ? 'bg-rose-50 border-rose-300 text-rose-800'
    : esAdvertencia
    ? 'bg-amber-50 border-amber-300 text-amber-900'
    : 'bg-[#314235]/5 border-[#314235]/20 text-[#314235]';

  const colorBarra = esCritico
    ? 'bg-rose-600'
    : esAdvertencia
    ? 'bg-amber-500'
    : 'bg-[#314235]';

  return (
    <>
      {/* Banner Superior de Reserva Activa */}
      <div
        className={`w-full rounded-2xl border p-4 mb-6 shadow-xs transition-colors duration-300 ${colorBadge}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icono vectorial de reloj */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                esCritico
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : esAdvertencia
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-[#314235]/10 text-[#314235]'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">
                  {cargandoReserva
                    ? 'Apartando unidades en inventario...'
                    : 'Reserva temporal de stock activa'}
                </span>
                {codigoReserva && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/70 border border-stone-200 text-stone-600">
                    {codigoReserva}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {esCritico
                  ? 'Atención: quedan menos de 30 segundos antes de liberar las unidades.'
                  : esAdvertencia
                  ? 'Queda menos de 1 minuto para concretar tu pago.'
                  : 'Tus productos están apartados exclusivamente para ti.'}
              </p>
            </div>
          </div>

          {/* Contador Regresivo */}
          <div className="flex items-center sm:justify-end gap-2 shrink-0">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Tiempo:
            </span>
            <span
              className={`font-mono font-bold text-xl sm:text-2xl px-3 py-1 rounded-lg bg-white border shadow-xs tabular-nums ${
                esCritico
                  ? 'text-rose-600 border-rose-200 animate-pulse'
                  : esAdvertencia
                  ? 'text-amber-700 border-amber-200'
                  : 'text-[#314235] border-stone-200'
              }`}
            >
              {textoTiempo}
            </span>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${colorBarra}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Modal Bloqueante al Expirar la Reserva */}
      {estaExpirado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-stone-200">
            {/* Icono de tiempo vencido */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
            </div>

            <h3 className="font-serif font-bold text-2xl text-stone-900 mb-2">
              Tiempo de reserva agotado
            </h3>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              El límite de 2 minutos para completar tu transacción ha expirado. Por
              política de disponibilidad, las unidades reservadas han retornado al stock
              general de la tienda.
            </p>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-500 mb-6 text-left space-y-1">
              <p className="font-semibold text-stone-700">¿Qué puedes hacer?</p>
              <p>
                Puedes reintentar la reserva inmediatamente si todavía hay unidades
                disponibles en el catálogo, o retornar a la tienda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onReintentarReserva}
                className="flex-1 py-3 px-4 rounded-full bg-[#314235] hover:bg-[#243127] text-white font-bold text-sm transition shadow-md cursor-pointer"
              >
                Volver a reservar
              </button>
              <button
                type="button"
                onClick={onVolverTienda}
                className="py-3 px-4 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-sm transition cursor-pointer"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
