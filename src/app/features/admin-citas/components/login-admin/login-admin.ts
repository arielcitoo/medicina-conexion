// features/admin-citas/components/login-admin/login-admin.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCnsService } from '../../../../core/service/auth-cns.service';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.html',
  styleUrls: ['./login-admin.css']
})
export class LoginAdmin {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private authService: AuthCnsService,
    private router: Router
  ) {}
  
  login(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        // Verificar si es admin después del login
        if (this.authService.isAdmin() || this.authService.hasPermission('administrar_citas')) {
          this.router.navigate(['/admin-citas']);
        } else {
          this.errorMessage = 'No tiene permisos para acceder al sistema de citas';
          this.authService.logout();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Credenciales incorrectas o error de conexión';
        console.error('Error en login:', error);
        this.isLoading = false;
      }
    });
  }
}