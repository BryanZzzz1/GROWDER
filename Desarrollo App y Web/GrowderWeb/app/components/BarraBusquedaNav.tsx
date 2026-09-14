'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BarraBusquedaNavProps {
  valorInicial?: string;
  placeholder?: string;
  className?: string;
  alCambiarTexto?: (texto: string) => void;
  alBuscar?: (texto: string) => void;
}

export default function BarraBusquedaNav({
  valorInicial = '',
  placeholder = 'Buscar por mate, calabaza, bombilla, termo...',
  className = '',
  alCambiarTexto,
  alBuscar,
}: BarraBusquedaNavProps) {
  const router = useRouter();
  const [termino, setTermino] = useState(valorInicial);
  const [prevValorInicial, setPrevValorInicial] = useState(valorInicial);

  if (valorInicial !== prevValorInicial) {
    setPrevValorInicial(valorInicial);
    setTermino(valorInicial);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTermino(val);
    if (alCambiarTexto) {
      alCambiarTexto(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alBuscar) {
      alBuscar(termino);
    } else {
      const q = termino.trim();
      if (q) {
        router.push(`/buscar?q=${encodeURIComponent(q)}`);
      } else {
        router.push('/buscar');
      }
    }
  };

  const handleLimpiar = () => {
    setTermino('');
    if (alCambiarTexto) {
      alCambiarTexto('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative w-full ${className}`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={termino}
        onChange={handleChange}
        className="w-full text-xs sm:text-sm rounded-full border border-stone-300 bg-stone-50/90 pl-9 pr-9 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#314235] focus:bg-white focus:ring-2 focus:ring-[#314235]/15 transition shadow-inner"
      />

      {/* Boton Icono de Busqueda */}
      <button
        type="submit"
        aria-label="Ejecutar busqueda"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#314235] transition cursor-pointer p-0.5"
        title="Buscar"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Boton para Quitar Texto */}
      {termino && (
        <button
          type="button"
          onClick={handleLimpiar}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer p-1"
          title="Quitar texto"
          aria-label="Quitar texto"
        >
          ✕
        </button>
      )}
    </form>
  );
}
