import React, { useMemo, useState } from "react";
import type { Pedido, EstadoPedido } from "../../types";
import { PedidoEstadoBadge } from "./PedidoEstadoBadge";
import { PedidoFiltros, FiltroEstado } from "./PedidoFiltros";
import { PedidoDetalleModal } from "./PedidoDetalleModal";

interface PedidosTabProps {
  pedidos: Pedido[];
  cargando: boolean;
  onRefresh: () => void;
  onActualizarEstado: (
    idPedido: string | number,
    nuevoEstado: EstadoPedido
  ) => Promise<void>;
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
  const [filtroActivo, setFiltroActivo] =
    useState<FiltroEstado>("todos");

  const [busqueda, setBusqueda] = useState("");

  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<Pedido | null>(null);

  const [cambiandoId, setCambiandoId] =
    useState<string | number | null>(null);

  const conteoPorEstado = useMemo(() => {
    const conteo: {
      todos: number;
      pendiente: number;
      preparando: number;
      "en despacho": number;
      recibido: number;
    } = {
      todos: pedidos.length,
      pendiente: 0,
      preparando: 0,
      "en despacho": 0,
      recibido: 0,
    };

    pedidos.forEach((pedido) => {
      if (pedido.estado in conteo) {
        conteo[pedido.estado]++;
      }
    });

    return conteo;
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      if (
        filtroActivo !== "todos" &&
        pedido.estado !== filtroActivo
      ) {
        return false;
      }

      if (!busqueda.trim()) {
        return true;
      }

      const q = busqueda.toLowerCase();

      const matchCodigo = pedido.codigo_pedido
        ?.toLowerCase()
        .includes(q);

      const matchCliente = pedido.nombre_cliente
        ?.toLowerCase()
        .includes(q);

      const matchEmail = pedido.email_cliente
        ?.toLowerCase()
        .includes(q);

      const matchComuna = pedido.comuna
        ?.toLowerCase()
        .includes(q);

      const matchRegion = pedido.region
        ?.toLowerCase()
        .includes(q);

      const matchGuia = pedido.numero_seguimiento
        ?.toLowerCase()
        .includes(q);

      const matchItems = pedido.items?.some((item) =>
        item.nombre.toLowerCase().includes(q)
      );

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
    if (!fechaStr) {
      return "-";
    }

    const fecha = new Date(fechaStr);

    return fecha.toLocaleDateString("es-CL", {
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

      if (
        pedidoSeleccionado &&
        pedidoSeleccionado.id === id
      ) {
        setPedidoSeleccionado((prev) =>
          prev
            ? {
                ...prev,
                estado: nuevoEstado,
              }
            : null
        );
      }
    } finally {
      setCambiandoId(null);
    }
  };

  return (
    <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 shadow-sm sm:p-8">
      {/* CABECERA */}
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="brand-serif text-2xl text-[#2d2a23] sm:text-3xl">
              Seguimiento de Pedidos y Despachos
            </h2>

            <span className="rounded-full bg-[#314235]/10 px-3 py-1 text-xs font-bold text-[#314235]">
              Admin y Editor
            </span>
          </div>

          <p className="mt-1 text-sm text-stone-600">
            Control de paquetes enviados, revisión de artículos
            despachados y actualización de estado de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>

            <span>Tiempo real activo</span>
          </div>

          {onCrearPedidoPrueba && pedidos.length === 0 && (
            <button
              type="button"
              onClick={onCrearPedidoPrueba}
              className="cursor-pointer rounded-xl bg-[#8C7762] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#725F4C]"
            >
              + Cargar pedidos de demostración
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={cargando}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#f8f3e9] disabled:opacity-60"
          >
            <svg
              className={`h-3.5 w-3.5 ${
                cargando ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            <span>
              {cargando ? "Actualizando..." : "Actualizar"}
            </span>
          </button>
        </div>
      </div>

      {/* CONTADORES */}
      <div className="my-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* TOTAL */}
        <div className="rounded-2xl border border-stone-200 bg-[#fdfbf7] p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500">
            <span>Total</span>

            <svg
              className="h-4 w-4 text-stone-400"
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
          </div>

          <p className="text-2xl font-bold text-[#314235] sm:text-3xl">
            {conteoPorEstado.todos}
          </p>

          <p className="mt-1 text-[11px] text-stone-500">
            Pedidos registrados
          </p>
        </div>

        {/* PEDIDO RECIBIDO */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
            Pedido recibido
          </div>

          <p className="text-2xl font-bold text-amber-900 sm:text-3xl">
            {conteoPorEstado.pendiente}
          </p>

          <p className="mt-1 text-[11px] text-amber-700/80">
            Pendientes de preparación
          </p>
        </div>

        {/* PREPARANDO */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-800">
            Preparando
          </div>

          <p className="text-2xl font-bold text-orange-900 sm:text-3xl">
            {conteoPorEstado.preparando}
          </p>

          <p className="mt-1 text-[11px] text-orange-700/80">
            Preparando / embalando
          </p>
        </div>

        {/* EN REPARTO */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-800">
            En reparto
          </div>

          <p className="text-2xl font-bold text-sky-900 sm:text-3xl">
            {conteoPorEstado["en despacho"]}
          </p>

          <p className="mt-1 text-[11px] text-sky-700/80">
            En camino al cliente
          </p>
        </div>

        {/* ENTREGADO */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Entregado
          </div>

          <p className="text-2xl font-bold text-emerald-900 sm:text-3xl">
            {conteoPorEstado.recibido}
          </p>

          <p className="mt-1 text-[11px] text-emerald-700/80">
            Entregados conforme
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <PedidoFiltros
        filtroActivo={filtroActivo}
        setFiltroActivo={setFiltroActivo}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        conteoPorEstado={conteoPorEstado}
      />

      {/* LISTADO */}
      <div className="mt-6">
        {cargando && pedidos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#314235] border-t-transparent" />

            <p className="text-xs font-semibold text-stone-500">
              Cargando paquetes y despachos...
            </p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[#fdfbf7] py-16 text-center">
            <h4 className="mb-1 text-sm font-bold text-stone-800">
              No se encontraron paquetes
            </h4>

            <p className="mx-auto mb-4 max-w-sm text-xs text-stone-500">
              {busqueda
                ? `No hay envíos que coincidan con "${busqueda}".`
                : "Aún no hay pedidos registrados con el filtro seleccionado."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosFiltrados.map((pedido) => {
              const totalItems =
                pedido.items?.reduce(
                  (acc, item) =>
                    acc + (item.cantidad || 1),
                  0
                ) || 0;

              const estaCambiando =
                cambiandoId === pedido.id;

              return (
                <div
                  key={pedido.id}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs transition-all hover:border-stone-400/80 hover:shadow-sm sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    {/* DATOS */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold text-stone-800">
                          {pedido.codigo_pedido}
                        </span>

                        <PedidoEstadoBadge
                          estado={pedido.estado}
                          tamanio="sm"
                        />

                        <span className="text-[11px] text-stone-400">
                          {formatearFecha(
                            pedido.created_at
                          )}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-xs text-stone-600">
                        <p className="text-sm font-bold text-stone-900">
                          {pedido.nombre_cliente}
                        </p>

                        <p className="truncate text-stone-500">
                          {pedido.direccion}
                          {pedido.depto
                            ? `, Depto ${pedido.depto}`
                            : ""}{" "}
                          •{" "}
                          <span className="font-semibold text-stone-700">
                            {pedido.comuna}
                          </span>
                          , {pedido.region}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs text-stone-600">
                          <strong className="text-stone-800">
                            {totalItems}{" "}
                            {totalItems === 1
                              ? "artículo"
                              : "artículos"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* ACCIONES */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Monto Total
                        </p>

                        <p className="text-base font-bold text-[#314235]">
                          {formatearPrecio(pedido.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          disabled={estaCambiando}
                          value={pedido.estado}
                          onChange={(event) =>
                            void handleCambioRapidoEstado(
                              pedido.id,
                              event.target
                                .value as EstadoPedido
                            )
                          }
                          className="cursor-pointer rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#314235] disabled:opacity-50"
                        >
                          <option value="pendiente">
                            Pedido recibido
                          </option>

                          <option value="preparando">
                            Preparando / embalando
                          </option>

                          <option value="en despacho">
                            En reparto
                          </option>

                          <option value="recibido">
                            Entregado
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            setPedidoSeleccionado(
                              pedido
                            )
                          }
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#314235] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#243127]"
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

      {/* MODAL */}
      {pedidoSeleccionado && (
        <PedidoDetalleModal
          pedido={pedidoSeleccionado}
          onCerrar={() =>
            setPedidoSeleccionado(null)
          }
          onActualizarEstado={
            onActualizarEstado
          }
          onActualizarDatosDespacho={
            onActualizarDatosDespacho
          }
        />
      )}
    </section>
  );
}