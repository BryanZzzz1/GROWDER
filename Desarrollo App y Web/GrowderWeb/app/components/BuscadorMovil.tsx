'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BarraBusquedaNav from './BarraBusquedaNav';

interface BuscadorMovilProps {
  valorInicial?: string;
  placeholder?: string;
  alCambiarTexto?: (texto: string) => void;
  alBuscar?: (texto: string) => void;
}

/**
 * Solo móvil (< sm): muestra una lupa en el encabezado. Al tocarla, una barra de
 * búsqueda cubre la fila del encabezado (para que haya espacio para escribir) y, al
 * buscar o cerrar, el encabezado vuelve a su forma normal.
 *
 * Requisito: el contenedor de la fila del encabezado debe tener `relative`.
 */
export default function BuscadorMovil({
  valorInicial = '',
  placeholder = 'Buscar mates, bombillas, termos...',
  alCambiarTexto,
  alBuscar,
}: BuscadorMovilProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [abierto]);

  const buscar = (termino: string) => {
    if (alBuscar) {
      alBuscar(termino);
    } else {
      const q = termino.trim();
      router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : '/buscar');
    }
    setAbierto(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Buscar productos"
        className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[#8C7762]/40 text-[#8C7762] transition hover:bg-[#8C7762]/10 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {abierto && (
        <div className="sm:hidden absolute inset-0 z-40 flex items-center gap-2 bg-white px-4 animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="min-w-0 flex-1">
            <BarraBusquedaNav
              valorInicial={valorInicial}
              placeholder={placeholder}
              alCambiarTexto={alCambiarTexto}
              alBuscar={buscar}
              autoEnfocar
            />
          </div>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar búsqueda"
            className="shrink-0 rounded-full px-2 py-2 text-sm font-semibold text-[#8C7762] hover:text-[#314235] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
