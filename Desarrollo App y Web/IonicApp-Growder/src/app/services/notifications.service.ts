import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface Notificacion {
  id: number;
  user_id: string;
  codigo_pedido: string | null;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

/**
 * Notificaciones de cambio de estado de pedido.
 * - Suscripción Realtime a `notificaciones` del usuario: al cambiar el estado en el panel,
 *   el trigger de BD inserta la fila y la app muestra una notificación del sistema al instante.
 * - Al abrir la app / iniciar sesión revisa las no leídas pendientes de avisar.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly noLeidasSubject = new BehaviorSubject<number>(0);
  readonly noLeidas$ = this.noLeidasSubject.asObservable();
  readonly nuevaNotificacion$ = new BehaviorSubject<Notificacion | null>(null);

  private canal: RealtimeChannel | null = null;
  private userActual: string | null = null;
  private readonly storageKey = 'sumate_notif_avisadas';

  constructor(private supabase: SupabaseService, private auth: AuthService) {
    this.auth.currentUser$.subscribe(user => {
      const uid = user?.id ?? null;
      if (uid === this.userActual) return;
      this.detener();
      this.userActual = uid;
      if (uid) this.iniciar(uid);
      else this.noLeidasSubject.next(0);
    });
  }

  private async iniciar(uid: string) {
    try { await LocalNotifications.requestPermissions(); } catch {}

    // Pendientes mientras la app estaba cerrada
    const pendientes = await this.listar(true);
    const avisadas = this.leerAvisadas();
    for (const n of pendientes.filter(x => !avisadas.has(x.id)).slice(0, 5)) {
      await this.mostrarNativa(n);
    }
    await this.actualizarContador();

    this.canal = this.supabase.client
      .channel(`notificaciones-${uid}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${uid}` },
        async (payload) => {
          const n = payload.new as Notificacion;
          await this.mostrarNativa(n);
          this.nuevaNotificacion$.next(n);
          await this.actualizarContador();
        })
      .subscribe();
  }

  private detener() {
    if (this.canal) {
      this.supabase.client.removeChannel(this.canal);
      this.canal = null;
    }
  }

  private async mostrarNativa(n: Notificacion) {
    const avisadas = this.leerAvisadas();
    avisadas.add(n.id);
    this.guardarAvisadas(avisadas);
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 100000 + (n.id % 1000000),
          title: n.titulo,
          body: n.mensaje,
          schedule: { at: new Date(Date.now() + 500) },
        }],
      });
    } catch (e) {
      console.warn('[Notif] No se pudo mostrar notificación del sistema', e);
    }
  }

  async listar(soloNoLeidas = false): Promise<Notificacion[]> {
    const uid = this.auth.currentUser?.id;
    if (!uid) return [];
    let q = this.supabase.client.from('notificaciones').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(50);
    if (soloNoLeidas) q = q.eq('leida', false);
    const { data } = await q;
    return (data || []) as Notificacion[];
  }

  async actualizarContador() {
    const uid = this.auth.currentUser?.id;
    if (!uid) { this.noLeidasSubject.next(0); return; }
    const { count } = await this.supabase.client.from('notificaciones')
      .select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('leida', false);
    this.noLeidasSubject.next(count ?? 0);
  }

  async marcarLeida(id: number) {
    await this.supabase.client.from('notificaciones').update({ leida: true }).eq('id', id);
    await this.actualizarContador();
  }

  async marcarTodasLeidas() {
    const uid = this.auth.currentUser?.id;
    if (!uid) return;
    await this.supabase.client.from('notificaciones').update({ leida: true }).eq('user_id', uid).eq('leida', false);
    await this.actualizarContador();
  }

  private leerAvisadas(): Set<number> {
    try { return new Set(JSON.parse(localStorage.getItem(this.storageKey) || '[]')); } catch { return new Set(); }
  }
  private guardarAvisadas(s: Set<number>) {
    try { localStorage.setItem(this.storageKey, JSON.stringify([...s].slice(-200))); } catch {}
  }
}
