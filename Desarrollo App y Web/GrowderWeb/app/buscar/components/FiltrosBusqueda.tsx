'use client';

import React from 'react';
import { CategoriaBD } from '@/app/components/SubNavbar';

export type TipoOrden = 'reciente' | 'precio-asc' | 'precio-desc';

interface FiltrosBusquedaProps {
  categorias: CategoriaBD[];
  categoriaSeleccionada: string | number;
  onCambiarCategoria: (categoriaId: string | number) => void;
  ordenPrecio: TipoOrden;
  onCambiarOrden: (orden: TipoOrden) => void;
  conteoPorCategoria: { [id: string | number]: number };
  onLimpiarFiltros: () => void;
  totalResultados: number;
  busquedaTexto?: string;
  onCambiarTexto?: (texto: string) => void;
}

export default function FiltrosBusqueda({
  categorias,
  categoriaSeleccionada,
  onCambiarCategoria,
  ordenPrecio,
  onCambiarOrden,
  conteoPorCategoria,
  onLimpiarFiltros,
  totalResultados,
  busquedaTexto = '',
  onCambiarTexto,
}: FiltrosBusquedaProps) {
  const hayFiltrosActivos =
    Boolean(busquedaTexto?.trim()) ||
    categoriaSeleccionada !== 'todos' ||
    ordenPrecio !== 'reciente';

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Encabezado del panel de filtros */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-stone-900 text-base">Filtros de Búsqueda</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {totalResultados} {totalResultados === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
          </div>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="text-xs font-semibold text-[#8C7762] hover:text-[#314235] hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* 0. SECCIÓN: BÚSQUEDA POR ESCRITO */}
        {onCambiarTexto && (
          <div className="py-4 border-b border-stone-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Búsqueda por escrito
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar mates, bombillas..."
                value={busquedaTexto}
                onChange={(e) => onCambiarTexto(e.target.value)}
                className="w-full text-xs rounded-xl border border-stone-300 bg-stone-50 pl-8 pr-7 py-2 outline-none focus:border-[#314235] focus:bg-white transition text-stone-800 placeholder:text-stone-400"
              />
              <svg
                className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {busquedaTexto && (
                <button
                  type="button"
                  onClick={() => onCambiarTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer p-0.5"
                  title="Quitar texto"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 1. SECCIÓN: ORDENAR POR PRECIO */}
        <div className="py-5 border-b border-stone-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
            Ordenar por Precio
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onCambiarOrden('reciente')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                ordenPrecio === 'reciente'
                  ? 'bg-[#314235] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>Destacados / Recientes</span>
              {ordenPrecio === 'reciente' && <span className="text-xs">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => onCambiarOrden('precio-asc')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                ordenPrecio === 'precio-asc'
                  ? 'bg-[#314235] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>Menor a mayor precio</span>
              </div>
              {ordenPrecio === 'precio-asc' && <span className="text-xs">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => onCambiarOrden('precio-desc')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                ordenPrecio === 'precio-desc'
                  ? 'bg-[#314235] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>Mayor a menor precio</span>
              </div>
              {ordenPrecio === 'precio-desc' && <span className="text-xs">✓</span>}
            </button>
          </div>
        </div>

        {/* 2. SECCIÓN: CATEGORÍAS DE LA BASE DE DATOS */}
        <div className="pt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
            Categorías
          </label>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {/* Todas las categorías */}
            <button
              type="button"
              onClick={() => onCambiarCategoria('todos')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                categoriaSeleccionada === 'todos'
                  ? 'bg-[#314235] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>Todas las Categorías</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  categoriaSeleccionada === 'todos'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {conteoPorCategoria['todos'] || 0}
              </span>
            </button>

            {/* Categorías provenientes de la BD */}
            {categorias.map((cat) => {
              const estaActiva =
                String(categoriaSeleccionada) === String(cat.id) ||
                String(categoriaSeleccionada).toLowerCase() === cat.nombre.toLowerCase();

              const cantidad =
                conteoPorCategoria[cat.id] ?? conteoPorCategoria[cat.nombre] ?? 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCambiarCategoria(cat.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    estaActiva
                      ? 'bg-[#314235] text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate pr-2">{cat.nombre}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      estaActiva
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón de restablecer si hay filtros activos */}
        {hayFiltrosActivos && (
          <div className="pt-5 border-t border-stone-100 mt-5">
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
