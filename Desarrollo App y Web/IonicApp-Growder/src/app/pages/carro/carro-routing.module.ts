import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CarroPage } from './carro.page';

const routes: Routes = [
  {
    path: '',
    component: CarroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CarroPageRoutingModule {}
