import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { ToastController, AlertController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = ''; 
  password: string = '';

  constructor(
    private servicebd: ServicebdService, 
    private router: Router, 
    private toastController: ToastController,
    private alertController: AlertController,
    private supabaseService: SupabaseService
  ) {}

  async onLogin() {
    if (!this.email || !this.password) {
      await this.presentToast('Completa tu correo y contraseña.', 'alert-circle-outline');
      return; 
    }

    const result = await this.servicebd.loginUsuario(this.email, this.password);
    
    if (result.success) {
      this.router.navigate(['/tienda']); 
    } else {
      this.presentToast(result.message || 'No se pudo iniciar sesión.', 'alert-circle-outline');
    }
  }

  async presentToast(message: string, icon = 'information-circle-outline') {
    const toast = await this.toastController.create({ message, duration: 2600, position: 'bottom', icon, cssClass: 'app-toast' });
    await toast.present();
  }

  async mostrarToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: 'app-toast'
    });
    await toast.present();
  }

  mostrarModalRecuperacion = false;
  emailRecuperacion = '';
  enviandoCorreo = false;

  abrirModalRecuperacion() {
    this.emailRecuperacion = this.email || '';
    this.mostrarModalRecuperacion = true;
  }

  cerrarModalRecuperacion() {
    this.mostrarModalRecuperacion = false;
    this.emailRecuperacion = '';
    this.enviandoCorreo = false;
  }

  async enviarEnlaceRecuperacion() {
    const correoLimpio = this.emailRecuperacion?.trim();
    if (!correoLimpio || !correoLimpio.includes('@')) {
      this.mostrarToast('Por favor, ingresa un correo válido.', 'warning');
      return;
    }

    this.enviandoCorreo = true;

    // Esquema nativo registrado en AndroidManifest.xml
    const { data, error } = await this.supabaseService.client.auth.resetPasswordForEmail(correoLimpio, {
      redirectTo: 'somatecl://recuperar-password'
    });

    this.enviandoCorreo = false;

    if (error) {
      this.mostrarToast('Error al enviar enlace: ' + error.message, 'danger');
    } else {
      this.mostrarToast('Enlace enviado. Abre el correo desde este teléfono.', 'success');
      this.cerrarModalRecuperacion();
    }
  }
}