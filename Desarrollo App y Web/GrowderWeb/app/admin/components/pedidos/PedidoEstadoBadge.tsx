import React from "react";
import { EstadoPedido } from "../../types";

interface PedidoEstadoBadgeProps {
  estado: EstadoPedido;
  tamanio?: "sm" | "md" | "lg";
}

export function PedidoEstadoBadge({
  estado,
  tamanio = "md",
}: PedidoEstadoBadgeProps) {
  const estilosPorEstado = {
    pendiente: {
      bg: "bg-amber-50",
      border: "border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
      etiqueta: "Pendiente",
      icono: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    "en despacho": {
      bg: "bg-sky-50",
      border: "border-sky-200/80",
      text: "text-sky-800",
      dot: "bg-sky-500",
      etiqueta: "En Despacho",
      icono: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
    },
    recibido: {
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
      etiqueta: "Recibido",
      icono: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const actual = estilosPorEstado[estado] || estilosPorEstado.pendiente;

  const clasesTamanio = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[tamanio];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs tracking-wide transition-all ${actual.bg} ${actual.border} ${actual.text} ${clasesTamanio}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${actual.dot}`} />
      {actual.icono}
      <span>{actual.etiqueta}</span>
    </span>
  );
}
