'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

interface ItemConImagen {
  id?: number | string
  idproducto?: number | string
  foto?: string
  imagen?: string
}

const cache = new Map<string, string>()

const idDeItem = (it: ItemConImagen) => String(it.idproducto ?? it.id ?? '')

// Las rutas de placeholder guardadas en pedidos antiguos no existen: se ignoran
const esUrlValida = (url?: string) =>
  !!url && !url.includes('placeholder-mate') && url.trim() !== ''

/** Devuelve { idProducto: urlFoto } consultando `imagenes` y, de respaldo, `producto.foto`. */
export async function obtenerFotosProductos(ids: (string | number)[]): Promise<Record<string, string>> {
  const unicos = Array.from(new Set(ids.map(String).filter((i) => i && i !== 'undefined')))
  const pendientes = unicos.filter((i) => !cache.has(i))

  if (pendientes.length > 0) {
    const [{ data: imgs }, { data: prods }] = await Promise.all([
      supabase.from('imagenes').select('productoid, url').in('productoid', pendientes),
      supabase.from('producto').select('idproducto, foto').in('idproducto', pendientes),
    ])

    pendientes.forEach((id) => {
      const img = imgs?.find((i: any) => String(i.productoid) === id)
      const prod = prods?.find((p: any) => String(p.idproducto) === id)
      const url = img?.url || prod?.foto
      if (url) cache.set(id, url)
    })
  }

  const resultado: Record<string, string> = {}
  unicos.forEach((id) => {
    const url = cache.get(id)
    if (url) resultado[id] = url
  })
  return resultado
}

/** Hook: devuelve una función que resuelve la foto de un ítem de pedido. */
export function useFotosItems(items?: ItemConImagen[]) {
  const [fotos, setFotos] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!items || items.length === 0) return
    let activo = true
    obtenerFotosProductos(items.map(idDeItem)).then((m) => {
      if (activo) setFotos(m)
    })
    return () => {
      activo = false
    }
  }, [items])

  return (item?: ItemConImagen) => {
    if (!item) return undefined
    if (esUrlValida(item.foto)) return item.foto
    if (esUrlValida(item.imagen)) return item.imagen
    return fotos[idDeItem(item)]
  }
}
