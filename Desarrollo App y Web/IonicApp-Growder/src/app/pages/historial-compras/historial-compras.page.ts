import { Component, OnInit } from '@angular/core';
import { ServicebdService } from '../../services/servicesbd.service';


interface Compra {
  foto: string;
  nombre: string;
  precio: number;
  cantidad: number;
   // Asegúrate de que la fecha esté disponible
}

@Component({
  selector: 'app-historial-compras',
  templateUrl: './historial-compras.page.html',
  styleUrls: ['./historial-compras.page.scss'],
})
export class HistorialComprasPage implements OnInit {
  historialCompras: Compra[] = [];

  constructor(private bd: ServicebdService) { }

  async ngOnInit() {
    try {
      const currentUser = await this.bd.getCurrentUser();
      if (currentUser) {
        this.historialCompras = await this.bd.obtenerHistorialCompras(currentUser.username);
      }
    } catch (error) {
      console.error('Error al obtener el historial de compras:', error);
    }
  }
}
