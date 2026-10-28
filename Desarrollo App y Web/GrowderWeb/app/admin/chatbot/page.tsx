'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Save, UploadCloud, FileText, CheckCircle2, ArrowLeft, Bot, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';


type Audiencia = 'cliente' | 'interno' | 'ambos';

const ETIQUETAS_AUDIENCIA: Record<Audiencia, string> = {
    cliente: 'Solo clientes',
    interno: 'Solo equipo (privado)',
    ambos: 'Clientes y equipo',
};

export default function AdminChatbotConfigPage() {
    const [instruccionesCliente, setInstruccionesCliente] = useState('');
    const [instruccionesInterno, setInstruccionesInterno] = useState('');
    const [temperatura, setTemperatura] = useState(0.7);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const [documentos, setDocumentos] = useState<any[]>([]);
    const [cargandoArchivo, setCargandoArchivo] = useState(false);
    const [audienciaNueva, setAudienciaNueva] = useState<Audiencia>('cliente');

    useEffect(() => {
        cargarConfiguracion();
        cargarDocumentos();
    }, []);

    const cargarConfiguracion = async () => {
        const { data } = await supabase.from('chatbot_config').select('*').eq('id', 1).single();
        if (data) {
            setInstruccionesCliente(data.instrucciones_cliente);
            setInstruccionesInterno(data.instrucciones_interno);
            setTemperatura(data.temperatura ?? 0.7);
        }
    };

    const cargarDocumentos = async () => {
        const { data } = await supabase.from('chatbot_documentos').select('*').order('created_at', { ascending: false });
        if (data) setDocumentos(data);
    };

    const guardarConfiguracion = async () => {
        setGuardando(true);
        const { error } = await supabase.from('chatbot_config').upsert({
            id: 1,
            instrucciones_cliente: instruccionesCliente,
            instrucciones_interno: instruccionesInterno,
            temperatura,
            updated_at: new Date().toISOString(),
        });
        setGuardando(false);
        setMensaje(error ? 'Error al guardar' : 'Comportamiento actualizado con éxito');
        setTimeout(() => setMensaje(null), 4000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCargandoArchivo(true);
        let contenido = '';

        try {
            if (file.type === 'application/pdf') {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/admin/chatbot/extraer-pdf', { method: 'POST', body: formData });
                const data = await res.json();
                contenido = data.contenido;
            } else {
                contenido = await file.text();
            }

            if (contenido) {
                const { error } = await supabase
                    .from('chatbot_documentos')
                    .insert({ titulo: file.name, contenido, activo: true, audiencia: audienciaNueva });
                if (error) {
                    console.error('Error al guardar documento:', error);
                    window.alert(
                        error.message?.includes('audiencia')
                            ? 'Falta la columna "audiencia". Ejecuta supabase/chatbot_audiencia.sql en el SQL Editor de Supabase.'
                            : 'No se pudo guardar el documento.'
                    );
                }
                cargarDocumentos();
            }
        } catch (error) {
            console.error("Error al procesar el archivo:", error);
        } finally {
            setCargandoArchivo(false);
            e.target.value = ''; // Resetea el input
        }
    };

    const cambiarAudiencia = async (id: string, audiencia: Audiencia) => {
        const { error } = await supabase.from('chatbot_documentos').update({ audiencia }).eq('id', id);
        if (error) {
            window.alert('No se pudo cambiar la audiencia. ¿Ejecutaste supabase/chatbot_audiencia.sql?');
            return;
        }
        setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, audiencia } : d)));
    };

    const eliminarDocumento = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este documento del conocimiento del bot?")) return;
        await supabase.from('chatbot_documentos').delete().eq('id', id);
        cargarDocumentos();
    };

    return (
        <div className="min-h-screen bg-[#f8f3e9] pb-16 font-sans">

            {/* Botón de retroceso */}
            <div className="max-w-6xl mx-auto pt-8 px-6 mb-6">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-[#314235] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Administración General
                </Link>
            </div>

            {/* Banner Principal (Estilo GrowderWeb) */}
            <div className="max-w-6xl mx-auto px-6 mb-8">
                <div className="bg-[#314235] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-[#314235]/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    {/* Decoración de fondo suave */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none blur-3xl"></div>

                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <Bot className="w-8 h-8 text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cerebro de IA</h1>
                            <p className="text-stone-300 mt-1 text-sm md:text-base">
                                Controla la personalidad, reglas y el conocimiento base de tu asistente virtual.
                            </p>
                        </div>
                    </div>

                    {mensaje && (
                        <div className="relative z-10 bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle2 className="w-4 h-4" /> {mensaje}
                        </div>
                    )}
                </div>
            </div>

            {/* Paneles de Configuración */}
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Columna Izquierda: Instrucciones */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200/60 flex flex-col h-full">
                    <div className="mb-6 border-b border-stone-100 pb-4">
                        <h2 className="text-lg font-bold text-stone-800">Directrices de Comportamiento</h2>
                        <p className="text-xs text-stone-500 mt-1">¿Cómo debe actuar el bot según quién le hable?</p>
                    </div>

                    <div className="space-y-5 flex-1">
                        <div>
                            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                                Público (Clientes en Tienda)
                            </label>
                            <textarea
                                rows={5}
                                value={instruccionesCliente}
                                onChange={e => setInstruccionesCliente(e.target.value)}
                                placeholder="Ej: Eres un vendedor amable..."
                                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm text-stone-700 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                                Interno (Bodega / Admin)
                            </label>
                            <textarea
                                rows={5}
                                value={instruccionesInterno}
                                onChange={e => setInstruccionesInterno(e.target.value)}
                                placeholder="Ej: Eres un asistente logístico..."
                                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm text-stone-700 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-4">
                        <button
                            onClick={guardarConfiguracion}
                            disabled={guardando}
                            className="w-full bg-[#314235] hover:bg-[#253328] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        >
                            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {guardando ? 'Guardando en BD...' : 'Guardar Comportamiento'}
                        </button>
                    </div>
                </div>

                {/* Columna Derecha: Base de Conocimiento */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200/60 flex flex-col h-full">
                    <div className="mb-6 border-b border-stone-100 pb-4">
                        <h2 className="text-lg font-bold text-stone-800">Base de Conocimiento</h2>
                        <p className="text-xs text-stone-500 mt-1">Sube manuales o políticas. El bot leerá esto antes de responder.</p>
                    </div>

                    {/* Audiencia del próximo documento */}
                    <div className="mb-4">
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                            ¿Quién puede usar el próximo documento?
                        </label>
                        <select
                            value={audienciaNueva}
                            onChange={(e) => setAudienciaNueva(e.target.value as Audiencia)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-[#314235]"
                        >
                            {(Object.keys(ETIQUETAS_AUDIENCIA) as Audiencia[]).map((a) => (
                                <option key={a} value={a}>{ETIQUETAS_AUDIENCIA[a]}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-stone-400 mt-1.5">
                            Los documentos "Solo equipo" nunca los ve el bot de la tienda, ni siquiera si preguntas siendo administrador.
                        </p>
                    </div>

                    {/* Zona Dropzone para ocultar el input feo */}
                    <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${cargandoArchivo ? 'border-[#314235]/50 bg-[#314235]/5' : 'border-stone-300 hover:border-[#314235] hover:bg-stone-50'}`}>
                        <input
                            type="file"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileUpload}
                            disabled={cargandoArchivo}
                            className="hidden"
                        />
                        {cargandoArchivo ? (
                            <>
                                <Loader2 className="w-8 h-8 text-[#314235] animate-spin mb-3" />
                                <p className="text-sm font-bold text-stone-700">Analizando documento...</p>
                                <p className="text-xs text-stone-500 mt-1">Extrayendo texto para la IA</p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                                    <UploadCloud className="w-6 h-6 text-stone-600" />
                                </div>
                                <p className="text-sm font-bold text-stone-700">Haz clic para subir un archivo</p>
                                <p className="text-xs text-stone-500 mt-1">Soporta PDF o TXT (Máx. 10MB)</p>
                            </>
                        )}
                    </label>

                    <div className="mt-8 flex-1">
                        <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3">
                            Documentos Activos ({documentos.length})
                        </h3>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {documentos.length === 0 ? (
                                <div className="text-center p-6 bg-stone-50 rounded-2xl border border-stone-200 border-dashed">
                                    <p className="text-xs text-stone-500">No hay documentos cargados aún.</p>
                                </div>
                            ) : (
                                documentos.map((doc) => (
                                    <div key={doc.id} className="flex justify-between items-center p-4 bg-white border border-stone-200 rounded-2xl shadow-xs group hover:border-stone-300 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                <FileText className="w-4 h-4 text-emerald-700" />
                                            </div>
                                            <span className="text-sm font-semibold text-stone-700 truncate">
                                                {doc.titulo}
                                            </span>
                                        </div>
                                        <select
                                            value={(doc.audiencia as Audiencia) || 'ambos'}
                                            onChange={(e) => cambiarAudiencia(doc.id, e.target.value as Audiencia)}
                                            title="Audiencia del documento"
                                            className={`mx-2 shrink-0 text-[11px] font-semibold rounded-lg border px-2 py-1 outline-none ${doc.audiencia === 'interno' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
                                        >
                                            {(Object.keys(ETIQUETAS_AUDIENCIA) as Audiencia[]).map((a) => (
                                                <option key={a} value={a}>{ETIQUETAS_AUDIENCIA[a]}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => eliminarDocumento(doc.id)}
                                            className="p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                            title="Eliminar documento"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}