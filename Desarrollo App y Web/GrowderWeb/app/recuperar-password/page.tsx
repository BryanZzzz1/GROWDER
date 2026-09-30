'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import RecuperarPorEmail from './components/RecuperarPorEmail';

function RecuperarPasswordContenido() {
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
            <h1 className="text-2xl font-bold text-[#2d2a23]">
              Recuperar contrasena
            </h1>
            <p className="mt-2 text-xs text-stone-500 max-w-xs mx-auto">
              Ingresa tu correo electronico registrado y te enviaremos un enlace seguro para restablecer tu contrasena.
            </p>
          </Link>
        </div>

        <RecuperarPorEmail />

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col gap-2.5 text-center text-xs text-stone-600">
          <p>
            ¿Recordaste tu contrasena?{' '}
            <Link href="/login" className="font-bold text-[#a75632] hover:underline">
              Iniciar sesion
            </Link>
          </p>

          <p>
            ¿Aun no tienes una cuenta?{' '}
            <Link href="/registro" className="font-bold text-[#314235] hover:underline">
              Crear cuenta
            </Link>
          </p>

          <div className="mt-2">
            <Link href="/" className="text-stone-400 hover:text-stone-700 transition">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <p className="text-stone-600 font-semibold text-sm">Cargando...</p>
        </div>
      }
    >
      <RecuperarPasswordContenido />
    </Suspense>
  );
}
