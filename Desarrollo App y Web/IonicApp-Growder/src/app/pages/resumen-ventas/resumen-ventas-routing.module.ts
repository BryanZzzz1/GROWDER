import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResumenVentasPage } from './resumen-ventas.page';

const routes: Routes = [
  {
    path: '',
    component: ResumenVentasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResumenVentasPageRoutingModule {}
