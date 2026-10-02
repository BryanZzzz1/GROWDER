"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/src/lib/supabase";

type EstadoPedido =
  | "pendiente"
  | "preparando"
  | "en transporte"
  | "en despacho"
  | "recibido"
  | "problema stock"
  | "entrega fallida";

interface Pedido {
  id: number | string;
  codigo_pedido: string;
  nombre_cliente: string;
  estado: EstadoPedido;
  created_at?: string;
}

interface PasoNormal {
  estado:
    | "pendiente"
    | "preparando"
    | "en transporte"
    | "en despacho"
    | "recibido";

  titulo: string;
}

interface EstadoVisual {
  titulo: string;
  subtitulo: string;
  descripcion: string;

  contenedor: string;
  iconoContenedor: string;
  tituloColor: string;
  descripcionColor: string;
  etiquetaColor: string;

  etiqueta: string;
  icono: ReactNode;
}

const pasosNormales: PasoNormal[] = [
  {
    estado: "pendiente",
    titulo: "Pedido recibido",
  },
  {
    estado: "preparando",
    titulo: "Preparación",
  },
  {
    estado: "en transporte",
    titulo: "Distribución",
  },
  {
    estado: "en despacho",
    titulo: "En reparto",
  },
  {
    estado: "recibido",
    titulo: "Entregado",
  },
];

const iconoCaja = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-7 w-7"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      d="M21 8l-9-5-9 5m18 0l-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5"
    />
  </svg>
);

const iconoCamion = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-7 w-7"
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
);

const iconoUbicacion = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-7 w-7"
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
);

const iconoCheck = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-7 w-7"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 12l4 4L19 6"
    />
  </svg>
);

const iconoAlerta = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-7 w-7"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      d="M12 9v4m0 4h.01M10.3 4.7L2.6 18a2 2 0 001.73 3h15.34A2 2 0 0021.4 18L13.7 4.7a2 2 0 00-3.4 0z"
    />
  </svg>
);

const estadosVisuales: Record<
  EstadoPedido,
  EstadoVisual
> = {
  pendiente: {
    titulo: "Pedido recibido",
    subtitulo: "Tu compra fue registrada correctamente",
    descripcion:
      "Recibimos tu pedido. En breve nuestro equipo comenzará a prepararlo.",

    contenedor:
      "border-[#ded6c8] bg-[#f8f4ec]",
    iconoContenedor:
      "bg-[#8c7762] text-white",
    tituloColor: "text-[#2d2a23]",
    descripcionColor: "text-stone-600",
    etiquetaColor:
      "bg-white/80 text-[#8c7762] border-[#ded6c8]",

    etiqueta: "Pedido recibido",
    icono: iconoCaja,
  },

  preparando: {
    titulo: "Preparando / embalando",
    subtitulo:
      "Estamos preparando tu pedido en bodega",
    descripcion:
      "Estamos revisando tus productos y preparando todo cuidadosamente para que pueda continuar hacia despacho.",

    contenedor:
      "border-orange-200 bg-orange-50",
    iconoContenedor:
      "bg-orange-600 text-white",
    tituloColor: "text-orange-950",
    descripcionColor: "text-orange-900/70",
    etiquetaColor:
      "border-orange-200 bg-white/70 text-orange-700",

    etiqueta: "En preparación",
    icono: iconoCaja,
  },

  "en transporte": {
    titulo: "Ingresado a distribución",
    subtitulo:
      "Tu pedido ya está dentro del proceso de distribución",
    descripcion:
      "La preparación terminó y tu pedido ingresó al transporte de distribución para continuar su recorrido.",

    contenedor:
      "border-indigo-200 bg-indigo-50",
    iconoContenedor:
      "bg-indigo-600 text-white",
    tituloColor: "text-indigo-950",
    descripcionColor: "text-indigo-900/70",
    etiquetaColor:
      "border-indigo-200 bg-white/70 text-indigo-700",

    etiqueta: "En distribución",
    icono: iconoCamion,
  },

  "en despacho": {
    titulo: "En reparto",
    subtitulo:
      "Tu pedido está camino a la dirección indicada",
    descripcion:
      "El pedido salió a reparto. El transportista está realizando la ruta de entregas correspondiente.",

    contenedor:
      "border-sky-200 bg-sky-50",
    iconoContenedor:
      "bg-sky-600 text-white",
    tituloColor: "text-sky-950",
    descripcionColor: "text-sky-900/70",
    etiquetaColor:
      "border-sky-200 bg-white/70 text-sky-700",

    etiqueta: "En reparto",
    icono: iconoUbicacion,
  },

  recibido: {
    titulo: "Pedido entregado",
    subtitulo:
      "Tu pedido llegó correctamente a destino",
    descripcion:
      "La entrega fue completada. Gracias por comprar en SuMateCL.",

    contenedor:
      "border-emerald-300 bg-emerald-50",
    iconoContenedor:
      "bg-emerald-700 text-white",
    tituloColor: "text-emerald-950",
    descripcionColor: "text-emerald-800",
    etiquetaColor:
      "border-emerald-200 bg-white/70 text-emerald-800",

    etiqueta: "✓ Entregado",
    icono: iconoCheck,
  },

  "problema stock": {
    titulo: "Problema con el stock",
    subtitulo:
      "Encontramos un inconveniente mientras preparábamos tu pedido",
    descripcion:
      "Una unidad se agotó casi al mismo tiempo que se confirmó tu compra. Es algo muy poco frecuente. Nuestro equipo revisará tu pedido y se pondrá en contacto contigo para ofrecerte una solución.",

    contenedor:
      "border-red-300 bg-red-50",
    iconoContenedor:
      "bg-red-600 text-white",
    tituloColor: "text-red-950",
    descripcionColor: "text-red-800",
    etiquetaColor:
      "border-red-200 bg-white/80 text-red-700",

    etiqueta: "Requiere atención",
    icono: iconoAlerta,
  },

  "entrega fallida": {
    titulo: "No pudimos realizar la entrega",
    subtitulo:
      "El repartidor llegó, pero no fue posible entregar el pedido",
    descripcion:
      "El repartidor llegó a la dirección indicada e intentó contactar a alguien para recibir el pedido, pero no fue posible realizar la entrega. Haremos un nuevo intento en la próxima jornada de reparto dentro del horario informado. Si nuevamente no hay alguien disponible, será necesario coordinar un nuevo envío con costo o retirar el pedido en tienda.",

    contenedor:
      "border-red-300 bg-red-50",
    iconoContenedor:
      "bg-red-600 text-white",
    tituloColor: "text-red-950",
    descripcionColor: "text-red-800",
    etiquetaColor:
      "border-red-200 bg-white/80 text-red-700",

    etiqueta: "Entrega pendiente",
    icono: iconoAlerta,
  },
};

