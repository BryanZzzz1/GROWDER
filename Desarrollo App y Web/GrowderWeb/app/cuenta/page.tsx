"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { PerfilHeader } from "./components/PerfilHeader";
import { AccesosRapidos } from "./components/AccesosRapidos";
import { DatosPersonalesCard } from "./components/DatosPersonales";

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

    // También actualizamos los metadatos de Supabase Auth
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

        <PerfilHeader email={usuario?.email} onCerrarSesion={cerrarSesion} />

        <AccesosRapidos esAdmin={usuario?.rol === "admin"} />

        <DatosPersonalesCard
          email={usuario?.email}
          telefono={telefono}
          setTelefono={setTelefono}
          fechaNacimiento={fechaNacimiento}
          setFechaNacimiento={setFechaNacimiento}
          editando={editando}
          setEditando={setEditando}
          guardando={guardando}
          onGuardar={guardarCambios}
          onCancelar={() => {
            setTelefono(usuario?.telefono || "");
            setFechaNacimiento(usuario?.fecha_nacimiento || "");
            setEditando(false);
          }}
          mensaje={mensaje}
        />
      </div>
    </main>
  );
}