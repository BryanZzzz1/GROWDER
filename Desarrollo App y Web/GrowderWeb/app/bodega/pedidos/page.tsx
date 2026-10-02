"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { supabase } from "@/src/lib/supabase";
import { ModalAvisoCalidad } from "./components/ModalAvisoCalidad";

type EstadoPedidoBodega =
  | "pendiente"
  | "preparando"
  | "en transporte"
  | "en despacho"
  | "recibido"
  | "problema stock"
  | "entrega fallida";

interface PedidoItem {
  nombre: string;
  cantidad: number;
  precio?: number;
}

interface PedidoBodega {
  id: number | string;
  codigo_pedido: string;

  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;

  region: string;
  comuna: string;
  direccion: string;
  depto?: string | null;

  metodo_pago: string;

  estado: EstadoPedidoBodega;

  total: number;

  items?: PedidoItem[] | null;

  created_at: string;
  updated_at?: string | null;
}

interface OpcionEstado {
  valor: EstadoPedidoBodega;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
}

const opcionesEstado: OpcionEstado[] = [
  {
    valor: "preparando",
    titulo: "Preparación",
    descripcion:
      "El pedido está siendo preparado y embalado.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M21 8l-9-5-9 5m18 0l-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5"
        />
      </svg>
    ),
  },
  {
    valor: "en transporte",
    titulo: "Ingresado a distribución",
    descripcion:
      "El pedido ingresó al transporte de distribución general.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M3 6h11v10H3V6zm11 4h4l3 3v3h-7v-6z"
        />

        <circle
          cx="7"
          cy="18"
          r="2"
          strokeWidth="1.8"
        />

        <circle
          cx="18"
          cy="18"
          r="2"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    valor: "en despacho",
    titulo: "En reparto",
    descripcion:
      "El pedido salió a reparto hacia el cliente.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z"
        />

        <circle
          cx="12"
          cy="10"
          r="2"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    valor: "recibido",
    titulo: "Entregado",
    descripcion:
      "El pedido fue entregado correctamente.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 12l4 4L19 6"
        />
      </svg>
    ),
  },
];

const opcionesIncidencia: OpcionEstado[] = [
  {
    valor: "problema stock",
    titulo: "Problema de stock",
    descripcion:
      "Falta una unidad necesaria para completar correctamente este pedido.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M12 9v4m0 4h.01M10.3 4.7L2.6 18a2 2 0 001.73 3h15.34A2 2 0 0021.4 18L13.7 4.7a2 2 0 00-3.4 0z"
        />
      </svg>
    ),
  },
  {
    valor: "entrega fallida",
    titulo: "Entrega no realizada",
    descripcion:
      "El repartidor llegó al domicilio, pero no pudo entregar el pedido.",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M3 6h11v10H3V6zm11 4h4l3 3v3h-7v-6z"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17.5 5.5l4 4m0-4l-4 4"
        />
      </svg>
    ),
  },
];

function obtenerNombreEstado(
  estado: EstadoPedidoBodega
) {
  switch (estado) {
    case "pendiente":
      return "Pedido recibido";

    case "preparando":
      return "Preparación";

    case "en transporte":
      return "Ingresado a distribución";

    case "en despacho":
      return "En reparto";

    case "recibido":
      return "Entregado";

    case "problema stock":
      return "Problema de stock";

    case "entrega fallida":
      return "Entrega no realizada";

    default:
      return estado;
  }
}

