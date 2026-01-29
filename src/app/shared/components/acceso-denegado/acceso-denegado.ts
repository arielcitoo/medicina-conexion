// shared/components/acceso-denegado/acceso-denegado.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../modules/material.module';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, SharedMaterialModule],
  templateUrl: './acceso-denegado.html',
  styleUrls: ['./acceso-denegado.css']
})
export class AccesoDenegado implements OnInit {
  // Información del usuario para mostrar contexto
  userInfo: any = null;
  requiredRoles: string[] = ['admin', 'administrador_citas'];
  requiredPermissions: string[] = ['administrar_citas'];
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Obtener información del usuario desde localStorage
    this.loadUserInfo();
  }
  
  private loadUserInfo(): void {
    try {
      const userData = localStorage.getItem('cns_auth_data');
      if (userData) {
        this.userInfo = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error cargando información del usuario:', error);
    }
  }
  
  // Métodos para obtener información útil
  getUsuarioNombre(): string {
    return this.userInfo?.nombreCompleto || this.userInfo?.username || 'Usuario';
  }
  
  getUsuarioRoles(): string[] {
    return this.userInfo?.roles || [];
  }
  
  getUsuarioPermisos(): string[] {
    return this.userInfo?.permisos || [];
  }
  
  getRolesFaltantes(): string[] {
    const userRoles = this.getUsuarioRoles();
    return this.requiredRoles.filter(role => !userRoles.includes(role));
  }
  
  getPermisosFaltantes(): string[] {
    const userPermisos = this.getUsuarioPermisos();
    return this.requiredPermissions.filter(permiso => !userPermisos.includes(permiso));
  }
  
  // Navegación
  volverAlInicio(): void {
    this.router.navigate(['/']);
  }
  
  irALogin(): void {
    this.router.navigate(['/login']);
  }
  
  contactarSoporte(): void {
    // Puedes abrir email o redirigir a página de contacto
    window.location.href = 'mailto:soporte.sistemas@cns.gob.bo';
  }
  
  cerrarSesion(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}