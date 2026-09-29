import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase.service';
import { deepLinkAuthUrl } from 'src/app/app.component';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
})
export class RecuperarPasswordPage implements OnInit {
  estado: 'sincronizando' | 'listo' | 'error' = 'sincronizando';
  mensajeError: string = '';

  nuevaPassword = '';
  confirmarPassword = '';
  actualizando = false;
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;

  get tieneMinimoCaracteres(): boolean {
    return this.nuevaPassword.length >= 6;
  }

  get coincidenPasswords(): boolean {
    return this.nuevaPassword.length > 0 && this.nuevaPassword === this.confirmarPassword;
  }

  get formularioValido(): boolean {
    return this.tieneMinimoCaracteres && this.coincidenPasswords && !this.actualizando;
  }

  toggleMostrarNueva() {
    this.mostrarNuevaPassword = !this.mostrarNuevaPassword;
  }

  toggleMostrarConfirmar() {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.autoEjecutarCodigoDeEnlace();
  }

  async autoEjecutarCodigoDeEnlace() {
    this.estado = 'sincronizando';
    this.mensajeError = '';

    // Obtener la URL desde el query param, variable global o ubicación actual
    const paramUrl = this.route.snapshot.queryParamMap.get('auth_link');
    let fullUrl = paramUrl ? decodeURIComponent(paramUrl) : (deepLinkAuthUrl || window.location.href);

    console.log('[Sincronización] Procesando URL de enlace:', fullUrl);

    try {
      let sesionValida = false;

      // 1. Extraer 'code' (flujo PKCE / Authorization Code)
      if (fullUrl.includes('code=')) {
        const dummyUrl = new URL(fullUrl.replace('somatecl://', 'https://dummy.local/'));
        const code = dummyUrl.searchParams.get('code');

        if (code) {
          console.log('[Sincronización] Auto-ejecutando exchangeCodeForSession con código recibido...');
          const { data, error } = await this.supabaseService.client.auth.exchangeCodeForSession(code);
          if (error) throw error;
          sesionValida = true;
        }
      }

      // 2. Extraer tokens de hash (#access_token=...&refresh_token=...) si no vino code
      if (!sesionValida && fullUrl.includes('access_token')) {
        const hashSegment = fullUrl.includes('#') ? fullUrl.split('#')[1] : fullUrl.split('?')[1];
        const params = new URLSearchParams(hashSegment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[Sincronización] Auto-ejecutando setSession con tokens hash...');
          const { data, error } = await this.supabaseService.client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
          sesionValida = true;
        }
      }

      // 3. Verificación final de sesión activa
      if (!sesionValida) {
        const { data: { session } } = await this.supabaseService.client.auth.getSession();
        if (session) {
          sesionValida = true;
        }
      }

      if (sesionValida) {
        console.log('[Sincronización] Sesión vinculada con éxito. Habilitando vista de cambio.');
        this.estado = 'listo';
      } else {
        throw new Error('El enlace no contiene un código de seguridad válido o ya ha expirado.');
      }

    } catch (err: any) {
      console.error('[Sincronización Error]:', err);
      this.estado = 'error';
      this.mensajeError = err.message || 'No fue posible validar el enlace. Solicita uno nuevo.';
    }
  }

  async actualizarContrasena() {
    if (this.estado !== 'listo') return;

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mostrarToast('Las contraseñas no coinciden.', 'warning');
      return;
    }

    if (this.nuevaPassword.length < 6) {
      this.mostrarToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    this.actualizando = true;

    try {
      const { data, error } = await this.supabaseService.client.auth.updateUser({
        password: this.nuevaPassword
      });

      if (error) throw error;

      this.mostrarToast('¡Contraseña actualizada con éxito!', 'success');
      await this.supabaseService.client.auth.signOut();
      this.navCtrl.navigateRoot('/login');

    } catch (err: any) {
      this.mostrarToast('Error al actualizar: ' + err.message, 'danger');
    } finally {
      this.actualizando = false;
    }
  }

  volverAlLogin() {
    this.navCtrl.navigateRoot('/login');
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}
