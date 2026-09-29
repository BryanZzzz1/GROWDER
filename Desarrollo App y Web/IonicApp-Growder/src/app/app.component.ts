import { Component, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ServicebdService } from './services/servicesbd.service';
import { CartService } from './services/cart.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar } from '@capacitor/status-bar';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SupabaseService } from './services/supabase.service';
import { NavController } from '@ionic/angular';

export let deepLinkAuthUrl: string | null = null;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  ocultarnavbar = true;
  private subscription: Subscription;
  public isLoggedIn: boolean = false; 
  public cartCount: number = 0;

  constructor(
    private router: Router, 
    private service: ServicebdService,
    private cartService: CartService,
    private zone: NgZone,
    private supabaseService: SupabaseService,
    private navCtrl: NavController
  ) {
    this.subscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ocultarnavbar = this.ocultabarrabaja(event.urlAfterRedirects);
        this.updateStatusBar(event.urlAfterRedirects);
        this.updateCartCount();
      }
    });

    this.service.isUserLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.updateCartCount();
      } else {
        this.cartCount = 0;
      }
    });

    this.setupStatusBar();
    this.scheduleNotification();
    this.setupDeepLinks();
  }

  async updateCartCount() {
    if (this.isLoggedIn) {
      const items = await this.cartService.get();
      this.cartCount = items.reduce((total, item) => total + (item.cantidad || 1), 0);
    } else {
      this.cartCount = 0;
    }
    // Re-evaluate tab bar visibility since it depends on cartCount
    this.ocultarnavbar = this.ocultabarrabaja(this.router.url);
  }

  private setupDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('[DeepLink] URL entrante recibida:', event.url);
      deepLinkAuthUrl = event.url;
      const urlString = event.url;

      this.zone.run(() => {
        Browser.close().catch(() => {});

        if (urlString.includes('recuperar-password') || urlString.includes('type=recovery') || urlString.includes('code=')) {
          this.navCtrl.navigateRoot(['/recuperar-password'], {
            queryParams: { auth_link: encodeURIComponent(urlString) }
          });
        } else if (urlString.includes('/pago/exito')) {
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
        } else if (urlString.includes('/pago/fracaso')) {
          this.router.navigate(['/carro']);
        }
      });
    });

    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.zone.run(() => {
          this.navCtrl.navigateRoot('/recuperar-password');
        });
      }
    });
  }

  private async setupStatusBar() {
    await StatusBar.setBackgroundColor({ color: '#314235' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  }

  private async updateStatusBar(url: string) {
    await StatusBar.setBackgroundColor({ color: '#314235' });
  }

  ocultabarrabaja(url: string): boolean {
    return url.includes('/login') || 
           url.includes('/register') || 
           url.includes('/iniciotienda') || 
           url.includes('/dtproducto') || 
           url.includes('/checkout') ||
           url.includes('/pago-exito') ||
           url.includes('/user-profile') ||
           url.includes('/historial-compras') ||
           url.includes('/pedidos') ||
           url.includes('/detalle-pedido') ||
           url.includes('/editar-perfil') ||
           url.includes('/edit-user') ||
           url.includes('/recuperar-password') ||
           (url.includes('/carro') && this.cartCount > 0) ||
           url === '/';
  }

  irTienda() {
    this.router.navigate(['/tienda']);
  }

  irBuscar() {
    this.router.navigate(['/buscar']);
  }

  irCarro() {
    this.router.navigate(['/carro']);
  }

  irPerfil() {
    this.router.navigate(['/user-profile']);
  }

  irLogin() {
    this.router.navigate(['/login']);
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