import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AuthCnsService } from '../../../../core/service/auth-cns.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login-admin.html',
  styleUrls: ['./login-admin.css']
})
export class LoginAdmin implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthCnsService);
  private readonly snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Verificar si ya hay una sesión activa
    this.verificarSesionActiva();
  }

  private verificarSesionActiva(): void {
    if (this.authService.isAuthenticated()) {
      const esAdmin = this.authService.isAdmin();
      const tienePermiso = this.authService.hasPermission('administrar_citas');
      
      if (esAdmin || tienePermiso) {
        this.router.navigate(['/admin-citas']);
      }
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(username, password).subscribe({
      next: (response: any) => {
        // El servicio ya maneja la autenticación y almacenamiento
        this.isLoading = false;
        
        // Verificar permisos
        const esAdmin = this.authService.isAdmin();
        const tienePermiso = this.authService.hasPermission('administrar_citas');
        
        if (esAdmin || tienePermiso) {
          this.mostrarMensaje('Login exitoso');
          this.router.navigate(['/admin-citas']);
        } else {
          this.errorMessage = 'No tiene permisos para acceder al sistema de administración de citas';
          this.authService.logout();
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status === 401 || error.status === 400) {
          this.errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifique su conexión a internet';
        } else {
          this.errorMessage = 'Error en el servidor. Intente nuevamente';
        }
        
        console.error('Error en login:', error);
      }
    });
  }

  private mostrarMensaje(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  irAHome(): void {
    this.router.navigate(['/home']);
  }
}