import React, { useState } from "react";
import { Categoria } from "../types";
import { optimizarImagen } from "../utils/imageOptimizer";

interface ProductoFormTabProps {
  editingId: number | null;
  nombre: string;
  setNombre: (val: string) => void;
  categoria: string;
  setCategoria: (val: string) => void;
  categoriaId: number | null;
  setCategoriaId: (val: number | null) => void;
  categorias: Categoria[];
  onCrearCategoria: (nombre: string) => Promise<Categoria | null>;
  precio: string;
  setPrecio: (val: string) => void;
  cantidad: string;
  setCantidad: (val: string) => void;
  descripcion: string;
  setDescripcion: (val: string) => void;
  fotos: string[];
  setFotos: React.Dispatch<React.SetStateAction<string[]>>;
  urlTemporal: string;
  setUrlTemporal: (val: string) => void;
  guardando: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onVolverInventario: () => void;
  setStatus: (text: string, type?: "success" | "error" | "info") => void;
}

export function ProductoFormTab({
  editingId,
  nombre,
  setNombre,
  categoria,
  setCategoria,
  categoriaId,
  setCategoriaId,
  categorias,
  onCrearCategoria,
  precio,
  setPrecio,
  cantidad,
  setCantidad,
  descripcion,
  setDescripcion,
  fotos,
  setFotos,
  urlTemporal,
  setUrlTemporal,
  guardando,
  onSubmit,
  onCancelEdit,
  onVolverInventario,
  setStatus,
}: ProductoFormTabProps) {
  const [modoNuevaCategoria, setModoNuevaCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

  const procesarImagenesMultiples = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (fotos.length + files.length > 3) {
      setStatus(
        "Solo puedes subir un máximo de 3 fotos por producto.",
        "error",
      );
      e.target.value = "";
      return;
    }

    setStatus(`Optimizando imagen(es)...`, "info");
    const nuevasFotos: string[] = [];

    for (const file of files) {
      try {
        const webpBase64 = await optimizarImagen(file);
        nuevasFotos.push(webpBase64);
      } catch (error) {
        console.error("Error al optimizar", error);
      }
    }

    setFotos((prev) => [...prev, ...nuevasFotos]);
    setStatus(
      `Imágenes añadidas. Total: ${fotos.length + nuevasFotos.length}/3`,
      "success",
    );
    e.target.value = "";
  };

  const agregarUrlManual = () => {
    if (urlTemporal.trim() !== "") {
      if (fotos.length >= 3) {
        setStatus("Límite de 3 fotos alcanzado.", "error");
        return;
      }
      setFotos((prev) => [...prev, urlTemporal.trim()]);
      setUrlTemporal("");
    }
  };

  const eliminarFotoDeGaleria = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardarNuevaCategoria = async () => {
    if (!nuevaCategoriaNombre.trim()) return;
    setGuardandoCategoria(true);
    try {
      const nueva = await onCrearCategoria(nuevaCategoriaNombre.trim());
      if (nueva) {
        setCategoria(nueva.nombre);
        setCategoriaId(nueva.id);
        setNuevaCategoriaNombre("");
        setModoNuevaCategoria(false);
      }
    } finally {
      setGuardandoCategoria(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoNuevaCategoria && nuevaCategoriaNombre.trim()) {
      setGuardandoCategoria(true);
      try {
        const nueva = await onCrearCategoria(nuevaCategoriaNombre.trim());
        if (nueva) {
          setCategoria(nueva.nombre);
          setCategoriaId(nueva.id);
          setModoNuevaCategoria(false);
        }
      } finally {
        setGuardandoCategoria(false);
      }
    }
    onSubmit(e);
  };

  return (
    <section className="mt-8 max-w-4xl mx-auto rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-10 shadow-sm">
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="inline-block text-xs uppercase tracking-wider font-bold text-[#a75632] mb-1">
            {editingId ? "Modo de edición" : "Nuevo registro"}
          </span>
          <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
            {editingId ? "Editar producto" : "Añadir un producto"}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {editingId
              ? `Modifica los datos del producto #${editingId} y guarda los cambios para sincronizarlos.`
              : "Registra un nuevo producto en el catálogo general."}
          </p>
        </div>
        <button
          type="button"
          onClick={onVolverInventario}
          className="text-xs font-bold text-stone-500 hover:text-stone-800 transition cursor-pointer"
        >
          Volver al inventario →
        </button>
      </div>

      <form
        id="product-form"
        onSubmit={handleFormSubmit}
        className="mt-8 space-y-6"
      >
        <div>
          <label
            className="mb-2 block text-sm font-bold text-[#2d2a23]"
            htmlFor="product-name"
          >
            Nombre del producto *
          </label>
          <input
            id="product-name"
            type="text"
            required
            placeholder="Ej: Mate Torpedo Uruguayo con Virola de Alpaca"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-sm font-bold text-[#2d2a23]"
                htmlFor="product-category"
              >
                Categoría *
              </label>
              <button
                type="button"
                onClick={() => {
                  setModoNuevaCategoria(!modoNuevaCategoria);
                  if (!modoNuevaCategoria) {
                    setNuevaCategoriaNombre("");
                  }
                }}
                className="text-xs font-bold text-[#a75632] hover:text-[#884326] transition cursor-pointer"
              >
                {modoNuevaCategoria
                  ? "← Seleccionar de la lista"
                  : "+ Escribir nueva categoría"}
              </button>
            </div>

            {!modoNuevaCategoria ? (
              <select
                id="product-category"
                required
                value={categoria}
                onChange={(e) => {
                  if (e.target.value === "__nueva__") {
                    setModoNuevaCategoria(true);
                    setNuevaCategoriaNombre("");
                  } else {
                    setCategoria(e.target.value);
                    const match = categorias.find(
                      (c) => c.nombre === e.target.value,
                    );
                    setCategoriaId(match ? match.id : null);
                  }
                }}
                className={`w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235] cursor-pointer ${
                  !categoria ? "text-stone-400" : "text-[#2d2a23]"
                }`}
              >
                <option value="" className="text-stone-400">
                  Seleccionar categoría existente
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre} className="text-[#2d2a23]">
                    {c.nombre}
                  </option>
                ))}
                {categoria &&
                  !categorias.some((c) => c.nombre === categoria) && (
                    <option value={categoria} className="text-[#2d2a23]">
                      {categoria}
                    </option>
                  )}
                <option value="__nueva__" className="text-[#a75632] font-bold">
                  + Crear nueva categoría...
                </option>
              </select>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Mates Imperiales, Bombillas..."
                    value={nuevaCategoriaNombre}
                    onChange={(e) => {
                      setNuevaCategoriaNombre(e.target.value);
                      setCategoria(e.target.value);
                    }}
                    className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleGuardarNuevaCategoria}
                    disabled={
                      guardandoCategoria || !nuevaCategoriaNombre.trim()
                    }
                    className="bg-[#314235] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#243127] transition shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {guardandoCategoria ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                <p className="text-[11px] text-stone-500">
                  Escribe la categoría y pulsa Guardar, o guarda el producto para registrarla automáticamente.
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-bold text-[#2d2a23]"
              htmlFor="product-price"
            >
              Precio ($ CLP) *
            </label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="1"
              required
              placeholder="Ej: 24990"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235]"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label
              className="mb-2 block text-sm font-bold text-[#2d2a23]"
              htmlFor="product-stock"
            >
              Stock en bodega *
            </label>
            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              required
              placeholder="Ej: 15"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#314235]"
            />
          </div>
        </div>

        {/* ZONA DE CARGA LIMITADA A 3 FOTOS */}
        <div className="p-5 border border-dashed border-stone-300 bg-[#fdfbf7] rounded-xl">
          <label className="mb-3 block text-sm font-bold text-[#2d2a23]">
            Galería de Imágenes (Máximo 3 fotos)
          </label>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={procesarImagenesMultiples}
              className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#314235] file:text-white hover:file:bg-[#243127] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-stone-200 flex-1"></div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              O usa un enlace web
            </span>
            <div className="h-px bg-stone-200 flex-1"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://ejemplo.com/foto.jpg"
              value={urlTemporal}
              onChange={(e) => setUrlTemporal(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
            />
            <button
              type="button"
              onClick={agregarUrlManual}
              className="bg-[#a75632] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#884326] transition cursor-pointer"
            >
              Añadir
            </button>
          </div>

          {/* VISTA PREVIA */}
          {fotos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200">
              <p className="text-xs font-bold text-stone-500 mb-3">
                Fotos cargadas ({fotos.length}/3) -{" "}
                <span className="text-[#a75632]">
                  La primera será la principal.
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                {fotos.map((f, i) => (
                  <div
                    key={i}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${
                      i === 0 ? "border-[#527953]" : "border-stone-300"
                    } bg-white shadow-sm group`}
                  >
                    <img
                      src={f}
                      alt={`Foto producto ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80";
                      }}
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[#527953]/90 text-white text-[9px] font-bold text-center py-0.5">
                        Principal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminarFotoDeGaleria(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-bold text-[#2d2a23]"
            htmlFor="product-description"
          >
            Descripción detallada *
          </label>
          <textarea
            id="product-description"
            required
            rows={4}
            placeholder="Describe los materiales, dimensiones, capacidad y detalles artesanales..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-4 py-3 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#314235]"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-3">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-full bg-[#a75632] px-6 py-3 font-bold text-white transition hover:bg-[#884326] disabled:opacity-60 cursor-pointer shadow-sm"
          >
            <span>
              {guardando
                ? "Guardando..."
                : editingId
                  ? "Guardar cambios"
                  : "Guardar producto"}
            </span>
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-stone-300 px-6 py-3 font-bold text-stone-700 transition hover:bg-stone-100 cursor-pointer"
            >
              Cancelar edición
            </button>
          )}

          <button
            type="button"
            onClick={onVolverInventario}
            className="rounded-full border border-transparent px-6 py-3 font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
          >
            Ir al inventario
          </button>
        </div>
      </form>
    </section>
  );
}
