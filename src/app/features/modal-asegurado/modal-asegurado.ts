import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, formatDate } from '@angular/common';
import { Asegurado } from '../../interfaces/examen.interface';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService } from '../../service/api.service';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
  selector: 'app-modal-asegurado',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule],

  standalone: true,
  templateUrl: './modal-asegurado.html',
  styleUrl: './modal-asegurado.css',
})
export class ModalAsegurado implements OnInit {
  private apiService = inject(ApiService);

  aseguradoForm: FormGroup;
  isLoading = false;
  busquedaRealizada = false;
  errorBusqueda: string | null = null;
  datosAsegurado: Asegurado | null = null;
  puedeAgregar = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalAsegurado>,
    @Inject(MAT_DIALOG_DATA) public data: { maxAsegurados?: number }
  ) {
    this.aseguradoForm = this.fb.group({
      ci: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}[A-Za-z]?$')]],
      fechaNacimiento: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  ngOnInit(): void {
    this.aseguradoForm.valueChanges.subscribe(() => {
      this.actualizarPuedeAgregar();
    });
  }

  get ciError(): string {
    const ciControl = this.aseguradoForm.get('ci');
    if (ciControl?.hasError('required')) {
      return 'El CI es requerido';
    }
    if (ciControl?.hasError('pattern')) {
      return 'Formato: 7-10 dígitos + letra opcional';
    }
    return '';
  }

  maxFechaNacimiento(): Date {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() - 18);
    return fecha;
  }

  puedeBuscar(): boolean {
    const ciValid = this.aseguradoForm.get('ci')?.valid;
    const fechaValid = this.aseguradoForm.get('fechaNacimiento')?.valid;
    return ciValid === true && fechaValid === true;
  }

  buscarAsegurado(): void {
    if (!this.puedeBuscar()) return;

    this.isLoading = true;
    this.busquedaRealizada = false;
    this.errorBusqueda = null;
    this.datosAsegurado = null;

    const documento = this.aseguradoForm.get('ci')?.value;
    const fechaNacimiento = this.aseguradoForm.get('fechaNacimiento')?.value;

    // Usar formatDate en lugar de DatePipe
    const fechaFormateada = this.formatFechaParaAPI(fechaNacimiento);

    this.apiService.buscarAsegurado(documento, fechaFormateada)
      .pipe(
        map(response => this.mapearRespuestaApi(response, documento)),
        catchError(error => {
          console.error('Error al buscar asegurado:', error);
          this.errorBusqueda = this.obtenerMensajeError(error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.busquedaRealizada = true;
          this.actualizarPuedeAgregar();
        })
      )
      .subscribe(asegurado => {
        if (asegurado) {
          this.datosAsegurado = asegurado;

          if (!this.aseguradoForm.get('correoElectronico')?.value) {
            const emailPorDefecto = this.generarEmailPorDefecto(documento, asegurado.nombres);
            this.aseguradoForm.patchValue({
              correoElectronico: asegurado.correoElectronico || emailPorDefecto
            });
          }

          if (!this.aseguradoForm.get('celular')?.value) {
            this.aseguradoForm.patchValue({
              celular: asegurado.celular || '77777777'
            });
          }
        }
      });
  }

  /**
   * Formatea fecha sin usar DatePipe
   */
  private formatFechaParaAPI(fecha: Date | string): string {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Mapea la respuesta de la API
   */
  private mapearRespuestaApi(response: any, documento: string): Asegurado | null {
    console.log('Respuesta de la API:', response);

    if (!response || (Array.isArray(response) && response.length === 0)) {
      this.errorBusqueda = 'No se encontró un asegurado con los datos proporcionados';
      return null;
    }

    const datos = Array.isArray(response) ? response[0] : response;
    const nombreCompleto = `${datos.nombres || ''} ${datos.primerApellido || ''} ${datos.segundoApellido || ''}`.trim();

    return {
      id: datos.aseguradoId || datos.id || Date.now(),
      nombreCompleto: nombreCompleto || 'Nombre no disponible',
      documentoIdentidad: datos.documentoIdentidad || documento,
      ci: datos.documentoIdentidad || documento,
      fechaNacimiento: datos.fechaNacimiento || this.aseguradoForm.get('fechaNacimiento')?.value,
      correoElectronico: datos.correoElectronico || datos.email || '',
      celular: datos.celular || datos.telefono || datos.movil || '',
      genero: datos.genero || datos.sexo || 'N/D',
      primerApellido: datos.primerApellido,
      segundoApellido: datos.segundoApellido,
      nombres: datos.nombres,
      estado: datos.estado,
      aseguradoId: datos.aseguradoId,
      codigoAsegurado: datos.codigoAsegurado,
      edad: datos.edad,
      fechaAfiliacion: datos.fechaAfiliacion
    };
  }

  /**
   * Genera email por defecto
   */
  private generarEmailPorDefecto(documento: string, nombres?: string): string {
    const nombreUsuario = nombres?.toLowerCase().split(' ')[0] || 'usuario';
    const dominio = 'email.com';
    return `${nombreUsuario}.${documento.substring(0, 4)}@${dominio}`;
  }

  /**
   * Obtiene mensaje de error
   */
  private obtenerMensajeError(error: any): string {
    if (error.status === 404) {
      return 'No se encontró un asegurado con el CI y fecha de nacimiento proporcionados';
    } else if (error.status === 401) {
      return 'Error de autenticación. Verifique las credenciales del servicio';
    } else if (error.status === 500) {
      return 'Error interno del servidor. Intente nuevamente más tarde';
    } else if (error.status === 0) {
      return 'Error de conexión. Verifique su conexión a internet';
    }
    return `Error al buscar asegurado: ${error.message || 'Error desconocido'}`;
  }

  actualizarPuedeAgregar(): void {
    const formValid = this.aseguradoForm.valid;
    const tieneDatos = this.datosAsegurado !== null;
    this.puedeAgregar = formValid && tieneDatos;
  }

  agregarAsegurado(): void {
    if (!this.puedeAgregar || !this.datosAsegurado) return;

    const asegurado: Asegurado = {
      ...this.datosAsegurado,
      correoElectronico: this.aseguradoForm.get('correoElectronico')?.value,
      celular: this.aseguradoForm.get('celular')?.value
    };

    console.log('Asegurado a agregar:', asegurado);
    this.dialogRef.close(asegurado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
