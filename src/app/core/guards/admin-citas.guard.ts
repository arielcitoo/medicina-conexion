// core/guards/admin-citas.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCnsService } from '../service/auth-cns.service';

export const adminCitasGuard = () => {
  const authService = inject(AuthCnsService);
  const router = inject(Router);
  
  // 1. Verificar autenticación
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  
  // 2. Verificar si es admin o tiene permisos específicos
  const isAdmin = authService.isAdmin();
  const hasPermission = authService.hasPermission('administrar_citas');
  
  if (!isAdmin && !hasPermission) {
    // Redirigir a acceso denegado con información del usuario
    router.navigate(['/acceso-denegado']);
    return false;
  }
  
  return true;
};