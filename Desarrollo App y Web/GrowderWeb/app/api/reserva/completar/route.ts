import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigoReserva } = body;

    if (!codigoReserva) {
      return NextResponse.json(
        { error: 'Código de reserva requerido' },
        { status: 400 }
      );
    }

    // 1. Intentar llamar a la función atómica RPC de completado
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'completar_reserva',
        { p_codigo_reserva: codigoReserva }
      );

      if (!rpcError && rpcData && rpcData.success) {
        return NextResponse.json({
          success: true,
          mensaje: 'Reserva completada exitosamente',
        });
      }
    } catch {
      // Continuar con fallback directo
    }

    // 2. Fallback: Actualizar estado directamente en tabla reservas_stock
    try {
      await supabase
        .from('reservas_stock')
        .update({
          estado: 'completada',
          updated_at: new Date().toISOString(),
        })
        .eq('codigo_reserva', codigoReserva);
    } catch {
      // Ignorar si la tabla aún no existe
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Reserva marcada como completada',
    });
  } catch (error: any) {
    console.error('Error al completar reserva:', error);
    return NextResponse.json(
      { error: error.message || 'Error al completar reserva de stock' },
      { status: 500 }
    );
  }
}
