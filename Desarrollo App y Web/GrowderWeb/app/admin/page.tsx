"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

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

export interface Usuario {
  id: string;
  email: string;
  rol?: string;
  telefono?: string;
  activo?: boolean;
}

export default function AdminPage() {
  const router = useRouter();

  // Estados de sesión y carga
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Navegación de secciones (Pestañas)
  const [pestanaActiva, setPestanaActiva] = useState<"inventario" | "producto" | "roles">("inventario");

  // Estado del Formulario de Producto (Crear / Editar)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [foto, setFoto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Buscador de inventario
  const [busquedaInventario, setBusquedaInventario] = useState("");

  // Estado de Gestión de Roles
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [guardandoRolId, setGuardandoRolId] = useState<string | null>(null);

  const setStatus = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setStatusMessage({ text, type });
    if (type !== "error") {
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const { data: dataProductos, error: errorProd } = await supabase
        .from("producto")
        .select("*")
        .order("idproducto", { ascending: false });

      if (errorProd) throw errorProd;

      const { data: dataImagenes } = await supabase
        .from("imagenes")
        .select("*");

      const productosMapeados: Producto[] = (dataProductos || []).map(
        (p: any) => {
          const fotosAsociadas = (dataImagenes || []).filter(
            (img: any) =>
              img.productoid === p.idproducto ||
              img.idproducto === p.idproducto,
          );
          const urlFoto =
            fotosAsociadas.length > 0 ? fotosAsociadas[0].url : p.foto;
          return {
            ...p,
            foto: urlFoto,
            categoria: p.categoria || "Mates Artesanales",
            imagenes: fotosAsociadas,
          };
        },
      );

      setProductos(productosMapeados);
    } catch (err: any) {
      console.error("Error al cargar productos:", err);
      setStatus(
        "No fue posible cargar los productos: " +
          (err.message || "Error desconocido"),
        "error",
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .order("email", { ascending: true });

      if (error) throw error;
      setListaUsuarios(data || []);
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err);
      setStatus(
        "No fue posible cargar los usuarios: " +
          (err.message || "Verifica las políticas RLS en Supabase"),
        "error",
      );
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cambiarRol = async (idUsuario: string, nuevoRol: string) => {
    setGuardandoRolId(idUsuario);
    try {
      const { error } = await supabase
        .from("usuario")
        .update({ rol: nuevoRol })
        .eq("id", idUsuario);

      if (error) throw error;

      setListaUsuarios((prev) =>
        prev.map((u) => (u.id === idUsuario ? { ...u, rol: nuevoRol } : u)),
      );
      setStatus(`Rol asignado correctamente a "${nuevoRol}".`, "success");
    } catch (err: any) {
      console.error("Error al cambiar rol:", err);
      setStatus(
        "No se pudo actualizar el rol: " +
          (err.message || "Verifica permisos en Supabase"),
        "error",
      );
    } finally {
      setGuardandoRolId(null);
    }
  };

  useEffect(() => {
    async function verificarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
      } else {
        setVerificandoAuth(false);
        cargarProductos();
        cargarUsuarios();
      }
    }

    verificarSesion();
  }, [router]);

  const totalProductos = useMemo(() => productos.length, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaInventario.trim()) return productos;
    const q = busquedaInventario.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }, [productos, busquedaInventario]);

  const usuariosFiltrados = useMemo(() => {
    if (!busquedaUsuario.trim()) return listaUsuarios;
    const q = busquedaUsuario.toLowerCase();
    return listaUsuarios.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.rol && u.rol.toLowerCase().includes(q)) ||
        (u.telefono && u.telefono.toLowerCase().includes(q)),
    );
  }, [listaUsuarios, busquedaUsuario]);

  const beginEdit = (product: Producto) => {
    setEditingId(product.idproducto);
    setNombre(product.nombre);
    setCategoria(product.categoria || "Mates Artesanales");
    setPrecio(product.precio.toString());
    setCantidad(product.cantidad.toString());
    setFoto(product.foto || "");
    setDescripcion(product.descripcion || "");
    setStatus(`Editando "${product.nombre}".`, "info");
    setPestanaActiva("producto");

    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setCategoria("");
    setPrecio("");
    setCantidad("");
    setFoto("");
    setDescripcion("");
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const precioNum = parseFloat(precio) || 0;
    const cantidadNum = parseInt(cantidad, 10) || 0;

    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      precioNum < 0 ||
      cantidadNum < 0
    ) {
      setStatus(
        "Completa todos los campos obligatorios con valores válidos.",
        "error",
      );
      return;
    }

    setGuardando(true);
    setStatus(
      editingId ? "Guardando cambios..." : "Creando producto...",
      "info",
    );

    try {
      if (editingId) {
        // Actualizar
        const { error: errorUpdate } = await supabase
          .from("producto")
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: precioNum,
            cantidad: cantidadNum,
            activo: true,
          })
          .eq("idproducto", editingId);

        if (errorUpdate) throw errorUpdate;

        // Actualizar o insertar imagen
        if (foto.trim()) {
          const { data: imgExistente } = await supabase
            .from("imagenes")
            .select("idimagen")
            .eq("productoid", editingId)
            .limit(1);

          if (imgExistente && imgExistente.length > 0) {
            await supabase
              .from("imagenes")
              .update({ url: foto.trim() })
              .eq("idimagen", imgExistente[0].idimagen);
          } else {
            await supabase
              .from("imagenes")
              .insert([{ productoid: editingId, url: foto.trim() }]);
          }
        }

        setStatus("Cambios guardados correctamente.", "success");
        resetForm();
        await cargarProductos();
        setPestanaActiva("inventario");
      } else {
        // Crear
        const { data: nuevoProd, error: errorInsert } = await supabase
          .from("producto")
          .insert([
            {
              nombre: nombre.trim(),
              descripcion: descripcion.trim(),
              precio: precioNum,
              cantidad: cantidadNum,
              activo: true,
            },
          ])
          .select();

        if (errorInsert) throw errorInsert;

        if (nuevoProd && nuevoProd[0] && foto.trim()) {
          await supabase
            .from("imagenes")
            .insert([
              { productoid: nuevoProd[0].idproducto, url: foto.trim() },
            ]);
        }

        setStatus("Producto creado correctamente.", "success");
        resetForm();
        await cargarProductos();
        setPestanaActiva("inventario");
      }
    } catch (err: any) {
      console.error("Error al guardar:", err);
      setStatus(
        "No se pudo guardar el producto: " +
          (err.message || "Error desconocido"),
        "error",
      );
    } finally {
      setGuardando(false);
    }
  };

  const requestDelete = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setStatus(
        'Pulsa "Confirmar" para eliminar el producto permanentemente.',
        "info",
      );
      return;
    }

    try {
      await supabase.from("imagenes").delete().eq("productoid", id);

      const { error } = await supabase
        .from("producto")
        .delete()
        .eq("idproducto", id);

      if (error) throw error;

      setPendingDeleteId(null);
      if (editingId === id) resetForm();
      setStatus("Producto eliminado correctamente.", "success");
      await cargarProductos();
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      setStatus(
        "No se pudo eliminar el producto: " + (err.message || ""),
        "error",
      );
    }
  };

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  if (verificandoAuth) {
    return (
      <div className="min-h-screen bg-[#f8f3e9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-stone-600">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  return (
    <div className="site-shell flex flex-col min-h-screen bg-[#fbf9f4]">
      {/* Header */}
      <header className="w-full border-b border-stone-800/10 bg-[#f8f3e9]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-full border border-stone-300 bg-white flex items-center justify-center font-serif font-bold text-lg text-[#314235] shadow-xs">
              SM
            </div>
            <div className="hidden sm:block">
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#2d2a23]">
                SoMate
              </span>
              <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Mates y accesorios
              </span>
            </div>
          </Link>
          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-2"
          >
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Banner Superior */}
        <div className="rounded-[2rem] bg-[#314235] p-7 sm:p-10 text-[#f8f3e9] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="uppercase tracking-[0.24em] text-xs font-bold text-[#eac29b]">
                Panel de Control
              </p>
              <h1 className="brand-serif mt-2 text-3xl sm:text-5xl text-white">
                Administración General
              </h1>
              <p className="mt-3 max-w-2xl text-[#f8f3e9]/80 text-sm sm:text-base leading-relaxed">
                Controla el inventario en tiempo real, añade nuevos productos
                al catálogo o gestiona los roles y permisos de acceso para tu equipo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xs px-5 py-3.5 min-w-32 text-center border border-white/10">
                <span className="block text-[11px] uppercase tracking-wider text-[#f8f3e9]/70">
                  Productos
                </span>
                <strong className="block mt-1 text-2xl font-serif text-white">
                  {totalProductos}
                </strong>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-xs px-5 py-3.5 min-w-32 text-center border border-white/10">
                <span className="block text-[11px] uppercase tracking-wider text-[#f8f3e9]/70">
                  Usuarios
                </span>
                <strong className="block mt-1 text-2xl font-serif text-white">
                  {listaUsuarios.length}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN DE SECCIONES (TABS) */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
          {/* Botón: Inventario en tiempo real */}
          <button
            type="button"
            onClick={() => setPestanaActiva("inventario")}
            className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
              pestanaActiva === "inventario"
                ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
                : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
            }`}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>Inventario en tiempo real</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                pestanaActiva === "inventario"
                  ? "bg-white/20 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {totalProductos}
            </span>
          </button>

          {/* Botón: Agregar / Editar Producto */}
          <button
            type="button"
            onClick={() => {
              if (pestanaActiva !== "producto") {
                resetForm();
              }
              setPestanaActiva("producto");
            }}
            className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
              pestanaActiva === "producto"
                ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
                : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
            }`}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>{editingId ? "Editar Producto" : "Agregar Producto"}</span>
            {editingId && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                Editando
              </span>
            )}
          </button>

          {/* Botón: Gestión de Roles */}
          <button
            type="button"
            onClick={() => {
              setPestanaActiva("roles");
              cargarUsuarios();
            }}
            className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
              pestanaActiva === "roles"
                ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
                : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
            }`}
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Gestión de Roles</span>
            {listaUsuarios.length > 0 && (
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  pestanaActiva === "roles"
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {listaUsuarios.length}
              </span>
            )}
          </button>
        </div>

        {/* Mensaje de estado global */}
        {statusMessage && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 ${
              statusMessage.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-stone-100 text-stone-800 border-stone-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-stone-400 hover:text-stone-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {pestanaActiva === "inventario" && (
          <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
                  Inventario en tiempo real
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Stock sincronizado en vivo con la base de datos de bodega.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Buscador en inventario */}
                <div className="relative min-w-56 sm:min-w-64">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
                    value={busquedaInventario}
                    onChange={(e) => setBusquedaInventario(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                  {busquedaInventario && (
                    <button
                      onClick={() => setBusquedaInventario("")}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={cargarProductos}
                  disabled={cargando}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] hover:bg-[#f8f3e9] transition cursor-pointer disabled:opacity-60"
                >
                  {cargando ? "Actualizando..." : "Refrescar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setPestanaActiva("producto");
                  }}
                  className="rounded-xl bg-[#a75632] px-4 py-2 text-xs font-bold text-white hover:bg-[#884326] transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Añadir Producto</span>
                </button>
              </div>
            </div>

            {cargando ? (
              <div className="my-12 py-12 text-center">
                <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-600 font-medium">
                  Cargando inventario...
                </p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="my-12 rounded-2xl bg-[#f8f3e9] px-5 py-12 text-center">
                <h3 className="brand-serif text-xl text-[#2d2a23]">
                  {busquedaInventario
                    ? "No se encontraron coincidencias"
                    : "Inventario vacío"}
                </h3>
                <p className="mt-1 text-sm text-stone-600 max-w-md mx-auto">
                  {busquedaInventario
                    ? `No hay productos que coincidan con "${busquedaInventario}".`
                    : "No hay productos registrados en la base de datos actualmente."}
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setPestanaActiva("producto");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#314235] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#243127] transition"
                >
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {productosFiltrados.map((product) => {
                  const isPendingDelete =
                    pendingDeleteId === product.idproducto;
                  const stockBajo = product.cantidad <= 3;

                  return (
                    <article
                      key={product.idproducto}
                      className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 transition hover:border-stone-300 hover:shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                          {/* Foto miniatura */}
                          <div className="w-16 h-16 rounded-xl bg-[#f8f3e9] border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.foto ? (
                              <img
                                src={product.foto}
                                alt={product.nombre}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80";
                                }}
                              />
                            ) : (
                              <span className="text-xs text-stone-400 font-serif">
                                Sin foto
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="brand-serif text-lg text-[#2d2a23] truncate">
                                {product.nombre}
                              </h3>
                              <span className="rounded-full bg-[#e8e0d0] px-2.5 py-0.5 text-[11px] font-bold text-[#314235]">
                                {product.categoria || "Mates Artesanales"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600 line-clamp-1">
                              {product.descripcion}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                              <span className="text-[#314235] font-bold text-sm">
                                {formatearPrecio(product.precio)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  stockBajo
                                    ? "bg-red-100 text-red-800 font-bold"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {stockBajo
                                  ? `Stock crítico: ${product.cantidad} un.`
                                  : `Stock: ${product.cantidad} unidades`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex shrink-0 gap-2 items-center self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => beginEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#314235] px-4 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#314235] hover:text-white cursor-pointer"
                          >
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(product.idproducto)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer ${
                              isPendingDelete
                                ? "bg-[#a75632] text-white border-[#a75632]"
                                : "border-[#a75632] text-[#a75632] hover:bg-[#a75632] hover:text-white"
                            }`}
                          >
                            <span>
                              {isPendingDelete ? "¿Confirmar?" : "Eliminar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {pestanaActiva === "producto" && (
          <section className="mt-8 max-w-4xl mx-auto rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-10 shadow-sm">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <span className="inline-block text-xs uppercase tracking-wider font-bold text-[#a75632] mb-1">
                  {editingId ? "Modo de edición" : "Nuevo registro"}
                </span>
                <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
                  {editingId ? "Editar producto" : "Añadir un producto"}
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  {editingId
                    ? `Modifica los datos del producto #${editingId} y guarda los cambios para sincronizarlos.`
                    : "Registra un nuevo mate, bombilla, termo o accesorio en el catálogo general."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPestanaActiva("inventario")}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 transition"
              >
                Volver al inventario →
              </button>
            </div>

            <form
              id="product-form"
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              <div>
                <label
                  className="mb-2 block text-sm font-bold text-[#2d2a23]"
                  htmlFor="product-name"
                >
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
                  <label
                    className="mb-2 block text-sm font-bold text-[#2d2a23]"
                    htmlFor="product-category"
                  >
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
                  <label
                    className="mb-2 block text-sm font-bold text-[#2d2a23]"
                    htmlFor="product-price"
                  >
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
                  <label
                    className="mb-2 block text-sm font-bold text-[#2d2a23]"
                    htmlFor="product-stock"
                  >
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
                  <label
                    className="mb-2 block text-sm font-bold text-[#2d2a23]"
                    htmlFor="product-image-url"
                  >
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
                        "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80";
                    }}
                  />
                  <div className="text-xs text-stone-600 truncate flex-1">
                    <p className="font-semibold text-[#2d2a23]">Vista previa cargada</p>
                    <p className="truncate text-stone-500">{foto}</p>
                  </div>
                </div>
              )}

              <div>
                <label
                  className="mb-2 block text-sm font-bold text-[#2d2a23]"
                  htmlFor="product-description"
                >
                  Descripción detallada *
                </label>
                <textarea
                  id="product-description"
                  required
                  rows={4}
                  placeholder="Describe los materiales, dimensiones, capacidad y detalles artesanales..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-6 py-3 font-bold text-white transition hover:bg-[#884326] disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  <span>
                    {guardando
                      ? "Guardando..."
                      : editingId
                        ? "Guardar cambios"
                        : "Guardar producto"}
                  </span>
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-stone-300 px-6 py-3 font-bold text-stone-700 transition hover:bg-stone-100 cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPestanaActiva("inventario")}
                  className="rounded-full border border-transparent px-6 py-3 font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
                >
                  Ir al inventario
                </button>
              </div>
            </form>
          </section>
        )}

        {pestanaActiva === "roles" && (
          <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
                  Gestión de Roles y Permisos
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Asigna permisos dentro de la plataforma a los usuarios registrados.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Buscador de usuarios */}
                <div className="relative min-w-56 sm:min-w-64">
                  <input
                    type="text"
                    placeholder="Buscar por correo o rol..."
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#314235]"
                  />
                  {busquedaUsuario && (
                    <button
                      onClick={() => setBusquedaUsuario("")}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] hover:bg-[#f8f3e9] transition cursor-pointer disabled:opacity-60"
                >
                  {cargandoUsuarios ? "Actualizando..." : "Refrescar"}
                </button>
              </div>
            </div>

            {/* Guía rápida de Roles */}
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
                <div className="flex items-center gap-2 font-bold text-sm text-[#314235]">
                  <span>Administrador (`admin`)</span>
                </div>
                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                  Control total de la tienda. Puede gestionar productos, stock, y asignar o revocar roles de otros usuarios.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
                <div className="flex items-center gap-2 font-bold text-sm text-[#a75632]">
                  <span>Editor (`editor`)</span>
                </div>
                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                  Acceso al panel para añadir productos, editar precios, descripciones y actualizar el inventario.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-700">
                  <span>Cliente (`cliente`)</span>
                </div>
                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                  Usuario estándar. Puede explorar el catálogo, agregar al carrito, comprar y dejar valoraciones.
                </p>
              </div>
            </div>

            {/* Listado de Usuarios */}
            {cargandoUsuarios ? (
              <div className="my-12 py-12 text-center">
                <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-600 font-medium">
                  Cargando usuarios registrados...
                </p>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="my-10 rounded-2xl bg-[#f8f3e9] px-5 py-10 text-center">
                <h3 className="brand-serif text-lg text-[#2d2a23]">
                  No se encontraron usuarios
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  {busquedaUsuario
                    ? `No hay usuarios con el criterio "${busquedaUsuario}".`
                    : "No hay usuarios registrados en la tabla usuario de Supabase."}
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4">Rol actual</th>
                      <th className="py-3 px-4 text-right">Asignar Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {usuariosFiltrados.map((u) => {
                      const rolActual = u.rol || "cliente";
                      const esGuardando = guardandoRolId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-stone-50/60 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#314235] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                {u.email?.charAt(0) || "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#2d2a23] truncate">
                                  {u.email}
                                </p>
                                <span className="text-[11px] text-stone-400 font-mono">
                                  ID: {u.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-stone-600 text-xs">
                            {u.telefono || "No registrado"}
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                rolActual === "admin"
                                  ? "bg-[#314235] text-white"
                                  : rolActual === "editor"
                                    ? "bg-[#e8d5c4] text-[#884326]"
                                    : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {rolActual === "admin" && "👑 "}
                              {rolActual === "editor" && "✍️ "}
                              {rolActual === "cliente" && "👤 "}
                              {rolActual}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              {esGuardando && (
                                <div className="w-4 h-4 border-2 border-[#314235] border-t-transparent rounded-full animate-spin" />
                              )}
                              <select
                                value={rolActual}
                                disabled={esGuardando}
                                onChange={(e) => cambiarRol(u.id, e.target.value)}
                                className="rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-1.5 text-xs font-semibold text-[#2d2a23] focus:outline-none focus:ring-2 focus:ring-[#314235] cursor-pointer disabled:opacity-50"
                              >
                                <option value="cliente">Cliente (compras)</option>
                                <option value="editor">Editor (inventario)</option>
                                <option value="admin">Administrador (total)</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/10 bg-[#f8f3e9] mt-16">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row justify-between gap-3 text-sm">
          <p className="font-bold text-[#314235]">SoMate • GROWDER</p>
          <p className="text-stone-500">
            Gestión Integral de Inventario, E-Commerce y Roles
          </p>
        </div>
      </footer>
    </div>
  );
}
