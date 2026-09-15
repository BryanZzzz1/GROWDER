-- ==============================================================================
-- TABLA PEDIDOS, POLÍTICAS RLS Y HABILITACIÓN DE TIEMPO REAL
-- Ejecuta este script en el SQL Editor de tu consola Supabase
-- ==============================================================================

-- 1. Crear tabla pedidos (si aún no existe)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id BIGSERIAL PRIMARY KEY,
    codigo_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(50) NOT NULL,
    region VARCHAR(150) NOT NULL,
    comuna VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    depto VARCHAR(50),
    instrucciones TEXT,
    metodo_pago VARCHAR(50) DEFAULT 'transferencia',
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en despacho', 'recibido')),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_envio NUMERIC(12,2) NOT NULL DEFAULT 2650,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    empresa_transporte VARCHAR(100),
    numero_seguimiento VARCHAR(100),
    notas_despacho TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar seguridad por fila (RLS)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso RLS:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pedidos' AND policyname = 'Permitir creacion de pedidos para clientes'
    ) THEN
        CREATE POLICY "Permitir creacion de pedidos para clientes" 
        ON public.pedidos FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pedidos' AND policyname = 'Permitir lectura y gestion de pedidos para admin y editor'
    ) THEN
        CREATE POLICY "Permitir lectura y gestion de pedidos para admin y editor" 
        ON public.pedidos FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.usuario
                WHERE public.usuario.id = auth.uid()
                AND public.usuario.rol_id IN (1, 2)
                AND public.usuario.activo = true
            )
            OR auth.role() = 'anon'
        ) 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.usuario
                WHERE public.usuario.id = auth.uid()
                AND public.usuario.rol_id IN (1, 2)
                AND public.usuario.activo = true
            )
            OR auth.role() = 'anon'
        );
    END IF;
END $$;

-- 4. HABILITAR TIEMPO REAL (SUPABASE REALTIME)
-- Permite que la tabla transmita INSERTs y UPDATEs instantáneamente al frontend
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
