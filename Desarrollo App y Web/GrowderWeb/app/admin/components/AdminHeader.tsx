import Link from "next/link";

export function AdminHeader() {
  return (
    <header className="w-full border-b border-stone-800/10 bg-[#f8f3e9]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-3 text-left">
          <div className="w-12 h-12 rounded-full border border-stone-300 bg-white flex items-center justify-center font-serif font-bold text-lg text-[#314235] shadow-xs">
            SM
          </div>
          <div className="hidden sm:block">
            <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#2d2a23]">
              SoMate
            </span>
            <span className="block mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
              Mates y accesorios
            </span>
          </div>
        </Link>
        <nav
          aria-label="Navegación principal"
          className="flex items-center gap-2"
        >
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#314235] transition hover:bg-[#e8e0d0]"
          >
            Catálogo
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-[#314235] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243127]"
          >
            Administración
          </Link>
        </nav>
      </div>
    </header>
  );
}

