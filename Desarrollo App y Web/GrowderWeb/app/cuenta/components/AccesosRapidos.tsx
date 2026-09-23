import Link from "next/link";

interface AccesosRapidosProps {
  esAdmin?: boolean;
}

export function AccesosRapidos({ esAdmin }: AccesosRapidosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tarjeta 1: Mis Compras */}
      <Link
        href="/mis-compras"
        className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-[#8C7762] transition group flex flex-col justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-[#f2ebe2] flex items-center justify-center text-[#8C7762] font-bold text-lg mb-3 transition">
            #
          </div>
          <h3 className="font-bold text-stone-900 group-hover:text-[#8C7762] transition">
            Mis Compras
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Seguimiento de pedidos en vivo y estados de envío por Starken o Chilexpress.
          </p>
        </div>
        <span className="text-xs font-bold text-[#8C7762] mt-4 inline-block">
          Ver pedidos →
        </span>
      </Link>

      {/* Tarjeta 2: Seguridad y Acceso */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-lg mb-3">
            @
          </div>
          <h3 className="font-bold text-stone-900">Seguridad</h3>
          <p className="text-xs text-stone-500 mt-1">
            Contraseña y credenciales protegidas con cifrado seguro en Supabase GoTrue.
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-700 mt-4 inline-block">
          Protegida
        </span>
      </div>

      {/* Tarjeta 3: Panel Administrador (si corresponde) o Catálogo */}
      {esAdmin ? (
        <Link
          href="/admin"
          className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-emerald-400 font-bold text-lg mb-3">
              ★
            </div>
            <h3 className="font-bold text-white group-hover:text-emerald-400 transition">
              Panel Backoffice
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              Gestión de inventario, despacho de pedidos y control de usuarios.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 mt-4 inline-block">
            Ir a /admin →
          </span>
        </Link>
      ) : (
        <Link
          href="/"
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-[#8C7762] transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-[#f2ebe2] flex items-center justify-center text-[#8C7762] font-bold text-lg mb-3 transition">
              +
            </div>
            <h3 className="font-bold text-stone-900 group-hover:text-[#8C7762] transition">
              Catálogo GROWDER
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Explora nuevos productos, ofertas exclusivas y novedades para el cultivo.
            </p>
          </div>
          <span className="text-xs font-bold text-[#8C7762] mt-4 inline-block">
            Ir a la tienda →
          </span>
        </Link>
      )}
    </div>
  );
}
