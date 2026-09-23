interface DatosPersonalesProps {
  email?: string;
  telefono: string;
  setTelefono: (val: string) => void;
  fechaNacimiento: string;
  setFechaNacimiento: (val: string) => void;
  editando: boolean;
  setEditando: (val: boolean) => void;
  guardando: boolean;
  onGuardar: () => void;
  onCancelar: () => void;
  mensaje: string;
}

export function DatosPersonalesCard({
  email,
  telefono,
  setTelefono,
  fechaNacimiento,
  setFechaNacimiento,
  editando,
  setEditando,
  guardando,
  onGuardar,
  onCancelar,
  mensaje,
}: DatosPersonalesProps) {
  const formatearFecha = (f?: string | null) => {
    if (!f) return "No registrada";
    return new Date(`${f}T00:00:00`).toLocaleDateString("es-CL");
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">Datos de tu cuenta</h2>
          <p className="text-xs text-stone-500">
            Mantén actualizado tu teléfono para notificaciones de entrega.
          </p>
        </div>

        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-bold text-[#8C7762] hover:text-[#725F4C] border border-[#8C7762]/30 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition cursor-pointer"
          >
            Modificar
          </button>
        )}
      </div>

      <div className="divide-y divide-stone-100 text-sm mt-4">
        {/* Email */}
        <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            Correo de inicio
          </span>
          <span className="text-stone-800 font-medium">{email}</span>
        </div>

        {/* Teléfono */}
        <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            Teléfono de contacto
          </span>
          {editando ? (
            <input
              type="tel"
              placeholder="9XXXXXXXX"
              value={telefono}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, "").slice(0, 9);
                setTelefono(valor);
              }}
              maxLength={9}
              className="w-full md:w-64 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-[#8C7762] transition"
            />
          ) : (
            <span className="text-stone-800 font-medium">{telefono || "Sin registrar"}</span>
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            Fecha de nacimiento
          </span>
          {editando ? (
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full md:w-64 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-[#8C7762] transition"
            />
          ) : (
            <span className="text-stone-800 font-medium">{formatearFecha(fechaNacimiento)}</span>
          )}
        </div>
      </div>

      {mensaje && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          {mensaje}
        </div>
      )}

      {editando && (
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            onClick={onCancelar}
            className="text-xs font-semibold text-stone-600 px-4 py-2 hover:bg-stone-100 rounded-lg transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="text-xs font-bold bg-[#314235] hover:bg-[#243127] text-white px-5 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}
