'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

function ActualizarPasswordContenido() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    async function verificarSesion() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Supabase Auth crea una sesion temporal cuando el usuario ingresa con el enlace de recuperacion o OTP
        if (!session) {
          // Si no hay sesion, dejamos que el usuario intente o mostramos aviso
        }
      } catch (err) {
        console.error('Error al verificar sesion:', err);
      } finally {
        setVerificandoSesion(false);
      }
    }

    verificarSesion();
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden. Por favor verificalas.');
      return;
    }

    setCargando(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setCompletado(true);
      // Cerrar sesion temporal para obligar a iniciar sesion limpia con la nueva credencial
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(
        err?.message ||
          'No se pudo actualizar la contrasena. El enlace puede haber expirado.'
      );
    } finally {
      setCargando(false);
    }
  };

  if (verificandoSesion) {
    return (
      <main className="min-h-screen bg-[#f8f3e9] flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-stone-200 p-8 text-center">
          <p className="text-sm font-semibold text-stone-600">Verificando autorizacion de recuperacion...</p>
        </div>
      </main>
    );
  }

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
              Nueva contrasena
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Ingresa tu nueva clave de acceso para tu cuenta.
            </p>
          </Link>
        </div>

        {completado ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-bold text-base text-emerald-800">
              Contrasena actualizada exitosamente
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Tu clave ha sido modificada. Ya puedes iniciar sesion con tus nuevas credenciales.
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full bg-[#8C7762] hover:bg-[#725F4C] text-white font-bold py-3 rounded-full transition cursor-pointer text-sm"
            >
              Ir a Iniciar sesion
            </button>
          </div>
        ) : (
          <form onSubmit={handleActualizar} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Nueva contrasena
              </label>
              <input
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Confirmar nueva contrasena
              </label>
              <input
                type="password"
                placeholder="Repite tu nueva contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando || !password || !confirmPassword}
              className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3 rounded-full transition cursor-pointer text-sm mt-2"
            >
              {cargando ? 'Guardando nueva clave...' : 'Actualizar contrasena'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
          >
            ← Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ActualizarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <p className="text-stone-600 font-semibold text-sm">Cargando...</p>
        </div>
      }
    >
      <ActualizarPasswordContenido />
    </Suspense>
  );
}
