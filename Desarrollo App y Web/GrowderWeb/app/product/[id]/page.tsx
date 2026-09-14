'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';
import { usarCarrito, ItemCarrito } from "@/app/datoscarro/estadocarro";
import SubNavbar from '@/app/components/SubNavbar';
import BarraBusquedaNav from '@/app/components/BarraBusquedaNav';

export default function DetalleProductoPage() {
  const { carrito, carritoAbierto, setCarritoAbierto, eliminarDelCarrito, total, agregarAlCarrito } = usarCarrito(); 
  const totalProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const params = useParams();
  const id = params?.id;

  const [producto, setProducto] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string>('');
  const [cantidadCompra, setCantidadCompra] = useState(1);
  const [colorSeleccionado, setColorSeleccionado] = useState<string>('Café moro');
  const [enviosAbierto, setEnviosAbierto] = useState<boolean>(true);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    async function verificarPermisos() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('usuario').select('rol_id, activo').eq('id', session.user.id).single();
        if (data && data.activo && (data.rol_id === 1 || data.rol_id === 2)) setIsAdmin(true);
      }
    }
    verificarPermisos();
  }, []);

  useEffect(() => {
    if (!id) return;
    async function cargarDetalle() {
      setCargando(true);
      try {
        // Consultamos el producto
        const { data: prodData, error: errProd } = await supabase.from('producto').select('*').eq('idproducto', id).single();
        
        // Si Supabase no encuentra el producto, lanzamos el error para ir al catch
        if (errProd) throw errProd;

        // Consultamos la galería
        const { data: imgData } = await supabase.from('imagenes').select('url').eq('productoid', id);

        let listaFotos: string[] = [];

        // Aseguramos primero la foto principal
        if (prodData?.foto && prodData.foto.trim() !== '') {
          listaFotos.push(prodData.foto);
        }

        // Metemos el resto de la galería sin duplicar
        if (imgData && imgData.length > 0) {
          imgData.forEach((img) => {
            if (img.url && !listaFotos.includes(img.url)) {
              listaFotos.push(img.url);
            }
          });
        }

        // Si no hay nada, ponemos el placeholder
        if (listaFotos.length === 0) {
          listaFotos = ['https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80'];
        }

        setProducto({ ...prodData, imagenes: listaFotos });
        setImagenSeleccionada(listaFotos[0]);
      } catch (err: any) {
        // En lugar de ensuciar la consola con un error rojo, lo manejamos silenciosamente
        // ya que es normal que un usuario busque un ID borrado.
        setProducto(null);
      } finally {
        setCargando(false);
      }
    }
    cargarDetalle();
  }, [id]);

  // NAVEGACIÓN DEL CARRUSEL
  const prevImage = () => {
    if (!producto || producto.imagenes.length <= 1) return;
    const currentIndex = producto.imagenes.indexOf(imagenSeleccionada);
    const prevIndex = (currentIndex - 1 + producto.imagenes.length) % producto.imagenes.length;
    setImagenSeleccionada(producto.imagenes[prevIndex]);
  };

  const nextImage = () => {
    if (!producto || producto.imagenes.length <= 1) return;
    const currentIndex = producto.imagenes.indexOf(imagenSeleccionada);
    const nextIndex = (currentIndex + 1) % producto.imagenes.length;
    setImagenSeleccionada(producto.imagenes[nextIndex]);
  };

  // 1. VISTA DE CARGA
  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-[#8C7762] gap-4">
        <div className="w-10 h-10 border-4 border-[#8C7762] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold tracking-widest uppercase text-sm">Cargando SuMate...</p>
      </div>
    );
  }

  // ==============================================================================
  // 2. NUEVA VISTA: PRODUCTO NO ENCONTRADO (Diseño integrado)
  // ==============================================================================
  if (!producto) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] flex flex-col">
        {/* Usamos el mismo header para mantener al cliente dentro de la app */}
        <header className="w-full border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-3 text-left group">
              <img src="/logocircular.png" alt="SuMate Logo" className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
              <div>
                <span className="block brand-serif font-bold tracking-tight text-xl leading-none text-[#1A1A1A]">SuMateCL</span>
                <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8C7762] font-semibold">Más que un mate, una experiencia</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center">
          <div className="w-24 h-24 bg-[#314235]/10 rounded-full flex items-center justify-center mb-6 text-[#314235]">
            {/* Ícono de caja vacía/error */}
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h1 className="brand-serif text-3xl sm:text-4xl font-bold text-[#2d2a23] mb-4">Producto no encontrado</h1>
          <p className="text-stone-600 mb-8 max-w-md mx-auto leading-relaxed">
            Parece que el artículo que buscas no existe, ha sido quitado del inventario o el enlace es incorrecto.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-8 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#884326] shadow-md cursor-pointer">
            Volver al catálogo
          </Link>
        </main>
      </div>
    );
  }
  // ==============================================================================

  // 3. VISTA NORMAL DEL PRODUCTO
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A]">
      {/* HEADER */}
      <header className="w-full border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-3 text-left group shrink-0">
            <img src="/logocircular.png" alt="SuMate Logo" className="h-11 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
            <div className="hidden lg:block">
              <span className="block brand-serif font-bold tracking-tight text-xl leading-none text-[#1A1A1A]">SuMateCL</span>
              <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8C7762] font-semibold">Más que un mate, una experiencia</span>
            </div>
          </Link>

          {/* CENTRO: Barra de búsqueda en el Navbar */}
          <div className="flex-1 max-w-md mx-1 sm:mx-4">
            <BarraBusquedaNav
              placeholder="Buscar mates, bombillas, termos..."
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botón de acceso a Búsqueda Filtrada */}
            <Link
              href="/buscar"
              className="hidden sm:flex items-center gap-1.5 border border-[#8C7762]/30 hover:border-[#314235] text-stone-700 hover:text-[#314235] rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-[#8C7762]/5"
              title="Buscar productos con filtros y orden de precio"
            >
              <svg className="w-3.5 h-3.5 text-[#8C7762]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Filtros</span>
            </Link>
            <div className="relative group">
              <button onClick={() => setCarritoAbierto(!carritoAbierto)} className="flex items-center gap-2 border border-[#8C7762] rounded-full px-3 py-1.5 text-[#8C7762] font-bold hover:bg-[#8C7762]/10 transition cursor-pointer">
                <span className="text-xs">${(total || 0).toLocaleString('es-CL')}</span>
                <div className="relative flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                  {totalProductos > 0 && <span className="bg-[#8C7762] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center -ml-1 -mt-2">{totalProductos}</span>}
                </div>
              </button>

              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 hidden group-hover:block transition-all z-50 text-left">
                {carrito.length === 0 ? (
                  <p className="text-center text-xs text-stone-500 py-3">El carrito está vacío</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {carrito.map((item: ItemCarrito) => (
                        <div key={item.id} className="flex items-center justify-between text-xs border-b border-stone-100 pb-2 gap-2">
                          <img src={item.imagen} alt={item.nombre} className="w-9 h-9 object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80"; }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 truncate">{item.nombre}</p>
                            <p className="text-stone-500">{item.cantidad} × ${(item.precio || 0).toLocaleString('es-CL')}</p>
                          </div>
                          {eliminarDelCarrito && (
                            <button onClick={() => eliminarDelCarrito(item.id)} className="text-stone-400 hover:text-red-500 text-sm font-bold cursor-pointer" title="Quitar producto">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center my-3 text-xs font-bold text-stone-800 border-t pt-2">
                      <span>Subtotal:</span><span>${(total || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => setCarritoAbierto(true)} className="w-full border border-[#8C7762] text-[#8C7762] hover:bg-[#8C7762]/10 text-xs font-bold py-2 rounded-full transition cursor-pointer uppercase">VER CARRITO</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isAdmin && (
              <Link href="/admin" className="rounded-full bg-[#8C7762] hover:bg-[#725F4C] px-5 py-2 text-xs font-bold text-white transition shadow-sm">
                Panel Admin
              </Link>
            )}
          </div>
        </div>

        {/* SUBNAVBAR DE NAVEGACIÓN ENTRE CATEGORÍAS */}
        <SubNavbar />
      </header>

      {/* SECCIÓN PRINCIPAL DE PRODUCTO */}
      <main className="max-w-5xl mx-auto px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* GALERÍA DE IMÁGENES (CARRUSEL FUNCIONAL) */}
          <div className="flex flex-col gap-4 sticky top-24">
            
            <div className="relative w-full h-[450px] bg-white rounded-3xl border border-[#8C7762]/15 shadow-sm flex items-center justify-center p-6 overflow-hidden group">
              <img 
                src={imagenSeleccionada} 
                alt={producto.nombre} 
                className="max-h-full max-w-full object-contain transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80"; }}
              />

              {/* Botones de Navegación del Carrusel */}
              {producto.imagenes.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 bg-white/80 hover:bg-white text-stone-800 p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button onClick={nextImage} className="absolute right-4 bg-white/80 hover:bg-white text-stone-800 p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                  <div className="absolute bottom-4 bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    {producto.imagenes.indexOf(imagenSeleccionada) + 1} / {producto.imagenes.length}
                  </div>
                </>
              )}
            </div>

            {/* Fila de Miniaturas */}
            {producto.imagenes.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 justify-center scrollbar-hide py-1">
                {producto.imagenes.map((url: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setImagenSeleccionada(url)} 
                    className={`w-[72px] h-[72px] rounded-2xl border-2 overflow-hidden bg-white transition-all shrink-0 cursor-pointer ${imagenSeleccionada === url ? 'border-[#527953] shadow-md ring-2 ring-[#527953]/20 scale-105' : 'border-[#8C7762]/20 opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={url} alt={`Vista ${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL PRODUCTO Y COMPRA */}
          <div className="flex flex-col gap-4 text-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C7762]">{producto.categoria || 'Colección Artesanal'}</span>
              <span className="bg-[#527953]/10 text-[#527953] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Edición Importada</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">{producto.nombre}</h1>

            <div className="border-b border-[#8C7762]/15 pb-4">
              <div className="flex items-baseline gap-3"><p className="text-3xl font-bold text-[#527953]">${producto.precio?.toLocaleString('es-CL')}</p><span className="text-xs text-stone-400">CLP</span></div>
              <p className="text-[11px] text-stone-500 mt-1">Envíos rápidos a todo Chile. Calidad premium garantizada.</p>
            </div>

            <div className="space-y-2 mt-1">
              <label className="text-xs font-semibold text-stone-700 block uppercase tracking-wider">Tone / Color</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setColorSeleccionado('Café moro')} className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer border ${colorSeleccionado === 'Café moro' ? 'bg-[#8C7762] text-white border-[#8C7762] shadow-sm' : 'bg-white text-stone-700 border-[#8C7762]/30 hover:bg-[#8C7762]/5'}`}>Café moro</button>
                <button type="button" onClick={() => setColorSeleccionado('Negro')} className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer border ${colorSeleccionado === 'Negro' ? 'bg-stone-900 text-white border-stone-900 shadow-sm' : 'bg-white text-stone-700 border-[#8C7762]/30 hover:bg-[#8C7762]/5'}`}>Negro Premium</button>
              </div>
            </div>

            <div className="space-y-3 mt-2">
              <label className="text-xs font-semibold text-stone-700 block uppercase tracking-wider">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center border border-[#8C7762]/30 rounded-full bg-white px-4 py-2 gap-5">
                  <button onClick={() => setCantidadCompra(Math.max(1, cantidadCompra - 1))} className="text-stone-500 hover:text-stone-900 font-bold text-sm cursor-pointer">−</button>
                  <span className="font-semibold text-xs text-stone-800 min-w-[14px] text-center">{cantidadCompra}</span>
                  <button onClick={() => setCantidadCompra(Math.min(producto.cantidad || 99, cantidadCompra + 1))} className="text-stone-500 hover:text-stone-900 font-bold text-sm cursor-pointer">+</button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button onClick={() => { if (!producto) return; agregarAlCarrito({ id: String(producto.idproducto || id), nombre: `${producto.nombre} (${colorSeleccionado})`, precio: Number(producto.precio || 0), imagen: imagenSeleccionada || producto.imagenes?.[0] || producto.foto || '/placeholder.png' }, cantidadCompra); }} className="w-full bg-[#8C7762] hover:bg-[#785C3A] text-white text-xs font-bold py-3.5 rounded-full transition uppercase tracking-wider shadow-sm cursor-pointer">Añadir al carrito</button>
                <button onClick={() => { if (!producto) return; agregarAlCarrito({ id: String(producto.idproducto || id), nombre: `${producto.nombre} (${colorSeleccionado})`, precio: Number(producto.precio || 0), imagen: imagenSeleccionada || producto.imagenes?.[0] || producto.foto || '/placeholder.png' }, cantidadCompra); setCarritoAbierto(true); }} className="w-full bg-[#527953] hover:bg-[#436444] text-white text-xs font-bold py-3.5 rounded-full transition uppercase tracking-wider shadow-sm cursor-pointer">Comprar ahora</button>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-white border border-[#8C7762]/15 text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-2 text-[#527953] font-bold"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Despacho o retiro listo en Santiago</span></div>
              <p className="text-stone-500 text-[11px]">Coordinación directa para entregas en el día o despachos a todo Chile.</p>
            </div>

            <div className="mt-4 text-xs text-stone-700 leading-relaxed border-t border-[#8C7762]/15 pt-5 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm mb-2 uppercase tracking-wide">Descripción del Producto</h3>
                {producto.descripcion ? <p className="whitespace-pre-line text-stone-600 leading-relaxed">{producto.descripcion}</p> : <p className="text-stone-400 italic">Sin descripción disponible para este producto.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE INFORMATIVO DE ENVÍOS */}
        <div className="mt-16 bg-white border border-[#8C7762]/15 rounded-3xl p-6 sm:p-8 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-[#8C7762] font-bold block mb-1">Garantía SuMateCL</span>
          <h2 className="text-xl font-bold text-stone-900 mb-6">Información de Envíos & Cuidados</h2>

          <div className="border-t border-stone-200 pt-4">
            <button onClick={() => setEnviosAbierto(!enviosAbierto)} className="w-full flex justify-between items-center text-xs font-bold text-stone-800 py-2 cursor-pointer">
              <div className="flex items-center gap-2"><span className="text-[#527953]">🚚</span><span>Tiempos de Despacho</span></div>
              <span className="text-[#8C7762]">{enviosAbierto ? '▲' : '▼'}</span>
            </button>

            {enviosAbierto && (
              <p className="text-xs text-stone-600 mt-3 leading-relaxed pl-6">
                Envíos dentro de la Región Metropolitana llegan entre 24 y 48 horas hábiles. Para regiones, coordinamos mediante Starken o Blue Express asegurando un embalaje protegido para que tu producto llegue intacto.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}