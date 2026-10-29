import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const vercelGateway = createOpenAI({
    baseURL: 'https://ai-gateway.vercel.sh/v1',
    apiKey: process.env.AI_GATEWAY_API_KEY,
});

// ============================================================================
// 1. PRESETS MAESTROS (Se usan automáticamente cuando NO hay datos cargados)
// ============================================================================

const PRESET_IDENTIDAD_CLIENTE = `
Eres el Asesor Virtual oficial de **SuMateCL**, la tienda chilena especialista en mates artesanales, bombillas, termos y accesorios materos.
- **Tono y estilo:** Sumamente cordial, cercano, amable, claro y servicial.
- **Misión:** Guiar a los clientes por la tienda web, recomendar productos según el stock real, explicar cómo curar y cuidar sus mates, informar costos de envío y rastrear compras con código SM-XXXXXX.
`;

const PRESET_IDENTIDAD_INTERNO = `
Eres el Asistente Operativo interno de **GrowderWeb** (Administración y Bodega de SuMateCL). Hablas con personal autenticado del equipo (administradores, editores y bodegueros) que está dentro del backoffice.
- **Tono y estilo:** Ejecutivo, técnico, directo, estructurado y preciso. Respuestas cortas con pasos numerados.
- **Misión:** Guiar al equipo paso a paso dentro del panel (agregar productos, editar stock y precios, gestionar roles, pedidos, despachos e incidencias) y resolver problemas operativos. Además puedes ejecutar acciones por ellos con tus herramientas.
`;

const PRESET_CONOCIMIENTO_BACKOFFICE = `
=== 🛠️ GUÍA DEL BACKOFFICE DE GROWDERWEB ===
Roles: **1 = Administrador** (acceso total), **2 = Editor / Bodeguero** (productos, pedidos y bodega), **3 = Cliente** (sin acceso al backoffice). Solo el Administrador puede cambiar roles.
Los paneles /admin y /bodega solo se ven en escritorio (pantalla ≥ 1024px).

**Panel /admin (pestañas):**
- **Inventario en tiempo real:** lista de productos con foto, precio y stock. Botones *Editar* y *Quitar* (pide confirmación). Stock crítico se marca en rojo.
- **Agregar Producto:** completar nombre, descripción, precio (CLP con IVA incluido), cantidad, categoría (si no existe se crea al escribirla) y hasta 3 fotos. Las fotos se comprimen solas a WebP (máx. 1000px). Se guarda con el botón del formulario.
- **Gestión de Roles:** lista de usuarios; se cambia el rol con el selector y se puede suspender/activar una cuenta (al suspender vuelve a rol 3).
- **Gestión de Pedidos:** abrir un pedido muestra su detalle; se cambia el estado, se asigna empresa de transporte y número de guía y hay botón directo a WhatsApp del cliente.
- **Gestión de IA (menú superior):** /admin/chatbot, donde se editan las directrices del bot (cliente / interno) y se suben documentos PDF/TXT de conocimiento.

**Estados de un pedido (en orden):** pendiente → pagado → preparando → en transporte → en despacho → recibido. Excepciones: problema stock, entrega fallida, cancelado, rechazado. Un pedido "pendiente" por más de 5 minutos se auto-cancela y libera el stock.

**Panel /bodega:** *inventario* (stock físico, alerta bajo 3 unidades), *pedidos* (buscar por código SM-XXXXXX y pasar de pagado → preparando → en transporte), *estados* y avisos de calidad (fallas: rotura, óxido, hongos, manchas, virola despegada, deformación, mala terminación, otro) que se registran en incidencias con la acción realizada.

**Problemas frecuentes:** si un producto no aparece en la tienda revisa que esté *activo* y con stock; si las fotos no cargan revisa que el producto tenga imagen; si un pedido quedó "pendiente" tras pagar, confirma el pago y cambia el estado a *pagado*.
`;

