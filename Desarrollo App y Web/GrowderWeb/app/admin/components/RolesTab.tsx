import { Usuario } from "../types";

interface RolesTabProps {
  usuarios: Usuario[];
  cargandoUsuarios: boolean;
  busquedaUsuario: string;
  setBusquedaUsuario: (val: string) => void;
  onRefresh: () => void;
  guardandoRolId: string | null;
  onCambiarRol: (idUsuario: string, nuevoRolId: number) => void;
  onToggleEstadoUsuario: (idUsuario: string, estadoActual: boolean) => void;
}

export function RolesTab({
  usuarios,
  cargandoUsuarios,
  busquedaUsuario,
  setBusquedaUsuario,
  onRefresh,
  guardandoRolId,
  onCambiarRol,
  onToggleEstadoUsuario,
}: RolesTabProps) {
  return (
    <section className="mt-8 rounded-[1.75rem] border border-stone-800/10 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h2 className="brand-serif text-2xl sm:text-3xl text-[#2d2a23]">
            Gestión de Roles y Permisos
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Asigna permisos dentro de la plataforma o suspende usuarios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-56 sm:min-w-64">
            <input
              type="text"
              placeholder="Buscar por correo o teléfono..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#314235]"
            />
            {busquedaUsuario && (
              <button
                onClick={() => setBusquedaUsuario("")}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={cargandoUsuarios}
            className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-[#314235] hover:bg-[#f8f3e9] transition cursor-pointer disabled:opacity-60"
          >
            {cargandoUsuarios ? "Actualizando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {/* Guía rápida de Roles */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
          <div className="flex items-center gap-2 font-bold text-sm text-[#314235]">
            <span>Administrador (1)</span>
          </div>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Control total de la tienda. Puede gestionar productos, stock, y asignar o revocar roles de otros usuarios.
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
          <div className="flex items-center gap-2 font-bold text-sm text-[#a75632]">
            <span>Editor (2)</span>
          </div>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Acceso al panel para añadir productos, editar precios, descripciones y actualizar el inventario.
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8f3e9] p-4 border border-stone-200/80">
          <div className="flex items-center gap-2 font-bold text-sm text-stone-700">
            <span>Cliente (3)</span>
          </div>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Usuario estándar. Puede explorar el catálogo, agregar al carrito, comprar y dejar valoraciones. No accede aquí.
          </p>
        </div>
      </div>

      {/* Listado de Usuarios */}
      {cargandoUsuarios ? (
        <div className="my-12 py-12 text-center">
          <div className="w-8 h-8 border-4 border-[#314235] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-600 font-medium">
            Cargando usuarios registrados...
          </p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="my-10 rounded-2xl bg-[#f8f3e9] px-5 py-10 text-center">
          <h3 className="brand-serif text-lg text-[#2d2a23]">
            No se encontraron usuarios
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            {busquedaUsuario
              ? `No hay usuarios con el criterio "${busquedaUsuario}".`
              : "No hay usuarios registrados en la base de datos."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Rol actual</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Asignar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {usuarios.map((u) => {
                const rolActual = u.rol_id || 3;
                const esGuardando = guardandoRolId === u.id;

                return (
                  <tr
                    key={u.id}
                    className={`transition ${!u.activo ? "bg-stone-50/70" : "hover:bg-stone-50/60"}`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                            u.activo ? "bg-[#314235]" : "bg-stone-400"
                          }`}
                        >
                          {u.email?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              !u.activo ? "text-stone-500 line-through" : "text-[#2d2a23]"
                            }`}
                          >
                            {u.email}
                          </p>
                          <span className="text-[11px] text-stone-400 font-mono">
                            ID: {u.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-stone-600 text-xs">
                      {u.telefono || "No registrado"}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          !u.activo
                            ? "bg-stone-100 text-stone-500"
                            : rolActual === 1
                              ? "bg-[#314235] text-white"
                              : rolActual === 2
                                ? "bg-[#e8d5c4] text-[#884326]"
                                : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {rolActual === 1 && "👑 Admin"}
                        {rolActual === 2 && "✍️ Editor"}
                        {rolActual === 3 && "👤 Cliente"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onToggleEstadoUsuario(u.id, !!u.activo)}
                        disabled={esGuardando}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition cursor-pointer disabled:opacity-50 ${
                          u.activo
                            ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                            : "bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800"
                        }`}
                      >
                        {u.activo ? "Activa" : "Suspendida"}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {esGuardando && (
                          <div className="w-4 h-4 border-2 border-[#314235] border-t-transparent rounded-full animate-spin" />
                        )}
                        <select
                          value={rolActual}
                          disabled={esGuardando || !u.activo}
                          onChange={(e) => onCambiarRol(u.id, parseInt(e.target.value))}
                          className="rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-1.5 text-xs font-semibold text-[#2d2a23] focus:outline-none focus:ring-2 focus:ring-[#314235] cursor-pointer disabled:opacity-50"
                        >
                          <option value={3}>3 - Cliente</option>
                          <option value={2}>2 - Editor</option>
                          <option value={1}>1 - Administrador</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

