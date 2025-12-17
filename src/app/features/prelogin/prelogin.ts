import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-prelogin',
  imports: [ReactiveFormsModule // ¡Asegúrate de importarlo aquí también!
    ,CommonModule],
  templateUrl: './prelogin.html',
  styleUrl: './prelogin.css',
})
export class Prelogin implements OnInit {
  preloginForm: FormGroup;
  cargando = false;
  mensaje = '';
  tipoMensaje: 'exito' | 'error' | 'info' = 'info';
  empresaEncontrada: any = null;

  // Ejemplos de números patronales
  ejemplos = [
    '01-730-00001',
    '01-730-00002', 
    '01-730-00003'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.preloginForm = this.fb.group({
      numeroPatronal: ['', [
        Validators.required,
        Validators.pattern(/^\d{2}-\d{3}-\d{5}$/)
      ]]
    });
  }

  ngOnInit(): void {
    this.mensaje = 'Ingrese su número patronal en formato: 01-730-00001';
    
    // Verificar si ya hay sesión
    if (this.authService.isLoggedIn()) {
      this.empresaEncontrada = this.authService.getEmpresaActual();
      this.mostrarMensaje(`Sesión activa: ${this.empresaEncontrada.RazonSocial}`, 'info');
    }
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    if (this.preloginForm.invalid) {
      this.mostrarMensaje('Formato incorrecto. Use: 01-730-00001', 'error');
      return;
    }

    const numeroPatronal = this.preloginForm.get('numeroPatronal')?.value;
    this.cargando = true;
    this.empresaEncontrada = null;
    
    this.authService.buscarEmpresa(numeroPatronal).subscribe({
      next: (response) => {
        this.cargando = false;
        
        if (response.success) {
          this.empresaEncontrada = response.empresa;
          this.mostrarMensaje(response.mensaje, 'exito');
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/programacion-citas']);
          }, 2000);
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarMensaje(error.mensaje, 'error');
      }
    });
  }

  /**
   * Cargar ejemplo - FUNCIÓN FALTANTE
   */
  cargarEjemplo(numero: string): void {
    this.preloginForm.patchValue({ numeroPatronal: numero });
    this.mostrarMensaje(`Ejemplo cargado: ${numero}. Presione "Verificar Empresa" para continuar.`, 'info');
  }

  /**
   * Limpiar formulario - FUNCIÓN FALTANTE
   */
  limpiar(): void {
    this.preloginForm.reset();
    this.empresaEncontrada = null;
    this.mensaje = 'Ingrese su número patronal en formato: 01-730-00001';
    this.tipoMensaje = 'info';
  }

  /**
   * Mostrar mensaje
   */
  mostrarMensaje(texto: string, tipo: 'exito' | 'error' | 'info'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
  }

  /**
   * Obtener texto del botón
   */
  get textoBoton(): string {
    if (this.cargando) return 'Verificando...';
    if (this.empresaEncontrada) return 'Ingresar al Sistema';
    return 'Verificar Empresa';
  }

  /**
   * Verificar si empresa está activa
   */
  get empresaActiva(): boolean {
    if (!this.empresaEncontrada) return false;
    const estado = this.empresaEncontrada.Estado?.toUpperCase() || '';
    return estado.includes('ACTIV') || estado === 'A' || estado === '1';
  }

  /**
   * Verificar si el campo es inválido y fue tocado
   */
  get campoInvalido(): boolean {
    const control = this.preloginForm.get('numeroPatronal');
    return control ? control.invalid && control.touched : false;
  }

  /**
   * Obtener mensaje de error del campo
   */
  get mensajeError(): string {
    const control = this.preloginForm.get('numeroPatronal');
    
    if (control?.errors?.['required']) {
      return 'El número patronal es obligatorio';
    }
    
    if (control?.errors?.['pattern']) {
      return 'Formato inválido. Use: 01-730-00001';
    }
    
    return '';
  }
}