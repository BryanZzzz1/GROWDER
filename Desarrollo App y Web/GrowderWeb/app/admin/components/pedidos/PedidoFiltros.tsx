import React from "react";
import { EstadoPedido } from "../../types";

export type FiltroEstado = "todos" | EstadoPedido;

interface PedidoFiltrosProps {
  filtroActivo: FiltroEstado;
  setFiltroActivo: (filtro: FiltroEstado) => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  conteoPorEstado: {
    todos: number;
    pendiente: number;
    "en despacho": number;
    recibido: number;
  };
}

export function PedidoFiltros({
  filtroActivo,
  setFiltroActivo,
  busqueda,
  setBusqueda,
  conteoPorEstado,
}: PedidoFiltrosProps) {
  const botonesFiltro: { id: FiltroEstado; label: string; count: number }[] = [
    { id: "todos", label: "Todos los paquetes", count: conteoPorEstado.todos },
    { id: "pendiente", label: "Pendientes", count: conteoPorEstado.pendiente },
    { id: "en despacho", label: "En Despacho", count: conteoPorEstado["en despacho"] },
    { id: "recibido", label: "Recibidos", count: conteoPorEstado.recibido },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 border-b border-stone-200">
      {/* Botones de Filtro por Estado */}
      <div className="flex flex-wrap items-center gap-2">
        {botonesFiltro.map((btn) => {
          const isActive = filtroActivo === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFiltroActivo(btn.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#314235] text-white shadow-sm shadow-[#314235]/20"
                  : "bg-white text-stone-600 border border-stone-300/80 hover:bg-[#f3ede1]"
              }`}
            >
              <span>{btn.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {btn.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador de pedidos / paquetes */}
      <div className="relative w-full lg:w-80">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, cliente, comuna..."
          className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] pl-9 pr-8 py-2 text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#314235] transition"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer text-xs"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
