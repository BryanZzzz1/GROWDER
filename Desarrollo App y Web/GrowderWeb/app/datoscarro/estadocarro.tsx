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

  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito((previo) => {
      return previo
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null
          }
          return item
        })
        .filter((item): item is ItemCarrito => item !== null)
    })
  }

  const limpiarCarrito = () => {
    setCarrito([])
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