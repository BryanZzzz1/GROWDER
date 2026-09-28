"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

interface Usuario {
  id: string;
  email: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  rol?: string | null;
}

export default function CuentaPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargarUsuario() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("usuario")
        .select("id, email, telefono, fecha_nacimiento, rol")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setUsuario(data);
        setTelefono(data.telefono || "");
        setFechaNacimiento(data.fecha_nacimiento || "");
      } else {
        const fallback = {
          id: session.user.id,
          email: session.user.email || "",
          telefono: session.user.user_metadata?.telefono || null,
          fecha_nacimiento: session.user.user_metadata?.fecha_nacimiento || null,
        };
        setUsuario(fallback);
        setTelefono(fallback.telefono || "");
        setFechaNacimiento(fallback.fecha_nacimiento || "");
      }

      setCargando(false);
    }

    cargarUsuario();
  }, [router]);

  const guardarCambios = async () => {
    if (!usuario) return;

    setGuardando(true);

    const { error } = await supabase
      .from("usuario")
      .update({
        telefono,
        fecha_nacimiento: fechaNacimiento || null,
      })
      .eq("id", usuario.id);

    if (error) {
      alert("No se pudieron guardar los cambios.");
      setGuardando(false);
      return;
    }

    // Actualizamos los metadatos de Supabase Auth
    await supabase.auth.updateUser({
      data: { telefono, fecha_nacimiento: fechaNacimiento },
    });

    setUsuario({ ...usuario, telefono, fecha_nacimiento: fechaNacimiento });
    setEditando(false);
    setGuardando(false);
    setMensaje("Tus datos fueron actualizados correctamente.");

    setTimeout(() => {
      setMensaje("");
    }, 3500);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#8C7762] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-500">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
      {/* Cabecera global de la web para mantener el diseño cohesivo */}
      <header className="w-full border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain transition-transform group-hover:scale-105" />
            <div>
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">SuMateCL</span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">Mi Perfil</span>
            </div>
          </Link>
          <Link href="/" className="text-xs font-semibold text-stone-600 hover:text-[#314235] transition flex items-center gap-1.5">
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-5 py-10">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#314235] transition">
            ← Volver al inicio
          </Link>
        </div>

        {/* 1. Tarjeta de Cabecera del Perfil */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border border-stone-200/60 mb-6">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-full bg-[#314235] text-white flex items-center justify-center text-2xl font-bold uppercase shrink-0">
              {usuario?.email?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 text-left">
                <h1 className="text-lg font-bold text-stone-900 truncate max-w-[200px] sm:max-w-xs">{usuario?.email}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Verificado</span>
              </div>
              <p className="text-sm text-stone-500 font-medium text-left">Cliente GROWDER</p>
            </div>
          </div>
          <button 
            onClick={cerrarSesion}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition cursor-pointer shrink-0"
          >
            Cerrar sesión
          </button>
        </div>

        {/* 2. Grid de Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#f8f3e9] flex items-center justify-center text-stone-600 font-bold mb-4 border border-[#8C7762]/20">#</div>
              <h3 className="font-bold text-stone-900 mb-2">Mis Compras</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">Seguimiento de pedidos en vivo y estados de envío por Starken o Chilexpress.</p>
            </div>
            <Link href="/mis-compras" className="text-xs font-bold text-[#314235] hover:text-[#527953] transition flex items-center gap-1">Ver pedidos →</Link>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#f8f3e9] flex items-center justify-center text-stone-600 font-bold mb-4 border border-[#8C7762]/20">@</div>
              <h3 className="font-bold text-stone-900 mb-2">Seguridad</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">Contraseña y credenciales protegidas con cifrado seguro en Supabase GoTrue.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600">Protegida</span>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-stone-200/60 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#f8f3e9] flex items-center justify-center text-stone-600 font-bold mb-4 border border-[#8C7762]/20">+</div>
              <h3 className="font-bold text-stone-900 mb-2">Catálogo GROWDER</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">Explora nuevos productos, ofertas exclusivas y novedades para el cultivo.</p>
            </div>
            <Link href="/" className="text-xs font-bold text-[#314235] hover:text-[#527953] transition flex items-center gap-1">Ir a la tienda →</Link>
          </div>
        </div>

        {/* 3. Tarjeta de Datos de Cuenta */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-200/60 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-bold text-lg text-stone-900">Datos de tu cuenta</h2>
              <p className="text-xs text-stone-500 mt-1">Mantén actualizado tu teléfono para notificaciones de entrega.</p>
            </div>
            {!editando && (
              <button 
                onClick={() => setEditando(true)}
                className="px-5 py-2 rounded-full border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
              >
                Modificar
              </button>
            )}
          </div>

          {mensaje && (
            <div className="mb-6 bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="text-emerald-600">✓</span> {mensaje}
            </div>
          )}

          {editando ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-center border-b border-stone-100 pb-5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Correo de Inicio</label>
                <div className="sm:col-span-2">
                  <input type="text" value={usuario?.email || ""} disabled className="w-full text-sm font-semibold text-stone-500 bg-stone-50 rounded-xl px-4 py-2 border border-stone-200 outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-center border-b border-stone-100 pb-5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Teléfono de Contacto</label>
                <div className="sm:col-span-2">
                  <input 
                    type="tel" 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="Ej: 912345678"
                    className="w-full text-sm font-bold text-stone-900 bg-white rounded-xl px-4 py-2 border border-stone-300 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-center pb-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha de Nacimiento</label>
                <div className="sm:col-span-2">
                  <input 
                    type="date" 
                    value={fechaNacimiento} 
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full text-sm font-bold text-stone-900 bg-white rounded-xl px-4 py-2 border border-stone-300 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition" 
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  onClick={() => {
                    setTelefono(usuario?.telefono || "");
                    setFechaNacimiento(usuario?.fecha_nacimiento || "");
                    setEditando(false);
                  }}
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-full text-stone-500 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={guardarCambios}
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-full bg-[#314235] text-white font-bold text-xs hover:bg-[#243127] transition shadow-md cursor-pointer disabled:opacity-70"
                >
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-5 border-t border-stone-100 items-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Correo de Inicio</span>
                <span className="sm:col-span-2 text-sm font-semibold text-stone-800 sm:text-right">{usuario?.email}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-5 border-t border-stone-100 items-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Teléfono de Contacto</span>
                <span className="sm:col-span-2 text-sm font-semibold text-stone-800 sm:text-right">{telefono || <span className="text-stone-400 italic">No registrado</span>}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-5 border-t border-stone-100 items-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha de Nacimiento</span>
                <span className="sm:col-span-2 text-sm font-semibold text-stone-800 sm:text-right">
                  {fechaNacimiento ? new Date(fechaNacimiento).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : <span className="text-stone-400 italic">No registrada</span>}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}