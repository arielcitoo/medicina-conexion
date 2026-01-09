
import { Component, Inject, OnInit, inject,ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asegurado } from '../../shared/models/examen.interface';
import { AseguradosService } from '../../service/asegurados.service';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { SharedMaterialModule } from '../../shared/modules/material.module'; //angular Material módulos compartidos


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
  datosAsegurado: Asegurado | null = null;
  puedeAgregar = false;

  constructor(
  private fb: FormBuilder,
  public dialogRef: MatDialogRef<ModalAsegurado>,
  @Inject(MAT_DIALOG_DATA) public data: { maxAsegurados?: number }
) {
  console.log('ModalAsegurdo CONSTRUCTOR ejecutado');
  
  this.aseguradoForm = this.fb.group({
    ci: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}[A-Za-z]?$')]],
    fechaNacimiento: ['', Validators.required],
    
    // Campos obligatorios que el usuario DEBE completar
    // Inicializar con valores vacíos
    correoElectronico: ['', [Validators.required, Validators.email]],
    celular: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
  });
    // Marcar los campos como touched para mostrar errores inmediatamente
  setTimeout(() => {
    this.aseguradoForm.get('correoElectronico')?.markAsTouched();
    this.aseguradoForm.get('celular')?.markAsTouched();
    this.actualizarPuedeAgregar();
  }, 100);
}


  ngOnInit(): void {
  console.log(' ModalAsegurado ngOnInit ejecutado');
  
  // Escuchar cambios en el formulario
  this.aseguradoForm.valueChanges.subscribe(() => {
    console.log(' Formulario cambió:', this.aseguradoForm.value);
    console.log(' Estado del formulario:', this.aseguradoForm.valid);
    console.log(' Correo válido:', this.aseguradoForm.get('correoElectronico')?.valid);
    console.log(' Celular válido:', this.aseguradoForm.get('celular')?.valid);
    
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

/**
 * Formatea fecha manualmente evitando problemas de zona horaria
 */
private formatFechaParaAPI(fecha: Date | string): string {
  if (!fecha) return '';
  
  // Si es string en formato dd/mm/yyyy, parsearlo correctamente
  if (typeof fecha === 'string' && fecha.includes('/')) {
    const [dia, mes, anio] = fecha.split('/').map(Number);
    // Crear fecha en UTC para evitar problemas de zona horaria
    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0)); // Mediodía UTC
    return fechaUTC.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
  
  // Si ya es un objeto Date
  const date = new Date(fecha);
  
  // Asegurar que usamos la fecha correcta (sin problemas de zona horaria)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
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
    
    // Nueva propiedad: Empresa
    empresa: datos.empresa || 
             datos.nombreEmpresa || 
             datos.razonSocial || 
             datos.empleador || 
             'No especificada',
    
    primerApellido: datos.primerApellido,
    segundoApellido: datos.segundoApellido,
    nombres: datos.nombres,
    estado: datos.estado,
    aseguradoId: datos.aseguradoId,
    codigoAsegurado: datos.codigoAsegurado,
    edad: datos.edad,
    fechaAfiliacion: datos.fechaAfiliacion,
    
    // Propiedades adicionales que podrían venir de la API
    cargo: datos.cargo,
    area: datos.area,
    fechaIngreso: datos.fechaIngreso,
    nitEmpresa: datos.nitEmpresa
  };
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

 // Método para actualizar si se puede agregar
  // Método para actualizar si se puede agregar - REVISADO
actualizarPuedeAgregar(): void {
  // Verificar que tenemos datos del API
  const tieneDatos = !!this.datosAsegurado;
  
  // Verificar que los campos de contacto estén completos y válidos
  const correoControl = this.aseguradoForm.get('correoElectronico');
  const celularControl = this.aseguradoForm.get('celular');
  
  const correoValido = correoControl ? 
    correoControl.valid && correoControl.value?.trim().length > 0 : 
    false;
    
  const celularValido = celularControl ? 
    celularControl.valid && celularControl.value?.toString().length === 8 : 
    false;
  
  // Solo se puede agregar si:
  // 1. Hay datos del API
  // 2. El correo es válido
  // 3. El celular es válido
  this.puedeAgregar = tieneDatos && correoValido && celularValido;
  
  console.log(' Validación agregar asegurado:', {
    puedeAgregar: this.puedeAgregar,
    tieneDatos,
    correoValido,
    celularValido,
    correoValue: correoControl?.value,
    celularValue: celularControl?.value,
    correoErrors: correoControl?.errors,
    celularErrors: celularControl?.errors
  });
  
  // Forzar detección de cambios
  this.cdRef.detectChanges();
}


// En modal-asegurado
 agregarAsegurado(): void {
  console.log(' Modal: Preparando para agregar asegurado...');
  
  if (!this.puedeAgregar || !this.datosAsegurado) {
    console.error(' No se puede agregar desde la modal');
    return;
  }

  const asegurado: Asegurado = {
    // Datos de la API
    ...this.datosAsegurado,
    
    // Datos del formulario (ingresados por usuario)
    correoElectronico: this.aseguradoForm.get('correoElectronico')?.value?.trim(),
    celular: this.aseguradoForm.get('celular')?.value?.toString(),
    
    // Asegurar campos críticos
     id: this.datosAsegurado.id || Date.now() + Math.floor(Math.random() * 1000),
    ci: this.datosAsegurado.ci || this.aseguradoForm.get('ci')?.value,
    empresa: this.datosAsegurado.empresa || 'No especificada'
  };

  console.log(' Modal: Asegurado listo para enviar:', asegurado);
  
  // Cerrar modal y enviar datos
  this.dialogRef.close(asegurado);
}



  cancelar(): void {
    this.dialogRef.close();
  }



  buscarAsegurado(): void {
    if (!this.puedeBuscar()) return;

    this.isLoading = true;
    this.busquedaRealizada = false;
    this.errorBusqueda = null;
    this.datosAsegurado = null;

    // Forzar detección de cambios
    this.cdRef.detectChanges();

    const documento = this.aseguradoForm.get('ci')?.value;
    const fechaNacimiento = this.aseguradoForm.get('fechaNacimiento')?.value;
    const fechaFormateada = this.formatFechaParaAPI(fechaNacimiento);

    this.apiAseguradosService.buscarAsegurado(documento, fechaFormateada)
      .pipe(
        map(response => {
          return this.mapearRespuestaApi(response, documento);
        }),
        catchError(error => {
          this.errorBusqueda = this.obtenerMensajeError(error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.busquedaRealizada = true;
          this.actualizarPuedeAgregar();
          
          // Forzar detección de cambios al finalizar
          this.cdRef.detectChanges();
        })
      )
      .subscribe(asegurado => {
        if (asegurado) {
          this.datosAsegurado = asegurado;
        
     // Forzar actualización de validación inmediatamente
    setTimeout(() => {
      this.actualizarPuedeAgregar();
    }, 0);
  }

  // Forzar detección de cambios después de asignar datos
  this.cdRef.detectChanges();
});
}

  validarCorreo(): void {
  const control = this.aseguradoForm.get('correoElectronico');
  const valor = control?.value?.trim();
  
  console.log(' Validando correo:', valor);
  
  if (!valor || valor.length === 0) {
    control?.setErrors({ 'required': true });
  } else {
    // Expresión regular más estricta para emails
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

validarCelular(): void {
  const control = this.aseguradoForm.get('celular');
  let valor = control?.value?.toString().replace(/\D/g, '');
  
  console.log('📱 Validando celular:', valor);
  
  if (!valor || valor.length === 0) {
    control?.setErrors({ 'required': true });
  } else if (valor.length !== 8) {
    control?.setErrors({ 'pattern': true });
  } else {
    // Actualizar con el valor limpio
    control?.setValue(valor, { emitEvent: true });
    control?.setErrors(null);
  }
  
  control?.markAsTouched();
  this.actualizarPuedeAgregar();
}
}