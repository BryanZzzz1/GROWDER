'use client';
import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function AdminPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [foto, setFoto] = useState('');
  const [mensaje, setMensaje] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('Guardando...');

    try {
      // 1. Insertamos solo los datos del producto y pedimos que nos devuelva el registro (.select)
      const { data: productoInsertado, error: errorProducto } = await supabase
        .from('producto')
        .insert([
          {
            nombre,
            descripcion,
            precio: parseFloat(precio),
            cantidad: parseInt(cantidad),
            activo: true
          }
        ])
        .select();

      if (errorProducto) throw errorProducto;

      // 2. Extraemos el ID del producto recién creado
      const nuevoProductoId = productoInsertado[0].idproducto;

      // 3. Insertamos la URL en la tabla 'imagenes' usando el ID obtenido
      const { error: errorImagen } = await supabase
        .from('imagenes')
        .insert([
          {
            productoid: nuevoProductoId, // Asegúrate de que coincida con tu nombre de columna en BD
            url: foto || 'https://via.placeholder.com/300'
          }
        ]);

      if (errorImagen) throw errorImagen;

      setMensaje('¡Producto e imagen agregados con éxito al catálogo general!');
      
      // Limpiar formulario
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setCantidad('');
      setFoto('');
    } catch (error: any) {
      console.error('Error detallado de Supabase:', error);
      setMensaje('Error al guardar: ' + (error.message || JSON.stringify(error)));
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Panel Administrativo Growder</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Agregar Nuevo Producto</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea required value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
              <input type="number" required min="0" value={precio} onChange={(e) => setPrecio(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
              <input type="number" required min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">URL de la Foto</label>
            <input type="url" value={foto} onChange={(e) => setFoto(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black" />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            Guardar en Base de Datos
          </button>
        </form>

        {mensaje && (
          <div className="mt-4 p-3 bg-gray-100 text-center rounded text-gray-800 font-medium">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}