"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#f8f3e9] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-stone-200 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <img
              src="/logocircular.png"
              alt="SuMateCL"
              className="w-20 h-20 object-contain mb-3"
            />

            <h1 className="text-3xl font-bold text-[#2d2a23]">
              Iniciar sesión
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              {redirect.includes("confirmacion-pago")
                ? "Inicia sesión para continuar con tu compra"
                : "Ingresa a tu cuenta de SuMateCL"}
            </p>
          </Link>
        </div>

        {redirect.includes("confirmacion-pago") && (
          <div className="mb-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Para completar tu pedido y despacho necesitas iniciar sesión.</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3 rounded-full transition cursor-pointer"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tienes una cuenta?{" "}
          <Link
            href={
              redirect !== "/"
                ? `/registro?redirect=${encodeURIComponent(redirect)}`
                : "/registro"
            }
            className="font-bold text-[#a75632] hover:underline"
          >
            Regístrate
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-[#314235] hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <p className="text-stone-600 font-semibold text-sm">Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}