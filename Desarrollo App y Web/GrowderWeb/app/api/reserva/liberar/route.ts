import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigoReserva, items: itemsRespaldo, motivo = 'expirada' } = body;

    if (!codigoReserva && (!itemsRespaldo || itemsRespaldo.length === 0)) {
      return NextResponse.json(
        { error: 'Identificador de reserva o lista de productos no proporcionada' },
        { status: 400 }
      );
    }

    // 1. Intentar llamar a la función atómica RPC de cancelación
    if (codigoReserva) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'cancelar_reserva',
          { p_codigo_reserva: codigoReserva }
        );

        if (!rpcError && rpcData && rpcData.success) {
          return NextResponse.json({
            success: true,
            mensaje: 'Reserva liberada y stock devuelto exitosamente vía RPC',
          });
        }
      } catch {
        // Continuar con fallback directo
      }
    }

    // 2. Fallback: Buscar en la tabla reservas_stock
    let itemsALiberar = itemsRespaldo || [];
    let reservaId: string | null = null;

    if (codigoReserva) {
      try {
        const { data: reserva } = await supabase
          .from('reservas_stock')
          .select('*')
          .eq('codigo_reserva', codigoReserva)
          .eq('estado', 'activa')
          .single();

        if (reserva) {
          reservaId = reserva.id;
          if (Array.isArray(reserva.items)) {
            itemsALiberar = reserva.items;
          }
        }
      } catch {
        // Ignorar
      }
    }

    // 3. Devolver stock a la tabla producto
    if (Array.isArray(itemsALiberar) && itemsALiberar.length > 0) {
      for (const item of itemsALiberar) {
        const idprod = item.idproducto || item.id;
        const cantidadADevolver = item.cantidad || 0;
        if (!idprod || cantidadADevolver <= 0) continue;

        const { data: prod } = await supabase
          .from('producto')
          .select('cantidad')
          .eq('idproducto', idprod)
          .single();

        if (prod) {
          await supabase
            .from('producto')
            .update({ cantidad: prod.cantidad + cantidadADevolver })
            .eq('idproducto', idprod);
        }
      }
    }

    // 4. Actualizar estado de la reserva en reservas_stock
    if (reservaId) {
      try {
        await supabase
          .from('reservas_stock')
          .update({
            estado: motivo === 'cancelada' ? 'cancelada' : 'expirada',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reservaId);
      } catch {
        // Ignorar
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Stock devuelto al inventario disponible',
    });
  } catch (error: any) {
    console.error('Error al liberar reserva:', error);
    return NextResponse.json(
      { error: error.message || 'Error al liberar reserva de stock' },
      { status: 500 }
    );
  }
}
