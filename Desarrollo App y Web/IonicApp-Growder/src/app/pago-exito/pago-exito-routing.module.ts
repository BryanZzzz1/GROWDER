import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PagoExitoPage } from './pago-exito.page';

const routes: Routes = [
  {
    path: '',
    component: PagoExitoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagoExitoPageRoutingModule {}
