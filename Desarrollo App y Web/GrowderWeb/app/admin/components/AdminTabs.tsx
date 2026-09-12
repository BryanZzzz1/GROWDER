import { TabType } from "../types";

interface AdminTabsProps {
  pestanaActiva: TabType;
  setPestanaActiva: (tab: TabType) => void;
  totalProductos: number;
  totalUsuarios: number;
  editingId: number | null;
  onSelectProductoTab: () => void;
  onSelectRolesTab: () => void;
}

export function AdminTabs({
  pestanaActiva,
  setPestanaActiva,
  totalProductos,
  totalUsuarios,
  editingId,
  onSelectProductoTab,
  onSelectRolesTab,
}: AdminTabsProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
      <button
        type="button"
        onClick={() => setPestanaActiva("inventario")}
        className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
          pestanaActiva === "inventario"
            ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
            : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span>Inventario en tiempo real</span>
        <span
          className={`ml-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
            pestanaActiva === "inventario" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
          }`}
        >
          {totalProductos}
        </span>
      </button>

      <button
        type="button"
        onClick={onSelectProductoTab}
        className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
          pestanaActiva === "producto"
            ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
            : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>{editingId ? "Editar Producto" : "Agregar Producto"}</span>
        {editingId && (
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
            Editando
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onSelectRolesTab}
        className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
          pestanaActiva === "roles"
            ? "bg-[#314235] text-white shadow-md shadow-[#314235]/20 scale-[1.02]"
            : "bg-white text-stone-700 border border-stone-300/80 hover:bg-[#f3ede1]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Gestión de Roles</span>
        {totalUsuarios > 0 && (
          <span
            className={`ml-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
              pestanaActiva === "roles" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            {totalUsuarios}
          </span>
        )}
      </button>
    </div>
  );
}

