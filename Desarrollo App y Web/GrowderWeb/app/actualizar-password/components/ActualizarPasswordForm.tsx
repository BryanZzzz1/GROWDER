'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

export function ActualizarPasswordForm() {
  const router = useRouter();
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  useEffect(() => {
    let montado = true;

    async function verificarTokenRecuperacion() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!montado) return;

        if (session?.user) {
          setSesionValida(true);
        } else {
          // Escuchar el evento de recuperacion de contraseña emitido por Supabase
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sesionActual) => {
            if (!montado) return;
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && sesionActual?.user)) {
              setSesionValida(true);
            }
          });

          // Dar un margen breve para que el cliente procese el hash de la URL
          setTimeout(() => {
            if (montado) {
              setVerificandoSesion(false);
            }
          }, 1500);

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Error al comprobar sesion de recuperacion:', err);
      } finally {
        if (montado) {
          setVerificandoSesion(false);
        }
      }
    }

    verificarTokenRecuperacion();

    return () => {
      montado = false;
    };
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    if (nuevaPassword.length < 6) {
      setErrorMensaje('La nueva contraseña debe tener un minimo de 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMensaje('Las contraseñas no coinciden. Por favor verificalas.');
      return;
    }

    setCargando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (error) {
        setErrorMensaje(error.message);
        return;
      }

      setExito(true);
    } catch (err: any) {
      setErrorMensaje(err?.message || 'Ocurrio un problema al actualizar la contraseña.');
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
              Nueva Contraseña
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Establece tu nueva clave de acceso para SuMateCL
            </p>
          </Link>
        </div>

        {errorMensaje && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs leading-relaxed">
            {errorMensaje}
          </div>
        )}

        {exito ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs leading-relaxed text-left">
              <p className="font-bold text-sm mb-1 text-emerald-900">Contraseña actualizada</p>
              <p>
                Tu contraseña ha sido modificada correctamente. Ahora puedes iniciar sesion con tu nueva clave en tu cuenta o continuar a la tienda.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full bg-[#314235] hover:bg-[#243127] text-white font-bold py-3.5 rounded-full text-sm transition shadow-md"
              >
                Iniciar sesion ahora
              </Link>
            </div>
          </div>
        ) : verificandoSesion ? (
          <div className="py-12 text-center text-sm text-stone-500 font-medium">
            Verificando enlace de seguridad...
          </div>
        ) : (
          <form onSubmit={handleActualizar} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Repite tu contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3.5 rounded-full text-sm transition cursor-pointer shadow-md mt-2"
            >
              {cargando ? 'Guardando contraseña...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col gap-2.5 text-center text-xs">
          <Link
            href="/login"
            className="font-bold text-[#314235] hover:underline"
          >
            ← Volver al inicio de sesion
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
