'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { X, Send, Package, HelpCircle, Truck, ExternalLink, Sparkles, Plus, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { usarCarrito } from '@/app/datoscarro/estadocarro';
import { supabase } from '@/src/lib/supabase';
import Link from 'next/link';
import { Blobatar } from '@blobatar/react';
import { useGaze } from '@blobatar/react/gaze';
import { blobatarUri } from 'blobatar/uri';
import { thinking } from 'blobatar/expression';
import 'blobatar/motion.css';
import 'blobatar/gaze.css';

// Apariencia del avatar (equivale a blobatar.dev/?hue=140&name=SuMate+Bot&expression=thinking&shape=sun)
// traits.shape 0.95–0.98 corresponde a la silueta "sun"
const AVATAR_NOMBRE = 'SuMate Bot';
// Colores del logo de SuMateCL: cuerpo marrón, ojos crema
const AVATAR_OPCIONES = {
    palette: { head: '#7c6b53', eye: '#fdf8ee' },
    traits: { shape: 0.965 },
    expression: thinking,
};
const AVATAR_CHATBOT = blobatarUri(AVATAR_NOMBRE, { ...AVATAR_OPCIONES, size: 128 });

// Avatar animado cuyos ojos siguen al cursor (botón flotante y cabecera)
function AvatarSeguidor({ size = 72, className }: { size?: number; className?: string }) {
    const { ref } = useGaze({ travel: 3, lookAt: 'pointer' });
    return <Blobatar ref={ref} name={AVATAR_NOMBRE} {...AVATAR_OPCIONES} animate="always" size={size} className={className} title="SuMate Bot" />;
}

function AvatarBot({ className = 'w-8 h-8' }: { className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={AVATAR_CHATBOT}
            alt="SuChat"
            className={`${className} rounded-full object-cover shrink-0 bg-white border border-stone-200 p-0.5`}
        />
    );
}

const MENSAJE_BIENVENIDA_BACKOFFICE: UIMessage = {
    id: 'mensaje-bienvenida-backoffice',
    role: 'assistant',
    parts: [
        {
            type: 'text',
            text: 'Hola, soy el **Asistente de Backoffice** de GrowderWeb.\n\nPuedo ayudarte a:\n- 🧭 Guiarte paso a paso en el panel (productos, pedidos, roles, bodega)\n- 🔎 Consultar stock, pedidos y usuarios en tiempo real\n- ⚙️ Ejecutar cambios por ti (precios, stock, estados, roles), siempre pidiendo tu confirmación\n\n¿Qué necesitas resolver?',
        },
    ],
};

type AccionRapida = { texto: string; pregunta: string; icono: 'package' | 'truck' | 'help' | 'plus' | 'users' };

const ACCIONES_CLIENTE: AccionRapida[] = [
    { texto: 'Rastrear pedido', pregunta: '¿Cómo puedo rastrear mi pedido?', icono: 'package' },
    { texto: 'Envíos ($2.650)', pregunta: '¿Cuánto cuesta el despacho?', icono: 'truck' },
    { texto: 'Ver mates', pregunta: '¿Qué mates tienen disponibles y qué precios tienen?', icono: 'help' },
];

const ACCIONES_BACKOFFICE: AccionRapida[] = [
    { texto: 'Agregar producto', pregunta: '¿Cómo agrego un producto nuevo?', icono: 'plus' },
    { texto: 'Stock bajo', pregunta: 'Muéstrame los productos con stock bajo', icono: 'package' },
    { texto: 'Pedidos recientes', pregunta: 'Muéstrame los pedidos más recientes', icono: 'truck' },
    { texto: 'Cambiar rol', pregunta: '¿Cómo cambio el rol de un usuario?', icono: 'users' },
];

const ICONOS_ACCION = {
    package: Package,
    truck: Truck,
    help: HelpCircle,
    plus: Plus,
    users: Users,
};

const MENSAJE_BIENVENIDA: UIMessage = {
    id: 'mensaje-bienvenida-inicial',
    role: 'assistant',
    parts: [
        {
            type: 'text',
            text: '¡Hola! 🧉 Bienvenido a **SuMateCL**. Soy tu asistente virtual.\n\nPuedo ayudarte a:\n- 📦 Rastrear tu compra con tu código **SM-XXXXXX**\n- 🧉 Buscar mates, bombillas y precios en stock\n- 🚚 Resolver dudas de envíos (**$2.650** a todo Chile)\n\n¿En qué te ayudo hoy?',
        },
    ],
};

