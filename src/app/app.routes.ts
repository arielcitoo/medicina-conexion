// app-routing.module.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './interceptors/auth.guard';

export const routes: Routes = [

  { path: '',
    redirectTo: '/login', 
    pathMatch: 'full' 
  },

  { 
    path: 'login', 
    loadComponent: () => import('./features/examenes-preocupacionales/components/login/login').then(m => m.Login)
  },

  { 
    path: 'prelogin', 
    loadComponent: () => import('./features/prelogin/prelogin').then(m => m.Prelogin)
  },

  { 
    path: 'busqueda', 
    loadComponent: () => import('./features/examenes-preocupacionales/components/busqueda/busqueda').then(m => m.Busqueda)
  },

 { 
    path: 'examen-preocupacional', 
    loadComponent: () => import('./features/examenes-preocupacionales/examen-preocupacional/examen-preocupacional').then(m => m.ExamenPreocupacional),
    canActivate: [AuthGuard]
  },
{ 
    path: '**', 
    redirectTo: 'prelogin'
} 
 ];

