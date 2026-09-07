import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IniciotiendaPageRoutingModule } from './iniciotienda-routing.module';

import { IniciotiendaPage } from './iniciotienda.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IniciotiendaPageRoutingModule
  ],
  declarations: [IniciotiendaPage]
})
export class IniciotiendaPageModule {}
