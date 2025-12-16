import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestService } from './service/test.service';


@Component({
  selector: 'app-root',
  imports: [CommonModule,FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  cargando = false;
  datos: any = null;
  error: any = null;
  tokenInfo = '';
  tokenLength = 0;
  verTodosLosDatos = false;

  constructor(private testService: TestService) {}

  ngOnInit() {
    // Mostrar info del token al cargar
    this.mostrarInfoToken();
  }

  probarConexion() {
    this.cargando = true;
    this.datos = null;
    this.error = null;
    
    console.log('🚀 Iniciando prueba de conexión...');
    
    this.testService.getDatosAsegurado().subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa:', response);
        this.datos = response;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error en la conexión:', err);
        this.error = {
          status: err.status,
          message: this.getErrorMessage(err),
          details: err.error
        };
        this.cargando = false;
      }
    });
  }

  mostrarInfoToken() {
    // Mostrar info básica del token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    this.tokenLength = token.length;
    
    if (token.startsWith('eyJ')) {
      this.tokenInfo = 'JWT válido ✅';
    } else {
      this.tokenInfo = 'Token no reconocido ⚠️';
    }
  }

  getErrorMessage(err: any): string {
    if (err.status === 0) {
      return 'No hay conexión con el servidor. Verifica tu internet o si hay bloqueo CORS.';
    }
    if (err.status === 401) {
      return 'Token no autorizado. El token puede haber expirado.';
    }
    if (err.status === 404) {
      return 'Endpoint no encontrado. Verifica la URL.';
    }
    if (err.status === 500) {
      return 'Error interno del servidor.';
    }
    return err.message || 'Error desconocido';
  }

  getEstadoStyle(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    
    if (estadoLower.includes('activo')) {
      return 'color: #10b981; font-weight: bold;';
    }
    if (estadoLower.includes('inactivo')) {
      return 'color: #dc2626; font-weight: bold;';
    }
    if (estadoLower.includes('pendiente')) {
      return 'color: #f59e0b; font-weight: bold;';
    }
    
    return 'color: #6b7280;';
  }
}