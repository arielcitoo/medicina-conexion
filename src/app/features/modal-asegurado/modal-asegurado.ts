import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
  isLoading = false;
  datosAsegurado: Asegurado | null = null;
  busquedaRealizada = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalAsegurado>,
    private examenService: ExamenService
  ) {
    this.aseguradoForm = this.fb.group({
      ci: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}[a-zA-Z]?$')]],
      fechaNacimiento: ['', Validators.required],
      nombreCompleto: [{ value: '', disabled: true }],
      documentoIdentidad: [{ value: '', disabled: true }],
      correoElectronico: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  ngOnInit(): void {}

  /**
   * Buscar asegurado en el sistema
   */
  buscarAsegurado(): void {
    const ci = this.aseguradoForm.get('ci')?.value;
    const fechaNacimiento = this.aseguradoForm.get('fechaNacimiento')?.value;

    if (!ci || !fechaNacimiento) {
      return;
    }

    this.isLoading = true;
    this.busquedaRealizada = false;

    this.examenService.buscarAsegurado(ci, fechaNacimiento).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.busquedaRealizada = true;

        if (response.success && response.data) {
          // Crear asegurado con ID
          this.datosAsegurado = {
            id: response.data.id || Date.now(), // Usar ID del servicio o temporal
            ci: ci,
            fechaNacimiento: fechaNacimiento,
            nombreCompleto: response.data.nombreCompleto,
            documentoIdentidad: response.data.documentoIdentidad || ci,
            correoElectronico: response.data.correoElectronico || '',
            celular: response.data.celular || ''
          };

          // Rellenar datos en el formulario
          this.aseguradoForm.patchValue({
            nombreCompleto: this.datosAsegurado.nombreCompleto,
            documentoIdentidad: this.datosAsegurado.documentoIdentidad,
            correoElectronico: this.datosAsegurado.correoElectronico,
            celular: this.datosAsegurado.celular
          });

          // Habilitar/deshabilitar campos según datos
          if (!response.data.correoElectronico) {
            this.aseguradoForm.get('correoElectronico')?.enable();
          } else {
            this.aseguradoForm.get('correoElectronico')?.disable();
          }

          if (!response.data.celular) {
            this.aseguradoForm.get('celular')?.enable();
          } else {
            this.aseguradoForm.get('celular')?.disable();
          }
        } else {
          this.datosAsegurado = null;
          this.resetearDatosAsegurado();
          this.mostrarError('Asegurado no encontrado');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.busquedaRealizada = true;
        this.datosAsegurado = null;
        this.resetearDatosAsegurado();
        this.mostrarError('Error al buscar asegurado');
        console.error('Error al buscar asegurado:', error);
      }
    });
  }

  /**
   * Resetear datos del asegurado
   */
  private resetearDatosAsegurado(): void {
    this.aseguradoForm.patchValue({
      nombreCompleto: '',
      documentoIdentidad: '',
      correoElectronico: '',
      celular: ''
    });
    this.aseguradoForm.get('correoElectronico')?.enable();
    this.aseguradoForm.get('celular')?.enable();
  }

  /**
   * Mostrar error
   */
  private mostrarError(mensaje: string): void {
    // Aquí podrías agregar un snackbar o alerta
    console.error(mensaje);
  }

  /**
   * Agregar asegurado
   */
  agregarAsegurado(): void {
    if (this.aseguradoForm.valid && this.datosAsegurado) {
      // Actualizar con datos del formulario
      const asegurado: Asegurado = {
        ...this.datosAsegurado,
        correoElectronico: this.aseguradoForm.get('correoElectronico')?.value,
        celular: this.aseguradoForm.get('celular')?.value
      };

      this.dialogRef.close(asegurado);
    }
  }

  /**
   * Cancelar
   */
  cancelar(): void {
    this.dialogRef.close();
  }

  /**
   * Verificar si se puede agregar
   */
  get puedeAgregar(): boolean {
    return this.aseguradoForm.valid &&
           !!this.datosAsegurado &&
           this.busquedaRealizada;
  }
}
