import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TiendaPageRoutingModule } from './tienda-routing.module';

import { TiendaPage } from './tienda.page';
import { FiltroModalComponent } from '../../components/filtro-modal/filtro-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TiendaPageRoutingModule
  ],
  declarations: [TiendaPage, FiltroModalComponent]
})
export class TiendaPageModule {}
