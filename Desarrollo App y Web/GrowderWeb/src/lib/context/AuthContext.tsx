'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

interface UsuarioData {
  id: string;
  email: string;
  rol: 'cliente' | 'editor' | 'admin';
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
    async function obtenerDatos() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Consultar el rol en la tabla usuario
        const { data } = await supabase
          .from('usuario')
          .select('id, email, rol')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setUsuario(data as UsuarioData);
        }
      } else {
        setUsuario(null);
      }
      setCargando(false);
    }

    obtenerDatos();

    // Escuchar si inicia o cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      obtenerDatos();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        isAdmin: usuario?.rol === 'admin',
        isEditor: usuario?.rol === 'editor' || usuario?.rol === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);