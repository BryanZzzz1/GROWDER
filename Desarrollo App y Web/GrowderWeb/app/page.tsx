'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';

import Link from 'next/link';

export default function Home() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarProductos() {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .eq('activo', true)
        .order('idproducto', { ascending: false });
      
      if (!error && data) {
        setProductos(data);
      }
      setCargando(false);
    }
    cargarProductos();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Catálogo Growder</h1>
        <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Ir a Administración
        </Link>
      </div>

      {cargando ? (
        <p>Cargando catálogo...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((prod) => (
            <div key={prod.idproducto} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 shadow-lg">
              <img src={prod.foto} alt={prod.nombre} className="w-full h-48 object-cover bg-white" />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-white">{prod.nombre}</h2>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{prod.descripcion}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold text-green-400">${prod.precio}</span>
                  <span className="text-sm text-gray-400">Stock: {prod.cantidad}</span>
                </div>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <p className="col-span-full text-center text-gray-400">No hay productos en el catálogo aún.</p>
          )}
        </div>
      )}
    </main>
  );
}