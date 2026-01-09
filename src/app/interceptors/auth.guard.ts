// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { EmpresaService } from '../service/empresa.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
   constructor(
    private empresaService: EmpresaService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('Verificando acceso a examen-preocupacional...');
    
    // Verificar si hay una empresa verificada y activa
    const puedeAcceder = this.empresaService.puedeAccederExamen();
    
    if (!puedeAcceder) {
      console.warn(' Acceso denegado. Redirigiendo a prelogin...');
      
      // Redirigir al prelogin
      this.router.navigate(['/prelogin']);
      return false;
    }
    
    console.log(' Acceso permitido');
    return true;
  }
}