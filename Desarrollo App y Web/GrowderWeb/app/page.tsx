'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

interface Producto {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string;
  foto?: string;
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarCatalogo() {
      setCargando(true);
      try {
        const { data: dataProductos, error: errorProd } = await supabase
          .from('producto')
          .select('*')
          .eq('activo', true)
          .order('idproducto', { ascending: false });

        if (errorProd) throw errorProd;

        const { data: dataImagenes } = await supabase
          .from('imagenes')
          .select('*');

        const productosConFoto = (dataProductos || []).map((p: any) => {
          const fotoEncontrada = (dataImagenes || []).find(
            (img: any) => img.productoid === p.idproducto || img.idproducto === p.idproducto
          );
          return {
            ...p,
            foto: fotoEncontrada ? fotoEncontrada.url : p.foto,
            categoria: p.categoria || 'Mates Artesanales'
          };
        });

        setProductos(productosConFoto);
      } catch (err) {
        console.error('Error al cargar catálogo:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarCatalogo();
  }, []);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  const scrollAlCatalogo = () => {
    const el = document.getElementById('product-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="site-shell flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-stone-800/10 bg-[#f8f3e9]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-full border border-stone-300 bg-white flex items-center justify-center font-serif font-bold text-lg text-[#314235] shadow-xs">
              SM
            </div>
            <div className="hidden sm:block">
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none">SoMate</span>
              <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Mates y accesorios
              </span>
            </div>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollAlCatalogo}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#314235] transition hover:bg-[#e8e0d0] cursor-pointer"
            >
              Catálogo
            </button>
            <Link
              href="/admin"
              className="rounded-full bg-[#314235] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243127]"
            >
              Administración
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-10 pb-16 lg:pt-16">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 lg:gap-14 items-center">
            <div className="order-2 lg:order-1">
              <p className="uppercase tracking-[0.25em] text-xs font-bold text-[#a75632]">
                Tradición & Calidad Artesanal
              </p>
              <h1 className="brand-serif mt-4 max-w-2xl text-5xl sm:text-6xl leading-[0.98] tracking-tight text-[#2d2a23]">
                El ritual del buen mate, en cada detalle.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                Descubre nuestra selección exclusiva de mates artesanales, calabazas uruguayas, bombillas cinceladas y accesorios diseñados para perdurar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollAlCatalogo}
                  className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#a75632]/20 transition hover:-translate-y-0.5 hover:bg-[#884326] cursor-pointer"
                >
                  <span>Explorar catálogo</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-[#314235] px-6 py-3.5 font-bold text-[#314235] transition hover:bg-[#314235] hover:text-white"
                >
                  <span>Panel administrativo</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#314235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Mates 100% artesanales</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#314235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Control de stock en tiempo real</span>
                </span>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-[#ddd1ba] rotate-3"></div>
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl bg-[#314235]">
                <img
                  src="https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80"
                  alt="Mates artesanales SoMate"
                  className="h-[26rem] w-full object-cover sm:h-[32rem]"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/75 to-transparent">
                  <p className="max-w-xs text-sm font-medium text-white">
                    Mates artesanales elaborados con calabaza seleccionada y virola cincelada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Bar */}
        <section className="w-full border-y border-stone-800/10 bg-[#314235] grain">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[#f8f3e9]">
            <p className="text-center text-sm font-semibold">Mates y calabazas seleccionadas a mano</p>
            <p className="text-center text-sm font-semibold border-y sm:border-y-0 sm:border-x border-white/20 py-3 sm:py-0">
              Sincronización de inventario en tiempo real
            </p>
            <p className="text-center text-sm font-semibold">Envíos protegidos a todo Chile</p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.22em] text-xs font-bold text-[#a75632]">Nuestros Productos</p>
              <h2 className="brand-serif mt-2 text-4xl text-[#2d2a23]">Catálogo general</h2>
            </div>
            <p className="text-sm font-semibold text-stone-500">
              {cargando
                ? 'Cargando catálogo...'
                : productos.length === 1
                ? '1 producto disponible'
                : `${productos.length} productos disponibles`}
            </p>
          </div>

          {cargando ? (
            <div className="mt-12 py-20 text-center">
              <p className="text-stone-600 font-medium">Cargando inventario de SoMate...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="mt-9 rounded-3xl border border-dashed border-[#746a52]/45 bg-white/45 px-6 py-14 text-center">
              <h3 className="brand-serif mt-4 text-2xl text-[#2d2a23]">No hay productos disponibles</h3>
              <p className="mt-2 text-stone-600">
                Añade nuevos productos desde el panel administrativo para verlos aquí.
              </p>
            </div>
          ) : (
            <div id="product-grid" className="mt-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {productos.map((product) => {
                const sinStock = product.cantidad <= 0;
                return (
                  <article
                    key={product.idproducto}
                    className="rounded-[1.6rem] border border-stone-800/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="image-frame flex h-48 sm:h-56 items-center justify-center rounded-2xl overflow-hidden text-[#f8f3e9]">
                        {product.foto ? (
                          <img
                            src={product.foto}
                            alt={product.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        ) : (
                          <span className="font-serif text-sm opacity-80">SoMate Artesanal</span>
                        )}
                      </div>
                      <div className="mt-5 flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block rounded-full bg-[#e8e0d0] px-3 py-1 text-xs font-bold text-[#314235]">
                            {product.categoria || 'Mates Artesanales'}
                          </span>
                          <h3 className="brand-serif mt-3 text-2xl leading-tight text-[#2d2a23]">
                            {product.nombre}
                          </h3>
                        </div>
                        <span className="whitespace-nowrap text-lg font-bold text-[#a75632]">
                          {formatearPrecio(product.precio)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-600 line-clamp-3">
                        {product.descripcion}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
                      <span className="text-xs font-bold text-[#314235]">
                        {sinStock ? 'Sin stock' : `${product.cantidad} unidades disponibles`}
                      </span>
                      <svg className="w-4 h-4 text-[#746a52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured Section */}
        <section className="w-full bg-[#e8e0d0] py-16">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="uppercase tracking-[0.22em] text-xs font-bold text-[#a75632]">Selección Destacada</p>
                <h2 className="brand-serif mt-2 text-4xl text-[#2d2a23]">Hechos a mano con dedicación</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80"
                  alt="Curado artesanal"
                  className="h-64 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="brand-serif text-2xl text-[#2d2a23]">El arte del curado tradicional</h3>
                  <p className="mt-2 leading-7 text-stone-600">
                    Cada calabaza es tratada con procesos naturales para garantizar el mejor sabor en cada cebada y una larga vida útil.
                  </p>
                </div>
              </article>
              <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
                  alt="Virolas en alpaca"
                  className="h-64 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="brand-serif text-2xl text-[#2d2a23]">Virolas y apliques cincelados</h3>
                  <p className="mt-2 leading-7 text-stone-600">
                    Diseños en alpaca maciza trabajados a mano por orfebres especializados en la tradición matera del Río de la Plata.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/10 bg-[#f8f3e9]">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row justify-between gap-3 text-sm">
          <p className="font-bold text-[#314235]">SoMate • GROWDER</p>
          <p className="text-stone-500">Gestión Integral de Inventario y E-Commerce</p>
        </div>
      </footer>
    </div>
  );
}