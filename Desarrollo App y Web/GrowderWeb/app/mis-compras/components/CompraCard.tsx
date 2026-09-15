import React from "react";
import { Pedido } from "@/app/admin/types";

interface CompraCardProps {
  pedido: Pedido;
  onVerDetalle: (pedido: Pedido) => void;
  onVolverAComprar?: (pedido: Pedido) => void;
}

export function CompraCard({
  pedido,
  onVerDetalle,
  onVolverAComprar,
}: CompraCardProps) {
  const primerItem = pedido.items?.[0];
  const totalItems =
    pedido.items?.reduce((acc, it) => acc + (it.cantidad || 1), 0) || 1;

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFechaCabecera = (fechaStr?: string) => {
    if (!fechaStr) return "Compra reciente";
    const f = new Date(fechaStr);
    return f.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden">
      {/* Barra superior con fecha y código de compra */}
      <div className="bg-[#fdfbf7] px-6 py-3.5 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-900">
            {formatearFechaCabecera(pedido.created_at)}
          </span>
          <span className="text-stone-300">|</span>
          <span className="font-mono text-stone-500 font-medium">
            #{pedido.codigo_pedido}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pedido.estado === "recibido" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Entregado
            </span>
          ) : pedido.estado === "en despacho" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/80">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              En camino
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              En preparación
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Información del producto y envío */}
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          {/* Miniatura del producto */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
            {primerItem?.foto ? (
              <img
                src={primerItem.foto}
                alt={primerItem.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>

          {/* Textos del estado y producto */}
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold text-emerald-800">
              {pedido.estado === "recibido"
                ? "Llegó conforme a tu dirección"
                : pedido.estado === "en despacho"
                ? "En camino a " + pedido.comuna
                : "Preparando tu envío artesanal"}
            </p>

            <h3 className="text-sm sm:text-base font-bold text-stone-900 line-clamp-1">
              {primerItem?.nombre || "Pack de Mates y Accesorios"}
            </h3>

            <p className="text-xs text-stone-500">
              {totalItems} {totalItems === 1 ? "unidad" : "unidades"}
              {pedido.items && pedido.items.length > 1 && (
                <span> ({pedido.items.length} productos distintos)</span>
              )}
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs">
              <span className="font-bold text-stone-800">
                {formatearPrecio(pedido.total)}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">Tienda Oficial SoMateCL</span>
            </div>
          </div>
        </div>

        {/* Botones de acción derecha */}
        <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
          <button
            type="button"
            onClick={() => onVerDetalle(pedido)}
            className="flex-1 lg:flex-none px-5 py-2.5 rounded-full bg-[#314235] hover:bg-[#243127] text-white font-bold text-xs transition cursor-pointer shadow-xs text-center"
          >
            Ver compra y seguimiento
          </button>

          {onVolverAComprar && (
            <button
              type="button"
              onClick={() => onVolverAComprar(pedido)}
              className="flex-1 lg:flex-none px-5 py-2 rounded-full border border-stone-300 hover:bg-[#f8f3e9] text-stone-700 font-bold text-xs transition cursor-pointer text-center"
            >
              Volver a comprar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
