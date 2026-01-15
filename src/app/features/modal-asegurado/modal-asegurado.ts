
import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AseguradoExamen, AseguradoBackend } from '../../interface/examen.interface'; // Cambiar import
import { AseguradosService } from '../../service/asegurados.service';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { SharedMaterialModule } from '../../shared/modules/material.module';
import { BusquedaAseguradoResponse } from '../../interface/asegurado.interface';
import { AseguradoCreateDTO } from '../../service/examen-preocupacional.service'; // Añadir este import




export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-modal-asegurado',
  imports: [SharedMaterialModule],

  standalone: true,
  templateUrl: './modal-asegurado.html',
  styleUrl: './modal-asegurado.css',
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ]
})
export class ModalAsegurado implements OnInit {
  private apiAseguradosService = inject(AseguradosService);
  private cdRef = inject(ChangeDetectorRef);

  aseguradoForm: FormGroup;
  isLoading = false;
  busquedaRealizada = false;
  errorBusqueda: string | null = null;
  datosAsegurado: AseguradoBackend | null = null; // Cambiar tipo a AseguradoBackend
  puedeAgregar = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalAsegurado>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      maxAsegurados?: number;
      empresaId?: number;
      empresaNombre?: string;
      empresaNit?: string;
    }
  ) {
    this.aseguradoForm = this.fb.group({
      ci: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}[A-Za-z]?$')]],
      fechaNacimiento: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      empresa: [data.empresaNombre || '', Validators.required], // Añadir campo empresa
      nitEmpresa: [data.empresaNit || '', Validators.required] // Añadir campo nitEmpresa
    });

    setTimeout(() => {
      this.aseguradoForm.get('correoElectronico')?.markAsTouched();
      this.aseguradoForm.get('celular')?.markAsTouched();
      this.actualizarPuedeAgregar();
    }, 100);
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
    const ciValid = this.aseguradoForm.get('ci')?.valid ?? false;
    const fechaValid = this.aseguradoForm.get('fechaNacimiento')?.valid ?? false;
    return ciValid && fechaValid;
  }

  /**
   * Formatea fecha para la API (formato YYYY-MM-DD)
   */
  private formatFechaParaAPI(fecha: Date | string): string {
    if (!fecha) return '';

    let date: Date;

    if (typeof fecha === 'string' && fecha.includes('/')) {
      const [dia, mes, anio] = fecha.split('/').map(Number);
      date = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
    } else {
      date = new Date(fecha);
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Mapea la respuesta del servicio a la interfaz AseguradoBackend
   */
  private mapearRespuestaApi(apiResponse: BusquedaAseguradoResponse, documento: string): AseguradoBackend | null {
  if (!apiResponse.success || !apiResponse.data) {
    this.errorBusqueda = apiResponse.message || 'No se encontró un asegurado con los datos proporcionados';
    return null;
  }

  const datos = apiResponse.data;

  const nombreCompleto = datos.nombreCompleto ||
                        `${datos.nombres || ''} ${datos.paterno || ''} ${datos.materno || ''}`.trim();

  // Retornar objeto AseguradoBackend
  return {
    id: datos.aseguradoId || 0, // ID del asegurado en el backend
    ci: datos.documentoIdentidad || documento,
    nombreCompleto: nombreCompleto || 'Nombre no disponible',
    documentoIdentidad: datos.documentoIdentidad || documento,
    fechaNacimiento: datos.fechaNacimiento || this.formatFechaParaAPI(this.aseguradoForm.get('fechaNacimiento')?.value),
    correoElectronico: datos.correoElectronico || '',
    celular: datos.celular || '',
    empresa: datos.razonSocial || this.data.empresaNombre || 'No especificada',
    nitEmpresa: datos.nroPatronal || this.data.empresaNit || '',
    genero: datos.genero || 'N/D',
    cargo: datos.cargo || '',
    area: datos.area || '',
    fechaIngreso: datos.fechaIngreso || '',
    primerApellido: datos.paterno,
    segundoApellido: datos.materno,
    nombres: datos.nombres,
    estado: datos.estadoAsegurado,
    codigoAsegurado: datos.matricula,
    edad: this.calcularEdad(datos.fechaNacimiento),
    empresaId: datos.empresaId || this.data.empresaId
  };
}

  /**
   * Calcula la edad a partir de la fecha de nacimiento
   */
  private calcularEdad(fechaNacimiento: string): number | undefined {
    if (!fechaNacimiento) return undefined;

    try {
      const fechaNac = new Date(fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();

      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }

      return edad;
    } catch {
      return undefined;
    }
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
    return error.message || 'Error al buscar asegurado';
  }

  /**
   * Actualiza si se puede agregar el asegurado
   */
  actualizarPuedeAgregar(): void {
    const tieneDatos = !!this.datosAsegurado;

    const correoControl = this.aseguradoForm.get('correoElectronico');
    const celularControl = this.aseguradoForm.get('celular');

    const correoValido = Boolean(
      correoControl?.valid &&
      correoControl.value?.trim().length > 0
    );

    const celularValido = Boolean(
      celularControl?.valid &&
      celularControl.value?.toString().length === 8
    );

    const empresaValida = this.aseguradoForm.get('empresa')?.valid ?? false;
    const nitEmpresaValido = this.aseguradoForm.get('nitEmpresa')?.valid ?? false;

    this.puedeAgregar = tieneDatos && correoValido && celularValido && empresaValida && nitEmpresaValido;
    this.cdRef.detectChanges();
  }

  /**
   * Agrega el asegurado y cierra el modal
   */
  agregarAsegurado(): void {
  if (!this.puedeAgregar || !this.datosAsegurado) {
    return;
  }

  // Formatear fecha correctamente
  const fechaNacimiento = this.datosAsegurado.fechaNacimiento;
  const fechaFormateada = this.formatFechaParaAPI(fechaNacimiento);
  
  // Crear AseguradoCreateDTO para enviar al componente padre
  const aseguradoDTO: AseguradoCreateDTO = {
    aseguradoId: this.datosAsegurado.id || 0,
    ci: this.aseguradoForm.get('ci')?.value || '',
    nombreCompleto: this.datosAsegurado.nombreCompleto || '',
    fechaNacimiento: fechaFormateada, // Usar fecha formateada
    genero: this.datosAsegurado.genero,
    correoElectronico: this.aseguradoForm.get('correoElectronico')?.value?.trim() || '',
    celular: this.aseguradoForm.get('celular')?.value?.toString() || '',
    empresa: this.aseguradoForm.get('empresa')?.value || '',
    nitEmpresa: this.aseguradoForm.get('nitEmpresa')?.value || ''
  };

  this.dialogRef.close(aseguradoDTO);
}

  cancelar(): void {
    this.dialogRef.close();
  }

  /**
   * Busca asegurado en la API
   */
  buscarAsegurado(): void {
    if (!this.puedeBuscar()) return;

    this.isLoading = true;
    this.busquedaRealizada = false;
    this.errorBusqueda = null;
    this.datosAsegurado = null;
    this.puedeAgregar = false;

    this.cdRef.detectChanges();

    const documento = this.aseguradoForm.get('ci')?.value || '';
    const fechaNacimiento = this.aseguradoForm.get('fechaNacimiento')?.value;
    const fechaFormateada = this.formatFechaParaAPI(fechaNacimiento);

    this.apiAseguradosService.buscarAsegurado(documento, fechaFormateada)
      .pipe(
        map((response: BusquedaAseguradoResponse) => {
          return this.mapearRespuestaApi(response, documento);
        }),
        catchError(error => {
          this.errorBusqueda = this.obtenerMensajeError(error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.busquedaRealizada = true;
          
          // Si no se encontró asegurado, habilitar campos para completar manualmente
          if (!this.datosAsegurado) {
            this.aseguradoForm.get('empresa')?.enable();
            this.aseguradoForm.get('nitEmpresa')?.enable();
          } else {
            // Si se encontró, completar los campos con los datos del backend
            this.aseguradoForm.patchValue({
              empresa: this.datosAsegurado.empresa || this.data.empresaNombre || '',
              nitEmpresa: this.datosAsegurado.nitEmpresa || this.data.empresaNit || ''
            });
          }
          
          this.actualizarPuedeAgregar();
          this.cdRef.detectChanges();
        })
      )
      .subscribe(asegurado => {
        if (asegurado) {
          this.datosAsegurado = asegurado;
          this.actualizarPuedeAgregar();
        }
      });
  }

  /**
   * Valida el campo de correo electrónico
   */
  validarCorreo(): void {
    const control = this.aseguradoForm.get('correoElectronico');
    const valor = control?.value?.trim();

    if (!valor || valor.length === 0) {
      control?.setErrors({ 'required': true });
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(valor)) {
        control?.setErrors({ 'email': true });
      } else {
        control?.setErrors(null);
      }
    }

    control?.markAsTouched();
    this.actualizarPuedeAgregar();
  }

  /**
   * Valida el celular
   */
  validarCelular(): void {
    const control = this.aseguradoForm.get('celular');
    let valor = control?.value?.toString().replace(/\D/g, '') || '';

    if (!valor || valor.length === 0) {
      control?.setErrors({ 'required': true });
    } else if (valor.length !== 8) {
      control?.setErrors({ 'pattern': true });
    } else {
      control?.setValue(valor, { emitEvent: true });
      control?.setErrors(null);
    }

    control?.markAsTouched();
    this.actualizarPuedeAgregar();
  }

  /**
   * Crea un nuevo asegurado si no existe en el backend
   */
  crearNuevoAsegurado(): void {
    if (!this.datosAsegurado) {
      // Si no se encontró el asegurado, crear uno nuevo localmente
      this.datosAsegurado = {
        id: 0, // ID 0 indica que no existe en el backend
        ci: this.aseguradoForm.get('ci')?.value || '',
        nombreCompleto: '',
        documentoIdentidad: this.aseguradoForm.get('ci')?.value || '',
        fechaNacimiento: this.formatFechaParaAPI(this.aseguradoForm.get('fechaNacimiento')?.value),
        correoElectronico: '',
        celular: '',
        empresa: this.aseguradoForm.get('empresa')?.value || '',
        nitEmpresa: this.aseguradoForm.get('nitEmpresa')?.value || '',
        cargo: '',
        area: '',
        fechaIngreso: '',
        genero: 'N/D',
        estado: 'ACTIVO'
      };
      
      this.mostrarMensaje('Complete los datos del asegurado manualmente');
      this.actualizarPuedeAgregar();
    }
  }

  private mostrarMensaje(mensaje: string): void {
    // Puedes implementar un snackbar o simplemente mostrar en consola
    console.log(mensaje);
  }
}