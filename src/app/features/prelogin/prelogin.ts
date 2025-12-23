
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { Component, OnInit, inject,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';





@Component({
  selector: 'app-prelogin',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  
    ],
  templateUrl: './prelogin.html',
  styleUrl: './prelogin.css',
})
export class Prelogin implements OnInit {
  preloginForm: FormGroup;
  isLoading = false;
  empresaEncontrada: any = null;
  mensajeError: string = '';
  busquedaRealizada = false;
  debugMode = false; // Cambiar a true solo para desarrollo

  ejemplos = ['01-730-00001', '01-730-00002', '01-730-00003'];
  redireccionEnProgreso = false;
  contadorRedireccion = 3;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {
    this.preloginForm = this.fb.group({
      numeroPatronal: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(12),
        Validators.pattern(/^\d{2}-\d{3}-\d{5}$/)
      ]]
    });

    // Verificar si ya hay una empresa verificada
    this.verificarEmpresaAlmacenada();
  }

  ngOnInit(): void {
    console.log('✅ Prelogin inicializado');
    
    // Auto-cargar ejemplo para pruebas
    setTimeout(() => {
      if (this.debugMode) {
        this.cargarEjemplo('01-730-00001');
      }
    }, 100);
  }

  /**
   * Verificar si ya hay una empresa almacenada
   */
  private verificarEmpresaAlmacenada(): void {
    const empresa = this.authService.getEmpresaExamen();
    if (empresa && this.authService.estaActiva(empresa)) {
      console.log('🏢 Empresa ya verificada encontrada:', empresa.razonSocial);
      
      // Mostrar información de la empresa ya verificada
      this.empresaEncontrada = empresa;
      this.busquedaRealizada = true;
      
      // Verificar si puede acceder directamente
      if (this.authService.puedeAccederExamen()) {
        console.log('🔄 Redirigiendo automáticamente...');
        this.iniciarRedireccionAutomatica();
      }
    }
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    console.log('🚀 Enviando formulario...');
    
    if (this.preloginForm.invalid) {
      this.mostrarMensaje('Ingrese un número patronal válido', 'error');
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.preloginForm.controls).forEach(key => {
        this.preloginForm.get(key)?.markAsTouched();
      });
      
      return;
    }

    const numeroPatronal = this.preloginForm.get('numeroPatronal')?.value;
    this.buscarEmpresa(numeroPatronal);
  }

  /**
   * Buscar empresa en el sistema CNS
   */
  private buscarEmpresa(numeroPatronal: string): void {
    console.log('🔍 Buscando empresa:', numeroPatronal);
    
    this.isLoading = true;
    this.mensajeError = '';
    this.empresaEncontrada = null;
    this.busquedaRealizada = false;
    this.redireccionEnProgreso = false;

    // Forzar actualización de UI
    this.cdRef.detectChanges();

    this.authService.buscarEmpresa(numeroPatronal).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa:', response);
        
        this.isLoading = false;
        this.busquedaRealizada = true;
        
        if (response.success) {
          this.empresaEncontrada = response.empresa;
          
          // Guardar empresa en localStorage y sessionStorage
          this.authService.guardarEmpresaExamen(response.empresa);
          
          this.mostrarMensaje(response.mensaje, 'success');
          
          // Si está activa, iniciar redirección
          if (this.empresaActiva) {
            console.log('🏢 Empresa activa, preparando redirección...');
            this.iniciarRedireccionAutomatica();
          }
        }
        
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error en búsqueda:', error);
        
        this.isLoading = false;
        this.busquedaRealizada = true;
        this.empresaEncontrada = null;
        this.mensajeError = error.mensaje || 'Error desconocido al buscar empresa';
        
        this.mostrarMensaje(this.mensajeError, 'error');
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Iniciar redirección automática
   */
  private iniciarRedireccionAutomatica(): void {
    if (this.redireccionEnProgreso) return;
    
    this.redireccionEnProgreso = true;
    this.contadorRedireccion = 3;
    
    console.log('⏱️ Iniciando cuenta regresiva para redirección...');
    
    const intervalo = setInterval(() => {
      this.contadorRedireccion--;
      this.cdRef.detectChanges();
      
      if (this.contadorRedireccion <= 0) {
        clearInterval(intervalo);
        this.redirigirAExamen();
      }
    }, 1000);
  }

  /**
   * Redirigir manualmente al examen
   */
  redirigirAhora(): void {
    if (this.empresaEncontrada && this.empresaActiva) {
      console.log('🎯 Redirección manual solicitada');
      this.redirigirAExamen();
    } else {
      this.mostrarMensaje('La empresa no está activa o no se encontró', 'error');
    }
  }

  /**
   * Redirigir a la página de examen
   */
  private redirigirAExamen(): void {
    console.log('🔄 Redirigiendo a examen-preocupacional...');
    
    // Verificar nuevamente antes de redirigir
    if (!this.authService.puedeAccederExamen()) {
      console.error('❌ No se puede acceder al examen');
      this.mostrarMensaje('No tiene permisos para acceder al examen', 'error');
      return;
    }
    
    // Navegar a la ruta
    this.router.navigate(['/examen-preocupacional']).then(success => {
      if (success) {
        console.log('✅ Redirección exitosa');
      } else {
        console.error('❌ Error en redirección');
        this.mostrarMensaje('Error al acceder al examen', 'error');
      }
    });
  }

  /**
   * Cargar ejemplo
   */
  cargarEjemplo(numero: string): void {
    console.log('📥 Cargando ejemplo:', numero);
    this.preloginForm.patchValue({ numeroPatronal: numero });
    this.preloginForm.get('numeroPatronal')?.markAsDirty();
    this.mostrarMensaje(`Ejemplo cargado: ${numero}`, 'info');
  }

  /**
   * Limpiar formulario
   */
  limpiar(): void {
    console.log('🧹 Limpiando formulario...');
    
    this.preloginForm.reset();
    this.empresaEncontrada = null;
    this.mensajeError = '';
    this.busquedaRealizada = false;
    this.redireccionEnProgreso = false;
    
    // Limpiar datos almacenados
    this.authService.limpiarDatosExamen();
    
    this.mostrarMensaje('Formulario limpiado', 'info');
    this.cdRef.detectChanges();
  }

  /**
   * Mostrar mensaje toast
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: [`snackbar-${tipo}`]
    });
  }

  /**
   * Getters
   */
  get empresaActiva(): boolean {
    return this.authService.estaActiva(this.empresaEncontrada);
  }

  get textoBotonPrincipal(): string {
    if (this.isLoading) return 'Verificando...';
    if (this.empresaEncontrada && this.empresaActiva) return 'Ingresar al Registro';
    if (this.empresaEncontrada && !this.empresaActiva) return 'Empresa Inactiva';
    return 'Verificar Empresa';
  }

  get botonPrincipalHabilitado(): boolean {
    return this.preloginForm.valid && !this.isLoading;
  }

  /**
   * Verificar errores del formulario
   */
  tieneError(controlName: string, errorType: string): boolean {
    const control = this.preloginForm.get(controlName);
    return control ? control.hasError(errorType) && (control.touched || control.dirty) : false;
  }

  /**
   * Evento onBlur
   */
  onBlur(): void {
  console.log(' Campo perdió el foco');
  
  const control = this.preloginForm.get('numeroPatronal');
  
  // Verificar que el control existe
  if (!control) {
    console.error('❌ Control "numeroPatronal" no encontrado');
    return;
  }
  
  let valor = control.value;
  
  if (valor) {
    // Limpiar y formatear
    valor = valor.trim().toUpperCase();
    
    // Solo actualizar si el valor cambió
    if (valor !== control.value) {
      control.setValue(valor, { emitEvent: false });
    }
    
    // Marcar como tocado para mostrar errores
    control.markAsTouched();
    
    // Actualizar validación
    control.updateValueAndValidity();
    
    console.log(' Campo validado:', valor);
  }
}

  /**
   * Evento onKeyPress
   */
  onKeyPress(event: KeyboardEvent): void {
    const allowed = /[0-9-]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/;
    if (!allowed.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Evento onInput
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d-]/g, '');
    
    // Autoformatear
    if (value.length > 2 && value.charAt(2) !== '-') {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    if (value.length > 6 && value.charAt(6) !== '-') {
      value = value.slice(0, 6) + '-' + value.slice(6);
    }
    
    if (value.length > 12) {
      value = value.slice(0, 12);
    }
    
    this.preloginForm.patchValue({ numeroPatronal: value });
  }
}