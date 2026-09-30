'use client';

import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function RecuperarPorEmail() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const redirectUrl = `${window.location.origin}/recuperar-password/actualizar`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setEnviado(true);
    } catch (err: any) {
      setError(
        err?.message ||
          'No se pudo enviar el correo de recuperacion. Verifica que el correo ingresado sea valido.'
      );
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3">
        <h3 className="font-bold text-base text-emerald-800">
          Revisa tu bandeja de entrada
        </h3>
        <p className="text-xs leading-relaxed text-emerald-700">
          Hemos enviado un enlace de recuperacion a <span className="font-semibold">{email}</span>. Haz clic en el enlace para restablecer tu contrasena.
        </p>
        <p className="text-[11px] text-emerald-600">
          Si no ves el mensaje en unos minutos, revisa tu carpeta de correo no deseado o spam.
        </p>
        <button
          type="button"
          onClick={() => {
            setEnviado(false);
            setEmail('');
          }}
          className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900 cursor-pointer pt-1 block"
        >
          Enviar a otro correo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Correo electronico
        </label>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
        />
        <p className="text-[11px] text-stone-500 mt-1.5">
          Te enviaremos un enlace seguro para crear una nueva contrasena.
        </p>
      </div>

      <button
        type="submit"
        disabled={cargando || !email.trim()}
        className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3 rounded-full transition cursor-pointer text-sm"
      >
        {cargando ? 'Enviando enlace...' : 'Enviar enlace de recuperacion'}
      </button>
    </form>
  );
}
