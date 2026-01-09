
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../service/empresa.service';
import { Component, OnInit, OnDestroy, inject,ChangeDetectorRef} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SesionService } from '../../service/sesion.service';
import { SharedMaterialModule } from '../../shared/modules/material.module'; //Angular Material módulos compartidos


@Component({
  selector: 'app-prelogin',
  standalone: true,
  imports: [ SharedMaterialModule ],
  templateUrl: './prelogin.html',
  styleUrl: './prelogin.css',
})
export class Prelogin implements OnInit,OnDestroy  {
  preloginForm: FormGroup;
  isLoading = false;
  empresaEncontrada: any = null;
  mensajeError: string = '';
  busquedaRealizada = false;
  debugMode = false; // Cambiar a true solo para desarrollo

   // Estados para redirección manual
  redireccionEnProgreso = false;
  redireccionando = false;

 // ejemplos = ['01-730-00001', '01-730-00002', '01-730-00003'];

  contadorRedireccion = 3;

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef,
    private sesionService: SesionService
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
    console.log(' Prelogin inicializado');
    
    // Auto-cargar ejemplo para pruebas
    // setTimeout(() => {
    //   if (this.debugMode) {
    //     this.cargarEjemplo('01-730-00001');
    //   }
    // }, 100);
  }

  ngOnDestroy(): void {
    // Limpiar cualquier timeout pendiente
    this.redireccionEnProgreso = false;
  }


  /**
   * Verificar si ya hay una empresa almacenada
   */
  private verificarEmpresaAlmacenada(): void {
    const empresa = this.empresaService.getEmpresaExamen();
    if (empresa && this.empresaService.estaActiva(empresa)) {
      console.log(' Empresa ya verificada encontrada:', empresa.razonSocial);
      
      // Mostrar información de la empresa ya verificada
      this.empresaEncontrada = empresa;
      this.busquedaRealizada = true;
      
       this.mostrarMensaje(`Empresa ${empresa.razonSocial} ya verificada`, 'info');
      
      // Forzar actualización de UI
      this.cdRef.detectChanges();
    }
  }
  /**
   * Enviar formulario
   */
  onSubmit(): void {
    console.log(' Enviando formulario...');
    
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

    this.empresaService.buscarEmpresa(numeroPatronal).subscribe({
      next: (response) => {
        console.log(' Respuesta exitosa:', response);
        if (response.success) {
          this.empresaEncontrada = response.empresa;
           // Guardar empresa (esto emitirá el cambio al header)
          this.empresaService.guardarEmpresaExamen(response.empresa);
          this.sesionService.actualizarPaso(1, { empresa: response.empresa });
        }
        
        
        this.isLoading = false;
        this.busquedaRealizada = true;
        
        if (response.success) {
          this.empresaEncontrada = response.empresa;
          
          // Guardar empresa en localStorage y sessionStorage
          this.empresaService.guardarEmpresaExamen(response.empresa);
          
          this.mostrarMensaje(response.mensaje, 'success');
          
           }
        
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error(' Error en búsqueda:', error);
        
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
   * Redirigir manualmente al examen
   */
  redirigirAhora(): void {
    if (this.redireccionando) {
      console.log(' Redirección ya en progreso...');
      return;
    }

    if (!this.empresaEncontrada) {
      this.mostrarMensaje('Primero debe verificar una empresa', 'error');
      return;
    }

    if (!this.empresaActiva) {
      this.mostrarMensaje('La empresa no está activa', 'error');
      return;
    }

    console.log(' Usuario solicitó redirección manual');
    
    // Cambiar estado para mostrar feedback
    this.redireccionando = true;
    this.cdRef.detectChanges();

    // Pequeño delay para feedback visual
    setTimeout(() => {
      this.ejecutarRedireccion();
    }, 300);
  }

  /**
   * Ejecutar redirección real
   */
  private ejecutarRedireccion(): void {
    // Verificar nuevamente con el servicio
    this.empresaService.redirigirAExamen()
      .then(() => {
        console.log(' Redirigiendo a examen-preocupacional...');
        
        // Navegar a la ruta
        this.router.navigate(['/examen-preocupacional']).then(success => {
          this.redireccionando = false;
          
          if (success) {
            console.log(' Redirección exitosa');
          } else {
            console.error(' Error en redirección');
            this.mostrarMensaje('Error al acceder al examen. Intente nuevamente.', 'error');
            this.cdRef.detectChanges();
          }
        });
      })
      .catch(error => {
        console.error(' Error en verificación:', error);
        this.redireccionando = false;
        this.mostrarMensaje(error || 'No se puede acceder al examen', 'error');
        this.cdRef.detectChanges();
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
    console.log(' Limpiando formulario...');
    
    this.preloginForm.reset();
    this.empresaEncontrada = null;
    this.mensajeError = '';
    this.busquedaRealizada = false;
    this.redireccionando = false;
    
    // Limpiar datos almacenados
    this.empresaService.limpiarDatosExamen();
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
    return this.empresaService.estaActiva(this.empresaEncontrada);
  }

  get textoBotonPrincipal(): string {
    if (this.isLoading) return 'Verificando...';
    if (this.empresaEncontrada && this.empresaActiva) return 'Empresa Verificada';
    if (this.empresaEncontrada && !this.empresaActiva) return 'Empresa Inactiva';
    return 'Verificar Empresa';
  }

  get botonPrincipalHabilitado(): boolean {
    return this.preloginForm.valid && !this.isLoading;
  }

  /**
   * Texto del botón "Ingresar Ahora"
   */
  get textoBotonIngresar(): string {
    if (this.redireccionando) {
      return 'Redirigiendo...';
    }
    return 'Ingresar Ahora';
  }

  /**
   * Estado del botón "Ingresar Ahora"
   */
  get botonIngresarHabilitado(): boolean {
    return this.empresaEncontrada && 
           this.empresaActiva && 
           !this.redireccionando &&
           !this.isLoading;
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
    const control = this.preloginForm.get('numeroPatronal');
    
    if (!control) {
      console.error(' Control "numeroPatronal" no encontrado');
      return;
    }
    
    let valor = control.value;
    
    if (valor) {
      valor = valor.trim().toUpperCase();
      
      if (valor !== control.value) {
        control.setValue(valor, { emitEvent: false });
      }
      
      control.markAsTouched();
      control.updateValueAndValidity();
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