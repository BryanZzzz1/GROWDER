import React, { useState, useEffect } from "react";
import { Pedido } from "@/app/admin/types";
import { SeguimientoStepper } from "./SeguimientoStepper";
import { supabase } from "@/src/lib/supabase";

interface DetalleCompraViewProps {
  pedido: Pedido;
  onVolver: () => void;
  onVolverAComprar?: (pedido: Pedido) => void;
  onCancelarPedido?: (pedido: Pedido) => void;
}

export function DetalleCompraView({
  pedido,
  onVolver,
  onVolverAComprar,
  onCancelarPedido,
}: DetalleCompraViewProps) {
  const [copiado, setCopiado] = useState(false);

  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const estadoLocal = pedido.estado?.toLowerCase() || "";

  useEffect(() => {
    if (estadoLocal !== 'pendiente') return;

    const fechaCreacion = new Date(pedido.created_at).getTime();
    const expiracion = fechaCreacion + 5 * 60 * 1000;

    const interval = setInterval(() => {
      const ahora = Date.now();
      const dif = expiracion - ahora;
      
      if (dif <= 0) {
        clearInterval(interval);
        setTiempoRestante(0);
        setTiempoAgotado(true);
        // Autocancelación silenciosa
        supabase.rpc('cancelar_pedido', {
          p_codigo_pedido: pedido.codigo_pedido,
          p_motivo: 'cancelado'
        });
      } else {
        setTiempoRestante(Math.floor(dif / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estadoLocal, pedido]);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "";
    const f = new Date(fechaStr);
    return f.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const copiarGuia = () => {
    if (pedido.numero_seguimiento) {
      navigator.clipboard.writeText(pedido.numero_seguimiento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegación y Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#314235] hover:text-[#8C7762] transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver a Mis compras</span>
        </button>

        <span className="text-xs font-mono font-semibold text-stone-400">
          Pedido {pedido.codigo_pedido}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA (7 cols): Seguimiento y Logística */}
        <div className="lg:col-span-7 space-y-6">
          <SeguimientoStepper
            estado={tiempoAgotado ? "cancelado" : pedido.estado}
            fechaCreacion={pedido.created_at}
            fechaActualizacion={pedido.updated_at}
            empresaTransporte={pedido.empresa_transporte}
            numeroSeguimiento={pedido.numero_seguimiento}
            direccionEntrega={pedido.direccion}
            comuna={pedido.comuna}
            region={pedido.region}
          />

          {/* Tarjeta de Guía de Transporte (Adaptada a Reparto Interno) */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-stone-900">
              Datos de tu Despacho
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-stone-200">
                <span className="text-stone-400 block text-[11px] font-medium">Repartidor Asignado:</span>
                <strong className="text-stone-900 font-bold text-sm block mt-0.5">
                  {pedido.empresa_transporte || "Logística interna SuMate"}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-stone-400 block text-[11px] font-medium">Identificador de Ruta:</span>
                  <strong className="font-mono text-stone-900 text-sm block mt-0.5">
                    {pedido.numero_seguimiento || "Por asignar en empaque"}
                  </strong>
                </div>
                {pedido.numero_seguimiento && (
                  <button
                    type="button"
                    onClick={copiarGuia}
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-[11px] font-bold text-stone-700 transition cursor-pointer"
                  >
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                )}
              </div>
            </div>

            {/* Acciones del Pedido */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {estadoLocal === "pendiente" && !tiempoAgotado ? (
                <>
                  {tiempoRestante !== null && (
                    <div className="text-center bg-amber-50 rounded-full px-4 py-3 border border-amber-200">
                      <span className="text-amber-800 text-xs font-bold">
                        Expira en {Math.floor(tiempoRestante / 60).toString().padStart(2, '0')}:{(tiempoRestante % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/confirmacion-pago?codigo=${pedido.codigo_pedido}`;
                    }}
                    className="w-full py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    Completar Pago
                  </button>
                  {onCancelarPedido && (
                    <button
                      type="button"
                      onClick={() => onCancelarPedido(pedido)}
                      className="w-full py-3 px-5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition cursor-pointer"
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </>
              ) : estadoLocal === "pendiente" && tiempoAgotado ? (
                <div className="w-full flex flex-col items-center p-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-red-800 font-bold text-sm">Tiempo Agotado</span>
                  <span className="text-red-600 text-xs">La reserva de stock fue liberada.</span>
                </div>
              ) : (
                onVolverAComprar && (
                  <button
                    type="button"
                    onClick={() => onVolverAComprar(pedido)}
                    className="w-full py-3 px-5 rounded-full border border-[#314235] text-[#314235] hover:bg-[#314235] hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Volver a comprar
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 cols): Detalle de la Compra */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block">
                Comprobante de compra
              </span>
              <h3 className="brand-serif text-lg font-bold text-stone-900 mt-0.5">
                Detalle de la compra
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {formatearFecha(pedido.created_at)} • #{pedido.codigo_pedido}
              </p>
            </div>

            <div className="divide-y divide-stone-100 border-t border-b border-stone-100 py-2">
              {pedido.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.foto ? (
                        <img
                          src={item.foto}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {item.nombre}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {item.cantidad} {item.cantidad === 1 ? "unidad" : "unidades"} × {formatearPrecio(item.precio)}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-stone-900 shrink-0">
                    {formatearPrecio(item.precio * item.cantidad)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal productos:</span>
                <span className="font-semibold text-stone-900">
                  {formatearPrecio(pedido.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Despacho a domicilio (Fijo Chile):</span>
                <span className="font-semibold text-stone-900">
                  {formatearPrecio(pedido.costo_envio)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#314235] pt-2 border-t border-stone-200">
                <span>Total pagado:</span>
                <span>{formatearPrecio(pedido.total)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 text-xs space-y-1 text-stone-600">
              <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">
                Dirección de entrega
              </span>
              <p className="text-stone-800 font-semibold">{pedido.nombre_cliente}</p>
              <p>{pedido.direccion}{pedido.depto ? `, Depto ${pedido.depto}` : ""}</p>
              <p>{pedido.comuna}, {pedido.region}</p>
              <p className="text-stone-400">Tel: +56 {pedido.telefono_cliente}</p>
              {pedido.instrucciones && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] break-words break-all">
                  <strong className="block">Indicaciones:</strong>
                  {pedido.instrucciones}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}