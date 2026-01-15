import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray,  } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExamenService } from '../../service/examen.service';
import { EmpresaService } from '../../service/empresa.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExamenExitoModal, ExitoModalData } from '../examen-exito-modal/examen-exito-modal';
import { SharedMaterialModule } from '../../shared/modules/material.module'; // Angular Material módulos compartidos

// Importar el servicio de examen preocupacional y asegurados
import { ExamenPreocupacionalService, ExamenPreocupacionalCreateDTO, AseguradoCreateDTO } from '../../service/examen-preocupacional.service';
import { AseguradosService } from '../../service/asegurados.service'; // Asumo que existe este servicio
import { AseguradoExamen, AseguradoBackend } from '../../interface/examen.interface';





@Component({
  selector: 'app-examen-preocupacional',
  imports: [
    SharedMaterialModule,
    MatStep
],
  standalone: true,
  templateUrl: './examen-preocupacional.html',
  styleUrl: './examen-preocupacional.css',
})
export class ExamenPreocupacional implements OnInit {
  empresa: any = null;
  
  @ViewChild('stepper') stepper!: MatStepper;

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private examenService = inject(ExamenPreocupacionalService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);
  private aseguradosService = inject(AseguradosService); // Inyectar servicio de asegurados

  paso1Form: FormGroup;
  paso2Form: FormGroup;

  asegurados: AseguradoExamen[] = []; // 
  archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  
  isLoading = false;
  imagenReciboPreview: string | null = null;
  
  idIngresoGenerado: string = '';
  fechaRegistro: Date | null = null;
  
  private cantidadAseguradosSubject = new Subject<number>();

  readonly displayedColumns: string[] = [
    'nombre',
    'ci',
    'correo',
    'celular',
    'archivos',
    'acciones'
  ];

