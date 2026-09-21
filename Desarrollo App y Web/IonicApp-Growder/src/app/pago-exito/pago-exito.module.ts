import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PagoExitoPageRoutingModule } from './pago-exito-routing.module';

import { PagoExitoPage } from './pago-exito.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PagoExitoPageRoutingModule
  ],
  declarations: [PagoExitoPage]
})
export class PagoExitoPageModule {}
