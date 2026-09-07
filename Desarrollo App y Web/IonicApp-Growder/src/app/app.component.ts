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
    await StatusBar.setBackgroundColor({ color: '#a57352ec' }); 
    await StatusBar.setOverlaysWebView({ overlay: false });
    // Barra debajo de la app
  }

  private async updateStatusBar(url: string) {
    let color = '#a57352ec'; // Color por defecto

    if (url.includes('/login')) {
      color = '#a57352ec'; // Rojo para la página de login (por ejemplo)
    } else if (url.includes('/tienda')) {
      color = '#a57352ec'; // Verde para la página de la tienda (por ejemplo)
    } else if (url.includes('/carro')) {
      color = '#a57352ec'; // Azul para la página del carro
    } else if (url.includes('/iniciotienda')) {
      color = '#a57352ec'; 
    } 


    await StatusBar.setBackgroundColor({ color });
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
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '¡Grandes descuentos disponibles!',
          body: 'No te pierdas nuestras ofertas en nuevos productos.',
          id: 1,
          schedule: { at: new Date(Date.now() + 10000) }, 
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  }
}
