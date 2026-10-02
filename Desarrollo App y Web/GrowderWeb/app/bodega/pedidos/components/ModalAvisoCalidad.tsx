"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/src/lib/supabase";

interface PedidoItem {
  nombre: string;
  cantidad: number;
  precio?: number;
}

interface ModalAvisoCalidadProps {
  codigoPedido: string;
  items: PedidoItem[];
  onCerrar: () => void;
  onEnviado: () => void;
}

interface OpcionFalla {
  valor: string;
  etiqueta: string;
}

const opcionesFalla: OpcionFalla[] = [
  {
    valor: "rotura",
    etiqueta: "Rotura / trizadura",
  },
  {
    valor: "oxido",
    etiqueta: "Óxido",
  },
  {
    valor: "hongos",
    etiqueta: "Hongos",
  },
  {
    valor: "manchas",
    etiqueta: "Manchas",
  },
  {
    valor: "virola despegada",
    etiqueta: "Virola despegada",
  },
  {
    valor: "deformacion",
    etiqueta: "Deformación",
  },
  {
    valor: "mala terminacion",
    etiqueta: "Mala terminación",
  },
  {
    valor: "otro",
    etiqueta: "Otro",
  },
];

export function ModalAvisoCalidad({
  codigoPedido,
  items,
  onCerrar,
  onEnviado,
}: ModalAvisoCalidadProps) {
  const [producto, setProducto] = useState(
    items[0]?.nombre ?? ""
  );

  const [fallas, setFallas] = useState<string[]>([]);

  const [detalleOtro, setDetalleOtro] = useState("");

  const [accionRealizada, setAccionRealizada] =
    useState("");

  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState("");

  const alternarFalla = (falla: string) => {
    setError("");

    setFallas((actuales) => {
      if (actuales.includes(falla)) {
        return actuales.filter(
          (item) => item !== falla
        );
      }

      return [...actuales, falla];
    });

    if (
      falla === "otro" &&
      fallas.includes("otro")
    ) {
      setDetalleOtro("");
    }
  };

  const enviarAviso = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!producto) {
      setError(
        "Selecciona el producto que presenta la falla."
      );

      return;
    }

    if (fallas.length === 0) {
      setError(
        "Selecciona al menos una falla."
      );

      return;
    }

    if (
      fallas.includes("otro") &&
      !detalleOtro.trim()
    ) {
      setError(
        'Describe brevemente la falla marcada como "Otro".'
      );

      return;
    }

    setEnviando(true);

    try {
      const { error: errorSupabase } = await supabase
        .from("incidencias_bodega")
        .insert({
          codigo_pedido: codigoPedido,

          producto_nombre: producto,

          fallas,

          detalle_otro:
            fallas.includes("otro")
              ? detalleOtro.trim()
              : null,

          accion_realizada:
            accionRealizada.trim()
              ? accionRealizada.trim()
              : null,

          estado_aviso: "pendiente",
        });

      if (errorSupabase) {
        throw errorSupabase;
      }

      onEnviado();
    } catch (err) {
      console.error(
        "Error enviando aviso de calidad:",
        err
      );

      setError(
        "No fue posible enviar el aviso. Intenta nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-stone-200 bg-[#fdfbf7] shadow-2xl">
        {/* CABECERA */}
        <div className="flex items-start justify-between gap-6 border-b border-stone-200 px-6 py-6 sm:px-8">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
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
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c7762]">
                Control de calidad
              </p>

              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#2d2a23]">
                Avisar problema de calidad
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                Pedido {codigoPedido}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={enviarAviso}
          className="space-y-7 p-6 sm:p-8"
        >
          {/* PRODUCTO */}
          <div>
            <label
              htmlFor="producto-calidad"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500"
            >
              Producto con problema
            </label>

            <select
              id="producto-calidad"
              value={producto}
              onChange={(event) =>
                setProducto(event.target.value)
              }
              disabled={enviando}
              className="h-13 w-full cursor-pointer rounded-2xl border border-stone-300 bg-white px-4 text-sm font-semibold text-[#2d2a23] outline-none transition focus:border-[#314235] focus:ring-2 focus:ring-[#314235]/10 disabled:opacity-60"
            >
              {items.map((item, index) => (
                <option
                  key={`${item.nombre}-${index}`}
                  value={item.nombre}
                >
                  {item.nombre}
                  {item.cantidad > 1
                    ? ` · x${item.cantidad}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* FALLAS */}
          <div>
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                ¿Qué problema encontraste?
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Puedes seleccionar más de una opción.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {opcionesFalla.map((opcion) => {
                const seleccionada =
                  fallas.includes(opcion.valor);

                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    disabled={enviando}
                    onClick={() =>
                      alternarFalla(opcion.valor)
                    }
                    className={`min-h-20 cursor-pointer rounded-2xl border px-3 py-3 text-center text-xs font-bold transition ${
                      seleccionada
                        ? "border-[#314235] bg-[#314235] text-white shadow-sm"
                        : "border-stone-200 bg-white text-stone-600 hover:border-[#8c7762] hover:bg-[#f8f4ec]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                          seleccionada
                            ? "border-white/30 bg-white/15"
                            : "border-stone-200 bg-[#f8f4ec]"
                        }`}
                      >
                        {seleccionada ? "✓" : "+"}
                      </span>

                      <span>
                        {opcion.etiqueta}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OTRO */}
          {fallas.includes("otro") && (
            <div>
              <label
                htmlFor="detalle-otro"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500"
              >
                Describe la otra falla
              </label>

              <textarea
                id="detalle-otro"
                value={detalleOtro}
                onChange={(event) =>
                  setDetalleOtro(
                    event.target.value
                  )
                }
                disabled={enviando}
                rows={3}
                maxLength={500}
                placeholder="Ej: El cuero llegó despegado en un costado."
                className="w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-[#2d2a23] outline-none transition placeholder:text-stone-400 focus:border-[#314235] focus:ring-2 focus:ring-[#314235]/10 disabled:opacity-60"
              />

              <p className="mt-1 text-right text-[10px] text-stone-400">
                {detalleOtro.length}/500
              </p>
            </div>
          )}

          {/* ACCIÓN REALIZADA */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="accion-realizada"
                className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500"
              >
                ¿Qué hiciste ante el problema?
              </label>

              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                Opcional
              </span>
            </div>

            <textarea
              id="accion-realizada"
              value={accionRealizada}
              onChange={(event) =>
                setAccionRealizada(
                  event.target.value
                )
              }
              disabled={enviando}
              rows={4}
              maxLength={700}
              placeholder="Ej: Separé la unidad dañada y busqué un reemplazo del stock."
              className="w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-[#2d2a23] outline-none transition placeholder:text-stone-400 focus:border-[#314235] focus:ring-2 focus:ring-[#314235]/10 disabled:opacity-60"
            />

            <div className="mt-2 flex items-start justify-between gap-4">
              <p className="max-w-md text-[11px] leading-5 text-stone-400">
                Si no realizaste ninguna acción, puedes dejar
                esta sección vacía.
              </p>

              <p className="shrink-0 text-[10px] text-stone-400">
                {accionRealizada.length}/700
              </p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* AVISO */}
          <div className="rounded-2xl border border-[#ded6c8] bg-[#f8f4ec] px-4 py-3">
            <p className="text-xs leading-5 text-stone-600">
              Este aviso es{" "}
              <strong>interno</strong>. No cambia el estado
              del pedido ni será mostrado al cliente.
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="h-12 cursor-pointer rounded-2xl border border-stone-300 bg-white px-6 text-sm font-bold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="h-12 cursor-pointer rounded-2xl bg-[#314235] px-7 text-sm font-bold text-white transition hover:bg-[#263329] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando
                ? "Enviando aviso..."
                : "Enviar aviso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}