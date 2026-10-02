"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { Pedido, Usuario } from "@/app/admin/types"; 

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [cliente, setCliente] = useState<Usuario | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function cargarDatosCliente() {
      setCargando(true);
      try {
        const { data: dataCliente, error: errorCliente } = await supabase
          .from("usuario")
          .select("*")
          .eq("id", id)
          .single();

        if (errorCliente) throw errorCliente;
        setCliente(dataCliente);

        const { data: dataPedidos, error: errorPedidos } = await supabase
          .from("pedidos")
          .select("*")
          .or(`usuario_id.eq.${id},email_cliente.ilike.${dataCliente.email}`)
          .order("created_at", { ascending: false });

        if (!errorPedidos && dataPedidos) {
          setPedidos(dataPedidos as Pedido[]);
        }
      } catch (error) {
        console.error("Error al cargar datos del cliente:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosCliente();
  }, [id]);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#8C7762] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-500">Cargando perfil del cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
        <header className="w-full border-b border-[#8C7762]/20 bg-white/95 backdrop-blur-md sticky top-0 z-30">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain transition-transform group-hover:scale-105" />
              <div>
                <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">SuMateCL</span>
                <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">Admin</span>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="brand-serif text-3xl sm:text-4xl font-bold text-[#2d2a23] mb-4">Cliente no encontrado</h1>
          <p className="text-stone-600 mb-8 max-w-md mx-auto leading-relaxed">El ID del usuario no existe o la cuenta ha sido eliminada.</p>
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-full bg-[#314235] px-8 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#243127] shadow-md">
            Volver a Administración
          </Link>
        </main>
      </div>
    );
  }

  const totalGastado = pedidos.reduce((acc, p) => acc + p.total, 0);
  const pedidosEntregados = pedidos.filter(p => p.estado === 'recibido').length;

  return (
    <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
      {/* Header con el diseño de la web */}
      <header className="w-full border-b border-[#8C7762]/20 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3 group">
            <img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain transition-transform group-hover:scale-105" />
            <div>
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">SuMateCL</span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">Perfil del Cliente</span>
            </div>
          </Link>

          <Link href="/admin" className="text-xs font-semibold text-stone-600 hover:text-[#314235] transition flex items-center gap-1.5 bg-[#f8f3e9] px-4 py-2 rounded-full border border-stone-200 hover:bg-[#efe7d8]">
            ← Volver a Gestión
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: PERFIL DEL CLIENTE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-stone-200/60 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center pb-6 border-b border-stone-100">
              <div className="w-20 h-20 bg-[#314235] text-white rounded-full flex items-center justify-center text-3xl font-bold uppercase mb-4 shadow-inner">
                {cliente.email?.charAt(0)}
              </div>
              <h1 className="text-xl font-bold text-stone-900 truncate w-full" title={cliente.email}>
                {cliente.email}
              </h1>
              <span className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${cliente.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {cliente.activo ? "Cuenta Activa" : "Cuenta Suspendida"}
              </span>
            </div>

            <div className="pt-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Teléfono</p>
                <p className="text-sm font-semibold text-stone-800">{cliente.telefono || <span className="text-stone-400 italic">No registrado</span>}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">ID Interno</p>
                <p className="text-[11px] font-mono text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">{cliente.id}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Estadísticas Vitales */}
          <div className="bg-white rounded-[2rem] border border-stone-200/60 p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8C7762]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Resumen de Actividad
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#f8f3e9] p-3.5 rounded-xl border border-[#8C7762]/20">
                <span className="text-xs text-stone-600 font-semibold">Total Gastado</span>
                <span className="font-bold text-[#314235]">{formatearPrecio(totalGastado)}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f8f3e9] p-3.5 rounded-xl border border-[#8C7762]/20">
                <span className="text-xs text-stone-600 font-semibold">Pedidos Totales</span>
                <span className="font-bold text-stone-800">{pedidos.length}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f8f3e9] p-3.5 rounded-xl border border-[#8C7762]/20">
                <span className="text-xs text-stone-600 font-semibold">Entregas Exitosas</span>
                <span className="font-bold text-emerald-700">{pedidosEntregados}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE COMPRAS */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] border border-stone-200/60 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 brand-serif">Historial de Compras</h2>
                <p className="text-sm text-stone-500 mt-1">Todas las órdenes asociadas a este cliente.</p>
              </div>
            </div>

            {pedidos.length === 0 ? (
              <div className="py-16 text-center bg-[#f8f3e9] rounded-3xl border border-stone-200">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center text-stone-400 shadow-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <h3 className="brand-serif text-lg font-bold text-stone-900 mb-1">Sin compras registradas</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">Este usuario aún no ha realizado ningún pedido en la tienda.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {pedidos.map((pedido) => (
                  <div key={pedido.id} className="border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                    
                    {/* Cabecera del Pedido */}
                    <div className="bg-[#f8f3e9] p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-stone-800 text-sm">Orden {pedido.codigo_pedido}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm
                            ${pedido.estado === 'pendiente' ? 'bg-[#314235] text-white' : ''}
                            ${pedido.estado === 'en despacho' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}
                            ${pedido.estado === 'recibido' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : ''}
                          `}>
                            {pedido.estado}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium">{formatearFecha(pedido.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-0.5">Total</p>
                        <p className="text-lg font-bold text-[#314235] brand-serif">{formatearPrecio(pedido.total)}</p>
                      </div>
                    </div>

                    {/* Detalle de Items */}
                    <div className="p-6">
                      <h4 className="text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest border-b border-stone-100 pb-2">Artículos adquiridos</h4>
                      <ul className="space-y-4">
                        {pedido.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-4">
                              {item.foto || item.imagen ? (
                                <img src={item.foto || item.imagen} alt={item.nombre} className="w-12 h-12 object-cover rounded-xl border border-stone-200" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}/>
                              ) : (
                                <div className="w-12 h-12 bg-[#f8f3e9] rounded-xl flex items-center justify-center text-xl border border-stone-200">📦</div>
                              )}
                              <span className="font-bold text-stone-800">{item.nombre}</span>
                            </div>
                            <span className="text-stone-500 font-semibold bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">{item.cantidad} x {formatearPrecio(item.precio)}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Detalles de Envío */}
                      <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <span className="text-[#8C7762] font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Dirección de Envío
                          </span>
                          <p className="text-stone-800 font-semibold">{pedido.direccion} {pedido.depto ? `, ${pedido.depto}` : ''}</p>
                          <p className="text-stone-600">{pedido.comuna}, {pedido.region}</p>
                        </div>
                        {pedido.numero_seguimiento && (
                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                            <span className="text-[#314235] font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                              Despacho
                            </span>
                            <p className="text-stone-800 font-bold">{pedido.empresa_transporte}</p>
                            <p className="text-stone-600 font-mono mt-0.5">Guía: {pedido.numero_seguimiento}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-stone-200/80 bg-white mt-auto py-6 text-center text-xs text-stone-500">
        <p className="font-semibold text-stone-700">SuMateCL • Mates y Accesorios Artesanales</p>
        <p className="text-[11px] text-stone-400 mt-1">Panel de Administración de Clientes</p>
      </footer>
    </div>
  );
}