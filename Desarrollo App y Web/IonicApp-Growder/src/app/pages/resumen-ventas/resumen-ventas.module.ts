import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResumenVentasPageRoutingModule } from './resumen-ventas-routing.module';

import { ResumenVentasPage } from './resumen-ventas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResumenVentasPageRoutingModule
  ],
  declarations: [ResumenVentasPage]
})
export class ResumenVentasPageModule {}
