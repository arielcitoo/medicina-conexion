
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
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    ],
  templateUrl: './prelogin.html',
  styleUrl: './prelogin.css',
})
export class Prelogin implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdRef = inject(ChangeDetectorRef); // 🔥 AÑADE ESTA LÍNEA

  preloginForm: FormGroup;
  isLoading = false;
  empresaEncontrada: any = null;
  mensajeError: string = '';
  busquedaRealizada = false;

  // Ejemplos de números patronales
  ejemplos = [
    '01-730-00001',
    '01-730-00002',
    '01-730-00003',
    '01-730-00004'
  ];

  constructor() {
    this.preloginForm = this.fb.group({
      numeroPatronal: ['', [
        Validators.required,
        Validators.pattern(/^\d{2}-\d{3}-\d{5}$/),
        Validators.minLength(12),
        Validators.maxLength(12)
      ]]
    });
  }

  ngOnInit(): void {
    // Usar setTimeout para evitar el error de detección de cambios
    setTimeout(() => {
      const empresaExistente = this.authService.getEmpresaExamen();
      if (empresaExistente) {
        this.empresaEncontrada = empresaExistente;
        this.mostrarMensaje(`Sesión activa: ${empresaExistente.RazonSocial}`, 'success');
        this.cdRef.detectChanges(); // 🔥 FORZAR DETECCIÓN DE CAMBIOS
      }
    }, 0);
  }

  /**
   * Manejar envío del formulario - CORREGIDO
   */
  onSubmit(): void {
    if (this.preloginForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const numeroPatronal = this.preloginForm.get('numeroPatronal')?.value;

    // Usar setTimeout para evitar el error de detección de cambios
    setTimeout(() => {
      this.buscarEmpresa(numeroPatronal);
    }, 0);
  }

  /**
   * Buscar empresa en el sistema - CORREGIDO
   */
  private buscarEmpresa(numeroPatronal: string): void {
    // Usar setTimeout para asegurar que Angular complete el ciclo actual
    setTimeout(() => {
      this.isLoading = true;
      this.empresaEncontrada = null;
      this.mensajeError = '';
      this.busquedaRealizada = true;

      // Forzar detección de cambios
      this.cdRef.detectChanges();
    }, 0);

    this.authService.buscarEmpresa(numeroPatronal).subscribe({
      next: (response) => {
        // Usar setTimeout para manejar la respuesta en el próximo ciclo
        setTimeout(() => {
          this.isLoading = false;

          if (response.success && response.empresa) {
            this.empresaEncontrada = response.empresa;

            // Guardar empresa específicamente para exámenes
            this.authService.guardarEmpresaExamen(response.empresa);

            this.mostrarMensaje(`✓ Empresa verificada: ${response.empresa.RazonSocial}`, 'success');

            // Redirigir al examen preocupacional después de un breve delay
            setTimeout(() => {
              this.router.navigate(['/examen-preocupacional']);
            }, 1500);
          }

          // Forzar detección de cambios
          this.cdRef.detectChanges();
        }, 0);
      },
      error: (error) => {
        // Usar setTimeout para manejar el error en el próximo ciclo
        setTimeout(() => {
          this.isLoading = false;
          this.mensajeError = error.mensaje || 'Error al verificar la empresa';
          this.mostrarMensaje(this.mensajeError, 'error');

          // Forzar detección de cambios
          this.cdRef.detectChanges();
        }, 0);
      }
    });
  }

  /**
   * Cargar ejemplo de número patronal - CORREGIDO
   */
  cargarEjemplo(numero: string): void {
    this.preloginForm.patchValue({ numeroPatronal: numero });

    // Usar setTimeout para evitar el error de detección de cambios
    setTimeout(() => {
      this.mostrarMensaje(`Ejemplo cargado: ${numero}. Haga clic en "Verificar Empresa" para continuar.`, 'info');
    }, 0);
  }

  /**
   * Limpiar formulario - CORREGIDO
   */
  limpiar(): void {
    this.preloginForm.reset();
    this.empresaEncontrada = null;
    this.mensajeError = '';
    this.busquedaRealizada = false;
    this.authService.limpiarDatosExamen();

    // Usar setTimeout para evitar el error de detección de cambios
    setTimeout(() => {
      this.mostrarMensaje('Formulario limpiado. Ingrese su número patronal.', 'info');
      this.cdRef.detectChanges();
    }, 0);
  }

  /**
   * Mostrar mensaje en snackbar
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    // Usar setTimeout para mostrar el snackbar en el próximo ciclo
    setTimeout(() => {
      this.snackBar.open(mensaje, 'Cerrar', {
        duration: 5000,
        panelClass: [`snackbar-${tipo}`],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }, 0);
  }

  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.preloginForm.controls).forEach(key => {
      const control = this.preloginForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });

    this.mostrarMensaje('Por favor, complete correctamente el número patronal', 'error');
  }

  /**
   * Métodos getter - CORREGIDOS para evitar cambios asíncronos
   */
  get empresaActiva(): boolean {
    // Evitar cambios durante la detección de cambios
    if (!this.empresaEncontrada?.Estado) return false;

    // Usar un valor fijo hasta el próximo ciclo
    const estado = this.empresaEncontrada.Estado.toUpperCase();
    const activa = estado.includes('ACTIV') || estado === 'A' || estado === '1' || estado.includes('VIGENTE');

    return activa;
  }

  get textoBotonPrincipal(): string {
    // Calcular de forma síncrona
    if (this.isLoading) return 'Verificando...';
    if (this.empresaEncontrada && this.empresaActiva) return 'Ingresar al Registro';
    if (this.empresaEncontrada && !this.empresaActiva) return 'Empresa Inactiva';
    return 'Verificar Empresa';
  }

  get botonPrincipalHabilitado(): boolean {
    // Calcular de forma síncrona
    if (this.isLoading) return false;
    if (this.empresaEncontrada && this.empresaActiva) return true;
    return this.preloginForm.valid;
  }

  /**
   * Verificar si hay errores en el campo
   */
  tieneError(controlName: string, errorType: string): boolean {
    const control = this.preloginForm.get(controlName);
    return control ? control.hasError(errorType) && (control.touched || control.dirty) : false;
  }

  // 🔥 AÑADE ESTOS MÉTODOS QUE FALTAN EN EL TEMPLATE
  onKeyPress(event: KeyboardEvent): void {
    const allowedKeys = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      '-',
      'Backspace', 'Delete', 'Tab', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d-]/g, '');

    if (value.length > 2 && value.charAt(2) !== '-') {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    if (value.length > 6 && value.charAt(6) !== '-') {
      value = value.slice(0, 6) + '-' + value.slice(6);
    }

    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    this.preloginForm.patchValue({ numeroPatronal: value }, { emitEvent: false });
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    let pastedText = clipboardData.getData('text');
    pastedText = pastedText.replace(/[^\d-]/g, '');

    if (pastedText.length > 2 && pastedText.charAt(2) !== '-') {
      pastedText = pastedText.slice(0, 2) + '-' + pastedText.slice(2);
    }
    if (pastedText.length > 6 && pastedText.charAt(6) !== '-') {
      pastedText = pastedText.slice(0, 6) + '-' + pastedText.slice(6);
    }

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = this.preloginForm.get('numeroPatronal')?.value || '';

    const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);

    this.preloginForm.patchValue({ numeroPatronal: newValue }, { emitEvent: true });
  }

  // Añade este método a la clase Prelogin
esBotonHabilitado(): boolean {
  // Versión síncrona y segura
  if (this.isLoading) return false;

  // Usar detección local en lugar de getters
  if (this.empresaEncontrada) {
    const estado = this.empresaEncontrada?.Estado?.toUpperCase() || '';
    const activa = estado.includes('ACTIV') || estado === 'A' ||
                   estado === '1' || estado.includes('VIGENTE');

    if (this.empresaEncontrada && activa) return true;
  }

  return this.preloginForm.valid;
}
}
