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
  foto?: string | null;
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
        .select("id, email, telefono, fecha_nacimiento, foto")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error al cargar usuario:", error);

        const usuarioAuth = {
          id: session.user.id,
          email: session.user.email || "",
          telefono: session.user.user_metadata?.telefono || null,
          fecha_nacimiento:
            session.user.user_metadata?.fecha_nacimiento || null,
          foto: session.user.user_metadata?.foto || null,
        };

        setUsuario(usuarioAuth);
        setTelefono(usuarioAuth.telefono || "");
        setFechaNacimiento(usuarioAuth.fecha_nacimiento || "");
      } else {
        setUsuario(data);
        setTelefono(data.telefono || "");
        setFechaNacimiento(data.fecha_nacimiento || "");
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
      console.error(error);
      setGuardando(false);
      return;
    }

    // También actualizamos los metadatos de Supabase Auth
    await supabase.auth.updateUser({
      data: {
        telefono,
        fecha_nacimiento: fechaNacimiento,
      },
    });

    setUsuario({
      ...usuario,
      telefono,
      fecha_nacimiento: fechaNacimiento,
    });

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

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "No registrada";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL");
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
        <p className="text-stone-600 font-semibold">
          Cargando tu cuenta...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3e9] px-5 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-block mb-6 text-sm font-semibold text-[#314235] hover:underline"
        >
          ← Volver al inicio
        </Link>

        <div className="bg-white rounded-[2rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="bg-[#314235] px-8 py-8 text-white">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#f8f3e9] text-[#314235] flex items-center justify-center text-2xl font-bold uppercase">
                {usuario?.email?.charAt(0)}
              </div>

              <div>
                <p className="text-sm text-white/70">Mi cuenta</p>

                <h1 className="text-2xl font-bold">
                  {usuario?.email}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-400 font-bold">
                Correo electrónico
              </p>

              <p className="mt-1 text-stone-800 font-semibold">
                {usuario?.email}
              </p>
            </div>

            <div className="border-t border-stone-200 pt-6">

              <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-2">
                Teléfono
              </p>

              {editando ? (
                <input
                  type="tel"
                  placeholder="912345678"
                  value={telefono}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, "").slice(0, 9);
                    setTelefono(valor);
                  }}
                  maxLength={9}
                  pattern="9[0-9]{8}"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                />
              ) : (
                <p className="text-stone-800 font-semibold">
                  {usuario?.telefono || "No registrado"}
                </p>
              )}
            </div>

            <div className="border-t border-stone-200 pt-6">
              <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-2">
                Fecha de nacimiento
              </p>

              {editando ? (
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                />
              ) : (
                <p className="text-stone-800 font-semibold">
                  {formatearFecha(usuario?.fecha_nacimiento)}
                </p>
              )}
            </div>

            {mensaje && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold text-green-800">
                    Cambios guardados
                  </p>

                  <p className="text-xs text-green-700">
                    {mensaje}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-stone-200 pt-6 space-y-3"></div>

            <div className="border-t border-stone-200 pt-6 space-y-3">

              {editando ? (
                <>
                  <button
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="w-full bg-[#314235] hover:bg-[#243127] disabled:opacity-60 text-white font-bold py-3 rounded-full transition cursor-pointer"
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>

                  <button
                    onClick={() => {
                      setTelefono(usuario?.telefono || "");
                      setFechaNacimiento(
                        usuario?.fecha_nacimiento || ""
                      );
                      setEditando(false);
                    }}
                    className="w-full border border-stone-300 text-stone-600 font-bold py-3 rounded-full hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="w-full bg-[#8C7762] hover:bg-[#725F4C] text-white font-bold py-3 rounded-full transition cursor-pointer"
                >
                  Editar mis datos
                </button>
              )}

              {!editando && (
                <button
                  onClick={cerrarSesion}
                  className="w-full border border-[#8C7762] text-[#8C7762] hover:bg-[#8C7762] hover:text-white font-bold py-3 rounded-full transition cursor-pointer"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}