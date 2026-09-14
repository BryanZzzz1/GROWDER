'use client';

import React from 'react';
import Link from 'next/link';

export interface ProductoItem {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string;
  categoria_id?: number | null;
  foto?: string;
}

interface GridResultadosProps {
  productos: ProductoItem[];
  cargando: boolean;
  onLimpiarFiltros: () => void;
  formatearPrecio: (val: number) => string;
}

export default function GridResultados({
  productos,
  cargando,
  onLimpiarFiltros,
  formatearPrecio,
}: GridResultadosProps) {
  if (cargando) {
    return (
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-[1.6rem] border border-stone-200 bg-white p-5 animate-pulse flex flex-col justify-between h-[420px]"
            >
              <div className="space-y-4">
                <div className="h-48 rounded-2xl bg-stone-200" />
                <div className="h-4 w-24 bg-stone-200 rounded-full" />
                <div className="h-6 w-3/4 bg-stone-200 rounded-md" />
                <div className="h-4 w-full bg-stone-100 rounded-md" />
                <div className="h-4 w-2/3 bg-stone-100 rounded-md" />
              </div>
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <div className="h-5 w-20 bg-stone-200 rounded-md" />
                <div className="h-4 w-16 bg-stone-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="flex-1">
        <div className="rounded-3xl border border-dashed border-[#8C7762]/30 bg-white/70 p-10 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#f8f3e9] text-[#8C7762] flex items-center justify-center mx-auto mb-4 border border-[#8C7762]/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="brand-serif text-2xl font-bold text-stone-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-stone-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            No hay artículos que coincidan con los criterios de búsqueda o filtros seleccionados actualmente.
          </p>
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="inline-flex items-center gap-2 rounded-full bg-[#314235] hover:bg-[#243127] text-white px-6 py-3 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <span>Restablecer filtros y ver todo</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {productos.map((producto) => {
          const sinStock = producto.cantidad <= 0;

          return (
            <article
              key={producto.idproducto}
              className="relative group cursor-pointer rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-[#8C7762]/30 transition-all flex flex-col justify-between"
            >
              <Link
                href={`/product/${producto.idproducto}`}
                className="absolute inset-0 z-10"
                aria-label={`Ver detalle de ${producto.nombre}`}
              />

              <div>
                {/* Imagen del producto con fallback seguro */}
                <div className="image-frame flex h-48 sm:h-52 items-center justify-center rounded-2xl overflow-hidden bg-[#f8f3e9] text-[#f8f3e9]">
                  {producto.foto ? (
                    <img
                      src={producto.foto}
                      alt={producto.nombre}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <span className="font-serif text-sm text-[#8C7762] opacity-80 font-bold">
                      SuMateCL Artesanal
                    </span>
                  )}
                </div>

                {/* Categoría y Nombre */}
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-[#e8e0d0] px-2.5 py-0.5 text-[11px] font-bold text-[#314235]">
                    {producto.categoria || 'Mates Artesanales'}
                  </span>
                  <h3 className="brand-serif mt-2.5 text-xl leading-tight text-stone-900 group-hover:text-[#314235] transition-colors line-clamp-1">
                    {producto.nombre}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-stone-500 line-clamp-2">
                    {producto.descripcion}
                  </p>
                </div>
              </div>

              {/* Precio y Disponibilidad */}
              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">
                    Precio CLP
                  </span>
                  <span className="text-lg font-bold text-[#a75632] brand-serif">
                    {formatearPrecio(producto.precio)}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    sinStock
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {sinStock ? 'Sin stock' : `${producto.cantidad} disponibles`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
