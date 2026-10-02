"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

import { Producto, Usuario, Categoria, StatusMessage, TabType, Pedido, EstadoPedido } from "./types";
export type { Producto, Usuario, Categoria } from "./types";

import { AdminHeader } from "./components/AdminHeader";
import { AdminBanner } from "./components/AdminBanner";
import { AdminTabs } from "./components/AdminTabs";
import { AdminAlert } from "./components/AdminAlert";
import { InventarioTab } from "./components/InventarioTab";
import { ProductoFormTab } from "./components/ProductoFormTab";
import { RolesTab } from "./components/RolesTab";
import { PedidosTab } from "./components/pedidos/PedidosTab";

interface ProductoRow {
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

interface ImagenRow {
  idimagen?: number;
  productoid: number;
  url: string;
}

const CATEGORIAS_DEFECTO: Categoria[] = [
  { id: 1, nombre: "Mates Torpedo" },
  { id: 2, nombre: "Mates Camionero" },
  { id: 3, nombre: "Mates Imperiales" },
  { id: 4, nombre: "Mates de Madera" },
  { id: 5, nombre: "Bombillas" },
  { id: 6, nombre: "Termos y Materas" },
  { id: 7, nombre: "Accesorios y Limpieza" },
];

export default function AdminPage() {
  const router = useRouter();

  // Estados de sesión y carga
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Navegación de secciones (Pestañas)
  const [pestanaActiva, setPestanaActiva] = useState<TabType>("inventario");

  // Estado de Categorías
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_DEFECTO);

  // Estado del Formulario de Producto
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  // Estados para galería (máximo 3 fotos)
  const [fotos, setFotos] = useState<string[]>([]);
  const [urlTemporal, setUrlTemporal] = useState("");

  // Buscador de inventario
  const [busquedaInventario, setBusquedaInventario] = useState("");

  // Estado de Gestión de Roles
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [guardandoRolId, setGuardandoRolId] = useState<string | null>(null);

  // Estado de Gestión de Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const setStatus = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setStatusMessage({ text, type });
    if (type !== "error") {
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const cargarCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) return;
      if (data && data.length > 0) setCategorias(data);
    } catch {
      // Fallback
    }
  }, []);

  const crearCategoria = async (nombreCat: string): Promise<Categoria | null> => {
    const nombreLimpio = nombreCat.trim();
    if (!nombreLimpio) return null;

    try {
      const { data, error } = await supabase
        .from("categorias")
        .insert([{ nombre: nombreLimpio }])
        .select()
        .single();

      if (error) {
        const nuevaLocal: Categoria = { id: Date.now(), nombre: nombreLimpio };
        setCategorias((prev) => {
          if (prev.some((c) => c.nombre.toLowerCase() === nombreLimpio.toLowerCase())) return prev;
          return [...prev, nuevaLocal];
        });
        setStatus('Categoría "' + nombreLimpio + '" seleccionada.', "info");
        return nuevaLocal;
      }

      if (data) {
        setCategorias((prev) => [...prev.filter((c) => c.id !== data.id), data]);
        setStatus('Categoría "' + data.nombre + '" creada en base de datos.', "success");
        return data;
      }
    } catch (err) {
      console.error("Error al crear categoría:", err);
    }

    const fallback: Categoria = { id: Date.now(), nombre: nombreLimpio };
    setCategorias((prev) => [...prev, fallback]);
    return fallback;
  };

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const { data: dataProductos, error: errorProd } = await supabase
        .from("producto")
        .select("*")
        .order("idproducto", { ascending: false });

      if (errorProd) throw errorProd;

      const { data: dataImagenes } = await supabase.from("imagenes").select("*");

      const productosMapeados: Producto[] = ((dataProductos as ProductoRow[]) || []).map((p) => {
        const fotosAsociadas = ((dataImagenes as ImagenRow[]) || []).filter((img) => img.productoid === p.idproducto);
        const urlFoto = fotosAsociadas.length > 0 ? fotosAsociadas[0].url : p.foto;
        return {
          ...p,
          foto: urlFoto,
          categoria: p.categoria || "Mates Artesanales",
          categoria_id: p.categoria_id || null,
          imagenes: fotosAsociadas,
        };
      });

      setProductos(productosMapeados);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setStatus("No fue posible cargar los productos.", "error");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true);
    try {
      const { data, error } = await supabase
        .from("usuario")
        .select("id, email, telefono, rol_id, activo")
        .order("email", { ascending: true });

      if (error) throw error;
      setListaUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setStatus("No fue posible cargar los usuarios.", "error");
    } finally {
      setCargandoUsuarios(false);
    }
  }, []);

  const cambiarRol = async (idUsuario: string, nuevoRolId: number) => {
    setGuardandoRolId(idUsuario);
    try {
      const { error } = await supabase.from("usuario").update({ rol_id: nuevoRolId }).eq("id", idUsuario);
      if (error) throw error;

      setListaUsuarios((prev) => prev.map((u) => (u.id === idUsuario ? { ...u, rol_id: nuevoRolId } : u)));
      setStatus("Rol asignado correctamente.", "success");
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      setStatus("No se pudo actualizar el rol.", "error");
    } finally {
      setGuardandoRolId(null);
    }
  };

  const toggleEstadoUsuario = async (idUsuario: string, estadoActual: boolean) => {
    setGuardandoRolId(idUsuario);
    try {
      const nuevoEstado = !estadoActual;
      const payload = nuevoEstado ? { activo: true } : { activo: false, rol_id: 3 };

      const { error } = await supabase.from("usuario").update(payload).eq("id", idUsuario);
      if (error) throw error;

      setListaUsuarios((prev) => prev.map((u) => (u.id === idUsuario ? { ...u, ...payload } : u)));
      setStatus('Cuenta de usuario ' + (nuevoEstado ? "activada" : "suspendida") + '.', "success");
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setStatus("No se pudo actualizar el estado de la cuenta.", "error");
    } finally {
      setGuardandoRolId(null);
    }
  };

  const cargarPedidos = useCallback(async () => {
    setCargandoPedidos(true);
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const now = Date.now();
        const pedidosProcesados = data.map((pedido: any) => {
          if (pedido.estado?.toLowerCase() === 'pendiente') {
            const created = new Date(pedido.created_at).getTime();
            if (now >= created + 5 * 60 * 1000) {
              // Trigger auto-cancel asynchronously
              const autoCancelar = async () => {
                const { error } = await supabase.rpc('cancelar_pedido', {
                  p_codigo_pedido: pedido.codigo_pedido,
                  p_motivo: 'cancelado'
                });
                if (error) console.error("Error auto-cancelando pedido vencido:", error);
              };
              autoCancelar();
              
              return { ...pedido, estado: 'cancelado' };
            }
          }
          return pedido;
        });

        setPedidos(pedidosProcesados as Pedido[]);
        return;
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem("sumate_pedidos");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Validamos que no sean los de DEMO
              if (parsed[0]?.id !== "demo-1") {
                setPedidos(parsed);
                return;
              }
            }
          } catch {}
        }
      }

      // Si no hay pedidos reales, seteamos array vacío (Adiós Demo)
      setPedidos([]);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setPedidos([]);
    } finally {
      setCargandoPedidos(false);
    }
  }, []);

  const actualizarEstadoPedido = async (idPedido: string | number, nuevoEstado: EstadoPedido) => {
    try {
      const pedidoEncontrado = pedidos.find(p => p.id === idPedido);
      
      if (["cancelado", "cancelado_por_usuario", "rechazado"].includes(nuevoEstado) && pedidoEncontrado) {
        // En lugar de update normal, llamamos a la RPC que además repone el stock
        const { error } = await supabase.rpc('cancelar_pedido', {
          p_codigo_pedido: pedidoEncontrado.codigo_pedido,
          p_motivo: nuevoEstado
        });
        if (error) throw error;
        // Refrescar inventario localmente para que se vea el stock devuelto
        cargarProductos();
      } else {
        const { error } = await supabase
          .from("pedidos")
          .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
          .eq("id", idPedido);
        if (error) console.warn("Actualizando localmente estado de pedido:", error);
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === idPedido ? { ...p, estado: nuevoEstado, updated_at: new Date().toISOString() } : p))
      );
      setStatus(`Estado del pedido actualizado a "${nuevoEstado}".`, "success");
    } catch (err: any) {
      setStatus(err.message || "No se pudo actualizar el estado del pedido.", "error");
    }
  };

  const actualizarDatosDespacho = async (idPedido: string | number, empresa: string, numeroSeguimiento: string, notas: string) => {
    try {
      const payload = { empresa_transporte: empresa, numero_seguimiento: numeroSeguimiento, notas_despacho: notas, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("pedidos").update(payload).eq("id", idPedido);

      if (error) console.warn("Actualizando localmente despacho:", error);

      setPedidos((prev) => prev.map((p) => (p.id === idPedido ? { ...p, ...payload } : p)));
      setStatus("Datos de despacho y número de guía guardados con éxito.", "success");
    } catch (err: any) {
      setStatus(err.message || "No se pudieron actualizar los datos de despacho.", "error");
    }
  };

  useEffect(() => {
    async function verificarSesionYRoles() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: userData, error } = await supabase.from("usuario").select("rol_id, activo").eq("id", session.user.id).single();
      if (error || !userData?.activo || userData?.rol_id === 3) {
        router.replace("/");
        return;
      }

      setVerificandoAuth(false);
      cargarCategorias();
      cargarProductos();
      cargarUsuarios();
      cargarPedidos();
    }

    verificarSesionYRoles();

    const canalPedidos = supabase
      .channel("pedidos_admin_canal")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => cargarPedidos())
      .subscribe();

    const canalProductos = supabase
      .channel("productos_admin_canal")
      .on("postgres_changes", { event: "*", schema: "public", table: "producto" }, () => cargarProductos())
      .subscribe();

    return () => { 
      supabase.removeChannel(canalPedidos); 
      supabase.removeChannel(canalProductos);
    };
  }, [router, cargarCategorias, cargarProductos, cargarUsuarios, cargarPedidos]);

  const totalProductos = useMemo(() => productos.length, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaInventario.trim()) return productos;
    const q = busquedaInventario.toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || (p.categoria && p.categoria.toLowerCase().includes(q)) || p.descripcion.toLowerCase().includes(q));
  }, [productos, busquedaInventario]);

  // Lógica de filtrado y separación de usuarios (Equipo vs Clientes)
  const usuariosFiltrados = useMemo(() => {
    let base = listaUsuarios;
    if (busquedaUsuario.trim()) {
      const q = busquedaUsuario.toLowerCase();
      base = base.filter((u) => (u.email && u.email.toLowerCase().includes(q)) || (u.telefono && u.telefono.toLowerCase().includes(q)));
    }
    return base;
  }, [listaUsuarios, busquedaUsuario]);

  const usuariosEquipo = useMemo(() => usuariosFiltrados.filter((u) => u.rol_id === 1 || u.rol_id === 2), [usuariosFiltrados]);
  const usuariosClientes = useMemo(() => usuariosFiltrados.filter((u) => u.rol_id === 3 || !u.rol_id), [usuariosFiltrados]);

  const beginEdit = (product: Producto) => {
    setEditingId(product.idproducto);
    setNombre(product.nombre);
    setCategoria(product.categoria || "Mates Artesanales");
    setCategoriaId(product.categoria_id || null);
    setPrecio(product.precio.toString());
    setCantidad(product.cantidad.toString());
    setDescripcion(product.descripcion || "");

    const fotosExistentes = product.imagenes?.map((img) => img.url) || [];
    if (product.foto && !fotosExistentes.includes(product.foto)) fotosExistentes.unshift(product.foto);
    setFotos(fotosExistentes.slice(0, 3));

    setStatus('Editando "' + product.nombre + '".', "info");
    setPestanaActiva("producto");
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setCategoria("");
    setCategoriaId(null);
    setPrecio("");
    setCantidad("");
    setDescripcion("");
    setFotos([]);
    setUrlTemporal("");
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = parseFloat(precio) || 0;
    const cantidadNum = parseInt(cantidad, 10) || 0;

    if (!nombre.trim() || !descripcion.trim() || precioNum < 0 || cantidadNum < 0) {
      setStatus("Completa todos los campos obligatorios con valores válidos.", "error");
      return;
    }

    setGuardando(true);
    setStatus(editingId ? "Subiendo fotos y guardando cambios..." : "Subiendo fotos y creando producto...", "info");

    try {
      const fotoPrincipal = fotos.length > 0 ? fotos[0] : null;
      let idProd = editingId;
      const categoriaFinal = categoria.trim() || "Mates Artesanales";

      const payloadCompleto = { nombre: nombre.trim(), descripcion: descripcion.trim(), precio: precioNum, cantidad: cantidadNum, foto: fotoPrincipal, activo: true, categoria: categoriaFinal, categoria_id: categoriaId };

      if (editingId) {
        const resUpdate = await supabase.from("producto").update(payloadCompleto).eq("idproducto", editingId);
        let errorUpdate = resUpdate.error;
        if (errorUpdate && errorUpdate.message && errorUpdate.message.includes("categoria_id")) {
          const { categoria_id: _cid, ...payloadSinId } = payloadCompleto;
          const retry = await supabase.from("producto").update(payloadSinId).eq("idproducto", editingId);
          errorUpdate = retry.error;
        }
        if (errorUpdate) throw errorUpdate;
        await supabase.from("imagenes").delete().eq("productoid", editingId);
      } else {
        const resInsert = await supabase.from("producto").insert([payloadCompleto]).select();
        let errorInsert = resInsert.error;
        let dataInsert = resInsert.data;
        if (errorInsert && errorInsert.message && errorInsert.message.includes("categoria_id")) {
          const { categoria_id: _cid, ...payloadSinId } = payloadCompleto;
          const retry = await supabase.from("producto").insert([payloadSinId]).select();
          errorInsert = retry.error;
          dataInsert = retry.data;
        }
        if (errorInsert) throw errorInsert;
        idProd = dataInsert && dataInsert[0] ? dataInsert[0].idproducto : undefined;
      }

      if (idProd && fotos.length > 0) {
        for (const f of fotos) await supabase.from("imagenes").insert({ productoid: idProd, url: f });
      }

      setStatus(editingId ? "Cambios guardados correctamente." : "Producto creado correctamente.", "success");
      resetForm();
      await cargarProductos();
      setPestanaActiva("inventario");
    } catch (err) {
      console.error("Error al guardar:", err);
      setStatus("No se pudo guardar el producto.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const requestDelete = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setStatus('Pulsa "Confirmar" para eliminar el producto permanentemente.', "info");
      return;
    }

    try {
      await supabase.from("imagenes").delete().eq("productoid", id);
      const { error } = await supabase.from("producto").delete().eq("idproducto", id);
      if (error) throw error;

      setPendingDeleteId(null);
      if (editingId === id) resetForm();
      setStatus("Producto eliminado correctamente.", "success");
      await cargarProductos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setStatus("No se pudo eliminar el producto.", "error");
    }
  };

  if (verificandoAuth) {
    return (
      <div className="min-h-screen bg-[#f8f3e9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-stone-600">Verificando credenciales...</p>
      </div>
    );
  }

  return (
    <div className="site-shell flex flex-col min-h-screen bg-[#fbf9f4]">
      <AdminHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <AdminBanner totalProductos={totalProductos} totalUsuarios={listaUsuarios.length} totalPedidos={pedidos.length} />

        <AdminTabs
          pestanaActiva={pestanaActiva}
          setPestanaActiva={setPestanaActiva}
          totalProductos={totalProductos}
          totalUsuarios={listaUsuarios.length}
          totalPedidos={pedidos.length}
          editingId={editingId}
          onSelectProductoTab={() => {
            if (pestanaActiva !== "producto") resetForm();
            setPestanaActiva("producto");
          }}
          onSelectRolesTab={() => {
            setPestanaActiva("roles");
            cargarUsuarios();
          }}
          onSelectPedidosTab={() => {
            setPestanaActiva("pedidos");
            cargarPedidos();
          }}
        />

        <AdminAlert statusMessage={statusMessage} onClose={() => setStatusMessage(null)} />

        {pestanaActiva === "inventario" && (
          <InventarioTab
            productos={productosFiltrados}
            busquedaInventario={busquedaInventario}
            setBusquedaInventario={setBusquedaInventario}
            cargando={cargando}
            onRefresh={cargarProductos}
            onAddProducto={() => {
              resetForm();
              setPestanaActiva("producto");
            }}
            onEditProducto={beginEdit}
            pendingDeleteId={pendingDeleteId}
            onDeleteProducto={requestDelete}
          />
        )}

        {pestanaActiva === "producto" && (
          <ProductoFormTab
            editingId={editingId}
            nombre={nombre}
            setNombre={setNombre}
            categoria={categoria}
            setCategoria={setCategoria}
            categoriaId={categoriaId}
            setCategoriaId={setCategoriaId}
            categorias={categorias}
            onCrearCategoria={crearCategoria}
            precio={precio}
            setPrecio={setPrecio}
            cantidad={cantidad}
            setCantidad={setCantidad}
            descripcion={descripcion}
            setDescripcion={setDescripcion}
            fotos={fotos}
            setFotos={setFotos}
            urlTemporal={urlTemporal}
            setUrlTemporal={setUrlTemporal}
            guardando={guardando}
            onSubmit={handleSubmit}
            onCancelEdit={resetForm}
            onVolverInventario={() => setPestanaActiva("inventario")}
            setStatus={setStatus}
          />
        )}

        {pestanaActiva === "roles" && (
          <RolesTab
            usuariosEquipo={usuariosEquipo}
            usuariosClientes={usuariosClientes}
            cargandoUsuarios={cargandoUsuarios}
            busquedaUsuario={busquedaUsuario}
            setBusquedaUsuario={setBusquedaUsuario}
            onRefresh={cargarUsuarios}
            guardandoRolId={guardandoRolId}
            onCambiarRol={cambiarRol}
            onToggleEstadoUsuario={toggleEstadoUsuario}
          />
        )}

        {pestanaActiva === "pedidos" && (
          <PedidosTab
            pedidos={pedidos}
            cargando={cargandoPedidos}
            onRefresh={cargarPedidos}
            onActualizarEstado={actualizarEstadoPedido}
            onActualizarDatosDespacho={actualizarDatosDespacho}
          />
        )}
      </main>

      <footer className="w-full border-t border-stone-800/10 bg-[#f8f3e9] mt-16">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row justify-between gap-3 text-sm">
          <p className="font-bold text-[#314235]">SuMate • GROWDER</p>
          <p className="text-stone-500">Gestión Integral de Inventario, E-Commerce y Roles</p>
        </div>
      </footer>
    </div>
  );
}