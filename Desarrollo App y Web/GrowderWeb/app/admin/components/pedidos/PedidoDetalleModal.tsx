import React, { useState } from "react";
import { Pedido, EstadoPedido } from "../../types";
import { PedidoEstadoBadge } from "./PedidoEstadoBadge";

interface PedidoDetalleModalProps {
  pedido: Pedido | null;
  onCerrar: () => void;
  onActualizarEstado: (idPedido: string | number, nuevoEstado: EstadoPedido) => Promise<void>;
  onActualizarDatosDespacho: (
    idPedido: string | number,
    empresa: string,
    numeroSeguimiento: string,
    notas: string
  ) => Promise<void>;
}

export function PedidoDetalleModal({
  pedido,
  onCerrar,
  onActualizarEstado,
  onActualizarDatosDespacho,
}: PedidoDetalleModalProps) {
  const [empresa, setEmpresa] = useState(pedido?.empresa_transporte || "");
  const [guia, setGuia] = useState(pedido?.numero_seguimiento || "");
  const [notas, setNotas] = useState(pedido?.notas_despacho || "");
  const [guardandoLogistica, setGuardandoLogistica] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  if (!pedido) return null;

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "Fecha no registrada";
    const f = new Date(fechaStr);
    return f.toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGuardarLogistica = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoLogistica(true);
    try {
      await onActualizarDatosDespacho(pedido.id, empresa, guia, notas);
      setMensajeGuardado(true);
      setTimeout(() => setMensajeGuardado(false), 3000);
    } finally {
      setGuardandoLogistica(false);
    }
  };

  const handleCambioEstado = async (nuevoEstado: EstadoPedido) => {
    if (nuevoEstado === pedido.estado) return;
    setCambiandoEstado(true);
    try {
      await onActualizarEstado(pedido.id, nuevoEstado);
    } finally {
      setCambiandoEstado(false);
    }
  };

  // Mensaje estructurado de WhatsApp para el cliente
  const textoWhatsapp = encodeURIComponent(
    `Hola ${pedido.nombre_cliente}, te escribimos desde SoMate respecto a tu pedido ${pedido.codigo_pedido}.\n` +
      `Estado actual del paquete: ${pedido.estado.toUpperCase()}.\n` +
      (guia ? `Empresa de transporte: ${empresa || "Chilexpress/Starken"} - Guía N°: ${guia}\n` : "") +
      `Destino: ${pedido.direccion}, ${pedido.comuna}, ${pedido.region}.\n` +
      `¡Quedamos atentos a cualquier consulta!`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="bg-[#314235] px-6 py-5 text-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="brand-serif text-xl sm:text-2xl font-bold tracking-tight">
                Paquete {pedido.codigo_pedido}
              </h3>
              <PedidoEstadoBadge estado={pedido.estado} tamanio="sm" />
            </div>
            <p className="text-white/70 text-xs mt-0.5">
              Registrado el {formatearFecha(pedido.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECCIÓN 1: QUÉ SE ENVIÓ (Contenido del paquete) */}
          <div className="rounded-2xl border border-stone-200 bg-[#fdfbf7] p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
              <h4 className="brand-serif text-base font-bold text-stone-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#314235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Contenido del Envío (Qué se envió)</span>
              </h4>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700">
                {pedido.items?.length || 0} {pedido.items?.length === 1 ? "artículo" : "artículos"}
              </span>
            </div>

            <div className="divide-y divide-stone-200/70">
              {pedido.items && pedido.items.length > 0 ? (
                pedido.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">
                          {item.nombre}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {item.categoria || "Accesorio / Mate"} • Cantidad:{" "}
                          <span className="font-bold text-stone-800">{item.cantidad}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#314235]">
                        {formatearPrecio(item.precio * item.cantidad)}
                      </p>
                      {item.cantidad > 1 && (
                        <p className="text-[10px] text-stone-400">
                          {formatearPrecio(item.precio)} c/u
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic py-3 text-center">
                  No se detallaron artículos individuales para este registro.
                </p>
              )}
            </div>

            {/* Desglose de Totales */}
            <div className="mt-3 pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal de productos:</span>
                <span className="font-semibold text-stone-800">{formatearPrecio(pedido.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de envío (Tarifa plana Chile):</span>
                <span className="font-semibold text-stone-800">{formatearPrecio(pedido.costo_envio)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#314235] pt-1 border-t border-stone-200">
                <span>Total General:</span>
                <span>{formatearPrecio(pedido.total)}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DESTINATARIO Y DIRECCIÓN DE DESPACHO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Datos del Destinatario
              </h4>
              <div className="space-y-1.5 text-xs text-stone-700">
                <p className="font-bold text-sm text-stone-900">{pedido.nombre_cliente}</p>
                <p className="flex items-center gap-2">
                  <span className="text-stone-400">Correo:</span>
                  <span className="font-medium text-stone-800">{pedido.email_cliente}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-stone-400">Teléfono:</span>
                  <span className="font-medium text-stone-800">+56 {pedido.telefono_cliente}</span>
                </p>
              </div>

              {/* Botón WhatsApp */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/56${pedido.telefono_cliente.replace(/\D/g, "")}?text=${textoWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs transition shadow-xs"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Notificar al cliente por WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Dirección de Entrega
              </h4>
              <div className="space-y-1.5 text-xs text-stone-700">
                <p className="font-semibold text-stone-800">{pedido.direccion}</p>
                {pedido.depto && (
                  <p className="text-stone-600">
                    <span className="text-stone-400">Depto/Oficina:</span> {pedido.depto}
                  </p>
                )}
                <p className="text-stone-600">
                  <span className="text-stone-400">Comuna:</span> {pedido.comuna}
                </p>
                <p className="text-stone-600">
                  <span className="text-stone-400">Región:</span> {pedido.region}
                </p>
                {pedido.instrucciones && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px]">
                    <span className="font-bold block mb-0.5">Indicaciones de entrega:</span>
                    {pedido.instrucciones}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONTROL DE ESTADO Y DATOS DE DESPACHO */}
          <div className="rounded-2xl border border-stone-200 bg-[#fbf9f4] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h4 className="text-sm font-bold text-stone-900">Estado del Paquete</h4>
                <p className="text-xs text-stone-500">
                  Actualiza el ciclo de vida del pedido en tiempo real.
                </p>
              </div>

              {/* Selector de Estado con Botones Rápidos */}
              <div className="inline-flex rounded-xl p-1 bg-stone-200/80 gap-1">
                {(["pendiente", "en despacho", "recibido"] as EstadoPedido[]).map((est) => {
                  const esActivo = pedido.estado === est;
                  return (
                    <button
                      key={est}
                      type="button"
                      disabled={cambiandoEstado}
                      onClick={() => handleCambioEstado(est)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                        esActivo
                          ? "bg-white text-stone-900 shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
                      }`}
                    >
                      {est}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulario de Logística / Guía de Transporte */}
            <form onSubmit={handleGuardarLogistica} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Empresa de Transporte
                  </label>
                  <select
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-[#314235] focus:outline-none"
                  >
                    <option value="">Seleccionar empresa...</option>
                    <option value="Starken">Starken</option>
                    <option value="Chilexpress">Chilexpress</option>
                    <option value="CorreosChile">Correos de Chile</option>
                    <option value="Blue Express">Blue Express</option>
                    <option value="Despacho Propio SoMate">Despacho Propio SoMate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Número de Seguimiento / Guía
                  </label>
                  <input
                    type="text"
                    value={guia}
                    onChange={(e) => setGuia(e.target.value)}
                    placeholder="Ej. STK-10928372"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-[#314235] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Notas de Despacho Internas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones de empaque, horarios de retiro o acuerdos con el cliente..."
                  rows={2}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-[#314235] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {mensajeGuardado && (
                  <span className="text-xs font-semibold text-emerald-700">
                    ✓ Datos de despacho actualizados correctamente.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={guardandoLogistica}
                  className="ml-auto px-4 py-2 bg-[#314235] hover:bg-[#243127] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {guardandoLogistica ? "Guardando..." : "Guardar Información de Despacho"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-stone-100/80 px-6 py-4 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
