// app-routing.module.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './interceptors/auth.guard';

export const routes: Routes = [

   {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  
  { 
    path: 'home', 
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },

  {
    path: 'admin-citas',
    loadComponent: () => import('./features/admin-citas/admin-citas/admin-citas').then(m => m.AdminCitas),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'admin_citas' }
  },

  { 
    path: 'login', 
    loadComponent: () => import('./features/examenes-preocupacionales/components/login/login').then(m => m.Login)
  },

  { 
    path: 'prelogin', 
    loadComponent: () => import('./features/examenes-preocupacionales/components/prelogin/prelogin').then(m => m.Prelogin)
  },
  
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin-citas/components/login-admin/login-admin').then(m => m.LoginAdmin)
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./shared/components/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegado)
  },

  { 
    path: 'busqueda', 
    loadComponent: () => import('./features/examenes-preocupacionales/components/busqueda-asegurados/busqueda-asegurados').then(m => m.Busqueda)
  },

 { 
    path: 'examen-preocupacional', 
    loadComponent: () => import('./features/examenes-preocupacionales/examen-preocupacional/examen-preocupacional').then(m => m.ExamenPreocupacional),
    canActivate: [AuthGuard]
  },
{ 
    path: '**', 
    redirectTo: 'home'
} 
 ];

