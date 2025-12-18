
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Component, OnInit, signal, computed } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ExamenService } from '../../service/examen.service';
import { Asegurado } from '../../interfaces/examen.interface';



// Angular Material Modules
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-modal-asegurado',
  imports: [
    CommonModule,

    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,

    // Angular Material Modules
    MatProgressSpinnerModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule],
  templateUrl: './modal-asegurado.html',
  styleUrl: './modal-asegurado.css',
})
export class ModalAsegurado implements OnInit {
  aseguradoForm: FormGroup;
  
  // Usando signals
  isLoading = false;
  datosAsegurado: Asegurado | null = null;
  busquedaRealizada = false;
  errorBusqueda = '';



  // Computed signals

  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalAsegurado>,
    private examenService: ExamenService,
    private snackBar: MatSnackBar
  ) {
    this.aseguradoForm = this.fb.group({
      ci: ['', [
        Validators.required, 
        Validators.pattern('^[0-9]{7,10}[a-zA-Z]?$'),
        Validators.minLength(7),
        Validators.maxLength(10)
      ]],
      fechaNacimiento: ['', Validators.required],
      nombreCompleto: [{ value: '', disabled: true }],
      documentoIdentidad: [{ value: '', disabled: true }],
      correoElectronico: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  ngOnInit(): void {
    this.aseguradoForm.get('ci')?.valueChanges.subscribe(() => {
      if (this.busquedaRealizada) {
        this.resetearResultados();
      }
    });

    this.aseguradoForm.get('fechaNacimiento')?.valueChanges.subscribe(() => {
      if (this.busquedaRealizada){
        this.resetearResultados();
      }
    });
  }
  /**
   * Resetear resultados de búsqueda
   */
  private resetearResultados(): void {
    this.busquedaRealizada = false;
    this.datosAsegurado = null;
    this.errorBusqueda = '';
    this.aseguradoForm.patchValue({
      nombreCompleto: '',
      documentoIdentidad: ''
    });
  }

    /**
   * Validar formato de CI
   */
  private validarFormatoCI(ci: string): boolean {
    // Patrón: 7-10 dígitos, opcionalmente seguido de 1-2 letras
    const pattern = /^[0-9]{7,10}[a-zA-Z]{0,2}$/;
    return pattern.test(ci);
  }

  buscarAsegurado(): void {
    const ci = this.aseguradoForm.get('ci')?.value?.trim();
    const fechaNacimiento = this.aseguradoForm.get('fechaNacimiento')?.value;

    if (!ci || !fechaNacimiento) {
      this.mostrarSnackbar('Complete CI y fecha de nacimiento', 'error');
      return;
    }

    if (!this.validarFormatoCI(ci)) {
      this.mostrarSnackbar('Formato de CI inválido. Ejemplo: 1234567LP', 'error');
      return;
    }

    this.isLoading=true;
    this.busquedaRealizada=false;
    this.errorBusqueda='';
    this.datosAsegurado=null;

    this.examenService.buscarAsegurado(ci, fechaNacimiento).subscribe({
      next: (response) => {
        this.isLoading=false;
        this.busquedaRealizada=true;

        if (response.success && response.data) {
          this.datosAsegurado = response.data;
          
          this.aseguradoForm.patchValue({
            nombreCompleto: response.data.nombreCompleto,
            documentoIdentidad: response.data.documentoIdentidad,
            correoElectronico: response.data.correoElectronico,
            celular: response.data.celular
          });

          // Habilitar/deshabilitar campos
          if (!response.data.correoElectronico) {
            this.aseguradoForm.get('correoElectronico')?.enable();
            this.aseguradoForm.get('correoElectronico')?.setValidators([Validators.required, Validators.email]);
          } else {
            this.aseguradoForm.get('correoElectronico')?.disable();
            this.aseguradoForm.get('correoElectronico')?.clearValidators();
          }

          if (!response.data.celular) {
            this.aseguradoForm.get('celular')?.enable();
            this.aseguradoForm.get('celular')?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
          } else {
            this.aseguradoForm.get('celular')?.disable();
            this.aseguradoForm.get('celular')?.clearValidators();
          }

          this.aseguradoForm.get('correoElectronico')?.updateValueAndValidity();
          this.aseguradoForm.get('celular')?.updateValueAndValidity();

          this.mostrarSnackbar(response.mensaje || 'Asegurado encontrado', 'success');
        } else {
          this.errorBusqueda=response.mensaje || 'Asegurado no encontrado';
          this.mostrarSnackbar(this.errorBusqueda, 'error');
        }
      },
      error: (error) => {
        this.isLoading=false;
        this.busquedaRealizada=true;
        this.errorBusqueda='Error en la conexión con el servidor';
        this.mostrarSnackbar(this.errorBusqueda, 'error');
      }
    });
  }

  agregarAsegurado(): void {
    if (this.aseguradoForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const datos = this.datosAsegurado;
    if (!datos) {
      this.mostrarSnackbar('Debe buscar un asegurado primero', 'error');
      return;
    }

    const asegurado: Asegurado = {
      ...datos,
      correoElectronico: this.aseguradoForm.get('correoElectronico')?.value || '',
      celular: this.aseguradoForm.get('celular')?.value || ''
    };

    if (!asegurado.correoElectronico || !asegurado.celular) {
      this.mostrarSnackbar('Correo y celular son obligatorios', 'error');
      return;
    }

    this.dialogRef.close(asegurado);
    this.mostrarSnackbar('Asegurado agregado correctamente', 'success');
  }
  /**
   * Marcar campos como tocados para mostrar errores
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.aseguradoForm.controls).forEach(key => {
      const control = this.aseguradoForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cancelar
   */
  cancelar(): void {
    this.dialogRef.close();
  }

  /**
   * Mostrar notificación
   */
  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    });
  }

  /**
   * Verificar si se puede agregar
   */
  get puedeAgregar(): boolean {
    return this.aseguradoForm.valid && 
           !!this.datosAsegurado && 
           this.busquedaRealizada;
  }

  /**
   * Verificar si se puede buscar
   */
  get puedeBuscar(): boolean {
    const ci = this.aseguradoForm.get('ci')?.valid;
    const fecha = this.aseguradoForm.get('fechaNacimiento')?.valid;
    return !!ci && !!fecha && !this.isLoading;
  }

  /**
   * Obtener mensaje de error del campo CI
   */
  get ciError(): string {
    const control = this.aseguradoForm.get('ci');
    
    if (control?.errors?.['required']) {
      return 'El CI es obligatorio';
    }
    
    if (control?.errors?.['pattern'] || control?.errors?.['minlength'] || control?.errors?.['maxlength']) {
      return 'Formato: 7-10 dígitos + letra (ej: 1234567LP)';
    }
    
    return '';
  }
  maxFechaNacimiento(): Date {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() - 14); // Mínimo 14 años
  return fecha;
}
}