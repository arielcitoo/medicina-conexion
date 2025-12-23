// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Home } from './features/home/home'; // Asegúrate de tener este componente
import { Citas } from './features/citas/citas';
import { Busqueda } from './features/busqueda/busqueda';
import { Prelogin } from './features/prelogin/prelogin';
import { ExamenPreocupacional } from './features/examen-preocupacional/examen-preocupacional';
import { AuthGuard } from './interceptors/auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: '/prelogin', pathMatch: 'full' },
  { path: 'prelogin', component: Prelogin },
  { path: 'home', component: Home },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'citas', component: Citas },
  { path: 'busqueda', component: Busqueda },
  { 
    path: 'examen-preocupacional', 
    component: ExamenPreocupacional,
    canActivate: [AuthGuard]  // <-- PROTEGER CON GUARD
  },
   { path: '**', redirectTo: '/prelogin' }
];
