import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { AlertService } from './alert.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly loggedInSubject = new BehaviorSubject(false);

  readonly isUserLoggedIn: Observable<boolean> = this.loggedInSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private alertService: AlertService
  ) {
    this.initAuthSession();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async register(
    email: string,
    password: string,
    telefono: string,
    fechaNacimiento: string,
    foto: string
  ): Promise<boolean> {
    if (!email || !password || !telefono || !fechaNacimiento) {
      await this.alertService.present('Registrar', 'Por favor, completa todos los campos.');
      return false;
    }

    try {
      const { error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            telefono,
            fecha_nacimiento: fechaNacimiento,
            foto,
            activo: true
          }
        }
      });

      if (error) throw error;
      await this.alertService.present('Registrar', 'Usuario registrado correctamente. Revisa tu correo para verificar.');
      return true;
    } catch (error) {
      this.alertService.handleError('Registrar', error);
      await this.alertService.present('No se pudo registrar', 'Revisa tus datos e inténtalo nuevamente.');
      return false;
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user?.user_metadata?.['activo'] === false) {
        await this.logout(false);
        return { success: false, message: 'Tu cuenta está desactivada.' };
      }

      return { success: true, message: 'Inicio de sesión exitoso.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error en el inicio de sesión.' };
    }
  }

  async getCurrentUser(): Promise<any> {
    const user = this.currentUser;
    return user ? { email: user.email, ...user.user_metadata } : null;
  }

  async updateUser(telefono: string, fechaNacimiento: string, foto: string, username?: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client.auth.updateUser({
        data: { username, telefono, fecha_nacimiento: fechaNacimiento, foto }
      });
      if (error) throw error;
      await this.alertService.present('Éxito', 'Los cambios se han guardado correctamente.');
      return true;
    } catch (error) {
      this.alertService.handleError('Actualizar Usuario', error);
      return false;
    }
  }

  async logout(showAlert = true): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    if (showAlert) await this.alertService.present('Logout', 'Has cerrado sesión correctamente.');
  }

  async changePassword(newPassword: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    } catch (error) {
      this.alertService.handleError('Cambiar Contraseña', error);
      return false;
    }
  }

  async changePasswordWithVerification(currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.currentUser;
    if (!user?.email) return false;

    try {
      const { error: signInError } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (signInError) return false;

      const { error } = await this.supabaseService.client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    } catch (error) {
      this.alertService.handleError('Cambiar Contraseña', error);
      return false;
    }
  }

  async recoverPassword(email: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return true;
    } catch (error) {
      this.alertService.handleError('Recuperar Contraseña', error);
      return false;
    }
  }

  setLoggedIn(status: boolean): void {
    this.loggedInSubject.next(status);
  }

  private initAuthSession(): void {
    this.supabaseService.client.auth.getSession().then(({ data: { session } }) => {
      this.setSessionUser(session?.user ?? null);
    });

    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.setSessionUser(session?.user ?? null);
    });
  }

  private setSessionUser(user: User | null): void {
    this.currentUserSubject.next(user);
    this.loggedInSubject.next(!!user);
  }
}
