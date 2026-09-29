import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-filtro-modal',
  templateUrl: './filtro-modal.component.html',
  styleUrls: ['./filtro-modal.component.scss'],
})
export class FiltroModalComponent implements OnInit {
  @Input() categorias: any[] = [];
  @Input() categoriaSeleccionada: string = 'Todos';
  
  rangoPrecio: any = { lower: 0, upper: 100000 };
  soloStock: boolean = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
  }

  aplicarFiltros() {
    this.modalCtrl.dismiss({
      categoria: this.categoriaSeleccionada,
      precioMin: this.rangoPrecio.lower,
      precioMax: this.rangoPrecio.upper,
      soloStock: this.soloStock
    });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