function obtenerClaseEstado(
  estado: EstadoPedidoBodega
) {
  switch (estado) {
    case "pendiente":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "preparando":
      return "border-orange-200 bg-orange-50 text-orange-800";

    case "en transporte":
      return "border-[#d8cdbd] bg-[#f4eee3] text-[#314235]";

    case "en despacho":
      return "border-[#cdd8d0] bg-[#eef2ee] text-[#314235]";

    case "recibido":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "problema stock":
    case "entrega fallida":
      return "border-red-200 bg-red-50 text-red-800";

    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
}

export default function ActualizarPedidosBodegaPage() {
  const [codigo, setCodigo] = useState("");

  const [pedido, setPedido] =
    useState<PedidoBodega | null>(null);

  const [buscando, setBuscando] = useState(false);

  const [actualizando, setActualizando] =
    useState<EstadoPedidoBodega | null>(null);

  const [mensaje, setMensaje] = useState("");

  const [error, setError] = useState("");

  const [
    modalCalidadAbierto,
    setModalCalidadAbierto,
  ] = useState(false);

  const [
    mensajeCalidad,
    setMensajeCalidad,
  ] = useState("");

  const buscarPedido = async (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    const codigoLimpio = codigo
      .trim()
      .toUpperCase();

    if (!codigoLimpio) {
      setError("Ingresa un código de compra.");
      setPedido(null);
      return;
    }

    setBuscando(true);
    setError("");
    setMensaje("");
    setMensajeCalidad("");
    setPedido(null);

    try {
      const {
        data,
        error: errorSupabase,
      } = await supabase
        .from("pedidos")
        .select(
          `
            id,
            codigo_pedido,
            nombre_cliente,
            email_cliente,
            telefono_cliente,
            region,
            comuna,
            direccion,
            depto,
            metodo_pago,
            estado,
            total,
            items,
            created_at,
            updated_at
          `
        )
        .eq(
          "codigo_pedido",
          codigoLimpio
        )
        .maybeSingle();

      if (errorSupabase) {
        throw errorSupabase;
      }

      if (!data) {
        setError(
          `No encontramos ningún pedido con el código ${codigoLimpio}.`
        );
        return;
      }

      setPedido(
        data as PedidoBodega
      );
    } catch (err) {
      console.error(
        "Error buscando pedido:",
        err
      );

      setError(
        "No fue posible buscar el pedido."
      );
    } finally {
      setBuscando(false);
    }
  };

  const actualizarEstado = async (
    nuevoEstado: EstadoPedidoBodega
  ) => {
    if (!pedido) {
      return;
    }

    if (pedido.estado === nuevoEstado) {
      return;
    }

    setActualizando(nuevoEstado);

    setError("");
    setMensaje("");
    setMensajeCalidad("");

    try {
      const fechaActualizacion =
        new Date().toISOString();

      const {
        data,
        error: errorSupabase,
      } = await supabase
        .from("pedidos")
        .update({
          estado: nuevoEstado,
          updated_at: fechaActualizacion,
        })
        .eq("id", pedido.id)
        .select(
          `
            id,
            codigo_pedido,
            nombre_cliente,
            email_cliente,
            telefono_cliente,
            region,
            comuna,
            direccion,
            depto,
            metodo_pago,
            estado,
            total,
            items,
            created_at,
            updated_at
          `
        )
        .single();

      if (errorSupabase) {
        throw errorSupabase;
      }

      setPedido(
        data as PedidoBodega
      );

      setMensaje(
        `Pedido ${
          pedido.codigo_pedido
        } actualizado a "${obtenerNombreEstado(
          nuevoEstado
        )}".`
      );
    } catch (err) {
      console.error(
        "Error actualizando estado:",
        err
      );

      setError(
        "No fue posible actualizar el estado del pedido."
      );
    } finally {
      setActualizando(null);
    }
  };

  const abrirAvisoCalidad = () => {
    if (!pedido) {
      return;
    }

    if (pedido.estado !== "preparando") {
      setMensaje("");
      setMensajeCalidad("");

      setError(
        'Para reportar una falla de calidad, primero cambia el pedido a "Preparación".'
      );

      return;
    }

    if (
      !pedido.items ||
      pedido.items.length === 0
    ) {
      setError(
        "Este pedido no tiene productos disponibles para reportar."
      );

      return;
    }

    setError("");
    setMensaje("");
    setMensajeCalidad("");

    setModalCalidadAbierto(true);
  };

  const cantidadProductos =
    pedido?.items?.reduce(
      (total, item) =>
        total +
        Number(item.cantidad || 0),
      0
    ) ?? 0;

  const incidenciaActiva =
    pedido?.estado === "problema stock" ||
    pedido?.estado === "entrega fallida";

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* VOLVER */}
        <div className="mb-6">
          <Link
            href="/bodega"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5a50] transition hover:text-[#314235]"
          >
            <span>←</span>
            <span>Volver a Bodega</span>
          </Link>
        </div>

        {/* CABECERA */}
        <section className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8c7762]">
            Bodega
          </p>

          <h1 className="font-serif text-4xl text-[#2d2a23] sm:text-5xl">
            Actualizar pedidos
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Busca una compra por su código y actualiza el
            estado general del pedido.
          </p>
        </section>

        {/* BUSCADOR */}
        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <form onSubmit={buscarPedido}>
            <label
              htmlFor="codigo-pedido"
              className="mb-3 block text-sm font-bold text-[#2d2a23]"
            >
              Código de compra
            </label>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="codigo-pedido"
                  type="text"
                  value={codigo}
                  onChange={(event) => {
                    setCodigo(
                      event.target.value
                    );

                    setError("");
                    setMensaje("");
                    setMensajeCalidad("");
                  }}
                  placeholder="Ej: SM-901072"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-stone-300 bg-[#fdfbf7] px-5 pr-12 font-mono text-sm font-semibold uppercase text-[#2d2a23] outline-none transition focus:border-[#314235]"
                />

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    strokeWidth="1.8"
                  />

                  <path
                    d="M20 20l-4-4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <button
                type="submit"
                disabled={buscando}
                className="h-14 cursor-pointer rounded-2xl bg-[#314235] px-6 text-sm font-bold text-white transition hover:bg-[#263329] disabled:opacity-60"
              >
                {buscando
                  ? "Buscando..."
                  : "Buscar"}
              </button>
            </div>

            <p className="mt-2 text-xs text-stone-400">
              También puedes escribir el código y presionar
              Enter.
            </p>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              ✓ {mensaje}
            </div>
          )}

          {mensajeCalidad && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              ✓ {mensajeCalidad}
            </div>
          )}
        </section>

        {/* PEDIDO */}
        {pedido && (
          <section className="mt-6 space-y-6">
            {/* INFORMACIÓN */}
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
                    Pedido encontrado
                  </p>

                  <h2 className="mt-2 font-mono text-2xl font-bold text-[#2d2a23]">
                    {pedido.codigo_pedido}
                  </h2>

                  <p className="mt-2 text-sm text-stone-500">
                    {pedido.nombre_cliente}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                    Estado actual
                  </p>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${obtenerClaseEstado(
                      pedido.estado
                    )}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />

                    {obtenerNombreEstado(
                      pedido.estado
                    )}
                  </span>
                </div>
              </div>

              {incidenciaActiva && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 font-bold text-white">
                      !
                    </div>

                    <div>
                      <p className="font-bold text-red-900">
                        Incidencia activa
                      </p>

                      <p className="mt-1 text-sm leading-5 text-red-700">
                        Este pedido tiene una incidencia
                        reportada. El cliente verá este aviso
                        en su seguimiento.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 border-t border-stone-100 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Productos
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {cantidadProductos}{" "}
                    {cantidadProductos === 1
                      ? "unidad"
                      : "unidades"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Destino
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {pedido.comuna}, {pedido.region}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Total
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {new Intl.NumberFormat(
                      "es-CL",
                      {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0,
                      }
                    ).format(
                      pedido.total
                    )}
                  </p>
                </div>
              </div>

              {pedido.items &&
                pedido.items.length > 0 && (
                  <div className="mt-6 border-t border-stone-100 pt-6">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">
                      Productos del pedido
                    </p>

                    <div className="space-y-2">
                      {pedido.items.map(
                        (item, index) => (
                          <div
                            key={`${item.nombre}-${index}`}
                            className="flex items-center justify-between rounded-xl bg-[#f8f4ec] px-4 py-3"
                          >
                            <span className="text-sm font-semibold text-[#2d2a23]">
                              {item.nombre}
                            </span>

                            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-stone-600">
                              x{item.cantidad}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* GESTIÓN DE ESTADO */}
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c7762]">
                  Gestión del pedido
                </p>

                <h3 className="mt-2 font-serif text-2xl text-[#2d2a23]">
                  Actualizar estado
                </h3>

                <p className="mt-2 text-sm text-stone-500">
                  Selecciona la etapa en la que se encuentra
                  actualmente el pedido.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {opcionesEstado.map(
                  (opcion) => {
                    const activo =
                      pedido.estado ===
                      opcion.valor;

                    const cargando =
                      actualizando ===
                      opcion.valor;

                    /*
                      El acceso a calidad SIEMPRE
                      se muestra en Preparación.
                    */
                    const esPreparacion =
                      opcion.valor ===
                      "preparando";

                    return (
                      <div
                        key={opcion.valor}
                        className="relative"
                      >
                        <button
                          type="button"
                          disabled={
                            activo ||
                            actualizando !== null
                          }
                          onClick={() =>
                            void actualizarEstado(
                              opcion.valor
                            )
                          }
                          className={`group flex min-h-32 w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                            esPreparacion
                              ? "pt-17 sm:pt-5 sm:pr-40"
                              : ""
                          } ${
                            activo
                              ? "cursor-default border-[#314235] bg-[#314235] text-white shadow-md"
                              : "cursor-pointer border-stone-200 bg-[#fdfbf7] text-[#2d2a23] hover:-translate-y-0.5 hover:border-[#8c7762] hover:shadow-md"
                          } disabled:opacity-80`}
                        >
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                              activo
                                ? "bg-white/15"
                                : "bg-[#314235]/10 text-[#314235]"
                            }`}
                          >
                            {activo &&
                            !cargando ? (
                              <span className="text-xl">
                                ✓
                              </span>
                            ) : (
                              opcion.icono
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold">
                                {cargando
                                  ? "Actualizando..."
                                  : opcion.titulo}
                              </p>

                              {activo && (
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Actual
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-xs leading-5 ${
                                activo
                                  ? "text-white/75"
                                  : "text-stone-500"
                              }`}
                            >
                              {opcion.descripcion}
                            </p>
                          </div>
                        </button>

                        {/* BOTÓN DE CONTROL DE CALIDAD */}
                        {esPreparacion && (
                          <button
                            type="button"
                            onClick={
                              abrirAvisoCalidad
                            }
                            className={`absolute right-4 top-4 z-20 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                              pedido.estado ===
                              "preparando"
                                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-stone-300 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                            }`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v4m0 4h.01M10.3 4.7L2.6 18a2 2 0 001.73 3h15.34A2 2 0 0021.4 18L13.7 4.7a2 2 0 00-3.4 0z"
                              />
                            </svg>

                            <span>
                              Avisar falla
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {pedido.estado ===
                "pendiente" && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  El pedido está en{" "}
                  <strong>
                    Pedido recibido
                  </strong>
                  . Selecciona Preparación cuando Bodega
                  comience a trabajar en él.
                </div>
              )}
            </div>

            {/* CASOS EXCEPCIONALES */}
            <div className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-lg font-bold text-red-600">
                    !
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                      Casos excepcionales
                    </p>

                    <h3 className="mt-1 font-serif text-2xl text-[#2d2a23]">
                      Reportar un problema
                    </h3>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
                  Estas opciones cambian el estado general del
                  pedido y el cliente verá el aviso en su
                  seguimiento.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {opcionesIncidencia.map(
                  (opcion) => {
                    const activo =
                      pedido.estado ===
                      opcion.valor;

                    const cargando =
                      actualizando ===
                      opcion.valor;

                    return (
                      <button
                        key={opcion.valor}
                        type="button"
                        disabled={
                          activo ||
                          actualizando !== null
                        }
                        onClick={() =>
                          void actualizarEstado(
                            opcion.valor
                          )
                        }
                        className={`flex min-h-28 items-center gap-4 rounded-2xl border p-5 text-left transition ${
                          activo
                            ? "cursor-default border-red-600 bg-red-600 text-white shadow-md"
                            : "cursor-pointer border-red-200 bg-red-50/60 text-red-950 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-50 hover:shadow-md"
                        } disabled:opacity-80`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            activo
                              ? "bg-white/15 text-white"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {activo &&
                          !cargando ? (
                            <span className="text-xl font-bold">
                              !
                            </span>
                          ) : (
                            opcion.icono
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">
                              {cargando
                                ? "Reportando..."
                                : opcion.titulo}
                            </p>

                            {activo && (
                              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase">
                                Activa
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-xs leading-5 ${
                              activo
                                ? "text-white/80"
                                : "text-red-800/70"
                            }`}
                          >
                            {opcion.descripcion}
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* MODAL DE CONTROL DE CALIDAD */}
      {modalCalidadAbierto &&
        pedido &&
        pedido.estado ===
          "preparando" && (
          <ModalAvisoCalidad
            codigoPedido={
              pedido.codigo_pedido
            }
            items={
              pedido.items ?? []
            }
            onCerrar={() =>
              setModalCalidadAbierto(
                false
              )
            }
            onEnviado={() => {
              setModalCalidadAbierto(
                false
              );

              setMensajeCalidad(
                "Aviso de calidad enviado al administrador correctamente."
              );

              setError("");
            }}
          />
        )}
    </main>
  );
}