import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tienda',
    loadChildren: () => import('./pages/tienda/tienda.module').then(m => m.TiendaPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'iniciotienda',
    pathMatch: 'full'
  },
  {
    path: 'iniciotienda',
    loadChildren: () => import('./pages/iniciotienda/iniciotienda.module').then(m => m.IniciotiendaPageModule)
  },
  {
    path: 'dtproducto/:idproducto',  // Modificado para incluir el parámetro idproducto
    loadChildren: () => import('./pages/dtproducto/dtproducto.module').then(m => m.DtproductoPageModule)
  },
  {
    path: 'ayuda',
    loadChildren: () => import('./pages/ayuda/ayuda.module').then(m => m.AyudaPageModule)
  },
  {
    path: 'carro',
    loadChildren: () => import('./pages/carro/carro.module').then(m => m.CarroPageModule)
  },
  {
    path: 'change-password',
    loadChildren: () => import('./change-password/change-password.module').then(m => m.ChangePasswordPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'user-profile',
    loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfilePageModule)
  },
  {
    path: 'edit-user/:username',
    loadChildren: () => import('./pages/edit-user/edit-user.module').then(m => m.EditUserPageModule)
  },
  {
    path: 'historial-compras',
    loadChildren: () => import('./pages/historial-compras/historial-compras.module').then( m => m.HistorialComprasPageModule)
  },
  {
    path: 'resumen-ventas',
    loadChildren: () => import('./pages/resumen-ventas/resumen-ventas.module').then( m => m.ResumenVentasPageModule)
  },
  {
    path: '**',
    loadChildren: () => import('./pages/notfound/notfound.module').then( m => m.NotfoundPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