// Renderiza negritas (**texto**) y enlaces ([texto](url)) dentro de una línea
function renderizarLineaEnriquecida(linea: string, keyPrefix: string) {
    const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    const elementos: React.ReactNode[] = [];
    let ultimoIndice = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(linea)) !== null) {
        if (match.index > ultimoIndice) {
            elementos.push(linea.substring(ultimoIndice, match.index));
        }

        if (match[2] && match[3]) {
            elementos.push(
                <Link
                    key={`${keyPrefix}-link-${match.index}`}
                    href={match[3]}
                    className="mt-2.5 flex items-center justify-center gap-2 w-full bg-[#7c6b53] hover:bg-[#65573f] text-white font-medium px-3.5 py-2 rounded-xl shadow-xs transition-all text-xs"
                >
                    <span>{match[2]}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            );
        } else if (match[4]) {
            elementos.push(
                <strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold text-stone-900">
                    {match[4]}
                </strong>
            );
        }

        ultimoIndice = regex.lastIndex;
    }

    if (ultimoIndice < linea.length) {
        elementos.push(linea.substring(ultimoIndice));
    }

    return elementos.length > 0 ? elementos : linea;
}

// Formatea el mensaje completo separando párrafos y listas con viñetas
function formatearMensajeRico(texto: string, esUsuario: boolean): React.ReactNode {
    if (esUsuario) return texto;

    const lineas = texto.split('\n');

    return (
        <div className="space-y-1.5">
            {lineas.map((linea, idx) => {
                const limpia = linea.trim();
                if (!limpia) return <div key={idx} className="h-1" />;

                if (limpia.startsWith('- ') || limpia.startsWith('• ')) {
                    const contenidoLista = limpia.substring(2);
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
                            <span className="text-[#7c6b53] font-bold mt-0.5">•</span>
                            <div className="flex-1 leading-snug">
                                {renderizarLineaEnriquecida(contenidoLista, `line-${idx}`)}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={idx} className="leading-relaxed">
                        {renderizarLineaEnriquecida(limpia, `line-${idx}`)}
                    </div>
                );
            })}
        </div>
    );
}

export default function ChatFlotante() {
    const [abierto, setAbierto] = useState(false);
    const [input, setInput] = useState('');
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [conversacionId, setConversacionId] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { carritoAbierto } = usarCarrito();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;
    const [rolId, setRolId] = useState<number | null>(null);

    // Contexto: backoffice solo si está en /admin o /bodega Y su rol es Admin/Editor.
    // (El servidor vuelve a validarlo con la sesión; esto solo adapta la interfaz.)
    const enBackoffice = /^\/(admin|bodega)(\/|$)/.test(pathname || '');
    const modoBackoffice = enBackoffice && (rolId === 1 || rolId === 2);

    // El backoffice no se puede usar en pantallas < 1024px (el panel muestra "Acceso restringido en móvil"):
    // ahí el chat se oculta. Mientras no se mide el ancho se mantiene oculto para evitar un parpadeo.
    const [pantallaAngosta, setPantallaAngosta] = useState<boolean | null>(null);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const actualizar = () => setPantallaAngosta(mq.matches);
        actualizar();
        mq.addEventListener('change', actualizar);
        return () => mq.removeEventListener('change', actualizar);
    }, []);
    const ocultoPorBackofficeMovil = enBackoffice && pantallaAngosta !== false;

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSessionToken(data.session?.access_token || null));
        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) =>
            setSessionToken(session?.access_token || null)
        );

        let convId = sessionStorage.getItem('sumate_chat_conv_id');
        if (!convId) {
            convId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv-${Date.now()}`;
            sessionStorage.setItem('sumate_chat_conv_id', convId);
        }
        setConversacionId(convId);

        return () => authListener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!sessionToken) {
            setRolId(null);
            return;
        }
        let activo = true;
        supabase.auth.getUser(sessionToken).then(async ({ data }) => {
            if (!data.user) return;
            const { data: perfil } = await supabase.from('usuario').select('rol_id').eq('id', data.user.id).maybeSingle();
            if (activo) setRolId(perfil?.rol_id ?? 3);
        });
        return () => {
            activo = false;
        };
    }, [sessionToken]);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                body: () => ({
                    sessionToken: sessionToken ?? '',
                    conversacionId,
                    pathname: pathnameRef.current,
                }),
            }),
        [sessionToken, conversacionId]
    );

    const { messages, sendMessage, status } = useChat({
        id: modoBackoffice ? 'chat-backoffice' : 'chat-cliente',
        transport,
    });

    const mensajesAMostrar = useMemo(() => {
        if (messages.length === 0) return [modoBackoffice ? MENSAJE_BIENVENIDA_BACKOFFICE : MENSAJE_BIENVENIDA];
        return messages;
    }, [messages, modoBackoffice]);

    const isLoading = status === 'submitted' || status === 'streaming';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const texto = input.trim();
        if (!texto || isLoading) return;
        sendMessage({ text: texto });
        setInput('');
    };

    const handleQuickQuestion = (texto: string) => {
        if (isLoading) return;
        sendMessage({ text: texto });
    };

    // En móvil el chat ocupa toda la pantalla: se bloquea el scroll de la página detrás
    // Área realmente visible en móvil (descuenta la barra del navegador y el teclado).
    // `100dvh`/`inset-0` no bastan: en Chrome Android el teclado no reduce el viewport de diseño,
    // y la barra de direcciones deja un hueco abajo donde asoma la página.
    const [areaVisible, setAreaVisible] = useState<{ top: number; height: number } | null>(null);
    useEffect(() => {
        if (!abierto || typeof window === 'undefined' || window.innerWidth >= 640) {
            setAreaVisible(null);
            return;
        }
        const vv = window.visualViewport;
        if (!vv) return;
        const actualizar = () => {
            setAreaVisible({ top: vv.offsetTop, height: vv.height });
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        };
        actualizar();
        vv.addEventListener('resize', actualizar);
        vv.addEventListener('scroll', actualizar);
        return () => {
            vv.removeEventListener('resize', actualizar);
            vv.removeEventListener('scroll', actualizar);
        };
    }, [abierto]);

    useEffect(() => {
        if (!abierto || typeof window === 'undefined' || window.innerWidth >= 640) return;
        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previo;
        };
    }, [abierto]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [mensajesAMostrar, isLoading]);

    return (
        // Con el carrito abierto el chat se oculta (sigue montado: no pierde la conversación)
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex-col items-end ${carritoAbierto || ocultoPorBackofficeMovil ? 'hidden' : 'flex'}`}>
            {!abierto && (
                <button
                    onClick={() => setAbierto(true)}
                    aria-label="Abrir asistente SuMate"
                    title="Asistente SuMate"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full drop-shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                    <AvatarSeguidor size={96} className="w-full h-full" />
                </button>
            )}

            {abierto && (
                <div
                    style={areaVisible ? { top: areaVisible.top, height: areaVisible.height, bottom: 'auto' } : undefined}
                    className="fixed inset-0 w-full sm:static sm:inset-auto sm:h-[560px] sm:w-[380px] bg-white sm:border border-stone-200 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150 sm:zoom-in-95"
                >
                    {/* Header */}
                    <div className="bg-[#7c6b53] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
                        <div className="flex gap-2.5 items-center">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-white shadow-md flex items-center justify-center">
                                <AvatarSeguidor size={40} />
                            </div>
                            <div>
                                <span className="font-semibold text-sm block leading-tight">{modoBackoffice ? 'Asistente Backoffice' : 'SuMate Bot'}</span>
                                <span className="text-[11px] text-[#f1e6d0] font-normal flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {modoBackoffice ? 'Modo equipo interno' : 'En línea • Soporte Oficial'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setAbierto(false)}
                            className="hover:bg-white/10 rounded-lg transition-colors p-1.5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Área de Mensajes */}
                    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#f8f3e9]/40">
                        {mensajesAMostrar.map((m: UIMessage) => {
                            const textoVisible = m.parts
                                ? m.parts
                                    .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
                                    .map((part: any) => part.text)
                                    .join('')
                                    .trim()
                                : typeof (m as any).content === 'string'
                                    ? (m as any).content.trim()
                                    : '';

                            if (!textoVisible && m.role === 'assistant') {
                                return null;
                            }

                            const esUsuario = m.role === 'user';

                            return (
                                <div key={m.id} className={`flex gap-2 ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                                    {!esUsuario && <AvatarBot className="w-7 h-7 mt-0.5" />}
                                    <div
                                        className={`max-w-[88%] px-4 py-3 rounded-2xl text-[13.5px] shadow-xs ${esUsuario
                                                ? 'bg-[#7c6b53] text-white rounded-br-xs font-medium'
                                                : 'bg-white border border-stone-200/90 text-stone-700 rounded-bl-xs'
                                            }`}
                                    >
                                        {formatearMensajeRico(textoVisible, esUsuario)}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-stone-200 text-stone-500 text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-2 shadow-2xs">
                                    <Sparkles className="w-3.5 h-3.5 text-[#7c6b53] animate-spin" />
                                    <span>{modoBackoffice ? 'Procesando...' : 'Consultando en SuMateCL...'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="px-3 py-2 bg-stone-50 border-t border-stone-200/70 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {(modoBackoffice ? ACCIONES_BACKOFFICE : ACCIONES_CLIENTE).map((a) => {
                            const Icono = ICONOS_ACCION[a.icono];
                            return (
                                <button
                                    key={a.texto}
                                    type="button"
                                    onClick={() => handleQuickQuestion(a.pregunta)}
                                    className="text-[11px] bg-white border border-stone-200 hover:border-[#7c6b53] hover:bg-[#f8f3e9] text-stone-700 px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors"
                                >
                                    <Icono className="w-3 h-3 text-[#7c6b53]" />
                                    {a.texto}
                                </button>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={modoBackoffice ? 'Pregunta o pide una acción...' : 'Escribe tu consulta o código SM-...'}
                            className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3.5 py-2 outline-none focus:border-[#7c6b53] focus:ring-1 focus:ring-[#7c6b53] text-base sm:text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-[#7c6b53] disabled:opacity-50 text-white p-2.5 rounded-xl hover:bg-[#65573f] transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}