  constructor(private empresaService: EmpresaService) {
    // Paso 1: Datos del Recibo con validación personalizada para la imagen
    this.paso1Form = this.fb.group({
      numeroRecibo: ['', [Validators.required, Validators.pattern('^[0-9\\-]+$')]],
      totalImporte: ['', [Validators.required, Validators.min(0)]],
      cantidadAsegurados: ['', [Validators.required, Validators.min(1)]],
      imagenRecibo: [null, [Validators.required]],
      correoEmpleador: ['', [Validators.email]],
      celularEmpleador: ['', [Validators.pattern('^[0-9]{8}$')]]
    });

    this.paso2Form = this.fb.group({
      aseguradosArray: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.empresa = this.empresaService.getEmpresaExamen();

    if (!this.empresa) {
      this.mostrarSnackbar('Debe verificar su empresa primero', 'error');
      this.router.navigate(['/prelogin']);
      return;
    }
    
    this.idIngresoGenerado = this.generarIdIngreso();
    
    this.setupCantidadAseguradosSubscription();
    
    this.paso1Form.get('cantidadAsegurados')?.valueChanges.subscribe(valor => {
      this.cantidadAseguradosSubject.next(valor);
      const aseguradosActuales = this.asegurados;
      if (aseguradosActuales.length > valor) {
        this.mostrarSnackbar(`Debe eliminar ${aseguradosActuales.length - valor} asegurados`);
      }
    });

    const cantidadInicial = this.paso1Form.get('cantidadAsegurados')?.value || 1;
    this.actualizarValidacionesPaso1(cantidadInicial);
  }

  /**
   * Generar ID de ingreso único
   */
    private generarIdIngreso(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const empresaId = this.empresa?.id?.toString().substr(0, 4) || '0000';
    return `ING-${empresaId}-${timestamp}-${random}`;
  }


  /**
   * Formatear fecha para usar en el template
   */
  formatearFecha(fecha: Date | null): string {
    if (!fecha) return '';
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  }

  /**
   * Formatear número con 2 decimales
   */
  formatNumber(numero: number | string): string {
    const num = typeof numero === 'string' ? parseFloat(numero) : numero;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  /**
   * Configurar suscripción para cambios en cantidad de asegurados
   */
 private setupCantidadAseguradosSubscription(): void {
    this.cantidadAseguradosSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((cantidad: number) => {
      this.actualizarValidacionesPaso1(cantidad);
    });
  }

  /**
   * Actualizar validaciones del paso 1 según cantidad de asegurados
   */
  private actualizarValidacionesPaso1(cantidad: number): void {
    const correoControl = this.paso1Form.get('correoEmpleador');
    const celularControl = this.paso1Form.get('celularEmpleador');

    if (cantidad > 1) {
      correoControl?.setValidators([Validators.required, Validators.email]);
      celularControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
    } else {
      correoControl?.setValidators([Validators.email]);
      celularControl?.setValidators([Validators.pattern('^[0-9]{8}$')]);
      
      if (correoControl?.value) {
        correoControl.setValue('');
      }
      if (celularControl?.value) {
        celularControl.setValue('');
      }
    }

    correoControl?.updateValueAndValidity();
    celularControl?.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  /**
   * Verificar si puede avanzar al paso 2
   */
  puedeAvanzarPaso2(): boolean {
  const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
  const cantidadActual = this.asegurados.length;

  console.log('Validando paso 2:', {
    cantidadPermitida,
    cantidadActual,
    asegurados: this.asegurados,
    archivos: this.archivosAsegurados
  });

  if (cantidadActual !== cantidadPermitida) {
    console.log('Fallo: cantidad no coincide');
    return false;
  }

  for (let i = 0; i < this.asegurados.length; i++) {
    const asegurado = this.asegurados[i];
    const idAsegurado = asegurado.idTemporal || asegurado.aseguradoId;

    console.log('Validando asegurado:', {
      nombre: asegurado.nombreCompleto,
      idAsegurado,
      tieneCorreo: !!asegurado.correoElectronico?.trim(),
      tieneCelular: !!asegurado.celular,
      archivos: this.archivosAsegurados[idAsegurado]
    });

    if (!asegurado.correoElectronico?.trim() || !asegurado.celular) {
      console.log('Fallo: falta correo o celular');
      return false;
    }

    const archivos = this.archivosAsegurados[idAsegurado];
    if (!archivos?.anverso || !archivos?.reverso) {
      console.log('Fallo: archivos incompletos para asegurado', idAsegurado);
      return false;
    }
  }

  console.log('Paso 2 válido');
  return true;
}
  /**
   * Verificar si puede avanzar al paso 1
   */
  puedeAvanzarPaso1(): boolean {
    const esValido = (controlName: string): boolean => {
      const control = this.paso1Form.get(controlName);
      return control ? control.valid : false;
    };

    const tieneValor = (controlName: string): boolean => {
      const control = this.paso1Form.get(controlName);
      return control ? !!control.value : false;
    };

    if (!esValido('numeroRecibo') || !esValido('totalImporte') || 
        !esValido('cantidadAsegurados') || !esValido('imagenRecibo')) {
      return false;
    }

    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    
    if (cantidad > 1) {
      return esValido('correoEmpleador') && esValido('celularEmpleador');
    }
    
    const correoValido = !tieneValor('correoEmpleador') || esValido('correoEmpleador');
    const celularValido = !tieneValor('celularEmpleador') || esValido('celularEmpleador');
    
    return correoValido && celularValido;
  }
 

  /**
   * Obtener mensaje de validación para correo
   */
  getCorreoErrorMessage(): string {
    const control = this.paso1Form.get('correoEmpleador');
    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value;
    
    if (control?.hasError('required') && cantidad > 1) {
      return 'El correo es obligatorio cuando hay más de un asegurado';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un correo válido';
    }
    
    return '';
  }

  /**
   * Obtener mensaje de validación para celular
   */
  getCelularErrorMessage(): string {
    const control = this.paso1Form.get('celularEmpleador');
    const cantidad = this.paso1Form.get('cantidadAsegurados')?.value;
    
    if (control?.hasError('required') && cantidad > 1) {
      return 'El celular es obligatorio cuando hay más de un asegurado';
    }
    
    if (control?.hasError('pattern')) {
      return 'Ingrese 8 dígitos';
    }
    
    return '';
  }

  /**
   * Paso 3: Finalizar y guardar
   */
finalizarRegistro(): void {
  if (!this.puedeAvanzarPaso2()) {
    this.mostrarSnackbar('Complete todos los datos requeridos');
    return;
  }

  // Validar datos antes de enviar
  const errores = this.validarDatosAntesDeEnviar();
  if (errores.length > 0) {
    errores.forEach(error => this.mostrarSnackbar(error, 'error'));
    return;
  }

  setTimeout(() => {
    this.isLoading = true;
    this.fechaRegistro = new Date();
    this.cdRef.markForCheck();
    
    const datosExamen = this.prepararDatosParaExamen();
    
    // DEBUG: Verificar datos antes de enviar
    console.log('Datos a enviar al backend:', JSON.stringify(datosExamen, null, 2));
    console.log('Total asegurados:', datosExamen.asegurados?.length);
    console.log('Primer asegurado:', datosExamen.asegurados?.[0]);
    
    this.examenService.createExamen(datosExamen).subscribe({
      next: (response: any) => {
        setTimeout(() => {
          this.isLoading = false;
          this.mostrarModalExito(response);
          this.cdRef.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        setTimeout(() => {
          this.isLoading = false;
          console.error('Error completo:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error response:', error.error);
          
          if (error.status === 400) {
            this.mostrarSnackbar('Error en los datos enviados: ' + (error.error?.message || 'Revise los datos del formulario'), 'error');
          } else {
            this.mostrarSnackbar('Error al guardar el examen: ' + (error.error?.message || error.message), 'error');
          }
          this.cdRef.markForCheck();
        }, 0);
      }
    });
  }, 0);
}

/**
   * Guardar documentos de asegurados
   */

 private prepararDatosParaExamen(): ExamenPreocupacionalCreateDTO {
  // Validar que todos los campos requeridos estén presentes
  const numeroPatronal = this.empresa.nroPatronal || this.empresa.numeroPatronal || '';
  const nit = this.empresa.nit || this.empresa.NIT || '';
  const razonSocial = this.empresa.razonSocial || '';
  
  if (!numeroPatronal || !nit || !razonSocial) {
    console.error('Datos de empresa incompletos:', this.empresa);
  }
  
  // Preparar observaciones
  const observaciones = `Recibo: ${this.paso1Form.get('numeroRecibo')?.value}. ` +
                       `Total asegurados: ${this.paso1Form.get('cantidadAsegurados')?.value}. ` +
                       `Importe: ${this.paso1Form.get('totalImporte')?.value} Bs.`;
  
  // Validar y preparar asegurados
  const aseguradosParaEnviar: AseguradoCreateDTO[] = this.asegurados.map(asegurado => {
    // Validar campos requeridos
    if (!asegurado.ci || !asegurado.nombreCompleto || !asegurado.fechaNacimiento) {
      console.error('Asegurado con datos incompletos:', asegurado);
    }
    
    return {
      aseguradoId: asegurado.aseguradoId || 0,
      ci: asegurado.ci || '',
      nombreCompleto: asegurado.nombreCompleto || '',
      fechaNacimiento: this.formatFechaParaAPI(asegurado.fechaNacimiento), // Asegurar formato YYYY-MM-DD
      genero: asegurado.genero || '',
      correoElectronico: asegurado.correoElectronico || '',
      celular: asegurado.celular || '',
      empresa: asegurado.empresa || razonSocial,
      nitEmpresa: asegurado.nitEmpresa || nit
    };
  });
  
  console.log('Asegurados preparados para enviar:', aseguradosParaEnviar);
  
  return {
    numeroPatronal: numeroPatronal,
    razonSocial: razonSocial,
    nit: nit,
    observaciones: observaciones,
    asegurados: aseguradosParaEnviar
  };
}

// Añadir método para formatear fechas
private formatFechaParaAPI(fecha: string | Date): string {
  if (!fecha) return '';
  
  let date: Date;
  
  if (typeof fecha === 'string') {
    // Si es string, intentar parsear
    if (fecha.includes('T')) {
      // Ya está en formato ISO
      return fecha.split('T')[0];
    } else if (fecha.includes('/')) {
      // Formato DD/MM/YYYY
      const [dia, mes, anio] = fecha.split('/').map(Number);
      date = new Date(anio, mes - 1, dia);
    } else {
      // Asumir formato YYYY-MM-DD
      return fecha;
    }
  } else {
    // Si es Date
    date = fecha;
  }
  
  // Formatear a YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Método para validar datos antes de enviar
private validarDatosAntesDeEnviar(): string[] {
  const errores: string[] = [];
  
  // Validar datos de empresa
  if (!this.empresa?.nroPatronal && !this.empresa?.numeroPatronal) {
    errores.push('Número patronal de la empresa es requerido');
  }
  
  if (!this.empresa?.nit && !this.empresa?.NIT) {
    errores.push('NIT de la empresa es requerido');
  }
  
  if (!this.empresa?.razonSocial) {
    errores.push('Razón social de la empresa es requerida');
  }
  
  // Validar datos del recibo
  if (!this.paso1Form.get('numeroRecibo')?.value) {
    errores.push('Número de recibo es requerido');
  }
  
  // Validar asegurados
  if (this.asegurados.length === 0) {
    errores.push('Debe agregar al menos un asegurado');
  }
  
  this.asegurados.forEach((asegurado, index) => {
    if (!asegurado.ci) {
      errores.push(`Asegurado ${index + 1}: CI es requerido`);
    }
    
    if (!asegurado.nombreCompleto) {
      errores.push(`Asegurado ${index + 1}: Nombre completo es requerido`);
    }
    
    if (!asegurado.fechaNacimiento) {
      errores.push(`Asegurado ${index + 1}: Fecha de nacimiento es requerida`);
    }
    
    if (!asegurado.correoElectronico) {
      errores.push(`Asegurado ${index + 1}: Correo electrónico es requerido`);
    }
    
    if (!asegurado.celular) {
      errores.push(`Asegurado ${index + 1}: Celular es requerido`);
    }
  });
  
  return errores;
}
/**
   * Guardar documentos asociados al examen
   */

  private guardarDocumentos(examenId: number, datosExamen: ExamenPreocupacionalCreateDTO): void {
    // Guardar imagen del recibo
    const imagenRecibo = this.paso1Form.get('imagenRecibo')?.value;
    if (imagenRecibo) {
      const documentoRecibo = {
        archivo: imagenRecibo,
        tipoDocumento: 'RECIBO_PAGO',
        observaciones: `Recibo N° ${this.paso1Form.get('numeroRecibo')?.value}`
      };
      
      this.examenService.subirDocumento(examenId, documentoRecibo).subscribe({
        next: () => {},
        error: (error: any) => {
          this.mostrarSnackbar('Error al subir recibo: ' + (error.error?.message || error.message), 'error');
        }
      });
    }

    // Guardar documentos de cada asegurado
    this.asegurados.forEach(asegurado => {
      const archivos = this.archivosAsegurados[asegurado.aseguradoId];
      
      if (archivos?.anverso) {
        const docAnverso = {
          archivo: archivos.anverso,
          tipoDocumento: 'FORMULARIO_GESTORA_ANVERSO',
          observaciones: `Asegurado: ${asegurado.nombreCompleto} - CI: ${asegurado.ci}`
        };
        
        this.examenService.subirDocumento(examenId, docAnverso).subscribe({
          error: (error: any) => {
            this.mostrarSnackbar(`Error al subir formulario anverso para ${asegurado.nombreCompleto}`, 'error');
          }
        });
      }

      if (archivos?.reverso) {
        const docReverso = {
          archivo: archivos.reverso,
          tipoDocumento: 'FORMULARIO_GESTORA_REVERSO',
          observaciones: `Asegurado: ${asegurado.nombreCompleto} - CI: ${asegurado.ci}`
        };
        
        this.examenService.subirDocumento(examenId, docReverso).subscribe({
          error: (error: any) => {
            this.mostrarSnackbar(`Error al subir formulario reverso para ${asegurado.nombreCompleto}`, 'error');
          }
        });
      }
    });
  }

  /**
   * Mostrar modal de éxito
   */
  private mostrarModalExito(examenRespuesta: any): void {
    const modalData: ExitoModalData = {
      idIngreso: examenRespuesta.id || this.idIngresoGenerado,
      fechaRegistro: new Date(),
      numeroRecibo: this.paso1Form.get('numeroRecibo')?.value,
      totalAsegurados: this.asegurados.length,
      importeTotal: parseFloat(this.paso1Form.get('totalImporte')?.value) || 0,
      empresa: {
        razonSocial: this.empresa.razonSocial,
        nit: this.empresa.nit || this.empresa.NIT || '',
        numeroPatronal: this.empresa.nroPatronal || this.empresa.numeroPatronal || ''
      }
    };

    const dialogRef = this.dialog.open(ExamenExitoModal, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'descargar') {
        this.descargarComprobantePDF(examenRespuesta);
      } else if (result?.action === 'salir') {
        this.volverAlInicio();
      }
    });
  }

  /**
   * Descargar comprobante PDF
   */
 private descargarComprobantePDF(examen: any): void {
    this.mostrarSnackbar('Generando PDF...', 'info');
    
    // Aquí deberías llamar a un servicio para generar el PDF real
    const contenido = `
      COMPROBANTE DE REGISTRO - EXAMEN PREOCUPACIONAL
      ================================================
      
      ID de Registro: ${examen.id || this.idIngresoGenerado}
      Fecha de Registro: ${this.formatearFecha(new Date())}
      
      DATOS DE LA EMPRESA
      -------------------
      Razón Social: ${this.empresa?.razonSocial}
      NIT: ${this.empresa?.nit || this.empresa?.NIT || ''}
      Número Patronal: ${this.empresa?.nroPatronal || this.empresa?.numeroPatronal || ''}
      
      DATOS DEL RECIBO
      ----------------
      Número de Recibo: ${this.paso1Form.get('numeroRecibo')?.value}
      Total Importe: Bs. ${this.formatNumber(this.paso1Form.get('totalImporte')?.value)}
      Cantidad de Asegurados: ${this.asegurados.length}
      
      ${ this.paso1Form.get('cantidadAsegurados')?.value > 1 
          ? `Correo Empleador: ${this.paso1Form.get('correoEmpleador')?.value}
      Celular Empleador: ${this.paso1Form.get('celularEmpleador')?.value}`
          : ''
      }
      
      ASEGURADOS REGISTRADOS
      ----------------------
      ${this.asegurados.map((asegurado, i) => `
      ${i + 1}. ${asegurado.nombreCompleto}
         CI/NIT: ${asegurado.ci}
         Correo: ${asegurado.correoElectronico}
         Celular: ${asegurado.celular}
      `).join('\n')}
      
      ---------------------------------
      Sistema CNS - Caja Nacional de Salud
      ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-examen-${examen.id || this.idIngresoGenerado}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.mostrarSnackbar('PDF descargado correctamente', 'success');
  }

   
  /**
   * Preparar datos para enviar al backend
   */
  // private prepararDatosParaBackend(): any {
  //   return {
  //     // Información del registro
  //     idIngreso: this.idIngresoGenerado,
  //     fechaRegistro: this.fechaRegistro,
  //     estado: 'REGISTRADO',
      
  //     // Información de la empresa
  //     empresa: {
  //       id: this.empresa.id,
  //       razonSocial: this.empresa.razonSocial,
  //       nit: this.empresa.nit,
  //       numeroPatronal: this.empresa.nroPatronal || this.empresa.numeroPatronal,
  //       telefono: this.empresa.telefono,
  //       direccion: this.empresa.direccion,
  //       estado: this.empresa.estado
  //     },
      
  //     // Datos del recibo
  //     recibo: {
  //       numeroRecibo: this.paso1Form.get('numeroRecibo')?.value,
  //       totalImporte: this.paso1Form.get('totalImporte')?.value,
  //       cantidadAsegurados: this.paso1Form.get('cantidadAsegurados')?.value,
  //       imagenRecibo: {
  //         nombre: this.paso1Form.get('imagenRecibo')?.value?.name,
  //         tipo: this.paso1Form.get('imagenRecibo')?.value?.type,
  //         tamaño: this.paso1Form.get('imagenRecibo')?.value?.size
  //       },
  //       correoEmpleador: this.paso1Form.get('correoEmpleador')?.value,
  //       celularEmpleador: this.paso1Form.get('celularEmpleador')?.value
  //     },
      
  //     // Lista de asegurados
  //     asegurados: this.asegurados.map(asegurado => {
  //       const archivos = this.archivosAsegurados[asegurado.id!];
        
  //       return {
  //         id: asegurado.id,
  //         nombreCompleto: asegurado.nombreCompleto,
  //         ci: asegurado.ci,
  //         fechaNacimiento: asegurado.fechaNacimiento,
  //         correoElectronico: asegurado.correoElectronico,
  //         celular: asegurado.celular,
  //         empresa: asegurado.empresa,
  //         genero: asegurado.genero,
  //         formularioGestora: {
  //           anverso: archivos?.anverso ? {
  //             nombre: archivos.anverso.name,
  //             tipo: archivos.anverso.type,
  //             tamaño: archivos.anverso.size
  //           } : null,
  //           reverso: archivos?.reverso ? {
  //             nombre: archivos.reverso.name,
  //             tipo: archivos.reverso.type,
  //             tamaño: archivos.reverso.size
  //           } : null
  //         }
  //       };
  //     }),
      
  //     // Metadatos
  //     metadata: {
  //       usuario: 'system',
  //       ip: '127.0.0.1',
  //       userAgent: navigator.userAgent,
  //       version: '1.0.0',
  //       timestamp: new Date().toISOString()
  //     }
  //   };
  // }

  /**
   * Volver al inicio
   */
  volverAlInicio(): void {
    this.router.navigate(['/prelogin']);
  }

  /**
   * Paso 1: Manejo de imagen del recibo (modificado)
   */
  onFileReciboSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const esTipoValido = file.type.match('image/*') || file.type.match('application/pdf');
      const esTamañoValido = file.size <= 5 * 1024 * 1024;

      if (!esTipoValido) {
        this.mostrarSnackbar('Solo se permiten imágenes (JPG, PNG) o PDF', 'error');
        this.paso1Form.get('imagenRecibo')?.setErrors({ fileType: true });
        return;
      }

      if (!esTamañoValido) {
        this.mostrarSnackbar('El archivo no debe superar los 5MB', 'error');
        this.paso1Form.get('imagenRecibo')?.setErrors({ maxSize: true });
        return;
      }

      this.paso1Form.get('imagenRecibo')?.setErrors(null);
      this.paso1Form.patchValue({ imagenRecibo: file });

      if (file.type.match('image/*')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenReciboPreview = reader.result as string;
          this.cdRef.detectChanges();
        };
        reader.readAsDataURL(file);
      } else {
        this.imagenReciboPreview = null;
      }

      this.mostrarSnackbar('Archivo cargado correctamente', 'success');
      this.paso1Form.get('imagenRecibo')?.updateValueAndValidity();
      this.cdRef.detectChanges();
    }
  }

/**
   * Mostrar snackbar con mensaje
   */

get estaCargando(): boolean {
  return this.isLoading;
}

/**
   * Verificar si puede avanzar al paso 2 (getter)
   */

get puedeAvanzarPaso2Estable(): boolean {
  return this.puedeAvanzarPaso2();
}
  /**
   * Eliminar imagen del recibo
   */
  eliminarImagenRecibo(): void {
    this.paso1Form.patchValue({ imagenRecibo: null });
    this.imagenReciboPreview = null;
    this.paso1Form.get('imagenRecibo')?.setErrors({ required: true });
    this.mostrarSnackbar('Imagen del recibo eliminada', 'info');
    this.cdRef.detectChanges();
  }

  /**
   * Manejar archivos del formulario gestora
   */
  onFileGestoraSelected(event: any, aseguradoId: number, tipo: 'anverso' | 'reverso'): void {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.match('image/*') && !file.type.match('application/pdf')) {
      this.mostrarSnackbar('Solo se permiten imágenes o PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.mostrarSnackbar('El archivo no debe superar los 5MB');
      return;
    }

    // Añadir console.log para depurar
    console.log('Subiendo archivo:', {
      aseguradoId,
      tipo,
      fileName: file.name,
      asegurados: this.asegurados,
      archivosActuales: this.archivosAsegurados
    });

    this.archivosAsegurados = {
      ...this.archivosAsegurados,
      [aseguradoId]: {
        ...this.archivosAsegurados[aseguradoId],
        [tipo]: file
      }
    };

    console.log('Archivos después de subir:', this.archivosAsegurados);
    
    this.mostrarSnackbar(`Archivo ${tipo} cargado correctamente`);
    this.cdRef.detectChanges();
  }
}

  /**
   * Abrir modal para agregar asegurado
   */
  abrirModalAsegurado(): void {
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    if (this.asegurados.length >= cantidadPermitida) {
      this.mostrarSnackbar(`No puede agregar más de ${cantidadPermitida} asegurados`, 'error');
      return;
    }

    const dialogRef = this.dialog.open(ModalAsegurado, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: {
        maxAsegurados: cantidadPermitida - this.asegurados.length,
        empresaId: this.empresa.id
      }
    });

    const subscription = dialogRef.afterClosed().subscribe({
      next: (result: AseguradoCreateDTO) => {
        if (result) {
          this.agregarAseguradoInmediatamente(result);
        }
        subscription.unsubscribe();
      },
      error: (error) => {
        this.mostrarSnackbar('Error al procesar el asegurado', 'error');
        subscription.unsubscribe();
      }
    });
  }

  /**
   * Agregar asegurado inmediatamente
   */
private agregarAseguradoInmediatamente(aseguradoDTO: AseguradoCreateDTO): void {
  const existe = this.asegurados.some(a => a.ci === aseguradoDTO.ci);
  if (existe) {
    this.mostrarSnackbar(`El asegurado con CI ${aseguradoDTO.ci} ya está en la lista`, 'error');
    return;
  }

   // Si aseguradoId es 0 o no válido, crear un ID temporal
  const idParaArchivos = aseguradoDTO.aseguradoId && aseguradoDTO.aseguradoId > 0 
    ? aseguradoDTO.aseguradoId 
    : Date.now() + Math.floor(Math.random() * 10000);


    // Convertir AseguradoCreateDTO a AseguradoExamen
      const aseguradoExamen: AseguradoExamen = {
    ...aseguradoDTO,
    idTemporal: idParaArchivos, // Usar el mismo ID para archivos
    aseguradoId: idParaArchivos // Asegurar que aseguradoId no sea 0
  };


     this.asegurados = [...this.asegurados, aseguradoExamen];

  this.archivosAsegurados = {
    ...this.archivosAsegurados,
    [idParaArchivos]: {
      anverso: null,
      reverso: null
    }
  };

   console.log('Asegurado agregado:', {
    idParaArchivos,
    asegurado: aseguradoExamen,
    archivos: this.archivosAsegurados
  });

   this.actualizarFormArrayAsegurados();
  this.mostrarSnackbar(`Asegurado "${aseguradoDTO.nombreCompleto}" agregado`, 'success');
  this.cdRef.detectChanges();
}

  /**
   * Eliminar asegurado de la lista
   */
  eliminarAsegurado(aseguradoId: number): void {
  const idParaEliminar = this.asegurados.find(a => 
    a.aseguradoId === aseguradoId || a.idTemporal === aseguradoId
  )?.idTemporal || aseguradoId;
  
  this.asegurados = this.asegurados.filter(a => 
    a.aseguradoId !== aseguradoId && a.idTemporal !== aseguradoId
  );
  delete this.archivosAsegurados[idParaEliminar];
  this.actualizarFormArrayAsegurados();
  this.mostrarSnackbar('Asegurado eliminado');
  this.cdRef.detectChanges();
}

  /**
   * Contar asegurados con contacto completo
   */
  contarAseguradosCompletos(): number {
    return this.asegurados.filter(a =>
      a.correoElectronico && a.celular
    ).length;
  }

  /**
   * Contar asegurados con archivos completos
   */
  contarAseguradosConArchivos(): number {
  return this.asegurados.filter(asegurado => {
    const idParaArchivos = asegurado.idTemporal || asegurado.aseguradoId;
    const archivos = this.archivosAsegurados[idParaArchivos];
    return !!archivos?.anverso && !!archivos?.reverso;
  }).length;
}

  /**
   * Verificar si un asegurado tiene archivos
   */
  tieneArchivosCompletos(aseguradoId: number): boolean {
  const asegurado = this.asegurados.find(a => 
    a.aseguradoId === aseguradoId || a.idTemporal === aseguradoId
  );
  
  if (!asegurado) return false;
  
  const idParaArchivos = asegurado.idTemporal || asegurado.aseguradoId;
  const archivos = this.archivosAsegurados[idParaArchivos];
  return !!archivos?.anverso && !!archivos?.reverso;
}
  /**
   * Obtener nombre del archivo
   */
  getNombreArchivo(aseguradoId: number, tipo: 'anverso' | 'reverso'): string {
  const asegurado = this.asegurados.find(a => 
    a.aseguradoId === aseguradoId || a.idTemporal === aseguradoId
  );
  
  if (!asegurado) return 'Sin archivo';

  const idParaArchivos = asegurado.idTemporal || asegurado.aseguradoId;
  const archivos = this.archivosAsegurados[idParaArchivos];
  if (!archivos) return 'Sin archivo';

  const archivo = tipo === 'anverso' ? archivos.anverso : archivos.reverso;
  return archivo?.name || 'Sin archivo';
}

  /**
   * Actualizar formulario reactivo con asegurados
   */
   private actualizarFormArrayAsegurados(): void {
    const formArray = this.paso2Form.get('aseguradosArray') as FormArray;
    formArray.clear();

    this.asegurados.forEach((asegurado) => {
      const grupo = this.fb.group({
        id: [asegurado.aseguradoId], // Usar aseguradoId
        nombreCompleto: [asegurado.nombreCompleto, Validators.required],
        ci: [asegurado.ci, Validators.required],
        correo: [asegurado.correoElectronico, [Validators.required, Validators.email]],
        celular: [asegurado.celular, [Validators.required, Validators.pattern('^[0-9]{8}$')]]
      });

      formArray.push(grupo);
    });

    this.paso2Form.updateValueAndValidity();
  }


  /**
   * Mostrar notificaciones
   */
  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    });
  }
}