const PRESET_CONOCIMIENTO_WEB = `
=== 🌐 CONOCIMIENTO BASE POR DEFECTO DE LA WEB (PRESET SUMATECL) ===
- **Despachos y Envíos:** Costo fijo de **$2.650 CLP** a todo Chile continental. No menciones empresas de transporte específicas: el despacho lo coordina SuMateCL. El plazo estimado de preparación es de 24 a 48 horas hábiles y la entrega toma entre 2 a 5 días hábiles según la región.
- **Precios e Impuestos:** Todos los precios publicados en la web están en Pesos Chilenos (CLP) e **incluyen IVA (19%)**.
- **Medios de Pago:** Aceptamos tarjetas de débito, crédito (vía Webpay Plus) y transferencia bancaria directa.
- **Seguimiento de Compras:** Todo pedido genera un código único con formato **SM-XXXXXX**. El cliente puede ver el detalle completo en la sección [Mis Compras](/mis-compras).
- **Garantía y Devoluciones:** Si un producto llega con fallas de fábrica o daños de transporte, el cliente puede reportarlo dentro de los primeros 10 días desde la recepción para gestionar cambio o reembolso.
- **Consejo Matero (Curado de mates):** Para mates de calabaza natural, se recomienda llenarlo con yerba húmeda (usada) y agua tibia durante 24 horas, raspar suavemente el interior con una cuchara para retirar el hollejo leñoso y repetir el proceso 2 veces antes del primer uso. Los mates de acero inoxidable, vidrio o cerámica no requieren curado.
`;

const ESTADOS_PEDIDO = [
    'pendiente', 'pagado', 'preparando', 'en transporte', 'en despacho', 'recibido',
    'problema stock', 'entrega fallida', 'cancelado', 'rechazado',
] as const;
const NOMBRE_ROL: Record<number, string> = { 1: 'Administrador', 2: 'Editor / Bodeguero', 3: 'Cliente' };
const RE_CONFIRMACION = /^\s*(s[ií]|confirm\w*|ok|dale|adelante|hazlo|procede|de acuerdo)\b/i;

// Textos cortos que vienen por defecto en el placeholder de la UI
const TEXTO_DEFAULT_UI_CLIENTE = 'Eres el Asesor Virtual de SuMateCL. Atiende dudas sobre mates, bombillas, envíos ($2.650 CLP) e IVA 19%.';
const TEXTO_DEFAULT_UI_INTERNO = 'Eres el Asistente Operativo de GrowderWeb. Asistes en incidencias de calidad, empaque y pedidos SM-XXXXXX.';

