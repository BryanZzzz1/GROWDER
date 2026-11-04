import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Notificacion, NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
})
export class NotificacionesPage implements OnDestroy {
  items: Notificacion[] = [];
  cargando = false;
  private sub?: Subscription;

  constructor(private notif: NotificationsService, private router: Router) {}

  async ionViewWillEnter() {
    await this.cargar();
    // Si llega una nueva mientras la pantalla está abierta, se agrega a la lista
    this.sub = this.notif.nuevaNotificacion$.subscribe(n => {
      if (n && !this.items.some(i => i.id === n.id)) this.items = [n, ...this.items];
    });
  }

  ionViewWillLeave() { this.sub?.unsubscribe(); }
  ngOnDestroy() { this.sub?.unsubscribe(); }

  async cargar() {
    this.cargando = true;
    try { this.items = await this.notif.listar(); } finally { this.cargando = false; }
  }

  async refrescar(ev: any) {
    await this.cargar();
    ev.target.complete();
  }

  async abrir(n: Notificacion) {
    if (!n.leida) { n.leida = true; await this.notif.marcarLeida(n.id); }
    if (n.codigo_pedido) this.router.navigate(['/detalle-pedido', n.codigo_pedido]);
  }

  async marcarTodas() {
    await this.notif.marcarTodasLeidas();
    this.items = this.items.map(i => ({ ...i, leida: true }));
  }

  get hayNoLeidas() { return this.items.some(i => !i.leida); }
  volver() { this.router.navigate(['/tienda']); }
}
