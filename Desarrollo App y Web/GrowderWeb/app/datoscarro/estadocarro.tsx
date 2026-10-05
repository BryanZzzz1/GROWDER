'use client'
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
// AJUSTA ESTA RUTA según dónde tengas exportado tu cliente de Supabase en Next.js
import { supabase } from '@/src/lib/supabase' 

export interface ItemCarrito {
  id: string
  nombre: string
  precio: number
  imagen: string
  cantidad: number
}

interface ContextoCarritoTipo {
  carrito: ItemCarrito[]
  agregarAlCarrito: (producto: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
  eliminarDelCarrito: (id: string) => void
  actualizarCantidad?: (id: string, delta: number) => void
  limpiarCarrito?: () => void
  carritoAbierto: boolean
  setCarritoAbierto: (abierto: boolean) => void
  total: number
}

const ContextoCarrito = createContext<ContextoCarritoTipo | undefined>(undefined)

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // ==========================================
  // 1. SINCRONIZACIÓN INICIAL Y DE SESIÓN
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id || null
      setUserId(uid)
      
      if (uid) {
        await cargarCarritoNube(uid)
        await fusionarCarritoLocalNube(uid)
      } else {
        cargarCarritoLocal()
      }
    }

    initSession()

    // Escuchar cuando el usuario inicia o cierra sesión en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id || null
      setUserId(uid)
      
      if (event === 'SIGNED_IN' && uid) {
        await fusionarCarritoLocalNube(uid)
        await cargarCarritoNube(uid)
      } else if (event === 'SIGNED_OUT') {
        setCarrito([])
        localStorage.removeItem('carrito_invitado')
      }
    })

    return () => { authListener.subscription.unsubscribe() }
  }, [])

  // ==========================================
  // 2. MÉTODOS DE LECTURA Y FUSIÓN (MERGE)
  // ==========================================
  const cargarCarritoLocal = () => {
    const guardado = localStorage.getItem('carrito_invitado')
    if (guardado) setCarrito(JSON.parse(guardado))
  }

  const guardarCarritoLocal = (nuevoCarrito: ItemCarrito[]) => {
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito_invitado', JSON.stringify(nuevoCarrito))
  }

  const cargarCarritoNube = async (uid: string) => {
    const { data, error } = await supabase
      .from('carrito')
      .select('id, idproducto, nombre, precio, cantidad')
      .eq('user_id', uid)

    if (!error && data) {
      const mapeado: ItemCarrito[] = data.map((item: any) => ({
        id: item.idproducto.toString(),
        nombre: item.nombre,
        precio: item.precio,
        imagen: '/assets/placeholder-mate.png', // Placeholder por si no guardas la foto en BD
        cantidad: item.cantidad
      }))
      setCarrito(mapeado)
    }
  }

  const fusionarCarritoLocalNube = async (uid: string) => {
    const guardado = localStorage.getItem('carrito_invitado')
    if (guardado) {
      const carritoLocal: ItemCarrito[] = JSON.parse(guardado)
      if (carritoLocal.length > 0) {
        // Subimos lo de invitado a la nube
        for (const item of carritoLocal) {
          await accionAgregarNube(uid, item, item.cantidad)
        }
        localStorage.removeItem('carrito_invitado')
      }
    }
  }

  const accionAgregarNube = async (uid: string, producto: Omit<ItemCarrito, 'cantidad'>, cantidad: number) => {
    const { data: existing } = await supabase
      .from('carrito')
      .select('id, cantidad')
      .eq('user_id', uid)
      .eq('idproducto', producto.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('carrito').update({ cantidad: existing.cantidad + cantidad }).eq('id', existing.id)
    } else {
      await supabase.from('carrito').insert({
        user_id: uid,
        idproducto: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad
      })
    }
  }

  // ==========================================
  // 3. MÉTODOS PÚBLICOS DEL CONTEXTO
  // ==========================================
  const agregarAlCarrito = async (producto: Omit<ItemCarrito, 'cantidad'>, cantidad: number = 1) => {
    // 1. Actualizamos la Interfaz Gráfica Inmediatamente (Optimista)
    let nuevoCarritoEstado: ItemCarrito[] = []
    setCarrito((previo) => {
      const existe = previo.find((item) => item.id === producto.id)
      if (existe) {
        nuevoCarritoEstado = previo.map((item) => item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item)
      } else {
        nuevoCarritoEstado = [...previo, { ...producto, cantidad }]
      }
      return nuevoCarritoEstado
    })
    setCarritoAbierto(true)

    // 2. Guardamos en el lugar correspondiente
    if (userId) {
      await accionAgregarNube(userId, producto, cantidad)
    } else {
      guardarCarritoLocal(nuevoCarritoEstado)
    }
  }

  const eliminarDelCarrito = async (id: string) => {
    setCarrito((previo) => previo.filter((item) => item.id !== id))

    if (userId) {
      await supabase.from('carrito').delete().eq('user_id', userId).eq('idproducto', id)
    } else {
      const nuevoCarrito = carrito.filter((item) => item.id !== id)
      guardarCarritoLocal(nuevoCarrito)
    }
  }

  const actualizarCantidad = async (id: string, delta: number) => {
    const itemActual = carrito.find(item => item.id === id)
    if (!itemActual) return

    const nuevaCantidad = itemActual.cantidad + delta

    if (nuevaCantidad <= 0) {
      await eliminarDelCarrito(id)
      return
    }

    // Actualización UI Optimista
    setCarrito((prev) => prev.map(item => item.id === id ? { ...item, cantidad: nuevaCantidad } : item))

    if (userId) {
      await supabase.from('carrito').update({ cantidad: nuevaCantidad }).eq('user_id', userId).eq('idproducto', id)
    } else {
      const nuevoCarrito = carrito.map((item) => item.id === id ? { ...item, cantidad: nuevaCantidad } : item)
      guardarCarritoLocal(nuevoCarrito)
    }
  }

  const limpiarCarrito = async () => {
    setCarrito([])
    if (userId) {
      await supabase.from('carrito').delete().eq('user_id', userId)
    } else {
      guardarCarritoLocal([])
    }
  }

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  return (
    <ContextoCarrito.Provider 
      value={{ 
        carrito, 
        agregarAlCarrito, 
        eliminarDelCarrito,
        actualizarCantidad,
        limpiarCarrito,
        carritoAbierto, 
        setCarritoAbierto, 
        total 
      }}
    >
      {children}
    </ContextoCarrito.Provider>
  )
}

export const usarCarrito = () => {
  const contexto = useContext(ContextoCarrito)
  if (!contexto) throw new Error('usarCarrito debe usarse dentro de ProveedorCarrito')
  return contexto
}