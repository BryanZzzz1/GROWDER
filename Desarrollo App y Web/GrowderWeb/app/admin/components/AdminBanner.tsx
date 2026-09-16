interface AdminBannerProps {
  totalProductos: number;
  totalUsuarios: number;
}

export function AdminBanner({ totalProductos, totalUsuarios }: AdminBannerProps) {
  return (
    <div className="rounded-[2rem] bg-[#314235] p-7 sm:p-10 text-[#f8f3e9] shadow-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="uppercase tracking-[0.24em] text-xs font-bold text-[#eac29b]">
            Panel de Control
          </p>
          <h1 className="brand-serif mt-2 text-3xl sm:text-5xl text-white">
            Administración General
          </h1>
          <p className="mt-3 max-w-2xl text-[#f8f3e9]/80 text-sm sm:text-base leading-relaxed">
            Controla el inventario en tiempo real, añade nuevos productos
            al catálogo o gestiona los roles y permisos de acceso para tu equipo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xs px-5 py-3.5 min-w-32 text-center border border-white/10">
            <span className="block text-[11px] uppercase tracking-wider text-[#f8f3e9]/70">
              Productos
            </span>
            <strong className="block mt-1 text-2xl font-serif text-white">
              {totalProductos}
            </strong>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-xs px-5 py-3.5 min-w-32 text-center border border-white/10">
            <span className="block text-[11px] uppercase tracking-wider text-[#f8f3e9]/70">
              Usuarios
            </span>
            <strong className="block mt-1 text-2xl font-serif text-white">
              {totalUsuarios}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

