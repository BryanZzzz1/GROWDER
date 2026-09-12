import { Producto } from "../types";
import { formatearPrecio } from "../utils/formatters";

interface InventarioTabProps {
  productos: Producto[];
  busquedaInventario: string;
  setBusquedaInventario: (val: string) => void;
  cargando: boolean;
  onRefresh: () => void;
  onAddProducto: () => void;
  onEditProducto: (producto: Producto) => void;
  pendingDeleteId: number | null;
  onDeleteProducto: (id: number) => void;
}

export function InventarioTab({
  productos,
  busquedaInventario,
  setBusquedaInventario,
  cargando,
  onRefresh,
  onAddProducto,
  onEditProducto,
  pendingDeleteId,
  onDeleteProducto,
}: InventarioTabProps) {
  return (
    <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
            Inventario en tiempo real
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Stock sincronizado en vivo con la base de datos de bodega.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 sm:min-w-64">
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={busquedaInventario}
              onChange={(e) => setBusquedaInventario(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#314235]"
            />
            {busquedaInventario && (
              <button
                onClick={() => setBusquedaInventario("")}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={cargando}
            className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] hover:bg-[#f8f3e9] transition cursor-pointer disabled:opacity-60"
          >
            {cargando ? "Actualizando..." : "Refrescar"}
          </button>

          <button
            type="button"
            onClick={onAddProducto}
            className="rounded-xl bg-[#a75632] px-4 py-2 text-xs font-bold text-white hover:bg-[#884326] transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Añadir Producto</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="my-12 py-12 text-center">
          <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-600 font-medium">Cargando inventario...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="my-12 rounded-2xl bg-[#f8f3e9] px-5 py-12 text-center">
          <h3 className="brand-serif text-xl text-[#2d2a23]">
            {busquedaInventario ? "No se encontraron coincidencias" : "Inventario vacío"}
          </h3>
          <p className="mt-1 text-sm text-stone-600 max-w-md mx-auto">
            {busquedaInventario
              ? `No hay productos que coincidan con "${busquedaInventario}".`
              : "No hay productos registrados en la base de datos actualmente."}
          </p>
          <button
            onClick={onAddProducto}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#314235] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#243127] transition"
          >
            Crear primer producto
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {productos.map((product) => {
            const isPendingDelete = pendingDeleteId === product.idproducto;
            const stockBajo = product.cantidad <= 3;

            return (
              <article
                key={product.idproducto}
                className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 transition hover:border-stone-300 hover:shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-[#f8f3e9] border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.foto ? (
                        <img
                          src={product.foto}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80";
                          }}
                        />
                      ) : (
                        <span className="text-xs text-stone-400 font-serif">Sin foto</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="brand-serif text-lg text-[#2d2a23] truncate">
                          {product.nombre}
                        </h3>
                        <span className="rounded-full bg-[#e8e0d0] px-2.5 py-0.5 text-[11px] font-bold text-[#314235]">
                          {product.categoria || "Mates Artesanales"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600 line-clamp-1">
                        {product.descripcion}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <span className="text-[#314235] font-bold text-sm">
                          {formatearPrecio(product.precio)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            stockBajo
                              ? "bg-red-100 text-red-800 font-bold"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {stockBajo
                            ? `Stock crítico: ${product.cantidad} un.`
                            : `Stock: ${product.cantidad} unidades`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 items-center self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onEditProducto(product)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#314235] px-4 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#314235] hover:text-white cursor-pointer"
                    >
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProducto(product.idproducto)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        isPendingDelete
                          ? "bg-[#a75632] text-white border-[#a75632]"
                          : "border-[#a75632] text-[#a75632] hover:bg-[#a75632] hover:text-white"
                      }`}
                    >
                      <span>{isPendingDelete ? "¿Confirmar?" : "Quitar"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

