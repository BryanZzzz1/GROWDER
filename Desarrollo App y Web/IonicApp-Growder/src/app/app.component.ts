import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ServicebdService } from './services/servicesbd.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar } from '@capacitor/status-bar';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  ocultarnavbar = true;
  private subscription: Subscription;
  public isLoggedIn: boolean = false; 

  constructor(
    private router: Router, 
    private service: ServicebdService,
    private zone: NgZone
  ) {
    this.subscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ocultarnavbar = !this.ocultabarrabaja(event.urlAfterRedirects);
        this.updateStatusBar(event.urlAfterRedirects); 
      }
    });

    this.service.isUserLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.setupStatusBar();
    this.scheduleNotification();
    this.setupDeepLinks();
  }

  private setupDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        Browser.close().catch(() => {});

        const urlString = event.url; 

        if (urlString.includes('/pago/exito')) {
          try {
            const url = new URL(urlString);
            const orden = url.searchParams.get('orden');
            const monto = url.searchParams.get('monto');
            const token_ws = url.searchParams.get('token_ws'); 
            const metodo = url.searchParams.get('metodo');     
            
            this.router.navigate(['/pago-exito'], { queryParams: { orden, monto, token_ws, metodo } });
          } catch (e) {
            console.error('Error parseando la URL de pago:', e);
          }
        } 
        else if (urlString.includes('/pago/fracaso')) {
          this.router.navigate(['/carro']);
        }
      });
    });
  }

  private async setupStatusBar() {
    await StatusBar.setBackgroundColor({ color: '#18342f' });
    await StatusBar.setOverlaysWebView({ overlay: false });
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