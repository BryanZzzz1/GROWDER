import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ServicebdService } from './services/servicesbd.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar } from '@capacitor/status-bar'; 

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  ocultarnavbar = true;
  private subscription: Subscription;
  public isLoggedIn: boolean = false; 

  constructor(private router: Router, private service: ServicebdService) {
    this.subscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ocultarnavbar = !this.ocultabarrabaja(event.urlAfterRedirects);
        this.updateStatusBar(event.urlAfterRedirects); 
      }
    });

    // Suscribirse al estado de inicio de sesión
    this.service.isUserLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn; // Actualizar el estado local
    });

    // Configuración inicial de la barra de estado
    this.setupStatusBar();

    // Programar notificación
    this.scheduleNotification();
  }

  private async setupStatusBar() {
    await StatusBar.setBackgroundColor({ color: '#18342f' });
    await StatusBar.setOverlaysWebView({ overlay: false });
    // Barra debajo de la app
  }

  private async updateStatusBar(url: string) {
    await StatusBar.setBackgroundColor({ color: '#18342f' });
  }

  ocultabarrabaja(url: string): boolean {
    return url.includes('/login') || url.includes('/iniciotienda')|| url.includes('/verproducto')|| url.includes('/ayuda') || url.includes('/user-profile')|| url.includes('/adminusuario') || url.includes('/dtproducto') || url.includes('/register') || url.includes('/resumen-ventas')|| url.includes('/agregarproductos');
  }

  irPerfil() {
    this.router.navigate(['./user-profile']);
  }

  irIngresar() {
    this.router.navigate(['/login']);
  }

  irTienda() {
    this.router.navigate(['/tienda']);
  }

  irAyuda() {
    this.router.navigate(['/ayuda']);
  }

  irCarro() {
    this.router.navigate(['/carro']);
  }

  get buttonLabel(): string {
    return this.isLoggedIn ? 'Perfil' : 'Ingresar';
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async scheduleNotification() {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== 'granted') return;
    }

    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Una nueva selección te espera',
          body: 'Descubre productos elegidos para acompañar tu día en Growder.',
          id: 1,
          schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000), repeats: true },
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  }
}
