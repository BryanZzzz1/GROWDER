"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase'; // Asegúrate de que esta ruta sea correcta
// IMPORTANTE: Ajusta la ruta de importación de tu archivo types.ts según tu proyecto
import { Pedido, EstadoPedido } from '@/app/admin/types'; 

export default function GestionEnvios() {
  // 1. Usamos la interfaz Pedido que viene de tu types.ts
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos((data as Pedido[]) || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  // 2. Usamos tu tipo EstadoPedido para validar estrictamente qué estados son permitidos
  const actualizarEstado = async (idPedido: number | string, nuevoEstado: EstadoPedido) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', idPedido);

      if (error) throw error;
      
      setPedidos(pedidos.map(p => p.id === idPedido ? { ...p, estado: nuevoEstado } : p));
      
      if (pedidoSeleccionado && pedidoSeleccionado.id === idPedido) {
        setPedidoSeleccionado({ ...pedidoSeleccionado, estado: nuevoEstado });
      }
      
      alert(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Hubo un error al actualizar el estado.');
    }
  };

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
  };

  if (cargando) return <div className="p-10 text-center">Cargando envíos...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Envíos (Bodega)</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Orden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pedido.codigo_pedido}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{pedido.nombre_cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${pedido.estado === 'en despacho' ? 'bg-blue-100 text-blue-800' : ''}
                    ${pedido.estado === 'recibido' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {pedido.estado.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button 
                    onClick={() => abrirDetalle(pedido)}
                    className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition"
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Detalle de Orden: {pedidoSeleccionado.codigo_pedido}</h2>
              <button onClick={cerrarDetalle} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500 font-semibold">Cliente:</p>
                <p>{pedidoSeleccionado.nombre_cliente}</p>
                <p>{pedidoSeleccionado.email_cliente}</p>
                <p>{pedidoSeleccionado.telefono_cliente}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold">Dirección de Envío:</p>
                <p>{pedidoSeleccionado.direccion} {pedidoSeleccionado.depto && `, Depto: ${pedidoSeleccionado.depto}`}</p>
                <p>{pedidoSeleccionado.comuna}, {pedidoSeleccionado.region}</p>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 border-b pb-2">Productos a Despachar</h3>
            <ul className="divide-y divide-gray-200 mb-6 bg-gray-50 rounded p-4">
              {pedidoSeleccionado.items && pedidoSeleccionado.items.length > 0 ? (
                pedidoSeleccionado.items.map((item, idx) => (
                  <li key={idx} className="py-2 flex justify-between">
                    <div>
                      <p className="font-semibold">{item.nombre}</p>
                      {/* Ya que usamos tu interfaz PedidoItem, TypeScript autocompleta idproducto */}
                      <p className="text-xs text-gray-500">ID Producto: {item.idproducto}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">x{item.cantidad}</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay detalles de productos (pedido antiguo).</p>
              )}
            </ul>

            <h3 className="font-bold text-lg mb-2 border-b pb-2">Actualizar Estado (Bodeguero)</h3>
            <div className="flex gap-3 mt-4">
              <button 
                disabled={pedidoSeleccionado.estado === 'pendiente'}
                onClick={() => actualizarEstado(pedidoSeleccionado.id, 'pendiente')}
                className="flex-1 bg-yellow-500 text-white py-2 rounded disabled:opacity-50"
              >
                Pendiente
              </button>
              <button 
                disabled={pedidoSeleccionado.estado === 'en despacho'}
                onClick={() => actualizarEstado(pedidoSeleccionado.id, 'en despacho')}
                className="flex-1 bg-blue-500 text-white py-2 rounded disabled:opacity-50"
              >
                En Despacho
              </button>
              <button 
                disabled={pedidoSeleccionado.estado === 'recibido'}
                onClick={() => actualizarEstado(pedidoSeleccionado.id, 'recibido')}
                className="flex-1 bg-green-500 text-white py-2 rounded disabled:opacity-50"
              >
                Recibido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}