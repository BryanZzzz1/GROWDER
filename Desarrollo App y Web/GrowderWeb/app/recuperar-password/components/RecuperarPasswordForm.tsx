'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

export function RecuperarPasswordForm() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMensaje('');

    try {
      const redirectUrl = `${window.location.origin}/actualizar-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          setErrorMensaje('Se ha superado el limite de envios por hora. Por favor espera unos minutos antes de volver a intentar.');
        } else if (error.message.includes('550') || error.message.toLowerCase().includes('testing emails')) {
          setErrorMensaje('En modo de prueba de Resend, solo se pueden enviar correos a la direccion registrada en Resend o configurar Gmail SMTP.');
        } else {
          setErrorMensaje(error.message);
        }
        return;
      }

      setMensajeExito(true);
    } catch (err: any) {
      setErrorMensaje(err?.message || 'Ocurrio un error inesperado al procesar la solicitud.');
    } finally {
      setCargando(false);
    }
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
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Ingresa tu correo para recibir las instrucciones de recuperacion
            </p>
          </Link>
        </div>

        {errorMensaje && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs leading-relaxed">
            {errorMensaje}
          </div>
        )}

        {mensajeExito ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs leading-relaxed text-left">
              <p className="font-bold text-sm mb-1 text-emerald-900">Correo enviado</p>
              <p>
                Hemos despachado un enlace para restablecer tu contraseña a <strong>{email}</strong>.
              </p>
              <p className="mt-2 text-emerald-700">
                Por favor revisa tu bandeja de entrada o la carpeta de correo no deseado (spam) y sigue el enlace para definir tu nueva clave.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full bg-[#314235] hover:bg-[#243127] text-white font-bold py-3 rounded-full text-sm transition shadow-md"
              >
                Volver al inicio de sesion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRecuperar} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Correo electronico registrado
              </label>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3.5 rounded-full text-sm transition cursor-pointer shadow-md"
            >
              {cargando ? 'Enviando instrucciones...' : 'Enviar enlace de recuperacion'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col gap-2.5 text-center text-xs">
          <Link
            href="/login"
            className="font-bold text-[#314235] hover:underline"
          >
            ← Volver a iniciar sesion
          </Link>
          <Link
            href="/"
            className="text-stone-400 hover:text-stone-600 transition"
          >
            Ir a la pagina principal
          </Link>
        </div>
      </div>
    </main>
  );
}
