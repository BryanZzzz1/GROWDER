'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
    async function obtenerDatos() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Consultamos el número de rol y el estado en la tabla usuario
        const { data } = await supabase
          .from('usuario')
          .select('id, email, rol_id, activo')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setUsuario(data as UsuarioData);
        } else {
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setCargando(false);
    }

    obtenerDatos();

    // Escuchar si el usuario inicia o cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      obtenerDatos();
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