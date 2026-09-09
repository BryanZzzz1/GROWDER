'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

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
  carritoAbierto: boolean
  setCarritoAbierto: (abierto: boolean) => void
  total: number
}

const ContextoCarrito = createContext<ContextoCarritoTipo | undefined>(undefined)

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)

  const agregarAlCarrito = (producto: Omit<ItemCarrito, 'cantidad'>, cantidad: number = 1) => {
    setCarrito((previo) => {
      const existe = previo.find((item) => item.id === producto.id)
      if (existe) {
        return previo.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
        )
      }
      return [...previo, { ...producto, cantidad }]
    })
    setCarritoAbierto(true)
  }

  const eliminarDelCarrito = (id: string) => {
    setCarrito((previo) => previo.filter((item) => item.id !== id))
  }

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  return (
    <ContextoCarrito.Provider 
      value={{ 
        carrito, 
        agregarAlCarrito, 
        eliminarDelCarrito, 
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