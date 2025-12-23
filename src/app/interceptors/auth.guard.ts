// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('🔒 Verificando acceso a examen-preocupacional...');
    
    // Verificar si hay una empresa verificada y activa
    const puedeAcceder = this.authService.puedeAccederExamen();
    
    if (!puedeAcceder) {
      console.warn('⛔ Acceso denegado. Redirigiendo a prelogin...');
      
      // Limpiar datos inválidos
      this.authService.limpiarDatosExamen();
      
      // Redirigir al prelogin
      this.router.navigate(['/prelogin']);
      return false;
    }
    
    console.log('✅ Acceso permitido');
    return true;
  }
}