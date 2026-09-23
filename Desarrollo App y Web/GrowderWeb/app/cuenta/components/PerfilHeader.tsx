interface PerfilHeaderProps {
    email?: string;
    onCerrarSesion: () => void;
}

export function PerfilHeader({ email, onCerrarSesion }: PerfilHeaderProps) {
    const inicial = email ? email.charAt(0).toUpperCase() : "U";
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#314235] text-white flex items-center justify-center text-2xl font-bold shadow-md">
                    {inicial}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-stone-900">{email}</h1>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                            Verificado
                        </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Cliente GROWDER</p>
                </div>
            </div>
            <button
                onClick={onCerrarSesion}
                className="self-start md:self-center text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition cursor-pointer"
            >
                Cerrar sesión
            </button>
        </div>
    );
}