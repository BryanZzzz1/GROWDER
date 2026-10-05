import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  async getReviews(productId: number): Promise<any[]> {
    const { data } = await this.supabaseService.client.from('resena').select('*').eq('idproducto', productId);
    return data || [];
  }

  async getReplies(reviewId: number): Promise<any[]> {
    const { data } = await this.supabaseService.client.from('respuestas').select('*').eq('id_resena', reviewId);
    return data || [];
  }

  async addReview(productId: number, username: string, text: string, rating: number): Promise<boolean> {
    const user = this.authService.currentUser;
    if (!user) return false;
    const { error } = await this.supabaseService.client.from('resena').insert({ idproducto: productId, username: username, texto: text, calificacion: rating, user_id: user.id });
    if (error) throw error;
    return true;
  }

  async addReply(reviewId: number, text: string, username: string): Promise<void> {
    const user = this.authService.currentUser;
    if (user) await this.supabaseService.client.from('respuestas').insert({ id_resena: reviewId, respuesta_username: username, respuesta_texto: text, user_id: user.id });
  }
}
