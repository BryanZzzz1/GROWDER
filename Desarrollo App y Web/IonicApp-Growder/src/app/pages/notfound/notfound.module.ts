import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotfoundPageRoutingModule } from './notfound-routing.module';

import { NotfoundPage } from './notfound.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotfoundPageRoutingModule
  ],
  declarations: [NotfoundPage]
})
export class NotfoundPageModule {}
