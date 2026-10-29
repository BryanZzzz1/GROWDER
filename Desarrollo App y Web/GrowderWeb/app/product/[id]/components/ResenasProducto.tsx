'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

interface Respuesta {
  id?: number;
  respuesta_username?: string;
  respuesta_texto: string;
}

interface Resena {
  id: number;
  username: string;
  texto: string;
  calificacion: number;
  respuestas: Respuesta[];
}

interface Props {
  idproducto: number | string;
  onResumen?: (cantidad: number, promedio: number) => void;
}

function Estrellas({ valor, className = '' }: { valor: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(valor) ? 'text-[#ffc107]' : 'text-stone-300'}>★</span>
      ))}
    </span>
  );
}

export default function ResenasProducto({ idproducto, onResumen }: Props) {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [abierto, setAbierto] = useState(true);
  const [cargando, setCargando] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  const [nuevaResena, setNuevaResena] = useState('');
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState<Record<number, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const mostrarAviso = (msj: string) => {
    setAviso(msj);
    setTimeout(() => setAviso(null), 3500);
  };

  // Usuario actual y nombre visible (primer nombre, o parte local del correo)
  useEffect(() => {
    const aplicar = (user: any) => {
      if (!user) {
        setUserId(null);
        setUsername('');
        return;
      }
      const meta = user.user_metadata || {};
      const nombreCompleto: string = meta.nombre || meta.full_name || meta.name || '';
      setUserId(user.id);
      setUsername(nombreCompleto.trim() ? nombreCompleto.trim().split(' ')[0] : (user.email || 'Usuario').split('@')[0]);
    };
    supabase.auth.getSession().then(({ data }) => aplicar(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => aplicar(session?.user));
    return () => listener.subscription.unsubscribe();
  }, []);

  const cargarResenas = useCallback(async () => {
    const { data: rs } = await supabase
      .from('resena')
      .select('*')
      .eq('idproducto', idproducto)
      .order('id', { ascending: true });

    const lista = rs || [];
    const ids = lista.map((r: any) => r.id);
    const { data: resp } = ids.length
      ? await supabase.from('respuestas').select('*').in('id_resena', ids).order('id', { ascending: true })
      : { data: [] as any[] };

    const completas: Resena[] = lista.map((r: any) => ({
      ...r,
      username: r.username || 'Usuario',
      respuestas: (resp || []).filter((x: any) => x.id_resena === r.id),
    }));
    setResenas(completas);
    setCargando(false);
  }, [idproducto]);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);

  useEffect(() => {
    const cant = resenas.length;
    const prom = cant ? resenas.reduce((a, r) => a + (r.calificacion || 0), 0) / cant : 0;
    onResumen?.(cant, prom);
  }, [resenas, onResumen]);

  const agregarResena = async () => {
    if (!userId) return mostrarAviso('Inicia sesión para dejar una reseña.');
    if (nuevaCalificacion < 1) return mostrarAviso('Elige una calificación de 1 a 5 estrellas.');
    if (!nuevaResena.trim()) return mostrarAviso('Escribe tu opinión antes de enviarla.');

    setEnviando(true);
    const { error } = await supabase.from('resena').insert({
      idproducto,
      username,
      texto: nuevaResena.trim(),
      calificacion: nuevaCalificacion,
      user_id: userId,
    });
    setEnviando(false);

    if (error) {
      console.error('Error al guardar reseña:', error);
      return mostrarAviso('No se pudo agregar la reseña.');
    }
    setNuevaResena('');
    setNuevaCalificacion(0);
    cargarResenas();
  };

  const agregarRespuesta = async (resenaId: number) => {
    if (!userId) return mostrarAviso('Inicia sesión para responder.');
    const texto = (respuestaTexto[resenaId] || '').trim();
    if (!texto) return mostrarAviso('Escribe una respuesta antes de enviarla.');

    const { error } = await supabase.from('respuestas').insert({
      id_resena: resenaId,
      respuesta_username: username,
      respuesta_texto: texto,
      user_id: userId,
    });
    if (error) {
      console.error('Error al guardar respuesta:', error);
      return mostrarAviso('No se pudo guardar la respuesta.');
    }
    setRespuestaTexto((prev) => ({ ...prev, [resenaId]: '' }));
    cargarResenas();
  };

  return (
    <section id="resenas" className="mt-8 sm:mt-10 scroll-mt-32 bg-white border border-[#8C7762]/15 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full flex justify-between items-center cursor-pointer"
      >
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">Reseñas ({resenas.length})</h2>
        <span className="text-[#8C7762] text-xs p-2 -m-2">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
          {aviso && (
            <div className="bg-[#314235] text-white text-xs font-semibold px-4 py-2.5 rounded-xl">{aviso}</div>
          )}

          {/* Formulario */}
          {userId ? (
            <div className="rounded-2xl border border-[#8C7762]/20 bg-[#FAF7F2] p-3.5 sm:p-4">
              <h3 className="text-sm font-bold text-stone-900 mb-1 sm:mb-2">Escribe una reseña</h3>
              <div className="flex gap-1 text-3xl sm:text-2xl leading-none mb-3 sm:mb-2" role="radiogroup" aria-label="Calificación">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNuevaCalificacion(s)}
                    aria-label={`${s} estrellas`}
                    className={`cursor-pointer transition p-1 -m-1 ${s <= nuevaCalificacion ? 'text-[#ffc107]' : 'text-stone-300 hover:text-[#ffc107]/60'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={nuevaResena}
                onChange={(e) => setNuevaResena(e.target.value)}
                rows={3}
                placeholder="¿Qué te pareció el producto?"
                className="w-full min-w-0 text-base sm:text-xs rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 outline-none focus:border-[#527953] resize-none"
              />
              <button
                type="button"
                onClick={agregarResena}
                disabled={enviando}
                className="mt-3 w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-full bg-[#527953] hover:bg-[#436444] text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-60 cursor-pointer"
              >
                {enviando ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500">
              <Link href="/login" className="font-bold text-[#527953] underline">Inicia sesión</Link> para dejar una reseña o responder.
            </p>
          )}

          {/* Listado */}
          {cargando ? (
            <p className="text-xs text-stone-400">Cargando reseñas...</p>
          ) : resenas.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-4">Aún no hay reseñas. ¡Sé el primero!</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {resenas.map((r) => (
                <article key={r.id} className="rounded-2xl border border-stone-200 p-3.5 sm:p-4 overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#8C7762] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {r.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-xs text-stone-900 truncate">{r.username}</strong>
                        <span className="text-[10px] font-semibold text-[#527953]">Compra verificada</span>
                      </div>
                    </div>
                    <Estrellas valor={r.calificacion || 0} className="text-base shrink-0" />
                  </div>

                  <p className="mt-3 text-sm sm:text-xs text-stone-700 leading-relaxed whitespace-pre-line break-words">{r.texto}</p>

                  {r.respuestas.map((resp, i) => (
                    <div key={resp.id ?? i} className="mt-3 ml-2 sm:ml-4 pl-3 border-l-2 border-[#8C7762]/30 bg-[#FAF7F2] rounded-r-xl py-2 pr-3 min-w-0">
                      <strong className="block text-[11px] text-stone-900 truncate">{resp.respuesta_username || 'Growder Team'}</strong>
                      <p className="text-sm sm:text-xs text-stone-600 mt-0.5 whitespace-pre-line break-words">{resp.respuesta_texto}</p>
                    </div>
                  ))}

                  {userId && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input
                        value={respuestaTexto[r.id] || ''}
                        onChange={(e) => setRespuestaTexto((p) => ({ ...p, [r.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && agregarRespuesta(r.id)}
                        placeholder="Escribe una respuesta..."
                        className="w-full sm:flex-1 min-w-0 text-base sm:text-xs rounded-xl border border-stone-300 px-3 py-2.5 sm:py-2 outline-none focus:border-[#527953]"
                      />
                      <button
                        type="button"
                        onClick={() => agregarRespuesta(r.id)}
                        className="shrink-0 w-full sm:w-auto px-4 py-2.5 sm:py-0 rounded-xl border border-[#8C7762]/40 text-[#8C7762] hover:bg-[#8C7762] hover:text-white text-xs font-bold transition cursor-pointer"
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
