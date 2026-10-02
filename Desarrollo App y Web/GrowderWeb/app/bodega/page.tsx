import Link from "next/link";

export default function BodegaPage() {
  const opciones = [
    {
      titulo: "Inventario",
      descripcion:
        "Consulta el stock disponible y revisa rápidamente el estado de los productos.",
      href: "/bodega/inventario",
      etiqueta: "Stock",
      icono: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-7 w-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M4 7l8-4 8 4-8 4-8-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M4 7v10l8 4 8-4V7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M12 11v10"
          />
        </svg>
      ),
    },

    {
      titulo: "Actualizar pedidos",
      descripcion:
        "Busca una compra por su código y actualiza el estado del pedido durante su preparación y despacho.",
      href: "/bodega/pedidos",
      etiqueta: "Operación",
      icono: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-7 w-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M9 12l2 2 4-4"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M5 4h14a1 1 0 011 1v16H4V5a1 1 0 011-1z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M8 4V2h8v2"
          />
        </svg>
      ),
    },

    {
      titulo: "Seguimiento",
      descripcion:
        "Consulta el estado actual de un pedido y visualiza el avance de su entrega.",
      href: "/bodega/estados",
      etiqueta: "Pedidos",
      icono: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-7 w-7"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            strokeWidth="1.7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M12 7v5l3 2"
          />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* VOLVER A TIENDA */}

        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5a50] transition hover:text-[#314235]"
          >
            <span>←</span>
            <span>Volver a la tienda</span>
          </Link>
        </div>

        {/* CABECERA */}

        <section className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#314235] text-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M4 7l8-4 8 4-8 4-8-4z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M4 7v10l8 4 8-4V7"
                />
              </svg>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8c7762]">
              SuMateCL
            </p>
          </div>

          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#2d2a23] sm:text-5xl">
            Gestión de Bodega
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            Administra el inventario, actualiza pedidos y consulta
            rápidamente el estado de las compras.
          </p>
        </section>

        {/* TARJETAS */}

        <section className="grid gap-5 md:grid-cols-3">
          {opciones.map((opcion) => (
            <Link
              key={opcion.href}
              href={opcion.href}
              className="group relative flex min-h-[270px] flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#314235]/25 hover:shadow-xl"
            >
              {/* FONDO DECORATIVO */}

              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#314235]/5 transition duration-300 group-hover:scale-125" />

              {/* ARRIBA */}

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1ece2] text-[#314235] transition duration-300 group-hover:bg-[#314235] group-hover:text-white">
                  {opcion.icono}
                </div>

                <span className="rounded-full bg-[#8c7762]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8c7762]">
                  {opcion.etiqueta}
                </span>
              </div>

              {/* TEXTO */}

              <div className="relative z-10 mt-8">
                <h2 className="font-serif text-2xl font-semibold text-[#2d2a23] transition group-hover:text-[#314235]">
                  {opcion.titulo}
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-500">
                  {opcion.descripcion}
                </p>
              </div>

              {/* ABAJO */}

              <div className="relative z-10 mt-auto flex items-center justify-between pt-8">
                <span className="text-sm font-bold text-[#314235]">
                  Ingresar
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#314235] text-lg text-white transition duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* PIE INTERNO */}

        <section className="mt-8 rounded-[24px] border border-[#8c7762]/15 bg-[#eee6d8] px-6 py-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-[#314235]">
                Panel operativo
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Selecciona una sección para continuar con la gestión.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#8c7762]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sistema activo
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}