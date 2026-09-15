import React, { useState, useMemo } from "react";
import { Pedido, EstadoPedido } from "../../types";
import { PedidoEstadoBadge } from "./PedidoEstadoBadge";
import { PedidoFiltros, FiltroEstado } from "./PedidoFiltros";
import { PedidoDetalleModal } from "./PedidoDetalleModal";

interface PedidosTabProps {
  pedidos: Pedido[];
  cargando: boolean;
  onRefresh: () => void;
  onActualizarEstado: (idPedido: string | number, nuevoEstado: EstadoPedido) => Promise<void>;
  onActualizarDatosDespacho: (
    idPedido: string | number,
    empresa: string,
    numeroSeguimiento: string,
    notas: string
  ) => Promise<void>;
  onCrearPedidoPrueba?: () => void;
}

export function PedidosTab({
  pedidos,
  cargando,
  onRefresh,
  onActualizarEstado,
  onActualizarDatosDespacho,
  onCrearPedidoPrueba,
}: PedidosTabProps) {
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | number | null>(null);

  // Conteo por estado
  const conteoPorEstado = useMemo(() => {
    const conteo = {
      todos: pedidos.length,
      pendiente: 0,
      "en despacho": 0,
      recibido: 0,
    };
    pedidos.forEach((p) => {
      if (p.estado in conteo) {
        conteo[p.estado as EstadoPedido]++;
      }
    });
    return conteo;
  }, [pedidos]);

  // Filtrado reactivo
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Filtro por estado
      if (filtroActivo !== "todos" && pedido.estado !== filtroActivo) {
        return false;
      }
      // Filtro por texto
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const matchCodigo = pedido.codigo_pedido?.toLowerCase().includes(q);
      const matchCliente = pedido.nombre_cliente?.toLowerCase().includes(q);
      const matchEmail = pedido.email_cliente?.toLowerCase().includes(q);
      const matchComuna = pedido.comuna?.toLowerCase().includes(q);
      const matchRegion = pedido.region?.toLowerCase().includes(q);
      const matchGuia = pedido.numero_seguimiento?.toLowerCase().includes(q);
      const matchItems = pedido.items?.some((it) => it.nombre.toLowerCase().includes(q));

      return (
        matchCodigo ||
        matchCliente ||
        matchEmail ||
        matchComuna ||
        matchRegion ||
        matchGuia ||
        matchItems
      );
    });
  }, [pedidos, filtroActivo, busqueda]);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "-";
    const f = new Date(fechaStr);
    return f.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCambioRapidoEstado = async (
    id: string | number,
    nuevoEstado: EstadoPedido
  ) => {
    setCambiandoId(id);
    try {
      await onActualizarEstado(id, nuevoEstado);
      // Si el modal está abierto con este pedido, actualizarlo también
      if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
        setPedidoSeleccionado((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }
    } finally {
      setCambiandoId(null);
    }
  };

  return (
    <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
              Seguimiento de Pedidos y Despachos
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#314235]/10 text-[#314235]">
              Admin y Editor
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Control de paquetes enviados, revisión de artículos despachados y actualización de estado de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Tiempo real activo</span>
          </div>

          {onCrearPedidoPrueba && pedidos.length === 0 && (
            <button
              type="button"
              onClick={onCrearPedidoPrueba}
              className="rounded-xl bg-[#8C7762] hover:bg-[#725F4C] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
            >
              + Cargar pedidos de demostración
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={cargando}
            className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] hover:bg-[#f8f3e9] transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            <svg className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{cargando ? "Actualizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Despacho (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="rounded-2xl border border-stone-200 bg-[#fdfbf7] p-4">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Paquetes</span>
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#314235]">
            {conteoPorEstado.todos}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Registrados en la tienda</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Pendientes</span>
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900">
            {conteoPorEstado.pendiente}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-1">Por empaquetar o coordinar</p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
          <div className="flex items-center justify-between text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>En Despacho</span>
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-sky-900">
            {conteoPorEstado["en despacho"]}
          </p>
          <p className="text-[11px] text-sky-700/80 mt-1">En camino al destinatario</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Recibidos</span>
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
            {conteoPorEstado.recibido}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Entregados conforme</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <PedidoFiltros
        filtroActivo={filtroActivo}
        setFiltroActivo={setFiltroActivo}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        conteoPorEstado={conteoPorEstado}
      />

      {/* Lista de Pedidos / Paquetes */}
      <div className="mt-6">
        {cargando && pedidos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-semibold">Cargando paquetes y despachos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="py-16 text-center bg-[#fdfbf7] rounded-2xl border border-dashed border-stone-300">
            <svg className="w-12 h-12 text-stone-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h4 className="text-sm font-bold text-stone-800 mb-1">
              No se encontraron paquetes
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              {busqueda
                ? `No hay envíos que coincidan con "${busqueda}". Intenta con otro término de búsqueda.`
                : "Aún no hay pedidos registrados con el filtro seleccionado."}
            </p>
            {onCrearPedidoPrueba && (
              <button
                type="button"
                onClick={onCrearPedidoPrueba}
                className="px-4 py-2 bg-[#314235] text-white rounded-xl text-xs font-bold hover:bg-[#243127] transition cursor-pointer"
              >
                Cargar pedidos de prueba
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosFiltrados.map((pedido) => {
              const totalItems = pedido.items?.reduce((acc, it) => acc + (it.cantidad || 1), 0) || 0;
              const estaCambiando = cambiandoId === pedido.id;

              return (
                <div
                  key={pedido.id}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 hover:border-stone-400/80 transition-all shadow-2xs hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Columna Izquierda: Código, Estado, Fecha y Destinatario */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
                          {pedido.codigo_pedido}
                        </span>
                        <PedidoEstadoBadge estado={pedido.estado} tamanio="sm" />
                        <span className="text-[11px] text-stone-400">
                          {formatearFecha(pedido.created_at)}
                        </span>
                        {pedido.numero_seguimiento && (
                          <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            Guía: {pedido.numero_seguimiento} ({pedido.empresa_transporte || "Transporte"})
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-600 space-y-0.5">
                        <p className="font-bold text-stone-900 text-sm">
                          {pedido.nombre_cliente}{" "}
                          <span className="font-normal text-stone-400 text-xs">
                            (+56 {pedido.telefono_cliente})
                          </span>
                        </p>
                        <p className="text-stone-500 truncate">
                          {pedido.direccion}
                          {pedido.depto ? `, Depto ${pedido.depto}` : ""} •{" "}
                          <span className="font-semibold text-stone-700">{pedido.comuna}</span>,{" "}
                          {pedido.region}
                        </p>
                      </div>

                      {/* QUÉ SE ENVIÓ (Muestra de artículos) */}
                      <div className="pt-2 flex items-center gap-3">
                        <div className="flex -space-x-2 overflow-hidden shrink-0">
                          {pedido.items && pedido.items.slice(0, 3).map((it, idx) => (
                            <div
                              key={idx}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-stone-200"
                              title={`${it.nombre} (x${it.cantidad})`}
                            >
                              {it.foto ? (
                                <img
                                  src={it.foto}
                                  alt={it.nombre}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-stone-600">
                                  {it.nombre.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <span className="text-xs text-stone-600">
                          <strong className="text-stone-800">{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</strong>:{" "}
                          {pedido.items?.map((it) => `${it.nombre} (x${it.cantidad})`).join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* Columna Derecha: Total, Selector de Estado y Botón Detalle */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 shrink-0 justify-between lg:justify-end">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                          Monto Total
                        </p>
                        <p className="text-base font-bold text-[#314235]">
                          {formatearPrecio(pedido.total)}
                        </p>
                      </div>

                      {/* Selector Rápido de Estado */}
                      <div className="flex items-center gap-2">
                        <select
                          disabled={estaCambiando}
                          value={pedido.estado}
                          onChange={(e) =>
                            handleCambioRapidoEstado(
                              pedido.id,
                              e.target.value as EstadoPedido
                            )
                          }
                          className="text-xs font-semibold rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#314235] cursor-pointer disabled:opacity-50"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en despacho">En Despacho</option>
                          <option value="recibido">Recibido</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setPedidoSeleccionado(pedido)}
                          className="px-3.5 py-2 rounded-xl bg-[#314235] hover:bg-[#243127] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Ver Detalle</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Paquete */}
      {pedidoSeleccionado && (
        <PedidoDetalleModal
          pedido={pedidoSeleccionado}
          onCerrar={() => setPedidoSeleccionado(null)}
          onActualizarEstado={onActualizarEstado}
          onActualizarDatosDespacho={onActualizarDatosDespacho}
        />
      )}
    </section>
  );
}
