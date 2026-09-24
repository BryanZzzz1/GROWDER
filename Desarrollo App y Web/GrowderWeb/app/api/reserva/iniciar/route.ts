import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, usuarioId, email, codigoReserva: codigoReq } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron productos para reservar' },
        { status: 400 }
      );
    }

    const duracionSegundos = 120; // 2 minutos exactos
    const codigoReserva =
      codigoReq || `RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiraEn = new Date(Date.now() + duracionSegundos * 1000).toISOString();

    // 1. Intentar llamar a la función atómica RPC de Supabase si está disponible
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'crear_reserva_stock',
        {
          p_codigo_reserva: codigoReserva,
          p_items: items,
          p_duracion_segundos: duracionSegundos,
          p_usuario_id: usuarioId || null,
          p_email: email || null,
        }
      );

      if (!rpcError && rpcData) {
        if (rpcData.success === false) {
          return NextResponse.json(
            { error: rpcData.error || 'Stock insuficiente' },
            { status: 409 }
          );
        }
        return NextResponse.json({
          success: true,
          codigoReserva,
          expiraEn: rpcData.expira_en || expiraEn,
          duracionSegundos,
        });
      }
    } catch {
      // Si la función RPC aún no fue ejecutada en Supabase, pasamos al fallback directo
    }

    // 2. Fallback directo en tabla Supabase: Limpiar reservas expiradas primero
    try {
      const nowISO = new Date().toISOString();
      const { data: vencidas } = await supabase
        .from('reservas_stock')
        .select('*')
        .eq('estado', 'activa')
        .lt('expira_en', nowISO);

      if (vencidas && vencidas.length > 0) {
        for (const res of vencidas) {
          if (Array.isArray(res.items)) {
            for (const it of res.items) {
              if (it.idproducto && it.cantidad) {
                const { data: prodActual } = await supabase
                  .from('producto')
                  .select('cantidad')
                  .eq('idproducto', it.idproducto)
                  .single();

                if (prodActual) {
                  await supabase
                    .from('producto')
                    .update({ cantidad: prodActual.cantidad + it.cantidad })
                    .eq('idproducto', it.idproducto);
                }
              }
            }
          }
          await supabase
            .from('reservas_stock')
            .update({ estado: 'expirada', updated_at: nowISO })
            .eq('id', res.id);
        }
      }
    } catch {
      // Ignorar si la tabla aún no existe
    }

    // 3. Fallback: Verificar stock de cada producto
    for (const item of items) {
      const idprod = item.idproducto || item.id;
      if (!idprod) continue;

      const { data: prod, error: errProd } = await supabase
        .from('producto')
        .select('idproducto, nombre, cantidad')
        .eq('idproducto', idprod)
        .single();

      if (!errProd && prod) {
        if (prod.cantidad < item.cantidad) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${prod.nombre}. Disponibles: ${prod.cantidad} unidades.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // 4. Fallback: Descontar stock temporalmente en la tabla producto
    for (const item of items) {
      const idprod = item.idproducto || item.id;
      if (!idprod) continue;

      const { data: prod } = await supabase
        .from('producto')
        .select('cantidad')
        .eq('idproducto', idprod)
        .single();

      if (prod) {
        const nuevoStock = Math.max(0, prod.cantidad - item.cantidad);
        await supabase
          .from('producto')
          .update({ cantidad: nuevoStock })
          .eq('idproducto', idprod);
      }
    }

    // 5. Fallback: Guardar en reservas_stock
    try {
      await supabase.from('reservas_stock').insert([
        {
          codigo_reserva: codigoReserva,
          usuario_id: usuarioId || null,
          email: email || null,
          items,
          estado: 'activa',
          expira_en: expiraEn,
        },
      ]);
    } catch {
      // Si la tabla no existe aún en Supabase, el timer seguirá funcionando a nivel de sesión
    }

    return NextResponse.json({
      success: true,
      codigoReserva,
      expiraEn,
      duracionSegundos,
    });
  } catch (error: any) {
    console.error('Error al iniciar reserva de stock:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar reserva de stock' },
      { status: 500 }
    );
  }
}
