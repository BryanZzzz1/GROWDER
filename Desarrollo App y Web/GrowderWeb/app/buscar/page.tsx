'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { usarCarrito } from '@/app/datoscarro/estadocarro';
import { useAuth } from '@/src/lib/context/AuthContext';
import SubNavbar, { CategoriaBD } from '@/app/components/SubNavbar';
import BarraBusquedaNav from '@/app/components/BarraBusquedaNav';
import FiltrosBusqueda, { TipoOrden } from './components/FiltrosBusqueda';
import GridResultados, { ProductoItem } from './components/GridResultados';

interface ImagenBD {
  id?: number;
  productoid?: number;
  idproducto?: number;
  url: string;
}

function ContenidoBuscar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isEditor } = useAuth();
  const { carrito, carritoAbierto, setCarritoAbierto, total } = usarCarrito();
  const totalProductosCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Estados de datos
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [categoriasBD, setCategoriasBD] = useState<CategoriaBD[]>([]);
  const [cargando, setCargando] = useState(true);

  const paramQ = searchParams.get('q') || '';
  const paramCat = searchParams.get('categoria') || 'todos';
  const paramOrdenRaw = searchParams.get('orden') as TipoOrden | null;
  const paramOrden: TipoOrden =
    paramOrdenRaw && ['reciente', 'precio-asc', 'precio-desc'].includes(paramOrdenRaw)
      ? paramOrdenRaw
      : 'reciente';

  // Estados de filtros y búsqueda
  const [busquedaTexto, setBusquedaTexto] = useState(paramQ);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | number>(paramCat);
  const [ordenPrecio, setOrdenPrecio] = useState<TipoOrden>(paramOrden);

  // Sincronizar si cambian los parámetros de la URL externamente (navegación del historial)
  const [prevParams, setPrevParams] = useState(searchParams);
  if (searchParams !== prevParams) {
    setPrevParams(searchParams);
    setBusquedaTexto(paramQ);
    setCategoriaSeleccionada(paramCat);
    setOrdenPrecio(paramOrden);
  }

  // Cargar productos y categorías de Supabase
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        // 1. Obtener productos activos
        const { data: dataProductos, error: errorProd } = await supabase
          .from('producto')
          .select('*')
          .eq('activo', true)
          .order('idproducto', { ascending: false });

        if (errorProd) throw errorProd;

        // 2. Obtener categorías activas de la BD
        const { data: dataCategorias } = await supabase
          .from('categorias')
          .select('id, nombre, descripcion, activo')
          .eq('activo', true)
          .order('id', { ascending: true });

        if (dataCategorias && dataCategorias.length > 0) {
          setCategoriasBD(dataCategorias);
        }

        // 3. Obtener imágenes
        const { data: dataImagenes } = await supabase.from('imagenes').select('*');

        const productosConFoto: ProductoItem[] = ((dataProductos as ProductoItem[]) || []).map((p) => {
          const fotoEncontrada = ((dataImagenes as ImagenBD[]) || []).find(
            (img) => img.productoid === p.idproducto || img.idproducto === p.idproducto
          );
          return {
            ...p,
            foto: fotoEncontrada ? fotoEncontrada.url : p.foto,
            categoria: p.categoria || 'Mates Artesanales',
          };
        });

        setProductos(productosConFoto);
      } catch (err) {
        console.error('Error al cargar datos en /buscar:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);



  // Actualizar la URL de forma limpia
  const actualizarUrl = (nuevaCat: string | number, nuevoOrden: TipoOrden, nuevoTexto: string) => {
    const params = new URLSearchParams();
    if (nuevoTexto.trim()) params.set('q', nuevoTexto.trim());
    if (String(nuevaCat) !== 'todos') params.set('categoria', String(nuevaCat));
    if (nuevoOrden !== 'reciente') params.set('orden', nuevoOrden);

    const queryString = params.toString();
    const nuevaUrl = queryString ? `/buscar?${queryString}` : '/buscar';
    window.history.replaceState(null, '', nuevaUrl);
  };

  const handleCambiarCategoria = (catId: string | number) => {
    setCategoriaSeleccionada(catId);
    actualizarUrl(catId, ordenPrecio, busquedaTexto);
  };

  const handleCambiarOrden = (orden: TipoOrden) => {
    setOrdenPrecio(orden);
    actualizarUrl(categoriaSeleccionada, orden, busquedaTexto);
  };

  const handleCambiarTexto = (texto: string) => {
    setBusquedaTexto(texto);
    actualizarUrl(categoriaSeleccionada, ordenPrecio, texto);
  };

  const handleLimpiarFiltros = () => {
    setBusquedaTexto('');
    setCategoriaSeleccionada('todos');
    setOrdenPrecio('reciente');
    router.replace('/buscar');
  };

  // Filtrado y ordenamiento de productos en memoria
  const productosFiltrados = useMemo(() => {
    let resultado = [...productos];

    // 1. Filtro por texto de búsqueda (nombre, descripción, categoría)
    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase().trim();
      resultado = resultado.filter((p) => {
        const texto = `${p.nombre || ''} ${p.descripcion || ''} ${p.categoria || ''}`.toLowerCase();
        return texto.includes(q);
      });
    }

    // 2. Filtro por categoría de la base de datos
    if (String(categoriaSeleccionada) !== 'todos') {
      const catEncontrada = categoriasBD.find((c) => String(c.id) === String(categoriaSeleccionada));
      const nombreFiltro = (catEncontrada ? catEncontrada.nombre : String(categoriaSeleccionada)).toLowerCase();

      resultado = resultado.filter((p) => {
        // Coincidencia por ID
        if (p.categoria_id && String(p.categoria_id) === String(categoriaSeleccionada)) {
          return true;
        }

        // Coincidencia por nombre exacto o parcial en campo categoria
        const catProducto = (p.categoria || '').toLowerCase();
        if (
          catProducto &&
          (catProducto === nombreFiltro ||
            catProducto.includes(nombreFiltro) ||
            nombreFiltro.includes(catProducto))
        ) {
          return true;
        }

        // Coincidencia inteligente por palabras clave según el nombre de la categoría
        const textoCompleto = `${p.nombre || ''} ${p.descripcion || ''} ${p.categoria || ''}`.toLowerCase();

        if (nombreFiltro.includes('mate')) {
          const subTerm = nombreFiltro.replace('mates', '').replace('mate', '').trim();
          if (subTerm.length > 2 && textoCompleto.includes(subTerm)) return true;
          return (
            textoCompleto.includes('mate') ||
            textoCompleto.includes('torpedo') ||
            textoCompleto.includes('camionero') ||
            textoCompleto.includes('imperial') ||
            textoCompleto.includes('algarrobo')
          );
        }

        if (nombreFiltro.includes('calabaza') || nombreFiltro.includes('porongo')) {
          return (
            textoCompleto.includes('calabaza') ||
            textoCompleto.includes('porongo') ||
            textoCompleto.includes('uruguay')
          );
        }

        if (nombreFiltro.includes('bombilla')) {
          return (
            textoCompleto.includes('bombill') ||
            textoCompleto.includes('pico loro') ||
            textoCompleto.includes('alpaca') ||
            textoCompleto.includes('acero')
          );
        }

        if (nombreFiltro.includes('termo') || nombreFiltro.includes('matera')) {
          return (
            textoCompleto.includes('termo') ||
            textoCompleto.includes('matera') ||
            textoCompleto.includes('bolso') ||
            textoCompleto.includes('canasta') ||
            textoCompleto.includes('botell')
          );
        }

        if (nombreFiltro.includes('accesorio') || nombreFiltro.includes('limpieza')) {
          return (
            textoCompleto.includes('accesorio') ||
            textoCompleto.includes('yerbera') ||
            textoCompleto.includes('despolvillador') ||
            textoCompleto.includes('cepillo') ||
            textoCompleto.includes('limpieza')
          );
        }

        return textoCompleto.includes(nombreFiltro);
      });
    }

    // 3. Ordenamiento por precio o fecha de creación (id)
    if (ordenPrecio === 'precio-asc') {
      resultado.sort((a, b) => a.precio - b.precio);
    } else if (ordenPrecio === 'precio-desc') {
      resultado.sort((a, b) => b.precio - a.precio);
    } else {
      // Reciente por ID descendente
      resultado.sort((a, b) => b.idproducto - a.idproducto);
    }

    return resultado;
  }, [productos, busquedaTexto, categoriaSeleccionada, ordenPrecio, categoriasBD]);

  // Conteo dinámico de productos por categoría
  const conteoPorCategoria = useMemo(() => {
    const mapa: { [key: string | number]: number } = {
      todos: productos.length,
    };

    categoriasBD.forEach((cat) => {
      const nombreCat = cat.nombre.toLowerCase();
      const cant = productos.filter((p) => {
        if (p.categoria_id && String(p.categoria_id) === String(cat.id)) return true;
        const catProd = (p.categoria || '').toLowerCase();
        if (
          catProd &&
          (catProd === nombreCat ||
            catProd.includes(nombreCat) ||
            nombreCat.includes(catProd))
        ) {
          return true;
        }

        const texto = `${p.nombre || ''} ${p.descripcion || ''} ${p.categoria || ''}`.toLowerCase();
        if (nombreCat.includes('mate')) {
          const subTerm = nombreCat.replace('mates', '').replace('mate', '').trim();
          if (subTerm.length > 2 && texto.includes(subTerm)) return true;
          return (
            texto.includes('mate') ||
            texto.includes('torpedo') ||
            texto.includes('camionero') ||
            texto.includes('imperial')
          );
        }
        if (nombreCat.includes('calabaza')) return texto.includes('calabaza') || texto.includes('porongo');
        if (nombreCat.includes('bombilla')) return texto.includes('bombill') || texto.includes('pico loro');
        if (nombreCat.includes('termo') || nombreCat.includes('matera')) return texto.includes('termo') || texto.includes('matera') || texto.includes('botell');
        if (nombreCat.includes('accesorio')) return texto.includes('accesorio') || texto.includes('yerbera') || texto.includes('limpieza');

        return texto.includes(nombreCat);
      }).length;

      mapa[cat.id] = cant;
      mapa[cat.nombre] = cant;
    });

    return mapa;
  }, [productos, categoriasBD]);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const nombreCategoriaActiva = useMemo(() => {
    if (String(categoriaSeleccionada) === 'todos') return 'Todas las Categorías';
    const c = categoriasBD.find((item) => String(item.id) === String(categoriaSeleccionada));
    return c ? c.nombre : String(categoriaSeleccionada);
  }, [categoriaSeleccionada, categoriasBD]);

  return (
    <div className="site-shell flex flex-col min-h-screen bg-[#f8f3e9]">
      {/* HEADER DE LA TIENDA */}
      <header className="w-full border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo SuMateCL */}
          <Link href="/" className="flex items-center gap-3 text-left group shrink-0">
            <img
              src="/logocircular.png"
              alt="SuMate Logo"
              className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="hidden xs:block">
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">
                SuMateCL
              </span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-semibold">
                Búsqueda & Catálogo
              </span>
            </div>
          </Link>

          {/* Campo de búsqueda superior interactivo */}
          <div className="flex-1 max-w-lg mx-2">
            <BarraBusquedaNav
              valorInicial={busquedaTexto}
              alCambiarTexto={(val) => handleCambiarTexto(val)}
              alBuscar={(term) => handleCambiarTexto(term)}
              placeholder="Buscar por mate, calabaza, bombilla, termo..."
            />
          </div>

          {/* Acciones de Carrito y Cuenta */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCarritoAbierto(!carritoAbierto)}
              className="flex items-center gap-2 border border-[#8C7762] rounded-full px-3 py-1.5 text-[#8C7762] font-bold hover:bg-[#8C7762]/10 transition cursor-pointer"
              aria-label="Abrir carrito"
            >
              <span className="text-xs hidden sm:inline">
                ${(total || 0).toLocaleString('es-CL')}
              </span>
              <div className="relative flex items-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalProductosCarrito > 0 && (
                  <span className="bg-[#8C7762] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center -ml-1 -mt-2">
                    {totalProductosCarrito}
                  </span>
                )}
              </div>
            </button>

            {isEditor && (
              <Link
                href="/admin"
                className="hidden md:inline-block rounded-full bg-[#314235] px-3.5 py-1.5 text-xs text-white font-semibold hover:bg-[#243127] transition"
              >
                Admin
              </Link>
            )}

            <Link
              href="/"
              className="text-xs font-semibold text-stone-600 hover:text-[#314235] transition hidden sm:inline"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>

        {/* SUBNAVBAR DIRECTO */}
        <SubNavbar
          categorias={categoriasBD}
          categoriaActiva={categoriaSeleccionada}
          onSeleccionarCategoria={(catId) => handleCambiarCategoria(catId)}
          conteoPorCategoria={conteoPorCategoria}
        />
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Cabecera de la búsqueda con breadcrumb y estado */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/" className="hover:text-stone-900 transition">Inicio</Link>
            <span>›</span>
            <span className="text-stone-900 font-semibold">Búsqueda Filtrada</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h1 className="brand-serif text-3xl sm:text-4xl font-bold text-stone-900">
                {nombreCategoriaActiva}
              </h1>
              {busquedaTexto && (
                <p className="text-stone-600 text-sm mt-1">
                  Resultados que contienen: <span className="font-bold text-[#314235]">&quot;{busquedaTexto}&quot;</span>
                </p>
              )}
            </div>

            <div className="text-xs font-semibold text-stone-500">
              {cargando
                ? 'Buscando productos...'
                : `${productosFiltrados.length} ${
                    productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'
                  }`}
            </div>
          </div>

          {/* Etiquetas activas de filtrado */}
          {(String(categoriaSeleccionada) !== 'todos' || ordenPrecio !== 'reciente' || busquedaTexto) && (
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-stone-200">
              <span className="text-xs text-stone-500 font-bold">Filtros aplicados:</span>

              {String(categoriaSeleccionada) !== 'todos' && (
                <span className="bg-white border border-stone-300 text-stone-800 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-semibold">
                  <span>Categoría: {nombreCategoriaActiva}</span>
                  <button
                    type="button"
                    onClick={() => handleCambiarCategoria('todos')}
                    className="text-stone-400 hover:text-red-600 cursor-pointer font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}

              {ordenPrecio === 'precio-asc' && (
                <span className="bg-white border border-stone-300 text-stone-800 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-semibold">
                  <span>Precio: Menor a Mayor</span>
                  <button
                    type="button"
                    onClick={() => handleCambiarOrden('reciente')}
                    className="text-stone-400 hover:text-red-600 cursor-pointer font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}

              {ordenPrecio === 'precio-desc' && (
                <span className="bg-white border border-stone-300 text-stone-800 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-semibold">
                  <span>Precio: Mayor a Menor</span>
                  <button
                    type="button"
                    onClick={() => handleCambiarOrden('reciente')}
                    className="text-stone-400 hover:text-red-600 cursor-pointer font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}

              {busquedaTexto && (
                <span className="bg-white border border-stone-300 text-stone-800 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-semibold">
                  <span>Texto: &quot;{busquedaTexto}&quot;</span>
                  <button
                    type="button"
                    onClick={() => handleCambiarTexto('')}
                    className="text-stone-400 hover:text-red-600 cursor-pointer font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-xs text-[#8C7762] hover:text-[#314235] font-bold hover:underline cursor-pointer ml-1"
              >
                Limpiar todos
              </button>
            </div>
          )}
        </div>

        {/* Layout en columnas: Filtros laterales + Cuadrícula de resultados */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <FiltrosBusqueda
            categorias={categoriasBD}
            categoriaSeleccionada={categoriaSeleccionada}
            onCambiarCategoria={handleCambiarCategoria}
            ordenPrecio={ordenPrecio}
            onCambiarOrden={handleCambiarOrden}
            conteoPorCategoria={conteoPorCategoria}
            onLimpiarFiltros={handleLimpiarFiltros}
            totalResultados={productosFiltrados.length}
            busquedaTexto={busquedaTexto}
            onCambiarTexto={handleCambiarTexto}
          />

          <GridResultados
            productos={productosFiltrados}
            cargando={cargando}
            onLimpiarFiltros={handleLimpiarFiltros}
            formatearPrecio={formatearPrecio}
          />
        </div>
      </main>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#8C7762] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-600 font-semibold text-sm">Cargando buscador...</p>
          </div>
        </div>
      }
    >
      <ContenidoBuscar />
    </Suspense>
  );
}
