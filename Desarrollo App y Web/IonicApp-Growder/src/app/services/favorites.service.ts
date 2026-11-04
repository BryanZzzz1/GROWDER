import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { Productos } from './productos';

/** Favoritos individuales por usuario (tabla `favoritos`, RLS por user_id). */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly idsSubject = new BehaviorSubject<Set<number>>(new Set());
  readonly ids$ = this.idsSubject.asObservable();

  constructor(private supabase: SupabaseService, private auth: AuthService) {
    this.auth.currentUser$.subscribe(user => {
      if (user) this.refrescar(); else this.idsSubject.next(new Set());
    });
  }

  private get userId(): string | null {
    return this.auth.currentUser?.id ?? null;
  }

  isFavorite(idproducto: number): boolean {
    return this.idsSubject.value.has(idproducto);
  }

  async refrescar(): Promise<void> {
    const uid = this.userId;
    if (!uid) { this.idsSubject.next(new Set()); return; }
    const { data } = await this.supabase.client.from('favoritos').select('idproducto').eq('user_id', uid);
    this.idsSubject.next(new Set((data || []).map((f: any) => f.idproducto)));
  }

  /** Devuelve el nuevo estado (true = favorito) o null si no hay sesión / falló. */
  async toggle(idproducto: number): Promise<boolean | null> {
    const uid = this.userId;
    if (!uid) return null;
    const actual = this.isFavorite(idproducto);
    const copia = new Set(this.idsSubject.value);

    const { error } = actual
      ? await this.supabase.client.from('favoritos').delete().eq('user_id', uid).eq('idproducto', idproducto)
      : await this.supabase.client.from('favoritos').insert({ user_id: uid, idproducto });

    if (error && error.code !== '23505') {
      console.error('[Favoritos] Error:', error);
      return null;
    }
    if (actual) copia.delete(idproducto); else copia.add(idproducto);
    this.idsSubject.next(copia);
    return !actual;
  }

  async obtenerProductos(): Promise<Productos[]> {
    const uid = this.userId;
    if (!uid) return [];
    const { data: favs } = await this.supabase.client
      .from('favoritos').select('idproducto').eq('user_id', uid).order('created_at', { ascending: false });
    const ids = (favs || []).map((f: any) => f.idproducto);
    if (!ids.length) return [];
    const { data } = await this.supabase.client.from('producto').select('*').in('idproducto', ids);
    const orden = new Map<number, number>(ids.map((id: number, i: number) => [id, i]));
    return ((data || []) as Productos[]).sort((a, b) => (orden.get(a.idproducto)! - orden.get(b.idproducto)!));
  }
}
