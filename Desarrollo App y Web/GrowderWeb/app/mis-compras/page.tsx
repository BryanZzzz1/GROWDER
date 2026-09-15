"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { Pedido } from "@/app/admin/types";
import { usarCarrito } from "@/app/datoscarro/estadocarro";
import { CompraCard } from "./components/CompraCard";
import { DetalleCompraView } from "./components/DetalleCompraView";

type FiltroCliente = "todas" | "por_recibir" | "entregadas";

const PEDIDOS_DEMO_CLIENTE: Pedido[] = [
  {
    id: "demo-1",
    codigo_pedido: "SM-732914",
    nombre_cliente: "Matias Alarcón",
    email_cliente: "matias@somate.cl",
    telefono_cliente: "954321876",
    region: "Valparaíso",
    comuna: "Viña del Mar",
    direccion: "Calle 1 Norte 720",
    depto: "Oficina 5B",
    instrucciones: "Dejar en conserjería si no respondo el timbre.",
    metodo_pago: "mercadopago",
    estado: "en despacho",
    subtotal: 64850,
    costo_envio: 2650,
    total: 67500,
    empresa_transporte: "Starken",
    numero_seguimiento: "STK-948201948",
    notas_despacho: "Paquete entregado a la sucursal Starken Viña Centro.",
    created_at: "2026-09-14T14:30:00.000Z",
    items: [
      {
        idproducto: 3,
        nombre: "Mate Imperial Calabaza Cincelada",
        precio: 45900,
        cantidad: 1,
        foto: "/productos/imperial-cincelado.jpg",
        categoria: "Mates Imperiales",
      },
      {
        idproducto: 6,
        nombre: "Termo Media Manija Acero 1L",
        precio: 18950,
        cantidad: 1,
        foto: "/productos/termo-acero.jpg",
        categoria: "Termos y Materas",
      },
    ],
  },
  {
    id: "demo-2",
    codigo_pedido: "SM-849201",
    nombre_cliente: "Matias Alarcón",
    email_cliente: "matias@somate.cl",
    telefono_cliente: "987654321",
    region: "Región Metropolitana de Santiago",
    comuna: "Providencia",
    direccion: "Av. Nueva Providencia 1881",
    depto: "Depto 402",
    instrucciones: "Tocar citófono 402.",
    metodo_pago: "transferencia",
    estado: "pendiente",
    subtotal: 54850,
    costo_envio: 2650,
    total: 57500,
    empresa_transporte: null,
    numero_seguimiento: null,
    notas_despacho: "Empaque en curso en bodega central.",
    created_at: "2026-09-14T19:15:00.000Z",
    items: [
      {
        idproducto: 1,
        nombre: "Mate Torpedo Uruguayo Premium",
        precio: 32900,
        cantidad: 1,
        foto: "/productos/torpedo-negro.jpg",
        categoria: "Mates Torpedo",
      },
      {
        idproducto: 5,
        nombre: "Bombilla Pico de Loro Alpaca",
        precio: 21950,
        cantidad: 1,
        foto: "/productos/bombilla-loro.jpg",
        categoria: "Bombillas",
      },
    ],
  },
  {
    id: "demo-3",
    codigo_pedido: "SM-610482",
    nombre_cliente: "Matias Alarcón",
    email_cliente: "matias@somate.cl",
    telefono_cliente: "912345678",
    region: "Biobío",
    comuna: "Concepción",
    direccion: "Barros Arana 450",
    depto: null,
    instrucciones: "Entregar en portería.",
    metodo_pago: "mercadopago",
    estado: "recibido",
    subtotal: 45900,
    costo_envio: 2650,
    total: 48550,
    empresa_transporte: "Chilexpress",
    numero_seguimiento: "CHX-774910283",
    notas_despacho: "Paquete entregado y firmado por el receptor.",
    created_at: "2026-09-02T11:20:00.000Z",
    items: [
      {
        idproducto: 2,
        nombre: "Mate Camionero Cuero Vaqueta",
        precio: 38900,
        cantidad: 1,
        foto: "/productos/camionero-marron.jpg",
        categoria: "Mates Camionero",
      },
      {
        idproducto: 7,
        nombre: "Cepillo Limpiador de Bombillas",
        precio: 7000,
        cantidad: 1,
        foto: "/productos/limpiador-bombilla.jpg",
        categoria: "Accesorios y Limpieza",
      },
    ],
  },
];

function MisComprasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoParam = searchParams.get("pedido");

  const { agregarAlCarrito } = usarCarrito();

  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [compras, setCompras] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<FiltroCliente>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoManualId, setPedidoManualId] = useState<string | number | null>(null);
  const [mensajeRecompra, setMensajeRecompra] = useState<string | null>(null);

  // Derivar pedidoActivo a partir de selección manual o parámetro de URL
  const pedidoActivo = useMemo(() => {
    if (compras.length === 0) return null;
    if (pedidoManualId === -1) return null;
    if (pedidoManualId !== null) {
      return compras.find((c) => c.id === pedidoManualId) || null;
    }
    if (pedidoParam) {
      return (
        compras.find(
          (c) => c.codigo_pedido.toLowerCase() === pedidoParam.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [compras, pedidoManualId, pedidoParam]);

  // Cargar pedidos asociados al cliente
  const cargarCompras = useCallback(async (uid?: string | null, email?: string | null) => {
    setCargando(true);
    try {
      let query = supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (uid && email) {
        query = query.or(`usuario_id.eq.${uid},email_cliente.eq.${email}`);
      } else if (uid) {
        query = query.eq("usuario_id", uid);
      } else if (email) {
        query = query.eq("email_cliente", email);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setCompras(data as Pedido[]);
        return;
      }

      // Si no hay datos en Supabase o es compra local, revisar respaldo en localStorage
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("somate_pedidos");
        if (local) {
          try {
            const parsed: Pedido[] = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const filtradas = email
                ? parsed.filter(
                    (p) =>
                      p.email_cliente?.toLowerCase() === email.toLowerCase() ||
                      p.usuario_id === uid
                  )
                : parsed;
              setCompras(filtradas.length > 0 ? filtradas : parsed);
              return;
            }
          } catch {
            // Error silencioso al parsear
          }
        }
      }

      // Cargar pedidos de demostración si no hay pedidos guardados todavía
      setCompras(PEDIDOS_DEMO_CLIENTE);
    } catch (err) {
      console.error("Error al cargar compras del cliente:", err);
      setCompras(PEDIDOS_DEMO_CLIENTE);
    } finally {
      setCargando(false);
    }
  }, []);

  // Verificar sesión
  useEffect(() => {
    async function inicializar() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      const uid = user?.id || null;
      const email = user?.email || null;

      setUsuarioEmail(email);

      await cargarCompras(uid, email);
    }

    inicializar();
  }, [cargarCompras]);

  // Suscripción a Supabase Realtime para que los cambios de estado se vean en vivo
  useEffect(() => {
    const canal = supabase
      .channel("mis-compras-cliente-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const actualizado = payload.new as Pedido;
            setCompras((prev) =>
              prev.map((c) => (c.id === actualizado.id ? actualizado : c))
            );
          } else if (payload.eventType === "INSERT") {
            const nuevo = payload.new as Pedido;
            setCompras((prev) => {
              if (prev.some((c) => c.id === nuevo.id)) return prev;
              return [nuevo, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // Volver a comprar: Re-agrega los productos del pedido al carrito
  const handleVolverAComprar = (pedido: Pedido) => {
    if (!pedido.items || pedido.items.length === 0) return;

    pedido.items.forEach((it) => {
      agregarAlCarrito(
        {
          id: String(it.idproducto),
          nombre: it.nombre,
          precio: it.precio,
          imagen: it.foto || "",
        },
        it.cantidad || 1
      );
    });

    setMensajeRecompra(
      `¡Los artículos de tu compra ${pedido.codigo_pedido} fueron añadidos a tu carrito!`
    );
    setTimeout(() => setMensajeRecompra(null), 4000);
  };

  // Conteo de compras
  const conteos = useMemo(() => {
    const total = compras.length;
    const porRecibir = compras.filter(
      (c) => c.estado === "pendiente" || c.estado === "en despacho"
    ).length;
    const entregadas = compras.filter((c) => c.estado === "recibido").length;
    return { total, porRecibir, entregadas };
  }, [compras]);

  // Filtrado de compras
  const comprasFiltradas = useMemo(() => {
    return compras.filter((c) => {
      if (filtro === "por_recibir") {
        if (c.estado === "recibido") return false;
      } else if (filtro === "entregadas") {
        if (c.estado !== "recibido") return false;
      }

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const matchCodigo = c.codigo_pedido.toLowerCase().includes(q);
      const matchItems = c.items?.some((it) => it.nombre.toLowerCase().includes(q));
      const matchGuia = c.numero_seguimiento?.toLowerCase().includes(q);

      return matchCodigo || matchItems || matchGuia;
    });
  }, [compras, filtro, busqueda]);

  return (
    <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
      {/* Header específico de navegación */}
      <header className="border-b border-[#8C7762]/20 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logocircular.png"
              alt="SuMate Logo"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">
                SuMateCL
              </span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">
                Mis Compras & Despachos
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="text-stone-600 hover:text-[#314235] font-semibold transition"
            >
              Catálogo
            </Link>
            <Link
              href="/cuenta"
              className="px-3 py-1.5 rounded-full bg-[#f8f3e9] border border-stone-200 text-stone-700 font-semibold hover:bg-[#efe7d8] transition flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#314235]" />
              <span>{usuarioEmail ? usuarioEmail.split("@")[0] : "Mi Cuenta"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Notificación flotante de recompra */}
      {mensajeRecompra && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 w-full">
          <div className="bg-[#314235] text-white p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <span>{mensajeRecompra}</span>
            <Link
              href="/confirmacion-pago"
              className="px-3 py-1 rounded-full bg-white text-[#314235] font-bold text-[11px] hover:bg-stone-100 transition"
            >
              Ir a pagar
            </Link>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {pedidoActivo ? (
          <DetalleCompraView
            pedido={pedidoActivo}
            onVolver={() => {
              setPedidoManualId(-1);
              if (pedidoParam) router.replace("/mis-compras");
            }}
            onVolverAComprar={handleVolverAComprar}
          />
        ) : (
          <div className="space-y-6">
            {/* Título de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="brand-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Mis Compras
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  Consulta el historial de tus pedidos y realiza el seguimiento de cada paquete en camino.
                </p>
              </div>

              {/* Indicador de tiempo real */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shrink-0 self-start sm:self-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Seguimiento en vivo</span>
              </div>
            </div>

            {/* Barra de Filtros y Buscador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-stone-200">
              {/* Filtros tipo Mercado Libre */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFiltro("todas")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    filtro === "todas"
                      ? "bg-[#314235] text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Todas ({conteos.total})
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("por_recibir")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    filtro === "por_recibir"
                      ? "bg-[#314235] text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Por recibir ({conteos.porRecibir})
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("entregadas")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    filtro === "entregadas"
                      ? "bg-[#314235] text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Entregadas ({conteos.entregadas})
                </button>
              </div>

              {/* Buscador reactivo */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por producto o código..."
                  className="w-full text-xs rounded-xl border border-stone-300 bg-white px-3.5 py-2 outline-none focus:border-[#314235] transition"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-3 top-2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Listado de Compras */}
            {cargando ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-stone-500 font-semibold">Cargando tus compras...</p>
              </div>
            ) : comprasFiltradas.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#f8f3e9] flex items-center justify-center text-stone-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="brand-serif text-lg font-bold text-stone-900 mb-1">
                  {busqueda ? "No encontramos compras con ese término" : "Aún no tienes compras registradas"}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                  {busqueda
                    ? "Verifica si escribiste bien el nombre del producto o el código del pedido."
                    : "Explora nuestro catálogo de mates artesanales, bombillas y accesorios para comenzar."}
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 rounded-full bg-[#314235] hover:bg-[#243127] text-white font-bold text-xs transition shadow-sm"
                >
                  Explorar catálogo de mates
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {comprasFiltradas.map((compra) => (
                  <CompraCard
                    key={compra.id}
                    pedido={compra}
                    onVerDetalle={(p) => setPedidoManualId(p.id)}
                    onVolverAComprar={handleVolverAComprar}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-200/80 bg-white mt-16 py-6 text-center text-xs text-stone-500">
        <p className="font-semibold text-stone-700">SoMateCL • Mates y Accesorios Artesanales</p>
        <p className="text-[11px] text-stone-400 mt-1">Despachos seguros a todo Chile con tarifa fija de $2.650</p>
      </footer>
    </div>
  );
}

export default function MisComprasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-3 border-[#314235] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-serif font-bold text-[#314235]">Cargando tus compras...</p>
        </div>
      }
    >
      <MisComprasContent />
    </Suspense>
  );
}
