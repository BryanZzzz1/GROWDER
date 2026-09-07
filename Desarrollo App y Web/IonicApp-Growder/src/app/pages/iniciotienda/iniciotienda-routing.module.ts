import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IniciotiendaPage } from './iniciotienda.page';

const routes: Routes = [
  {
    path: '',
    component: IniciotiendaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IniciotiendaPageRoutingModule {}
