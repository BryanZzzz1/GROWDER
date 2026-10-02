"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

interface ProductoRow {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string | null;
  categoria_id?: number | null;
  foto?: string | null;
}

interface ImagenRow {
  idimagen?: number;
  productoid: number;
  url: string;
}

interface ProductoInventario extends ProductoRow {
  fotoPrincipal?: string;
}

async function obtenerInventario(): Promise<ProductoInventario[]> {
  const { data: dataProductos, error: errorProductos } = await supabase
    .from("producto")
    .select("*")
    .order("idproducto", { ascending: false });

  if (errorProductos) {
    throw errorProductos;
  }

  const { data: dataImagenes, error: errorImagenes } = await supabase
    .from("imagenes")
    .select("*");

  if (errorImagenes) {
    console.warn(
      "No fue posible cargar la tabla de imágenes:",
      errorImagenes
    );
  }

  return ((dataProductos as ProductoRow[]) || []).map((producto) => {
    const imagenesProducto = ((dataImagenes as ImagenRow[]) || []).filter(
      (imagen) => imagen.productoid === producto.idproducto
    );

    return {
      ...producto,
      descripcion: producto.descripcion || "",
      categoria: producto.categoria || "Sin categoría",
      fotoPrincipal:
        imagenesProducto.length > 0
          ? imagenesProducto[0].url
          : producto.foto || undefined,
    };
  });
}

export default function InventarioBodegaPage() {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let componenteActivo = true;

    async function cargarInicial() {
      try {
        const inventario = await obtenerInventario();

        if (componenteActivo) {
          setProductos(inventario);
        }
      } catch (err) {
        console.error("Error al cargar inventario:", err);

        if (componenteActivo) {
          setError("No fue posible cargar el inventario desde Supabase.");
        }
      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    }

    void cargarInicial();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const cargarInventario = async () => {
    setCargando(true);
    setError("");

    try {
      const inventario = await obtenerInventario();
      setProductos(inventario);
    } catch (err) {
      console.error("Error al actualizar inventario:", err);
      setError("No fue posible actualizar el inventario desde Supabase.");
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return productos;
    }

    return productos.filter((producto) => {
      return (
        producto.nombre.toLowerCase().includes(texto) ||
        (producto.categoria || "").toLowerCase().includes(texto) ||
        (producto.descripcion || "").toLowerCase().includes(texto)
      );
    });
  }, [productos, busqueda]);

  const totalUnidades = useMemo(() => {
    return productos.reduce(
      (total, producto) => total + Number(producto.cantidad || 0),
      0
    );
  }, [productos]);

  const productosCriticos = useMemo(() => {
    return productos.filter(
      (producto) => producto.cantidad > 0 && producto.cantidad <= 3
    ).length;
  }, [productos]);

  const productosSinStock = useMemo(() => {
    return productos.filter((producto) => producto.cantidad <= 0).length;
  }, [productos]);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const obtenerEstadoStock = (cantidad: number) => {
    if (cantidad <= 0) {
      return {
        texto: "Sin stock",
        clases: "bg-red-50 text-red-700 border-red-200",
      };
    }

    if (cantidad <= 3) {
      return {
        texto: `Stock crítico · ${cantidad} un.`,
        clases: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      texto: `${cantidad} unidades`,
      clases: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/bodega"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f5145] transition hover:opacity-70"
        >
          <span aria-hidden="true">←</span>
          Volver a Bodega
        </Link>

        <header className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a65d3a]">
            Control de existencias
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#292820] md:text-5xl">
                Inventario
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706b61] md:text-base">
                Consulta el stock actual de los productos registrados en
                bodega.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void cargarInventario()}
              disabled={cargando}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8d1c4] bg-white px-5 py-2.5 text-sm font-semibold text-[#3f5145] transition hover:bg-[#f8f5ee] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
              </svg>

              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </header>

        <section className="mt-9 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ded8cd] bg-white px-5 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8579]">
              Unidades totales
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#292820]">
              {totalUnidades}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ded8cd] bg-white px-5 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8579]">
              Stock crítico
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#a65d3a]">
              {productosCriticos}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ded8cd] bg-white px-5 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8579]">
              Sin stock
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#292820]">
              {productosSinStock}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#ded8cd] bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7e796f]"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por producto, categoría o descripción..."
              className="w-full rounded-2xl border border-[#ddd7ca] bg-[#fbf9f4] py-3.5 pl-12 pr-12 text-sm text-[#292820] outline-none transition placeholder:text-[#aaa397] focus:border-[#3f5145] focus:ring-2 focus:ring-[#3f5145]/10"
            />

            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8d877c] transition hover:text-[#292820]"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <section className="mt-6 rounded-[28px] border border-[#ded8cd] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#3f5145] border-t-transparent" />
            <p className="mt-4 text-sm text-[#706b61]">
              Cargando inventario desde Supabase...
            </p>
          </section>
        ) : productosFiltrados.length === 0 ? (
          <section className="mt-6 rounded-[28px] border border-[#ded8cd] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1ede4] text-[#3f5145]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[#292820]">
              No encontramos productos
            </h2>

            <p className="mt-2 text-sm text-[#777267]">
              {busqueda
                ? `No existen coincidencias para "${busqueda}".`
                : "Actualmente no hay productos registrados."}
            </p>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-[#ded8cd] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#ece7dc] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h2 className="text-lg font-semibold text-[#292820]">
                  Productos en bodega
                </h2>
                <p className="mt-1 text-xs text-[#8c8579]">
                  Información sincronizada con el inventario de Supabase
                </p>
              </div>

              <span className="text-xs font-semibold text-[#6f6a60]">
                {productosFiltrados.length}{" "}
                {productosFiltrados.length === 1 ? "producto" : "productos"}
              </span>
            </div>

            <div className="divide-y divide-[#eee9df]">
              {productosFiltrados.map((producto) => {
                const estadoStock = obtenerEstadoStock(producto.cantidad);

                return (
                  <article
                    key={producto.idproducto}
                    className="p-5 transition hover:bg-[#fcfaf6] sm:px-7 sm:py-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e2ddd2] bg-[#f4f0e7]">
                        {producto.fotoPrincipal ? (
                          <img
                            src={producto.fotoPrincipal}
                            alt={producto.nombre}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <svg
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#8b8579]"
                            aria-hidden="true"
                          >
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.3 7 8.7 5 8.7-5" />
                            <path d="M12 22V12" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-[#292820]">
                            {producto.nombre}
                          </h3>

                          {!producto.activo && (
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                              Inactivo
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#a65d3a]">
                          {producto.categoria || "Sin categoría"}
                        </p>

                        {producto.descripcion && (
                          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-5 text-[#777267]">
                            {producto.descripcion}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${estadoStock.clases}`}
                          >
                            {estadoStock.texto}
                          </span>

                          <span className="text-sm font-semibold text-[#3f5145]">
                            {formatearPrecio(producto.precio)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 border-t border-[#eee9df] pt-4 sm:block sm:min-w-28 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0 sm:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#918b80]">
                          Stock
                        </p>

                        <p className="mt-1 text-3xl font-semibold text-[#292820]">
                          {producto.cantidad}
                        </p>

                        <p className="text-xs text-[#918b80]">unidades</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-[#918b80]">
          Inventario interno de bodega
        </p>
      </div>
    </main>
  );
}