"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Pedido, EstadoPedido } from "@/app/admin/types";

export default function GestionEnvios() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<Pedido | null>(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarPedidosIniciales() {
      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (componenteActivo) {
          setPedidos((data as Pedido[]) || []);
        }
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    void cargarPedidosIniciales();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const actualizarEstado = async (
    idPedido: number | string,
    nuevoEstado: EstadoPedido
  ) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", idPedido);

      if (error) {
        throw error;
      }

      setPedidos((pedidosActuales) =>
        pedidosActuales.map((pedido) =>
          pedido.id === idPedido
            ? { ...pedido, estado: nuevoEstado }
            : pedido
        )
      );

      setPedidoSeleccionado((pedidoActual) => {
        if (!pedidoActual || pedidoActual.id !== idPedido) {
          return pedidoActual;
        }

        return {
          ...pedidoActual,
          estado: nuevoEstado,
        };
      });

      alert(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
  };

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
  };

  if (cargando) {
    return (
      <div className="p-10 text-center">
        Cargando envíos...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Gestión de Envíos (Bodega)
      </h1>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                N° Orden
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Acción
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {pedido.codigo_pedido}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                  {pedido.nombre_cliente}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString("es-CL")}
                </td>

                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5
                      ${
                        pedido.estado === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : ""
                      }
                      ${
                        pedido.estado === "en despacho"
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }
                      ${
                        pedido.estado === "recibido"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    `}
                  >
                    {pedido.estado.toUpperCase()}
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => abrirDetalle(pedido)}
                    className="rounded bg-gray-800 px-4 py-2 text-white shadow transition hover:bg-gray-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Detalle de Orden: {pedidoSeleccionado.codigo_pedido}
              </h2>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="text-xl font-bold text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold text-gray-500">
                  Cliente:
                </p>

                <p>{pedidoSeleccionado.nombre_cliente}</p>
                <p>{pedidoSeleccionado.email_cliente}</p>
                <p>{pedidoSeleccionado.telefono_cliente}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">
                  Dirección de Envío:
                </p>

                <p>
                  {pedidoSeleccionado.direccion}

                  {pedidoSeleccionado.depto
                    ? `, Depto: ${pedidoSeleccionado.depto}`
                    : ""}
                </p>

                <p>
                  {pedidoSeleccionado.comuna},{" "}
                  {pedidoSeleccionado.region}
                </p>
              </div>
            </div>

            <h3 className="mb-2 border-b pb-2 text-lg font-bold">
              Productos a Despachar
            </h3>

            <ul className="mb-6 divide-y divide-gray-200 rounded bg-gray-50 p-4">
              {pedidoSeleccionado.items &&
              pedidoSeleccionado.items.length > 0 ? (
                pedidoSeleccionado.items.map((item, index) => (
                  <li
                    key={`${item.idproducto}-${index}`}
                    className="flex justify-between py-2"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.nombre}
                      </p>

                      <p className="text-xs text-gray-500">
                        ID Producto: {item.idproducto}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        x{item.cantidad}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No hay detalles de productos (pedido antiguo).
                </p>
              )}
            </ul>

            <h3 className="mb-2 border-b pb-2 text-lg font-bold">
              Actualizar Estado (Bodeguero)
            </h3>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={pedidoSeleccionado.estado === "pendiente"}
                onClick={() =>
                  void actualizarEstado(
                    pedidoSeleccionado.id,
                    "pendiente"
                  )
                }
                className="flex-1 rounded bg-yellow-500 py-2 text-white disabled:opacity-50"
              >
                Pendiente
              </button>

              <button
                type="button"
                disabled={pedidoSeleccionado.estado === "en despacho"}
                onClick={() =>
                  void actualizarEstado(
                    pedidoSeleccionado.id,
                    "en despacho"
                  )
                }
                className="flex-1 rounded bg-blue-500 py-2 text-white disabled:opacity-50"
              >
                En Despacho
              </button>

              <button
                type="button"
                disabled={pedidoSeleccionado.estado === "recibido"}
                onClick={() =>
                  void actualizarEstado(
                    pedidoSeleccionado.id,
                    "recibido"
                  )
                }
                className="flex-1 rounded bg-green-500 py-2 text-white disabled:opacity-50"
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