'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

export interface CategoriaBD {
  id: number | string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface SubNavbarProps {
  categorias?: CategoriaBD[];
  categoriaActiva?: number | string;
  onSeleccionarCategoria?: (categoriaId: number | string, nombreCategoria?: string) => void;
  conteoPorCategoria?: { [id: string | number]: number };
  cargando?: boolean;
}

// Categorías de respaldo en caso de que la tabla aún no contenga registros
const CATEGORIAS_FALLBACK: CategoriaBD[] = [
  { id: 'mates-torpedo', nombre: 'Mates Torpedo' },
  { id: 'mates-camionero', nombre: 'Mates Camionero' },
  { id: 'mates-imperiales', nombre: 'Mates Imperiales' },
  { id: 'calabazas', nombre: 'Calabazas' },
  { id: 'bombillas', nombre: 'Bombillas' },
  { id: 'termos-materas', nombre: 'Termos y Materas' },
  { id: 'accesorios', nombre: 'Accesorios y Limpieza' },
];

export default function SubNavbar({
  categorias: categoriasProp,
  categoriaActiva = 'todos',
  onSeleccionarCategoria,
  conteoPorCategoria,
  cargando = false,
}: SubNavbarProps) {
  const router = useRouter();
  const [categoriasBD, setCategoriasBD] = useState<CategoriaBD[]>([]);
  const [cargandoBD, setCargandoBD] = useState(!categoriasProp || categoriasProp.length === 0);
  const navRef = useRef<HTMLDivElement>(null);

  const categorias = categoriasProp && categoriasProp.length > 0 ? categoriasProp : categoriasBD;
  const cargandoCategorias = categoriasProp && categoriasProp.length > 0 ? false : (cargando || cargandoBD);

  // Cargar categorías directamente de Supabase si no fueron pasadas por props
  useEffect(() => {
    if (categoriasProp && categoriasProp.length > 0) {
      return;
    }

    let montado = true;

    async function cargarDesdeBD() {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre, descripcion, activo')
          .eq('activo', true)
          .order('id', { ascending: true });

        if (!montado) return;

        if (!error && data && data.length > 0) {
          setCategoriasBD(data);
        } else {
          // Si la tabla está vacía o hubo error, usar fallback de catálogo
          setCategoriasBD(CATEGORIAS_FALLBACK);
        }
      } catch (err) {
        console.error('Error al cargar categorías de la base de datos:', err);
        if (montado) setCategoriasBD(CATEGORIAS_FALLBACK);
      } finally {
        if (montado) setCargandoBD(false);
      }
    }

    cargarDesdeBD();

    return () => {
      montado = false;
    };
  }, [categoriasProp]);

  const handleClickCategoria = (catId: number | string, nombreCat?: string) => {
    if (onSeleccionarCategoria) {
      onSeleccionarCategoria(catId, nombreCat);
    } else {
      router.push(`/?categoria=${encodeURIComponent(catId)}`);
    }
  };

  const totalGeneral = conteoPorCategoria ? conteoPorCategoria['todos'] : undefined;

  return (
    <nav
      ref={navRef}
      aria-label="Categorías de la base de datos"
      className="w-full bg-[#f8f3e9]/95 backdrop-blur-md border-b border-[#8C7762]/15 shadow-xs select-none relative z-20"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-8">
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 scrollbar-none">
          {/* Título en pantallas medianas y grandes */}
          <div className="hidden md:flex items-center gap-2 pr-3 border-r border-[#8C7762]/20 shrink-0 text-[#8C7762]">
            <span className="text-[10px] uppercase font-bold tracking-widest">Categorías</span>
          </div>

          {/* Lista de categorías dinámicas de la base de datos */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-max flex-1 md:pl-3">
            {/* Opción fija: Todos los Productos */}
            <button
              type="button"
              onClick={() => handleClickCategoria('todos', 'Todos los Productos')}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                categoriaActiva === 'todos'
                  ? 'bg-[#314235] text-white shadow-sm ring-1 ring-[#314235]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>Todos los Productos</span>
              {totalGeneral !== undefined && totalGeneral > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                    categoriaActiva === 'todos'
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200/80 text-stone-600 group-hover:bg-[#8C7762]/20 group-hover:text-[#314235]'
                  }`}
                >
                  {totalGeneral}
                </span>
              )}
            </button>

            {/* Categorías provenientes de la BD */}
            {cargandoCategorias ? (
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-stone-400">
                <div className="w-3 h-3 border-2 border-[#8C7762] border-t-transparent rounded-full animate-spin" />
                <span>Cargando categorías...</span>
              </div>
            ) : (
              categorias.map((cat) => {
                const estaActiva =
                  String(categoriaActiva) === String(cat.id) ||
                  String(categoriaActiva).toLowerCase() === cat.nombre.toLowerCase();

                const cantidad = conteoPorCategoria
                  ? conteoPorCategoria[cat.id] ?? conteoPorCategoria[cat.nombre]
                  : undefined;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    title={cat.descripcion || cat.nombre}
                    onClick={() => handleClickCategoria(cat.id, cat.nombre)}
                    className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      estaActiva
                        ? 'bg-[#314235] text-white shadow-sm ring-1 ring-[#314235]'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-white/80'
                    }`}
                  >
                    <span>{cat.nombre}</span>

                    {cantidad !== undefined && cantidad > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                          estaActiva
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-200/80 text-stone-600 group-hover:bg-[#8C7762]/20 group-hover:text-[#314235]'
                        }`}
                      >
                        {cantidad}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Acciones directas: Búsqueda avanzada y limpiar filtro */}
          <div className="flex items-center gap-2 pl-3 shrink-0">
            <Link
              href="/buscar"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#314235] hover:text-[#8C7762] transition bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-stone-200 shadow-2xs"
              title="Abrir búsqueda filtrada con orden de precios"
            >
              <svg className="w-3 h-3 text-[#8C7762]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Filtrar</span>
            </Link>

            {categoriaActiva !== 'todos' && (
              <button
                type="button"
                onClick={() => handleClickCategoria('todos', 'Todos los Productos')}
                className="text-[11px] font-semibold text-[#8C7762] hover:text-[#314235] transition hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
