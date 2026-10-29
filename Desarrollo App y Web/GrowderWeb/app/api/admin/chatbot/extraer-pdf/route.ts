import { NextResponse } from 'next/server';

// Obligatorio en Next.js App Router para usar Buffer y pdf-parse sin errores
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
        }

        // Validación de tamaño máximo (10MB según indica la interfaz)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'El archivo supera el límite de 10MB' }, { status: 400 });
        }

        const nombreArchivo = file.name.toLowerCase();
        const esPdf = file.type === 'application/pdf' || nombreArchivo.endsWith('.pdf');
        const esTxt = file.type === 'text/plain' || nombreArchivo.endsWith('.txt');

        if (!esPdf && !esTxt) {
            return NextResponse.json(
                { error: 'Formato no válido. Solo se permiten archivos PDF o TXT.' },
                { status: 400 }
            );
        }

        let textoExtraido = '';

        if (esTxt) {
            // Lectura directa si es un archivo .txt
            textoExtraido = await file.text();
        } else {
            // pdf-parse v2: clase PDFParse (ya no existe `lib/pdf-parse.js` ni la función por defecto de la v1)
            const { PDFParse } = await import('pdf-parse');
            const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
            try {
                const resultado = await parser.getText();
                textoExtraido = resultado.text || '';
            } finally {
                await parser.destroy();
            }
        }

        // Limpiamos saltos de línea múltiples y espacios basura para ahorrar tokens en la IA
        const contenidoLimpio = textoExtraido
            .replace(/\r\n/g, '\n')
            .replace(/^-- \d+ of \d+ --$/gm, '') // marcas de página que agrega pdf-parse v2
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (!contenidoLimpio) {
            return NextResponse.json(
                { error: 'El archivo está vacío o es un PDF escaneado como imagen sin texto seleccionable.' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            titulo: file.name,
            contenido: contenidoLimpio,
        });

    } catch (error: any) {
        console.error('❌ Error al extraer texto del documento:', error);
        return NextResponse.json(
            { error: 'Error interno al procesar el archivo', detalle: error?.message },
            { status: 500 }
        );
    }
}