import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DtproductoPage } from './dtproducto.page';

const routes: Routes = [
  {
    path: '',
    component: DtproductoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DtproductoPageRoutingModule {}
