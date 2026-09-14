'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';

interface UsuarioData {
  id: string;
  email: string;
  rol_id: number;
  activo: boolean;
}

interface AuthContextType {
  usuario: UsuarioData | null;
  cargando: boolean;
  isAdmin: boolean;
  isEditor: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  isAdmin: false,
  isEditor: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerDatos(sesionActual?: Session | null) {
      try {
        const session = sesionActual !== undefined ? sesionActual : (await supabase.auth.getSession()).data.session;
        
        if (session?.user) {
          // Consultamos el número de rol y el estado en la tabla usuario
          const { data, error } = await supabase
            .from('usuario')
            .select('id, email, rol_id, activo')
            .eq('id', session.user.id)
            .single();

          if (data && !error) {
            setUsuario(data as UsuarioData);
          } else {
            // El usuario está autenticado mediante su sesión JWT de Supabase Auth.
            // Si aún no se ha sincronizado la fila en public.usuario, se asigna temporalmente
            // el rol base de cliente (3) en memoria de solo lectura para navegación, sin modificar la base de datos desde el cliente.
            const usuarioFallback: UsuarioData = {
              id: session.user.id,
              email: session.user.email || '',
              rol_id: 3,
              activo: true,
            };
            setUsuario(usuarioFallback);
          }
        } else {
          setUsuario(null);
        }
      } catch (err) {
        console.error('Error al obtener datos de sesión:', err);
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }

    obtenerDatos();

    // Escuchar si el usuario inicia o cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      obtenerDatos(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Validaciones directas usando el sistema numérico
  // 1 = Admin, 2 = Editor, 3 = Cliente
  const esAdmin = usuario?.rol_id === 1 && usuario?.activo === true;
  const esEditor = (usuario?.rol_id === 1 || usuario?.rol_id === 2) && usuario?.activo === true;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        isAdmin: esAdmin,
        isEditor: esEditor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);