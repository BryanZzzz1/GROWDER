import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CarroPageRoutingModule } from './carro-routing.module';

import { CarroPage } from './carro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CarroPageRoutingModule
  ],
  declarations: [CarroPage]
})
export class CarroPageModule {}
