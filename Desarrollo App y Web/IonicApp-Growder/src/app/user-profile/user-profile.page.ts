import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicebdService } from '../services/servicesbd.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
})
export class UserProfilePage implements OnInit {
  email: string = '';
  telefono: string = '';
  fechaNacimiento: string = '';
  foto: string = '';

  constructor(
    private serviceBD: ServicebdService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  async loadUserData() {
    try {
      const user = await this.serviceBD.getCurrentUser();
      if (user) {
        this.email = user.email; // Extraído directamente del Auth de Supabase
        this.telefono = user.telefono; // Extraído del user_metadata
        this.fechaNacimiento = this.formatDate(user.fecha_nacimiento);
        this.foto = user.foto || 'https://docs-demo.ionic.io/assets/madison.jpg';
      } else {
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      await this.router.navigate(['/login']);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    // Ajuste para evitar desfases de zona horaria al mostrar la fecha
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
      .toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  editarperfil() {
    this.router.navigate(['./edit-user', this.email]);
  }

  cambiarContrasena() {
    this.router.navigate(['/change-password']);
  }

  irHistorialCompras() {
    this.router.navigate(['./historial-compras']);
  }

  async logout() {
    await this.serviceBD.logout();
    const toast = await this.toastController.create({
      message: 'Sesión cerrada correctamente.',
      duration: 2200,
      position: 'bottom',
      icon: 'log-out-outline',
      cssClass: 'app-toast'
    });
    await toast.present();
    await this.router.navigate(['/tienda']);
  }

  async presentAlert(header: string, message: string) {
    const toast = await this.toastController.create({
      message: `${header}: ${message}`,
      duration: 2600,
      position: 'bottom',
      cssClass: 'app-toast'
    });
    await toast.present();
  }
}