"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { usarCarrito, ItemCarrito } from "@/app/datoscarro/estadocarro";
import { useAuth } from "@/src/lib/context/AuthContext";
import SubNavbar, { CategoriaBD } from "@/app/components/SubNavbar";
import BarraBusquedaNav from "@/app/components/BarraBusquedaNav";

interface Producto {
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

interface ImagenDB {
  id?: number;
  url?: string;
  productoid?: number;
  idproducto?: number;
}

function ContenidoHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCat = searchParams.get("categoria") || "todos";
  const paramQ = searchParams.get("q") || "";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const { isEditor } = useAuth();
  const [usuario, setUsuario] = useState<User | null>(null);
  const {
    carrito,
    carritoAbierto,
    setCarritoAbierto,
    eliminarDelCarrito,
    total,
  } = usarCarrito();

  const [categoriasBD, setCategoriasBD] = useState<CategoriaBD[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | number>(paramCat);
  const [busquedaNav, setBusquedaNav] = useState<string>(paramQ);

  // Sincronizar si cambian los parámetros de la URL externamente
  const [prevParams, setPrevParams] = useState(searchParams);
  if (searchParams !== prevParams) {
    setPrevParams(searchParams);
    if (searchParams.get("categoria")) {
      setCategoriaActiva(searchParams.get("categoria")!);
    }
    if (searchParams.get("q")) {
      setBusquedaNav(searchParams.get("q")!);
    }
  }

  const nombreCategoriaActiva = useMemo(() => {
    if (String(categoriaActiva) === "todos") return "Todos los Productos";
    const encontrada = categoriasBD.find((c) => String(c.id) === String(categoriaActiva));
    return encontrada ? encontrada.nombre : "Todos los Productos";
  }, [categoriaActiva, categoriasBD]);

  const totalProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    async function cargarCatalogo() {
      setCargando(true);
      try {
        // Cargar productos activos
        const { data: dataProductos, error: errorProd } = await supabase
          .from("producto")
          .select("*")
          .eq("activo", true)
          .order("idproducto", { ascending: false });

        if (errorProd) throw errorProd;

        // Cargar categorías activas de la base de datos
        const { data: dataCategorias } = await supabase
          .from("categorias")
          .select("id, nombre, descripcion, activo")
          .eq("activo", true)
          .order("id", { ascending: true });

        if (dataCategorias && dataCategorias.length > 0) {
          setCategoriasBD(dataCategorias);
        }

        const { data: dataImagenes } = await supabase
          .from("imagenes")
          .select("*");

        const productosConFoto = ((dataProductos as Producto[]) || []).map((p) => {
          const fotoEncontrada = ((dataImagenes as ImagenDB[]) || []).find(
            (img) =>
              img.productoid === p.idproducto ||
              img.idproducto === p.idproducto,
          );
          return {
            ...p,
            foto: fotoEncontrada ? fotoEncontrada.url : p.foto,
            categoria: p.categoria || "Mates Artesanales",
          };
        });

        setProductos(productosConFoto);
      } catch (err) {
        console.error("Error al cargar catálogo:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarCatalogo();
  }, []);

  useEffect(() => {
    async function revisarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUsuario(session?.user ?? null);
    }

    revisarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const scrollAlCatalogo = () => {
    const el = document.getElementById("seccion-catalogo") || document.getElementById("product-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSeleccionarCategoria = (catId: string | number) => {
    setCategoriaActiva(catId);

    const el = document.getElementById("seccion-catalogo") || document.getElementById("product-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const productosFiltrados = productos.filter((p) => {
    // 0. Búsqueda por escrito desde el Navbar Principal
    if (busquedaNav.trim()) {
      const q = busquedaNav.toLowerCase().trim();
      const texto = `${p.nombre || ""} ${p.descripcion || ""} ${p.categoria || ""}`.toLowerCase();
      if (!texto.includes(q)) {
        return false;
      }
    }

    if (String(categoriaActiva) === "todos") return true;

    // 1. Coincidencia por ID de categoría en la base de datos
    if (p.categoria_id && String(p.categoria_id) === String(categoriaActiva)) {
      return true;
    }

    // 2. Coincidencia por nombre de categoría de la BD
    const catEncontrada = categoriasBD.find((c) => String(c.id) === String(categoriaActiva));
    const nombreFiltro = (catEncontrada ? catEncontrada.nombre : String(categoriaActiva)).toLowerCase();

    const catProducto = (p.categoria || "").toLowerCase();
    if (
      catProducto &&
      (catProducto === nombreFiltro ||
        catProducto.includes(nombreFiltro) ||
        nombreFiltro.includes(catProducto))
    ) {
      return true;
    }

    // 3. Búsqueda inteligente por palabras clave según la categoría
    const texto = `${p.nombre || ""} ${p.descripcion || ""} ${p.categoria || ""}`.toLowerCase();

    if (nombreFiltro.includes("mate")) {
      const subTerm = nombreFiltro.replace("mates", "").replace("mate", "").trim();
      if (subTerm.length > 2 && texto.includes(subTerm)) return true;
      return (
        texto.includes("mate") ||
        texto.includes("torpedo") ||
        texto.includes("camionero") ||
        texto.includes("imperial") ||
        texto.includes("algarrobo")
      );
    }

    if (nombreFiltro.includes("calabaza") || nombreFiltro.includes("porongo")) {
      return (
        texto.includes("calabaza") ||
        texto.includes("porongo") ||
        texto.includes("uruguay")
      );
    }

    if (nombreFiltro.includes("bombilla")) {
      return (
        texto.includes("bombill") ||
        texto.includes("pico loro") ||
        texto.includes("alpaca") ||
        texto.includes("acero") ||
        texto.includes("resorte")
      );
    }

    if (nombreFiltro.includes("termo") || nombreFiltro.includes("matera")) {
      return (
        texto.includes("termo") ||
        texto.includes("matera") ||
        texto.includes("bolso") ||
        texto.includes("canasta") ||
        texto.includes("botell")
      );
    }

    if (nombreFiltro.includes("accesorio") || nombreFiltro.includes("limpieza")) {
      return (
        texto.includes("accesorio") ||
        texto.includes("yerbera") ||
        texto.includes("despolvillador") ||
        texto.includes("cepillo") ||
        texto.includes("limpieza")
      );
    }

    return texto.includes(nombreFiltro);
  });

  const conteoPorCategoria = useMemo(() => {
    const mapa: { [key: string | number]: number } = {
      todos: productos.length,
    };

    categoriasBD.forEach((cat) => {
      const nombreCat = cat.nombre.toLowerCase();
      const cant = productos.filter((p) => {
        if (p.categoria_id && String(p.categoria_id) === String(cat.id)) return true;
        const catProd = (p.categoria || "").toLowerCase();
        if (
          catProd &&
          (catProd === nombreCat ||
            catProd.includes(nombreCat) ||
            nombreCat.includes(catProd))
        ) {
          return true;
        }

        const texto = `${p.nombre || ""} ${p.descripcion || ""} ${p.categoria || ""}`.toLowerCase();
        if (nombreCat.includes("mate")) {
          const subTerm = nombreCat.replace("mates", "").replace("mate", "").trim();
          if (subTerm.length > 2 && texto.includes(subTerm)) return true;
          return (
            texto.includes("mate") ||
            texto.includes("torpedo") ||
            texto.includes("camionero") ||
            texto.includes("imperial")
          );
        }
        if (nombreCat.includes("calabaza")) return texto.includes("calabaza") || texto.includes("porongo");
        if (nombreCat.includes("bombilla")) return texto.includes("bombill") || texto.includes("pico loro");
        if (nombreCat.includes("termo") || nombreCat.includes("matera")) return texto.includes("termo") || texto.includes("matera") || texto.includes("botell");
        if (nombreCat.includes("accesorio")) return texto.includes("accesorio") || texto.includes("yerbera") || texto.includes("limpieza");

        return texto.includes(nombreCat);
      }).length;

      mapa[cat.id] = cant;
      mapa[cat.nombre] = cant;
    });

    return mapa;
  }, [productos, categoriasBD]);

  return (
    <div className="site-shell flex flex-col min-h-screen">
      {/* Header */}
      {/* HEADER CON TU LOGO REAL */}
      <header className="w-full border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3 sm:gap-5">
          {/* LADO IZQUIERDO: Logo */}
          <Link href="/" className="flex items-center gap-3 text-left group shrink-0">
            <img
              src="/logocircular.png"
              alt="SuMate Logo"
              className="h-11 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="hidden lg:block">
              <span className="block brand-serif font-bold tracking-tight text-xl leading-none text-[#1A1A1A]">
                SuMateCL
              </span>
              <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8C7762] font-semibold">
                Más que un mate, una experiencia
              </span>
            </div>
          </Link>

          {/* CENTRO: Barra de búsqueda por escrito en el Navbar Principal */}
          <div className="flex-1 min-w-[200px] sm:min-w-[280px] max-w-lg mx-2 sm:mx-4">
            <BarraBusquedaNav
              valorInicial={busquedaNav}
              alCambiarTexto={(val) => setBusquedaNav(val)}
              alBuscar={(term) => {
                const q = term.trim();
                if (q) {
                  router.push(`/buscar?q=${encodeURIComponent(q)}`);
                } else {
                  router.push('/buscar');
                }
              }}
              placeholder="Buscar mates, bombillas, termos..."
            />
          </div>

          {/* LADO DERECHO: Carrito + Panel Admin */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Widget Carrito con Desplegable */}
            <div className="relative group">
              <button
                onClick={() => setCarritoAbierto(!carritoAbierto)}
                className="flex items-center gap-2 border border-[#8C7762] rounded-full px-3 py-1.5 text-[#8C7762] font-bold hover:bg-[#8C7762]/10 transition cursor-pointer text-xs"
                aria-label="Abrir carrito"
              >
                <span>
                  ${(total || 0).toLocaleString("es-CL")}
                </span>
                <div className="relative flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>

                  {totalProductos > 0 && (
                    <span className="bg-[#8C7762] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center -ml-1 -mt-2">
                      {totalProductos}
                    </span>
                  )}
                </div>
              </button>

              {/* Ventana flotante al pasar el mouse */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 hidden group-hover:block transition-all z-50">
                {carrito.length === 0 ? (
                  <p className="text-center text-xs text-stone-500 py-3">
                    El carrito está vacío
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {carrito.map((item: ItemCarrito) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs border-b border-stone-100 pb-2 gap-2"
                        >
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="w-9 h-9 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 truncate">
                              {item.nombre}
                            </p>
                            <p className="text-stone-500">
                              {item.cantidad} × $
                              {(item.precio || 0).toLocaleString("es-CL")}
                            </p>
                          </div>
                          {eliminarDelCarrito && (
                            <button
                              onClick={() =>
                                eliminarDelCarrito(item.id)
                              }
                              className="text-stone-400 hover:text-red-500 text-sm font-bold cursor-pointer"
                              title="Quitar producto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center my-3 text-xs font-bold text-stone-800 border-t pt-2">
                      <span>Subtotal:</span>
                      <span>${(total || 0).toLocaleString("es-CL")}</span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setCarritoAbierto(true)}
                        className="w-full border border-[#8C7762] text-[#8C7762] hover:bg-[#8C7762]/10 text-xs font-bold py-2 rounded-full transition cursor-pointer uppercase"
                      >
                        VER CARRITO
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {usuario ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/cuenta"
                  className="hidden xl:flex items-center gap-2 bg-[#f8f3e9] border border-[#8C7762]/20 rounded-full pl-2.5 pr-3 py-1 hover:bg-[#efe7d8] transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#314235] text-white flex items-center justify-center font-bold text-xs uppercase">
                    {usuario.email?.charAt(0)}
                  </div>

                  <div className="leading-tight max-w-[110px]">
                    <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                      Mi cuenta
                    </p>

                    <p className="text-xs font-semibold text-stone-700 truncate">
                      {usuario.email}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUsuario(null);
                  }}
                  className="border border-[#8C7762] text-[#8C7762] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#8C7762] hover:text-white transition cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#8C7762] hover:text-[#725F4C] transition"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/registro"
                  className="bg-[#314235] hover:bg-[#243127] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
            {isEditor && (
              <Link
                href="/admin"
                className="rounded-full bg-[#314235] hover:bg-[#243127] px-3.5 py-1.5 text-white text-xs font-semibold transition"
              >
                Administración
              </Link>
            )}
          </div>
        </div>

        {/* SUBNAVBAR DE PRODUCTOS Y CATEGORÍAS (BASADO EN LA BD) */}
        <SubNavbar
          categorias={categoriasBD}
          categoriaActiva={categoriaActiva}
          onSeleccionarCategoria={handleSeleccionarCategoria}
          conteoPorCategoria={conteoPorCategoria}
        />
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
                Descubre nuestra selección exclusiva de mates artesanales,
                calabazas uruguayas, bombillas cinceladas y accesorios diseñados
                para perdurar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollAlCatalogo}
                  className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#a75632]/20 transition hover:-translate-y-0.5 hover:bg-[#884326] cursor-pointer"
                >
                  <span>Explorar catálogo</span>
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
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#314235]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Mates 100% artesanales</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#314235]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
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
                    Mates artesanales elaborados con calabaza seleccionada y
                    virola cincelada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Bar */}
        <section className="w-full border-y border-stone-800/10 bg-[#314235] grain">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[#f8f3e9]">
            <p className="text-center text-sm font-semibold">
              Mates y calabazas seleccionadas a mano
            </p>
            <p className="text-center text-sm font-semibold border-y sm:border-y-0 sm:border-x border-white/20 py-3 sm:py-0">
              Sincronización de inventario en tiempo real
            </p>
            <p className="text-center text-sm font-semibold">
              Envíos protegidos a todo Chile
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="seccion-catalogo" className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-16 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="uppercase tracking-[0.22em] text-xs font-bold text-[#a75632]">
                  Nuestros Productos
                </p>
                {busquedaNav.trim() && (
                  <>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs font-bold text-[#8C7762] bg-[#8C7762]/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span>Búsqueda: &quot;{busquedaNav}&quot;</span>
                      <button
                        type="button"
                        onClick={() => setBusquedaNav("")}
                        className="hover:text-red-500 cursor-pointer text-xs ml-0.5"
                        title="Quitar término de búsqueda"
                      >
                        ✕
                      </button>
                    </span>
                  </>
                )}
                {String(categoriaActiva) !== "todos" && (
                  <>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs font-bold text-[#314235] bg-[#314235]/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span>{nombreCategoriaActiva}</span>
                      <button
                        type="button"
                        onClick={() => handleSeleccionarCategoria("todos")}
                        className="hover:text-red-500 cursor-pointer text-xs ml-0.5"
                        title="Quitar filtro"
                      >
                        ✕
                      </button>
                    </span>
                  </>
                )}
              </div>
              <h2 className="brand-serif mt-2 text-4xl text-[#2d2a23]">
                {busquedaNav.trim()
                  ? `Resultados para "${busquedaNav}"`
                  : String(categoriaActiva) === "todos"
                    ? "Catálogo general"
                    : nombreCategoriaActiva}
              </h2>
            </div>
            <p className="text-sm font-semibold text-stone-500">
              {cargando
                ? "Cargando catálogo..."
                : productosFiltrados.length === 1
                  ? "1 producto disponible"
                  : `${productosFiltrados.length} productos disponibles`}
            </p>
          </div>

          {cargando ? (
            <div className="mt-12 py-20 text-center">
              <p className="text-stone-600 font-medium">
                Cargando inventario de SuMateCL...
              </p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="mt-9 rounded-3xl border border-dashed border-[#746a52]/45 bg-white/45 px-6 py-14 text-center">
              <h3 className="brand-serif mt-4 text-2xl text-[#2d2a23]">
                {busquedaNav.trim() ? "No se encontraron productos coincidentes" : "No hay productos en esta categoría"}
              </h3>
              <p className="mt-2 text-stone-600">
                {busquedaNav.trim()
                  ? `No encontramos artículos que coincidan con "${busquedaNav}". Prueba con otra palabra clave o quita los filtros.`
                  : `Aún no disponemos de artículos bajo la categoría "${nombreCategoriaActiva}".`}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {busquedaNav.trim() && (
                  <button
                    type="button"
                    onClick={() => setBusquedaNav("")}
                    className="inline-flex items-center gap-2 rounded-full border border-[#314235] px-5 py-2 text-xs font-bold text-[#314235] hover:bg-[#314235]/10 transition cursor-pointer"
                  >
                    Quitar búsqueda
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaNav("");
                    handleSeleccionarCategoria("todos");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#314235] px-6 py-2 text-xs font-bold text-white transition hover:bg-[#243127] cursor-pointer"
                >
                  Ver todos los productos
                </button>
              </div>
            </div>
          ) : (
            <div
              id="product-grid"
              className="mt-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {productosFiltrados.map((product) => {
                const sinStock = product.cantidad <= 0;
                return (
                  <article
                    key={product.idproducto}
                    className="relative group cursor-pointer rounded-[1.6rem] border border-stone-800/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <Link
                      href={`/product/${product.idproducto}`}
                      className="absolute inset-0 z-10"
                    />
                    <div>
                      <div className="image-frame flex h-48 sm:h-56 items-center justify-center rounded-2xl overflow-hidden text-[#f8f3e9]">
                        {product.foto ? (
                          <img
                            src={product.foto}
                            alt={product.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                        ) : (
                          <span className="font-serif text-sm opacity-80">
                            SoMate Artesanal
                          </span>
                        )}
                      </div>
                      <div className="mt-5 flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block rounded-full bg-[#e8e0d0] px-3 py-1 text-xs font-bold text-[#314235]">
                            {product.categoria || "Mates Artesanales"}
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
                        {sinStock
                          ? "Sin stock"
                          : `${product.cantidad} unidades disponibles`}
                      </span>
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
                <p className="uppercase tracking-[0.22em] text-xs font-bold text-[#a75632]">
                  Selección Destacada
                </p>
                <h2 className="brand-serif mt-2 text-4xl text-[#2d2a23]">
                  Hechos a mano con dedicación
                </h2>
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
                  <h3 className="brand-serif text-2xl text-[#2d2a23]">
                    El arte del curado tradicional
                  </h3>
                  <p className="mt-2 leading-7 text-stone-600">
                    Cada calabaza es tratada con procesos naturales para
                    garantizar el mejor sabor en cada cebada y una larga vida
                    útil.
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
                  <h3 className="brand-serif text-2xl text-[#2d2a23]">
                    Virolas y apliques cincelados
                  </h3>
                  <p className="mt-2 leading-7 text-stone-600">
                    Diseños en alpaca maciza trabajados a mano por orfebres
                    especializados en la tradición matera del Río de la Plata.
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
          <p className="text-stone-500">
            Gestión Integral de Inventario y E-Commerce
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="site-shell min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#8C7762] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-stone-500">Cargando catálogo...</p>
          </div>
        </div>
      }
    >
      <ContenidoHome />
    </Suspense>
  );
}
