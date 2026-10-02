import React from "react";
import { EstadoPedido } from "@/app/admin/types";

interface SeguimientoStepperProps {
  estado: EstadoPedido;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  empresaTransporte?: string | null;
  numeroSeguimiento?: string | null;
  direccionEntrega: string;
  comuna: string;
  region: string;
}

const pasos = [
  { estado: "pendiente", titulo: "Pedido recibido", desc: "Tu orden fue registrada correctamente en nuestro sistema." },
  { estado: "preparando", titulo: "Preparación", desc: "Nuestro equipo está seleccionando y empaquetando minuciosamente tu pedido." },
  { estado: "en transporte", titulo: "Distribución", desc: "El paquete ingresó al proceso de distribución general." },
  { estado: "en despacho", titulo: "En reparto", desc: "El pedido salió a reparto hacia tu dirección." },
  { estado: "recibido", titulo: "Entregado", desc: "Paquete recibido conforme en tu dirección. ¡Que disfrutes tu experiencia SuMate!" },
] as const;

export function SeguimientoStepper({
  estado,
  fechaCreacion,
  fechaActualizacion,
  empresaTransporte,
  numeroSeguimiento,
  direccionEntrega,
  comuna,
  region,
}: SeguimientoStepperProps) {

  const indiceNormal = (e: EstadoPedido) => {
    switch (e) {
      case "pendiente": return 0;
      case "preparando": case "problema stock": return 1;
      case "en transporte": return 2;
      case "en despacho": return 3;
      case "entrega fallida": return 4;
      case "recibido": return 4;
      default: return 0;
    }
  };

  const pasoActual = indiceNormal(estado);
  const esProblemaStock = estado === "problema stock";
  const esEntregaFallida = estado === "entrega fallida";
  const esEntregado = estado === "recibido";

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "";
    const f = new Date(fechaStr);
    return f.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
      <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block">
            Estado del Despacho
          </span>
          <h3 className="brand-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
            {esEntregado
              ? "Paquete entregado conforme"
              : esProblemaStock
              ? "Problema con el stock"
              : esEntregaFallida
              ? "No pudimos realizar la entrega"
              : estado === "en despacho"
              ? "Paquete en camino a tu domicilio"
              : estado === "en transporte"
              ? "Ingresado a distribución"
              : estado === "preparando"
              ? "En preparación artesanal"
              : "Pedido recibido"}
          </h3>
        </div>

        <div className="shrink-0">
          {esEntregado ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Entregado
            </span>
          ) : esProblemaStock || esEntregaFallida ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Requiere atención
            </span>
          ) : estado === "en despacho" || estado === "en transporte" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              En tránsito
            </span>
          ) : estado === "preparando" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              Preparando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
              <span className="w-2 h-2 rounded-full bg-stone-500" />
              Recibido
            </span>
          )}
        </div>
      </div>

      {/* Línea de tiempo vertical (Stepper) */}
      <div className="relative pl-8 sm:pl-10 space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
        {pasos.map((paso, index) => {
          let completado = index < pasoActual;
          let actual = index === pasoActual;
          let incidencia = false;

          if (esProblemaStock) {
            completado = index === 0;
            actual = false;
            incidencia = index === 1;
          }

          if (esEntregaFallida) {
            completado = index <= 3;
            actual = false;
            incidencia = index === 4;
          }

          if (esEntregado) {
            completado = true;
            actual = false;
          }

          const mostrarInfoTransporte = (index === 2 || index === 3) && (actual || completado);

          return (
            <div key={paso.estado} className="relative">
              <span
                className={`absolute -left-8 sm:-left-10 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  completado
                    ? "bg-[#314235] text-white shadow-xs"
                    : incidencia
                    ? "bg-red-500 text-white shadow-xs"
                    : actual
                    ? "bg-amber-100 text-amber-600 border border-amber-300"
                    : "bg-stone-100 text-stone-400 border border-stone-300"
                }`}
              >
                {completado ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : incidencia ? (
                  "!"
                ) : actual ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                ) : (
                  index + 1
                )}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h4
                    className={`text-sm font-bold ${
                      completado ? "text-[#314235]" : incidencia ? "text-red-700" : actual ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {index + 1}. {paso.titulo}
                  </h4>
                  {actual && !esEntregado && !esProblemaStock && !esEntregaFallida && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                      Actual
                    </span>
                  )}
                  {incidencia && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700">
                      Problema
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {paso.desc}
                </p>

                {index === 0 && fechaCreacion && (
                  <p className="text-[11px] text-stone-400 mt-1">
                    Registrado el {formatearFecha(fechaCreacion)}
                  </p>
                )}

                {/* Mostrar info de transporte solo en Distribución o Reparto, si ya llegamos ahí */}
                {mostrarInfoTransporte && empresaTransporte && index === pasoActual && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#fdfbf7] border border-stone-200 text-xs space-y-1.5">
                    <p className="text-stone-700">
                      <span className="text-stone-400">Empresa:</span>{" "}
                      <strong className="text-stone-900">{empresaTransporte}</strong>
                    </p>
                    {numeroSeguimiento && (
                      <p className="text-stone-700 flex items-center gap-2">
                        <span className="text-stone-400">Guía de seguimiento:</span>
                        <strong className="font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                          {numeroSeguimiento}
                        </strong>
                      </p>
                    )}
                    <p className="text-stone-500 text-[11px] truncate mt-1">
                      Destino: {direccionEntrega}, {comuna}, {region}
                    </p>
                    {fechaActualizacion && (
                      <p className="text-[10px] text-stone-400 pt-1 mt-1 border-t border-stone-100">
                        Última actualización: {formatearFecha(fechaActualizacion)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
