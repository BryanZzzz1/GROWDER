import React from "react";
import type { EstadoPedido } from "../../types";

interface PedidoEstadoBadgeProps {
  estado: EstadoPedido;
  tamanio?: "sm" | "md" | "lg";
}

export function PedidoEstadoBadge({
  estado,
  tamanio = "md",
}: PedidoEstadoBadgeProps) {
  const estilosPorEstado: Record<
    EstadoPedido,
    {
      bg: string;
      border: string;
      text: string;
      dot: string;
      etiqueta: string;
      icono: React.ReactNode;
    }
  > = {
    pendiente: {
      bg: "bg-gray-50",
      border: "border-gray-200/80",
      text: "text-gray-800",
      dot: "bg-gray-500",
      etiqueta: "Pendiente de pago",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },

    pagado: {
      bg: "bg-amber-50",
      border: "border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
      etiqueta: "Pedido recibido",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },

    cancelado: {
      bg: "bg-stone-100",
      border: "border-stone-300",
      text: "text-stone-600",
      dot: "bg-stone-500",
      etiqueta: "Cancelado",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },

    rechazado: {
      bg: "bg-rose-50",
      border: "border-rose-200/80",
      text: "text-rose-800",
      dot: "bg-rose-500",
      etiqueta: "Pago rechazado",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },

    preparando: {
      bg: "bg-orange-50",
      border: "border-orange-200/80",
      text: "text-orange-800",
      dot: "bg-orange-500",
      etiqueta: "Preparando / embalando",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },

    "en despacho": {
      bg: "bg-sky-50",
      border: "border-sky-200/80",
      text: "text-sky-800",
      dot: "bg-sky-500",
      etiqueta: "En reparto",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"
          />
        </svg>
      ),
    },

    recibido: {
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
      etiqueta: "Entregado",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },

    "en transporte": {
      bg: "bg-blue-50",
      border: "border-blue-200/80",
      text: "text-blue-800",
      dot: "bg-blue-500",
      etiqueta: "En transporte",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },

    "problema stock": {
      bg: "bg-red-50",
      border: "border-red-200/80",
      text: "text-red-800",
      dot: "bg-red-500",
      etiqueta: "Problema de stock",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },

    "entrega fallida": {
      bg: "bg-rose-50",
      border: "border-rose-200/80",
      text: "text-rose-800",
      dot: "bg-rose-500",
      etiqueta: "Entrega fallida",
      icono: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const actual = estilosPorEstado[estado] || {
    bg: "bg-gray-50",
    border: "border-gray-200/80",
    text: "text-gray-800",
    dot: "bg-gray-500",
    etiqueta: estado,
    icono: (
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const clasesTamanio = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[tamanio];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold tracking-wide shadow-2xs transition-all ${actual.bg} ${actual.border} ${actual.text} ${clasesTamanio}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${actual.dot}`} />

      {actual.icono}

      <span className="capitalize">{actual.etiqueta}</span>
    </span>
  );
}