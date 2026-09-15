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
  // 1 = Pendiente (En preparación), 2 = En despacho (En camino), 3 = Recibido (Entregado)
  const pasoActual =
    estado === "recibido" ? 3 : estado === "en despacho" ? 2 : 1;

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
            {estado === "recibido"
              ? "Paquete entregado conforme"
              : estado === "en despacho"
              ? "Paquete en camino a tu domicilio"
              : "En preparación artesanal"}
          </h3>
        </div>

        <div className="shrink-0">
          {estado === "recibido" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Entregado
            </span>
          ) : estado === "en despacho" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              En tránsito
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              Preparando
            </span>
          )}
        </div>
      </div>

      {/* Línea de tiempo vertical (Stepper) */}
      <div className="relative pl-8 sm:pl-10 space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
        {/* PASO 1: En preparación */}
        <div className="relative">
          <span
            className={`absolute -left-8 sm:-left-10 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              pasoActual >= 1
                ? "bg-[#314235] text-white shadow-xs"
                : "bg-stone-100 text-stone-400 border border-stone-300"
            }`}
          >
            {pasoActual > 1 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            )}
          </span>

          <div className="min-w-0">
            <h4
              className={`text-sm font-bold ${
                pasoActual >= 1 ? "text-stone-900" : "text-stone-400"
              }`}
            >
              1. En preparación
            </h4>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              Tu orden fue registrada y nuestro equipo está seleccionando y empaquetando minuciosamente cada calabaza, virola y accesorio.
            </p>
            {fechaCreacion && (
              <p className="text-[11px] text-stone-400 mt-1">
                Registrado el {formatearFecha(fechaCreacion)}
              </p>
            )}
          </div>
        </div>

        {/* PASO 2: En camino */}
        <div className="relative">
          <span
            className={`absolute -left-8 sm:-left-10 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              pasoActual >= 2
                ? "bg-[#314235] text-white shadow-xs"
                : "bg-stone-100 text-stone-400 border border-stone-300"
            }`}
          >
            {pasoActual > 2 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : pasoActual === 2 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
              </span>
            ) : (
              "2"
            )}
          </span>

          <div className="min-w-0">
            <h4
              className={`text-sm font-bold ${
                pasoActual >= 2 ? "text-stone-900" : "text-stone-400"
              }`}
            >
              2. En camino al destino
            </h4>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              El paquete fue entregado a la empresa de transporte para despacho a tu dirección.
            </p>

            {pasoActual >= 2 && (
              <div className="mt-2 p-3 rounded-2xl bg-[#fdfbf7] border border-stone-200 text-xs space-y-1.5">
                {empresaTransporte && (
                  <p className="text-stone-700">
                    <span className="text-stone-400">Empresa:</span>{" "}
                    <strong className="text-stone-900">{empresaTransporte}</strong>
                  </p>
                )}
                {numeroSeguimiento && (
                  <p className="text-stone-700 flex items-center gap-2">
                    <span className="text-stone-400">Guía de seguimiento:</span>
                    <strong className="font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {numeroSeguimiento}
                    </strong>
                  </p>
                )}
                <p className="text-stone-500 text-[11px] truncate">
                  Destino: {direccionEntrega}, {comuna}, {region}
                </p>
                {fechaActualizacion && pasoActual === 2 && (
                  <p className="text-[10px] text-stone-400 pt-1">
                    Última actualización: {formatearFecha(fechaActualizacion)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PASO 3: Entregado */}
        <div className="relative">
          <span
            className={`absolute -left-8 sm:-left-10 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              pasoActual === 3
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-stone-100 text-stone-400 border border-stone-300"
            }`}
          >
            {pasoActual === 3 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              "3"
            )}
          </span>

          <div className="min-w-0">
            <h4
              className={`text-sm font-bold ${
                pasoActual === 3 ? "text-emerald-800" : "text-stone-400"
              }`}
            >
              3. Entrega completada
            </h4>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              {pasoActual === 3
                ? "Paquete recibido conforme en tu dirección. ¡Que disfrutes tu experiencia SoMate!"
                : "Se notificará una vez que el transportista confirme la recepción en tu domicilio."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