export async function POST(req: Request) {
    const inicio = Date.now();
    console.log("\n=== 🟢 NUEVA PETICIÓN AL CHATBOT (Vercel AI Gateway) ===");

    try {
        const { messages, sessionToken, conversacionId, pathname } = await req.json();

        // Normalizar mensajes entrantes
        const mensajesNormalizados = messages
            .map((m: any) => {
                const textoPartes = Array.isArray(m.parts)
                    ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
                    : '';
                return {
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: typeof m.content === 'string' && m.content.trim() !== '' ? m.content : textoPartes,
                };
            })
            .filter((m: any) => m.content && m.content.trim() !== '');

        const ultimoMensajeTexto = mensajesNormalizados[mensajesNormalizados.length - 1]?.content || '';
        const ultimoMensajeLower = ultimoMensajeTexto.toLowerCase();

        // Detectores en tiempo real para pre-cargar base de datos
        const matchCodigo = ultimoMensajeTexto.match(/(?:sm-)?(\d{5,8})/i);
        const codigoDetectado = matchCodigo ? `SM-${matchCodigo[1]}` : null;
        const consultaCatalogo = /precio|cuesta|cuanto|cuánto|valor|mate|bombilla|termo|yerba|stock|producto|catalogo|catálogo|disponible|comprar|venden|recomienda|tipos/.test(ultimoMensajeLower);

        // Consultas en paralelo a Supabase
        const [authResult, configResult, docsResult, pedidoDirectoResult, catalogoResult] = await Promise.all([
            sessionToken ? supabase.auth.getUser(sessionToken) : Promise.resolve({ data: { user: null } }),
            supabase.from('chatbot_config').select('*').eq('id', 1).maybeSingle(),
            supabase.from('chatbot_documentos').select('titulo, contenido, audiencia').eq('activo', true),
            codigoDetectado
                ? supabase
                    .from('pedidos')
                    .select('codigo_pedido, estado, comuna, region, empresa_transporte, numero_seguimiento, total, usuario_id, email_cliente')
                    .eq('codigo_pedido', codigoDetectado.toUpperCase())
                    .maybeSingle()
                : Promise.resolve({ data: null }),
            consultaCatalogo
                ? supabase
                    .from('producto')
                    .select('nombre, precio, cantidad, categoria, descripcion')
                    .eq('activo', true)
                    .limit(15)
                : Promise.resolve({ data: null }),
        ]);

        let rolId = 3; // 3 = Cliente
        const user = authResult.data?.user;

        if (user) {
            const { data: perfil } = await supabase
                .from('usuario')
                .select('rol_id')
                .eq('id', user.id)
                .maybeSingle();
            if (perfil) rolId = perfil.rol_id;
        }

        const esEquipoInterno = rolId === 1 || rolId === 2;
        // El modo backoffice exige DOS cosas: estar en /admin o /bodega Y ser Admin/Editor verificado por sesión.
        // Un cliente que falsifique la ruta sigue recibiendo la identidad de cliente.
        const enBackoffice = typeof pathname === 'string' && /^\/(admin|bodega)(\/|$)/.test(pathname);
        const modoBackoffice = esEquipoInterno && enBackoffice;
        const config = configResult.data;

        // Documentos según audiencia: 'cliente' | 'interno' | 'ambos'.
        // Si la columna aún no existe (migración pendiente) se consulta sin ella y todos valen para ambos.
        let docsRaw: any[] = docsResult.data || [];
        if (docsResult.error) {
            const { data: sinAudiencia } = await supabase.from('chatbot_documentos').select('titulo, contenido').eq('activo', true);
            docsRaw = sinAudiencia || [];
        }
        // Un documento interno NUNCA llega al bot de cliente, ni siquiera si quien pregunta es administrador
        const docs = docsRaw.filter((d) => (modoBackoffice ? d.audiencia !== 'cliente' : d.audiencia !== 'interno'));

        // ====================================================================
        // 2. LÓGICA DE CONMUTACIÓN: ¿USAR CEREBRO DE IA O USAR PRESET BASE?
        // ====================================================================

        // A) Evaluamos si hay una identidad personalizada cargada en "Directrices de Comportamiento"
        const instruccionGuardada = modoBackoffice
            ? config?.instrucciones_interno?.trim()
            : config?.instrucciones_cliente?.trim();

        const textoDefaultComparar = modoBackoffice ? TEXTO_DEFAULT_UI_INTERNO : TEXTO_DEFAULT_UI_CLIENTE;

        // Si el admin escribió instrucciones personalizadas (distintas al texto vacío o al placeholder inicial), usamos las del Cerebro de IA. Si no, usamos el Preset.
        const tienePersonalidadCustom = Boolean(
            instruccionGuardada &&
            instruccionGuardada.length > 0 &&
            instruccionGuardada !== textoDefaultComparar
        );

        const bloqueIdentidad = tienePersonalidadCustom
            ? `=== 🧠 DIRECTRICES DE COMPORTAMIENTO (CEREBRO DE IA ACTIVO) ===\n${instruccionGuardada}`
            : `=== 🤖 DIRECTRICES DE COMPORTAMIENTO (PRESET AUTOMÁTICO) ===\n${modoBackoffice ? PRESET_IDENTIDAD_INTERNO : PRESET_IDENTIDAD_CLIENTE}`;

        // B) Evaluamos si hay documentos cargados en "Base de Conocimiento"
        const tieneDocumentosCargados = docs.length > 0;

        // Si hay documentos activos en Cerebro de IA, rigen esos documentos; si hay 0 documentos, rige el Preset de la web.
        const bloqueConocimientoCliente = tieneDocumentosCargados
            ? `\n\n=== 📚 BASE DE CONOCIMIENTO OFICIAL (DOCUMENTOS CARGADOS EN CEREBRO DE IA) ===\nUsa prioritariamente esta información cargada por el administrador para responder:\n` +
            docs.map(d => `### ${d.titulo}\n${d.contenido}`).join('\n\n') +
            `\n\n(Datos complementarios de respaldo: Envío estándar $2.650 CLP, precios incluyen IVA 19%, sección de pedidos en /mis-compras).`
            : `\n\n${PRESET_CONOCIMIENTO_WEB}`;

        // En backoffice la guía operativa va siempre; los documentos cargados se agregan como apoyo
        const bloqueConocimiento = modoBackoffice
            ? `\n\n${PRESET_CONOCIMIENTO_BACKOFFICE}` +
              (tieneDocumentosCargados
                  ? `\n\n=== 📚 DOCUMENTOS INTERNOS CARGADOS ===\n` + docs.map(d => `### ${d.titulo}\n${d.contenido}`).join('\n\n')
                  : '')
            : bloqueConocimientoCliente;

        // ====================================================================
        // 3. INYECCIÓN DE DATOS EN TIEMPO REAL (PEDIDOS Y STOCK DE PRODUCTOS)
        // ====================================================================
        let datosTiempoReal = '';

        // En backoffice los datos se consultan con herramientas, no con el formato de cliente
        if (codigoDetectado && !modoBackoffice) {
            const p = pedidoDirectoResult.data;
            // Solo el dueño del pedido puede ver sus datos (por usuario o por correo de la compra)
            const esDuenio = !!user && !!p && (p.usuario_id === user.id || (!!user.email && p.email_cliente?.toLowerCase() === user.email.toLowerCase()));
            if (!user) {
                datosTiempoReal += `\n\n=== 📦 CONSULTA DE PEDIDO ===
El usuario pidió datos del pedido ${codigoDetectado} pero NO ha iniciado sesión. No reveles ningún dato del pedido ni confirmes si existe. Indícale con cordialidad que para consultar un pedido debe iniciar sesión:
[Iniciar sesión](/login)`;
            } else if (p && esDuenio) {
                datosTiempoReal += `\n\n=== 📦 DATOS REALES DEL PEDIDO CONSULTADO (${p.codigo_pedido}) ===
Responde al usuario con este formato exacto de lista con viñetas:
¡Aquí tienes el estado actualizado de tu compra! 🧉
- 📦 **Pedido:** ${p.codigo_pedido}
- 🔄 **Estado:** ${String(p.estado).toUpperCase()}
- 📍 **Destino:** ${p.comuna}, ${p.region}
- 🚚 **Transporte:** ${p.empresa_transporte || 'En preparación en bodega'}
- 🔢 **Seguimiento:** ${p.numero_seguimiento || 'Pendiente de asignación'}
- 💰 **Total pagado:** $${Number(p.total).toLocaleString('es-CL')} CLP

[Ver detalle completo en Mis Compras](/mis-compras)`;
            } else {
                datosTiempoReal += `\n\n=== 📦 RESULTADO DE BÚSQUEDA DE PEDIDO ===
No se encontró un pedido con el código ${codigoDetectado} asociado a la cuenta de este usuario. No reveles si el código existe o pertenece a otra persona. Indícale con mucha cordialidad que verifique si escribió bien el código o que revise sus compras directamente aquí:
[Ir a Mis Compras](/mis-compras)`;
            }
        }

        if (!modoBackoffice && catalogoResult.data && catalogoResult.data.length > 0) {
            datosTiempoReal += `\n\n=== 🧉 CATÁLOGO EN TIEMPO REAL (STOCK ACTUAL EN BASE DE DATOS) ===\n` +
                catalogoResult.data.map((prod: any) =>
                    `- **${prod.nombre}** (${prod.categoria}): **$${Number(prod.precio).toLocaleString('es-CL')} CLP** | Stock: ${prod.cantidad > 0 ? `${prod.cantidad} disponibles` : 'Agotado'} | ${prod.descripcion?.slice(0, 90) || ''}`
                ).join('\n');
        }

        // ====================================================================
        // 4. REGLAS ESTRICTAS DE DOMINIO (SIEMPRE ACTIVAS)
        // ====================================================================
        const candadoBackoffice = `
=== 🛡️ REGLAS DEL ASISTENTE DE BACKOFFICE ===
Usuario actual: **${NOMBRE_ROL[rolId] ?? 'Desconocido'}** (rol_id ${rolId}).
1. ÁMBITO: Solo operación de GrowderWeb / SuMateCL (inventario, productos, pedidos, despachos, roles, bodega, incidencias, configuración del bot). Ante temas ajenos responde brevemente que solo asistes con la operación del backoffice.
2. VERACIDAD: No inventes datos. Para stock, precios, pedidos o usuarios usa SIEMPRE las herramientas.
3. ACCIONES QUE MODIFICAN DATOS (crear/editar producto, cambiar estado de pedido, cambiar rol): llama a la herramienta; la primera vez devolverá "ACCIÓN PENDIENTE DE CONFIRMACIÓN". Entonces muestra al usuario un resumen exacto de lo que harás y pregunta "¿Confirmas?". Solo cuando el usuario responda con un "sí" / "confirmo" corto, vuelve a llamar la herramienta con exactamente los mismos datos. Nunca asumas la confirmación.
4. LÍMITES: No puedes eliminar productos, pedidos ni usuarios, ni subir fotos. En esos casos guía paso a paso dentro del panel. Los cambios de rol solo los puede hacer un Administrador.
5. Informa el resultado de cada herramienta tal cual, sin adornarlo.`;

        const candadoTematico = modoBackoffice ? candadoBackoffice : `
=== 🛡️ REGLAS DE EXCLUSIVIDAD DE DOMINIO Y CORDIALIDAD ===
1. ÁMBITO EXCLUSIVO: Solo puedes responder consultas vinculadas a **SuMateCL / GrowderWeb**, nuestro catálogo de mates, bombillas, termos, accesorios, cultura/cuidado del mate, precios, stock, rastreo de pedidos (SM-XXXXXX), envíos, pagos y uso de la web/app.
2. BLOQUEO CORDIAL DE OTROS TEMAS: Si el usuario pregunta sobre cualquier tema ajeno a la tienda (matemáticas, historia, programación, política, recetas de comida, deportes, chistes, etc.), **nunca respondas a esa consulta**. En su lugar, contesta siempre con mucha amabilidad:
   "¡Hola! 🧉 Te agradezco la consulta, pero como asistente exclusivo de **SuMateCL**, solo estoy programado para ayudarte con información de nuestra tienda, productos, envíos o el estado de tus pedidos. ¿Te gustaría ver nuestros mates disponibles o rastrear una compra?"
3. VERACIDAD: Nunca inventes precios, productos ni estados de pedidos que no estén en la base de datos.`;

        const systemPromptFinal = `${bloqueIdentidad}${candadoTematico}${bloqueConocimiento}${datosTiempoReal}`;

        // Herramienta de respaldo por si el código viene en otro turno
        const tools = {
            consultarEstadoPedido: tool({
                description: 'Consulta el estado de un pedido SM-XXXXXX en la base de datos.',
                inputSchema: z.object({
                    codigoPedido: z.string().describe('Código del pedido (ej. SM-649741)'),
                }),
                execute: async ({ codigoPedido }) => {
                    const limpio = String(codigoPedido).replace(/#/g, '').toUpperCase().trim();
                    const codigoFinal = limpio.startsWith('SM-') ? limpio : `SM-${limpio}`;

                    if (!user) return 'El usuario no ha iniciado sesión: pídele que inicie sesión para consultar un pedido. No reveles datos. [Iniciar sesión](/login)';

                    const { data: pedido } = await supabase
                        .from('pedidos')
                        .select('codigo_pedido, estado, comuna, region, empresa_transporte, numero_seguimiento, total, usuario_id, email_cliente')
                        .eq('codigo_pedido', codigoFinal)
                        .maybeSingle();

                    // Mismo mensaje si no existe o si es de otra persona: no se puede enumerar códigos
                    const esDuenio = !!pedido && (pedido.usuario_id === user.id || (!!user.email && pedido.email_cliente?.toLowerCase() === user.email.toLowerCase()));
                    if (!pedido || !esDuenio) return `No se encontró el pedido ${codigoFinal} en tu cuenta. [Ir a Mis Compras](/mis-compras)`;

                    return `Pedido ${pedido.codigo_pedido}: Estado "${pedido.estado}", Destino: ${pedido.comuna}, ${pedido.region}. Transporte: ${pedido.empresa_transporte || 'En preparación'}. Seguimiento: ${pedido.numero_seguimiento || 'Pendiente'}. Total: $${Number(pedido.total).toLocaleString('es-CL')} CLP. [Ver detalle completo en Mis Compras](/mis-compras)`;
                },
            }),
        };

        // ====================================================================
        // 5. HERRAMIENTAS DE BACKOFFICE (solo Admin/Editor verificados, en /admin o /bodega)
        //    Los permisos y la confirmación se validan AQUÍ, no en el prompt.
        // ====================================================================
        // La confirmación es el último mensaje del usuario: corto y afirmativo
        const usuarioConfirmo = ultimoMensajeTexto.trim().length <= 40 && RE_CONFIRMACION.test(ultimoMensajeTexto);
        const pendiente = (resumen: string) =>
            `ACCIÓN PENDIENTE DE CONFIRMACIÓN (NO ejecutada): ${resumen}. Pregunta al usuario "¿Confirmas?" y solo ejecútala cuando responda que sí.`;
        const auditar = (accion: string, detalle: unknown) =>
            console.log(`🛠️ [BACKOFFICE] usuario=${user?.id} rol=${rolId} accion=${accion}`, detalle);

        const toolsBackoffice = {
            buscarProductos: tool({
                description: 'Busca productos por nombre o lista los de stock bajo (menos de 3 unidades). Devuelve id, precio, stock y estado.',
                inputSchema: z.object({
                    texto: z.string().optional().describe('Parte del nombre del producto'),
                    soloStockBajo: z.boolean().optional(),
                }),
                execute: async ({ texto, soloStockBajo }) => {
                    let q = supabase.from('producto').select('idproducto, nombre, precio, cantidad, activo, categoria').limit(15);
                    if (texto?.trim()) q = q.ilike('nombre', `%${texto.trim()}%`);
                    if (soloStockBajo) q = q.lt('cantidad', 3);
                    const { data, error } = await q;
                    if (error) return `Error al consultar productos: ${error.message}`;
                    if (!data?.length) return 'No se encontraron productos.';
                    return data
                        .map((p: any) => `#${p.idproducto} ${p.nombre} | $${Number(p.precio).toLocaleString('es-CL')} | stock ${p.cantidad} | ${p.activo ? 'activo' : 'inactivo'} | ${p.categoria ?? 'sin categoría'}`)
                        .join('\n');
                },
            }),

            consultarPedido: tool({
                description: 'Detalle completo de un pedido SM-XXXXXX para el equipo interno.',
                inputSchema: z.object({ codigoPedido: z.string() }),
                execute: async ({ codigoPedido }) => {
                    const limpio = String(codigoPedido).replace(/#/g, '').toUpperCase().trim();
                    const codigo = limpio.startsWith('SM-') ? limpio : `SM-${limpio}`;
                    const { data: p } = await supabase
                        .from('pedidos')
                        .select('codigo_pedido, estado, nombre_cliente, email_cliente, telefono_cliente, region, comuna, direccion, metodo_pago, total, empresa_transporte, numero_seguimiento, items, created_at')
                        .eq('codigo_pedido', codigo)
                        .maybeSingle();
                    if (!p) return `No existe el pedido ${codigo}.`;
                    const items = Array.isArray(p.items) ? p.items.map((i: any) => `${i.cantidad}× ${i.nombre}`).join(', ') : 'sin detalle';
                    return `Pedido ${p.codigo_pedido} | estado: ${p.estado} | cliente: ${p.nombre_cliente} (${p.email_cliente}, ${p.telefono_cliente}) | destino: ${p.direccion}, ${p.comuna}, ${p.region} | pago: ${p.metodo_pago} | total: $${Number(p.total).toLocaleString('es-CL')} | transporte: ${p.empresa_transporte || '—'} | guía: ${p.numero_seguimiento || '—'} | productos: ${items}`;
                },
            }),

            listarPedidos: tool({
                description: 'Lista los pedidos más recientes, opcionalmente filtrados por estado.',
                inputSchema: z.object({ estado: z.enum(ESTADOS_PEDIDO).optional(), limite: z.number().int().min(1).max(10).optional() }),
                execute: async ({ estado, limite }) => {
                    let q = supabase.from('pedidos').select('codigo_pedido, estado, total, nombre_cliente, created_at').order('created_at', { ascending: false }).limit(limite ?? 8);
                    if (estado) q = q.eq('estado', estado);
                    const { data, error } = await q;
                    if (error) return `Error al consultar pedidos: ${error.message}`;
                    if (!data?.length) return 'No hay pedidos con ese criterio.';
                    return data.map((p: any) => `${p.codigo_pedido} | ${p.estado} | $${Number(p.total).toLocaleString('es-CL')} | ${p.nombre_cliente} | ${String(p.created_at).slice(0, 10)}`).join('\n');
                },
            }),

            actualizarProducto: tool({
                description: 'Modifica precio, stock (cantidad) o estado activo de un producto existente. Requiere confirmación del usuario.',
                inputSchema: z.object({
                    idproducto: z.number().int(),
                    precio: z.number().min(0).optional(),
                    cantidad: z.number().int().min(0).optional(),
                    activo: z.boolean().optional(),
                }),
                execute: async ({ idproducto, precio, cantidad, activo }) => {
                    const cambios: Record<string, unknown> = {};
                    if (precio !== undefined) cambios.precio = precio;
                    if (cantidad !== undefined) cambios.cantidad = cantidad;
                    if (activo !== undefined) cambios.activo = activo;
                    if (Object.keys(cambios).length === 0) return 'No indicaste ningún cambio.';

                    const { data: prod } = await supabase.from('producto').select('nombre').eq('idproducto', idproducto).maybeSingle();
                    if (!prod) return `No existe el producto #${idproducto}.`;
                    if (!usuarioConfirmo) return pendiente(`modificar "${prod.nombre}" (#${idproducto}): ${JSON.stringify(cambios)}`);

                    const { error } = await supabase.from('producto').update(cambios).eq('idproducto', idproducto);
                    if (error) return `No se pudo actualizar: ${error.message}`;
                    auditar('actualizarProducto', { idproducto, cambios });
                    return `Listo: "${prod.nombre}" actualizado (${JSON.stringify(cambios)}).`;
                },
            }),

            crearProducto: tool({
                description: 'Crea un producto nuevo (queda activo, sin fotos). Requiere confirmación del usuario.',
                inputSchema: z.object({
                    nombre: z.string().min(2),
                    descripcion: z.string().min(2),
                    precio: z.number().min(0),
                    cantidad: z.number().int().min(0),
                    categoria: z.string().optional(),
                }),
                execute: async ({ nombre, descripcion, precio, cantidad, categoria }) => {
                    const categoriaFinal = categoria?.trim() || 'Mates Artesanales';
                    if (!usuarioConfirmo) {
                        return pendiente(`crear el producto "${nombre}" — precio $${precio.toLocaleString('es-CL')}, stock ${cantidad}, categoría ${categoriaFinal}`);
                    }
                    const { data, error } = await supabase
                        .from('producto')
                        .insert([{ nombre: nombre.trim(), descripcion: descripcion.trim(), precio, cantidad, activo: true, categoria: categoriaFinal, foto: null }])
                        .select('idproducto')
                        .single();
                    if (error) return `No se pudo crear: ${error.message}`;
                    auditar('crearProducto', { id: data?.idproducto, nombre });
                    return `Producto "${nombre}" creado (#${data?.idproducto}). Aún no tiene fotos: agrégalas en /admin → Inventario → Editar.`;
                },
            }),

            cambiarEstadoPedido: tool({
                description: 'Cambia el estado de un pedido. Cancelado/rechazado libera el stock. Requiere confirmación del usuario.',
                inputSchema: z.object({ codigoPedido: z.string(), estado: z.enum(ESTADOS_PEDIDO) }),
                execute: async ({ codigoPedido, estado }) => {
                    const limpio = String(codigoPedido).replace(/#/g, '').toUpperCase().trim();
                    const codigo = limpio.startsWith('SM-') ? limpio : `SM-${limpio}`;
                    const { data: p } = await supabase.from('pedidos').select('estado').eq('codigo_pedido', codigo).maybeSingle();
                    if (!p) return `No existe el pedido ${codigo}.`;
                    if (!usuarioConfirmo) return pendiente(`cambiar el pedido ${codigo} de "${p.estado}" a "${estado}"`);

                    if (estado === 'cancelado' || estado === 'rechazado') {
                        const { error } = await supabase.rpc('cancelar_pedido', { p_codigo_pedido: codigo, p_motivo: estado });
                        if (error) return `No se pudo cancelar: ${error.message}`;
                    } else {
                        const { error } = await supabase.from('pedidos').update({ estado, updated_at: new Date().toISOString() }).eq('codigo_pedido', codigo);
                        if (error) return `No se pudo actualizar: ${error.message}`;
                    }
                    auditar('cambiarEstadoPedido', { codigo, de: p.estado, a: estado });
                    return `Pedido ${codigo} ahora está en "${estado}".`;
                },
            }),

            cambiarRolUsuario: tool({
                description: 'Cambia el rol de un usuario por su correo (1 Administrador, 2 Editor/Bodeguero, 3 Cliente). Solo Administradores. Requiere confirmación.',
                inputSchema: z.object({ email: z.string().email(), rolId: z.number().int().min(1).max(3) }),
                execute: async ({ email, rolId: nuevoRol }) => {
                    if (rolId !== 1) return 'Permiso denegado: solo un Administrador puede cambiar roles.';
                    const { data: u } = await supabase.from('usuario').select('id, email, rol_id').ilike('email', email.trim()).maybeSingle();
                    if (!u) return `No existe un usuario con el correo ${email}.`;
                    if (u.id === user?.id) return 'No puedes cambiar tu propio rol.';
                    if (!usuarioConfirmo) return pendiente(`cambiar el rol de ${u.email} de ${NOMBRE_ROL[u.rol_id] ?? u.rol_id} a ${NOMBRE_ROL[nuevoRol]}`);

                    const { error } = await supabase.from('usuario').update({ rol_id: nuevoRol }).eq('id', u.id);
                    if (error) return `No se pudo cambiar el rol: ${error.message}`;
                    auditar('cambiarRolUsuario', { objetivo: u.id, de: u.rol_id, a: nuevoRol });
                    return `Rol de ${u.email} actualizado a ${NOMBRE_ROL[nuevoRol]}.`;
                },
            }),
        };

        console.log(
            `👉 [+${Date.now() - inicio}ms] Contexto: ${modoBackoffice ? 'BACKOFFICE' : 'CLIENTE'} | Modo Identidad: ${tienePersonalidadCustom ? 'CEREBRO_IA' : 'PRESET_DEFAULT'} | ` +
            `Modo Conocimiento: ${tieneDocumentosCargados ? `CEREBRO_IA (${docs.length} docs)` : 'PRESET_DEFAULT'}`
        );

        const result = streamText({
            model: vercelGateway('gpt-4o-mini'),
            system: systemPromptFinal,
            temperature: config?.temperatura ? Number(config.temperatura) : 0.5,
            maxOutputTokens: modoBackoffice ? 800 : 550,
            messages: mensajesNormalizados as any,
            tools: modoBackoffice ? toolsBackoffice : !codigoDetectado && !consultaCatalogo ? tools : undefined,
            stopWhen: stepCountIs(modoBackoffice ? 6 : 5),
            onFinish: async ({ text }) => {
                if (conversacionId && text) {
                    try {
                        await supabase.from('chatbot_mensajes').insert([
                            { conversacion_id: conversacionId, rol: 'user', contenido: ultimoMensajeTexto },
                            { conversacion_id: conversacionId, rol: 'assistant', contenido: text },
                        ]);
                    } catch (e) {
                        console.error("⚠️ Excepción al persistir historial:", e);
                    }
                }
            },
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error("\n❌ ERROR GRAVE EN EL BACKEND:", error);
        return new Response(JSON.stringify({ error: "Fallo en el servidor" }), { status: 500 });
    }
}