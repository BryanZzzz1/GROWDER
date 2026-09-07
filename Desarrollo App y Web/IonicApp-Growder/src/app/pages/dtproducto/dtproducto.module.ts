import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DtproductoPageRoutingModule } from './dtproducto-routing.module';
import { DtproductoPage } from './dtproducto.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DtproductoPageRoutingModule
  ],
  declarations: [DtproductoPage]
})
export class DtproductoPageModule {}
