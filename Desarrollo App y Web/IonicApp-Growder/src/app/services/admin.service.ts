import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly adminSubject = new BehaviorSubject(false);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  async getUserByUsername(username: string): Promise<any> {
    const { data } = await this.supabaseService.client
      .from('usuarios').select('*').eq('username', username).single();
    return data || null;
  }

  async isAdmin(): Promise<boolean> {
    return this.adminSubject.value;
  }

  async isUserActive(_username: string): Promise<boolean> {
    return true;
  }

  async changePasswordForCurrentUser(newPassword: string): Promise<void> {
    await this.supabaseService.client.auth.updateUser({ password: newPassword });
  }

  async changeCurrentPassword(_username: string, currentPassword: string, newPassword: string): Promise<boolean> {
    return this.authService.changePasswordWithVerification(currentPassword, newPassword);
  }

  getAdminStatus(): Observable<boolean> {
    return this.adminSubject.asObservable();
  }

  async getAllPurchases(): Promise<any[]> {
    const { data } = await this.supabaseService.client
      .from('historial_compras').select('*').order('fecha', { ascending: false });
    return data || [];
  }

  setAdminStatus(status: boolean): void {
    this.adminSubject.next(status);
  }
}