function indiceNormal(
  estado: EstadoPedido
): number {
  switch (estado) {
    case "pendiente":
      return 0;

    case "preparando":
      return 1;

    case "problema stock":
      return 1;

    case "en transporte":
      return 2;

    case "en despacho":
      return 3;

    case "entrega fallida":
      return 4;

    case "recibido":
      return 4;

    default:
      return 0;
  }
}

export default function SeguimientoPedidoPage() {
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [buscando, setBuscando] =
    useState(false);

  const [error, setError] = useState("");

  const buscarPedido = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    const codigoLimpio = codigo
      .trim()
      .toUpperCase();

    if (!codigoLimpio) {
      setPedido(null);

      setError(
        "Ingresa un código de pedido para realizar la búsqueda."
      );

      return;
    }

    setBuscando(true);
    setError("");
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
            estado,
            created_at
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
          `No encontramos un pedido con el código ${codigoLimpio}.`
        );

        return;
      }

      setPedido(data as Pedido);
    } catch (err) {
      console.error(
        "Error buscando seguimiento:",
        err
      );

      setError(
        "No fue posible consultar el seguimiento del pedido."
      );
    } finally {
      setBuscando(false);
    }
  };

  const estadoVisual = pedido
    ? estadosVisuales[pedido.estado]
    : null;

  const indiceActual = pedido
    ? indiceNormal(pedido.estado)
    : 0;

  const problemaStock =
    pedido?.estado ===
    "problema stock";

  const entregaFallida =
    pedido?.estado ===
    "entrega fallida";

  const entregado =
    pedido?.estado === "recibido";

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
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
        <section className="mb-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8c7762]">
            Bodega
          </p>

          <h1 className="font-serif text-4xl font-semibold text-[#2d2a23] sm:text-5xl">
            Seguimiento de pedido
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            Ingresa el código para consultar
            rápidamente el estado actual y el
            recorrido del pedido.
          </p>
        </section>

        {/* BUSCADOR */}
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={buscarPedido}
          >
            <label
              htmlFor="codigo-pedido"
              className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-[#8c8378]"
            >
              Código de pedido
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500"
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

                <input
                  id="codigo-pedido"
                  type="text"
                  value={codigo}
                  onChange={(event) => {
                    setCodigo(
                      event.target.value
                    );

                    setError("");
                  }}
                  placeholder="SM-332918"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-[#ded6c8] bg-[#fdfbf7] pl-14 pr-5 font-mono text-sm font-semibold uppercase text-[#2d2a23] outline-none transition placeholder:text-stone-400 focus:border-[#314235] focus:ring-2 focus:ring-[#314235]/10"
                />
              </div>

              <button
                type="submit"
                disabled={buscando}
                className="h-14 cursor-pointer rounded-2xl bg-[#314235] px-8 text-sm font-bold text-white transition hover:bg-[#253128] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buscando
                  ? "Buscando..."
                  : "Buscar pedido"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </section>

        {/* PEDIDO */}
        {pedido &&
          estadoVisual && (
            <section className="mt-7">
              {/* DATOS PEDIDO */}
              <div className="mb-5 flex flex-col gap-3 px-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b45e36]">
                    Pedido encontrado
                  </p>

                  <h2 className="mt-2 font-serif text-3xl font-semibold text-[#2d2a23]">
                    Pedido{" "}
                    {
                      pedido.codigo_pedido
                    }
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    {
                      pedido.nombre_cliente
                    }
                  </p>
                </div>
              </div>

              {/* ESTADO ACTUAL GRANDE */}
              <article
                className={`rounded-[30px] border p-6 shadow-sm sm:p-9 ${estadoVisual.contenedor}`}
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] ${estadoVisual.iconoContenedor}`}
                  >
                    {
                      estadoVisual.icono
                    }
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${estadoVisual.etiquetaColor}`}
                      >
                        {
                          estadoVisual.etiqueta
                        }
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
                        Estado actual
                      </span>
                    </div>

                    <h3
                      className={`mt-4 font-serif text-3xl font-semibold sm:text-4xl ${estadoVisual.tituloColor}`}
                    >
                      {
                        estadoVisual.titulo
                      }
                    </h3>

                    <p
                      className={`mt-2 text-base font-semibold ${estadoVisual.tituloColor}`}
                    >
                      {
                        estadoVisual.subtitulo
                      }
                    </p>

                    <p
                      className={`mt-4 max-w-3xl text-sm leading-7 sm:text-base ${estadoVisual.descripcionColor}`}
                    >
                      {
                        estadoVisual.descripcion
                      }
                    </p>
                  </div>
                </div>
              </article>

              {/* PROGRESO PEQUEÑO */}
              <section className="mt-5 rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c7762]">
                    Recorrido del pedido
                  </p>

                  <h3 className="mt-2 font-serif text-2xl text-[#2d2a23]">
                    Progreso
                  </h3>
                </div>

                <div className="space-y-3">
                  {pasosNormales.map(
                    (paso, index) => {
                      let completado =
                        index <
                        indiceActual;

                      let actual =
                        index ===
                        indiceActual;

                      let incidencia =
                        false;

                      if (
                        problemaStock
                      ) {
                        completado =
                          index === 0;

                        actual = false;

                        incidencia =
                          index === 1;
                      }

                      if (
                        entregaFallida
                      ) {
                        completado =
                          index <= 3;

                        actual = false;

                        incidencia =
                          index === 4;
                      }

                      if (
                        entregado
                      ) {
                        completado =
                          true;

                        actual = false;
                      }

                      return (
                        <div
                          key={
                            paso.estado
                          }
                        >
                          <div className="flex items-center gap-4 rounded-2xl px-3 py-3">
                            {/* CÍRCULO */}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                                completado
                                  ? "border-[#314235] bg-[#314235] text-white"
                                  : actual
                                  ? "border-[#b45e36] bg-[#fff4ee] text-[#b45e36]"
                                  : incidencia
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : "border-stone-200 bg-white text-stone-300"
                              }`}
                            >
                              {completado ? (
                                <span className="text-sm font-bold">
                                  ✓
                                </span>
                              ) : incidencia ? (
                                <span className="text-sm font-bold">
                                  !
                                </span>
                              ) : (
                                <span className="h-2.5 w-2.5 rounded-full bg-current" />
                              )}
                            </div>

                            {/* TEXTO */}
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                              <p
                                className={`text-sm font-bold sm:text-base ${
                                  completado
                                    ? "text-[#314235]"
                                    : actual
                                    ? "text-[#2d2a23]"
                                    : incidencia
                                    ? "text-red-700"
                                    : "text-stone-400"
                                }`}
                              >
                                {
                                  paso.titulo
                                }
                              </p>

                              {actual && (
                                <span className="shrink-0 rounded-full bg-[#fff0e8] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#b45e36]">
                                  Actual
                                </span>
                              )}

                              {incidencia && (
                                <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-red-700">
                                  Requiere
                                  atención
                                </span>
                              )}

                              {completado && (
                                <span className="hidden shrink-0 rounded-full bg-[#eef2ee] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#314235] sm:inline-flex">
                                  Completado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* INCIDENCIA STOCK */}
                          {problemaStock &&
                            index ===
                              0 && (
                              <div className="ml-[30px] border-l-2 border-red-200 py-2 pl-8">
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                  <p className="text-xs font-bold text-red-800">
                                    ⚠
                                    Problema
                                    detectado
                                    durante la
                                    preparación
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* INCIDENCIA ENTREGA */}
                          {entregaFallida &&
                            index ===
                              3 && (
                              <div className="ml-[30px] border-l-2 border-red-200 py-2 pl-8">
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                  <p className="text-xs font-bold text-red-800">
                                    ⚠ No fue
                                    posible
                                    completar
                                    la entrega
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* FINALIZADO */}
                {entregado && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">
                        ✓
                      </span>

                      <div>
                        <p className="font-bold text-emerald-900">
                          Pedido
                          finalizado
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-700">
                          Todas las
                          etapas fueron
                          completadas
                          correctamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </section>
          )}
      </div>
    </main>
  );
}