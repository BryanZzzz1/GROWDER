import { Component } from '@angular/core';
import { ServicebdService } from 'src/app/services/servicesbd.service';

@Component({
  selector: 'app-resumen-ventas',
  templateUrl: './resumen-ventas.page.html',
  styleUrls: ['./resumen-ventas.page.scss'],
})
export class ResumenVentasPage {
  public compras: any[] = [];
  public totalVendido: number = 0;

  constructor(private servicebd: ServicebdService) { }

  ngOnInit() {
    this.obtenerHistorialCompras();
  }

  async obtenerHistorialCompras() {
    this.compras = await this.servicebd.obtenerTodasLasCompras();
    this.calcularTotalVendido();
  }
  
  calcularTotalVendido() {
    this.totalVendido = this.compras.reduce((total, compra) => total + (compra.precio * compra.cantidad), 0);
  }

}
