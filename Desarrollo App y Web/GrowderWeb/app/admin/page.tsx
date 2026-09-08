'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

export interface Producto {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string;
  foto?: string;
  imagenes?: { idimagen?: number; url: string }[];
}

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Edit / Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [foto, setFoto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const setStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    if (type !== 'error') {
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const { data: dataProductos, error: errorProd } = await supabase
        .from('producto')
        .select('*')
        .order('idproducto', { ascending: false });

      if (errorProd) throw errorProd;

      const { data: dataImagenes } = await supabase
        .from('imagenes')
        .select('*');

      const productosMapeados: Producto[] = (dataProductos || []).map((p: any) => {
        const fotosAsociadas = (dataImagenes || []).filter(
          (img: any) => img.productoid === p.idproducto || img.idproducto === p.idproducto
        );
        const urlFoto = fotosAsociadas.length > 0 ? fotosAsociadas[0].url : p.foto;
        return {
          ...p,
          foto: urlFoto,
          categoria: p.categoria || 'Mates Artesanales',
          imagenes: fotosAsociadas
        };
      });

      setProductos(productosMapeados);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
      setStatus('No fue posible cargar los productos: ' + (err.message || 'Error desconocido'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const totalProductos = useMemo(() => productos.length, [productos]);

  const beginEdit = (product: Producto) => {
    setEditingId(product.idproducto);
    setNombre(product.nombre);
    setCategoria(product.categoria || 'Mates Artesanales');
    setPrecio(product.precio.toString());
    setCantidad(product.cantidad.toString());
    setFoto(product.foto || '');
    setDescripcion(product.descripcion || '');
    setStatus(`Editando "${product.nombre}".`, 'info');

    const formEl = document.getElementById('product-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setCategoria('');
    setPrecio('');
    setCantidad('');
    setFoto('');
    setDescripcion('');
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const precioNum = parseFloat(precio) || 0;
    const cantidadNum = parseInt(cantidad, 10) || 0;

    if (!nombre.trim() || !descripcion.trim() || precioNum < 0 || cantidadNum < 0) {
      setStatus('Completa todos los campos obligatorios con valores válidos.', 'error');
      return;
    }

    setGuardando(true);
    setStatus(editingId ? 'Guardando cambios...' : 'Creando producto...', 'info');

    try {
      if (editingId) {
        // Actualizar
        const { error: errorUpdate } = await supabase
          .from('producto')
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: precioNum,
            cantidad: cantidadNum,
            activo: true
          })
          .eq('idproducto', editingId);

        if (errorUpdate) throw errorUpdate;

        // Actualizar o insertar imagen
        if (foto.trim()) {
          const { data: imgExistente } = await supabase
            .from('imagenes')
            .select('idimagen')
            .eq('productoid', editingId)
            .limit(1);

          if (imgExistente && imgExistente.length > 0) {
            await supabase
              .from('imagenes')
              .update({ url: foto.trim() })
              .eq('idimagen', imgExistente[0].idimagen);
          } else {
            await supabase
              .from('imagenes')
              .insert([{ productoid: editingId, url: foto.trim() }]);
          }
        }

        setStatus('Cambios guardados correctamente.', 'success');
        resetForm();
        await cargarProductos();
      } else {
        // Crear
        const { data: nuevoProd, error: errorInsert } = await supabase
          .from('producto')
          .insert([
            {
              nombre: nombre.trim(),
              descripcion: descripcion.trim(),
              precio: precioNum,
              cantidad: cantidadNum,
              activo: true
            }
          ])
          .select();

        if (errorInsert) throw errorInsert;

        if (nuevoProd && nuevoProd[0] && foto.trim()) {
          await supabase
            .from('imagenes')
            .insert([{ productoid: nuevoProd[0].idproducto, url: foto.trim() }]);
        }

        setStatus('Producto creado correctamente.', 'success');
        resetForm();
        await cargarProductos();
      }
    } catch (err: any) {
      console.error('Error al guardar:', err);
      setStatus('No se pudo guardar el producto: ' + (err.message || 'Error desconocido'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  const requestDelete = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setStatus('Pulsa "Confirmar" para eliminar el producto permanentemente.', 'info');
      return;
    }

    try {
      await supabase
        .from('imagenes')
        .delete()
        .eq('productoid', id);

      const { error } = await supabase
        .from('producto')
        .delete()
        .eq('idproducto', id);

      if (error) throw error;

      setPendingDeleteId(null);
      if (editingId === id) resetForm();
      setStatus('Producto eliminado correctamente.', 'success');
      await cargarProductos();
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setStatus('No se pudo eliminar el producto: ' + (err.message || ''), 'error');
    }
  };

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
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
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#314235] transition hover:bg-[#e8e0d0]"
            >
              Catálogo
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-[#314235] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243127]"
            >
              Administración
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {/* Banner Superior */}
        <div className="rounded-[2rem] bg-[#314235] p-7 sm:p-10 text-[#f8f3e9] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="uppercase tracking-[0.24em] text-xs font-bold text-[#eac29b]">Panel de Control</p>
              <h1 className="brand-serif mt-3 text-4xl sm:text-5xl">Administración de Inventario</h1>
              <p className="mt-3 max-w-2xl text-[#f8f3e9]/75 leading-7">
                Gestiona los productos disponibles en la tienda, actualiza precios y controla el stock en tiempo real para evitar desfases en bodega.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-6 py-4 min-w-40">
              <span className="block text-xs uppercase tracking-wider text-[#f8f3e9]/65">Total Productos</span>
              <strong className="block mt-1 text-3xl font-serif">{totalProductos}</strong>
            </div>
          </div>
        </div>

        {/* Layout en 2 Columnas */}
        <div className="mt-8 grid xl:grid-cols-[.9fr_1.3fr] gap-8 items-start">
          {/* Columna Izquierda: Formulario */}
          <section className="rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="brand-serif text-3xl text-[#2d2a23]">
                  {editingId ? 'Editar producto' : 'Añadir un producto'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {editingId
                    ? 'Modifica los datos del producto seleccionado y guarda los cambios.'
                    : 'Registra un nuevo mate, bombilla o accesorio en el catálogo general.'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f8f3e9] flex items-center justify-center text-[#a75632] font-bold text-lg">
                +
              </div>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-name">
                  Nombre del producto *
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  placeholder="Ej: Mate Torpedo Uruguayo con Virola de Alpaca"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-category">
                    Categoría *
                  </label>
                  <input
                    id="product-category"
                    type="text"
                    required
                    placeholder="Ej: Mates Artesanales"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-price">
                    Precio ($ CLP) *
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Ej: 24990"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-stock">
                    Stock en bodega *
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Ej: 15"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-image-url">
                    URL de la fotografía
                  </label>
                  <input
                    id="product-image-url"
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                </div>
              </div>

              {foto && (
                <div className="p-3 bg-[#f8f3e9] rounded-xl border border-stone-200 flex items-center gap-3">
                  <img
                    src={foto}
                    alt="Vista previa"
                    className="w-14 h-14 rounded-lg object-cover bg-white border border-stone-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                  <p className="text-xs text-stone-600 truncate flex-1">Vista previa cargada</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-[#2d2a23]" htmlFor="product-description">
                  Descripción detallada *
                </label>
                <textarea
                  id="product-description"
                  required
                  rows={3}
                  placeholder="Describe los materiales, dimensiones, capacidad y detalles artesanales..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="min-h-28 w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
                />
              </div>

              {statusMessage && (
                <p
                  className={`text-sm font-semibold ${
                    statusMessage.type === 'error'
                      ? 'text-red-700'
                      : statusMessage.type === 'success'
                      ? 'text-[#314235]'
                      : 'text-stone-600'
                  }`}
                >
                  {statusMessage.text}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-5 py-3 font-bold text-white transition hover:bg-[#884326] disabled:opacity-60 cursor-pointer"
                >
                  <span>{guardando ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar producto'}</span>
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-stone-300 px-5 py-3 font-bold text-stone-700 transition hover:bg-stone-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Columna Derecha: Listado de Inventario */}
          <section className="rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="brand-serif text-3xl text-[#2d2a23]">Inventario en tiempo real</h2>
                <p className="mt-2 text-sm text-stone-600">
                  Listado sincronizado directamente con la base de datos central de bodega.
                </p>
              </div>
              <button
                onClick={cargarProductos}
                disabled={cargando}
                className="text-xs font-semibold text-[#746a52] hover:text-[#314235] transition-colors cursor-pointer"
              >
                {cargando ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>

            {cargando ? (
              <div className="mt-8 rounded-2xl bg-[#f8f3e9] px-5 py-12 text-center">
                <p className="text-sm text-stone-600 font-medium">Cargando inventario...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-[#f8f3e9] px-5 py-12 text-center">
                <h3 className="brand-serif mt-3 text-xl text-[#2d2a23]">Inventario vacío</h3>
                <p className="mt-1 text-sm text-stone-600">
                  No hay productos registrados en la base de datos actualmente.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {productos.map((product) => {
                  const isPendingDelete = pendingDeleteId === product.idproducto;
                  return (
                    <article
                      key={product.idproducto}
                      className="admin-table-row rounded-2xl border border-stone-200 p-4 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="brand-serif text-xl text-[#2d2a23]">{product.nombre}</h3>
                            <span className="rounded-full bg-[#e8e0d0] px-2.5 py-1 text-xs font-bold text-[#314235]">
                              {product.categoria || 'Mates Artesanales'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-stone-600 line-clamp-2">{product.descripcion}</p>
                          <p className="mt-3 text-xs font-bold text-stone-500">
                            {formatearPrecio(product.precio)} · Stock: {product.cantidad} unidades
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => beginEdit(product)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#314235] px-3 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#314235] hover:text-white cursor-pointer"
                          >
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(product.idproducto)}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                              isPendingDelete
                                ? 'bg-[#a75632] text-white border-[#a75632]'
                                : 'border-[#a75632] text-[#a75632] hover:bg-[#a75632] hover:text-white'
                            }`}
                          >
                            <span>{isPendingDelete ? 'Confirmar' : 'Eliminar'}</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/10 bg-[#f8f3e9] mt-16">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row justify-between gap-3 text-sm">
          <p className="font-bold text-[#314235]">SoMate • GROWDER</p>
          <p className="text-stone-500">Gestión Integral de Inventario y E-Commerce</p>
        </div>
      </footer>
    </div>
  );
}

