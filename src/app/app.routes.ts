// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Home } from './features/home/home'; // Asegúrate de tener este componente
import { Citas } from './features/citas/citas';
import { Busqueda } from './features/busqueda/busqueda';
import { Prelogin } from './features/prelogin/prelogin';

export const routes: Routes = [
  
  { path: 'home', component: Home },
  { path: 'prelogin', component: Prelogin },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'citas', component: Citas },
  { path: 'busqueda', component: Busqueda },
   { path: '**', redirectTo: '' }
];