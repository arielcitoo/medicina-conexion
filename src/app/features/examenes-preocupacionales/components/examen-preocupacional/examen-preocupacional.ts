import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExamenService } from '../../services/examen.service';
import { EmpresaService } from '../../../../core/service/empresa.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExamenExitoModal, ExitoModalData } from '../examen-exito-modal/examen-exito-modal';
import { SharedMaterialModule } from '../../../../shared/modules/material.module'; // Angular Material módulos compartidos

// Importar el servicio de examen preocupacional y asegurados
import { ExamenPreocupacionalService, ExamenPreocupacionalCreateDTO, AseguradoCreateDTO, ExamenPreocupacionalResponse } from '../../../../core/service/examen-preocupacional.service';
import { AseguradosService } from '../../../../core/service/asegurados.service'; // Asumo que existe este servicio
import { AseguradoExamen, AseguradoBackend } from '../../../../interface/examen.interface';
import { ErrorModal } from '../../../../shared/components/error-modal/error-modal';



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
      //aseguradosArray: this.fb.array([])
    });
  }

  ngOnInit(): void {

    console.log('=== INICIALIZANDO COMPONENTE ===');
    this.empresa = this.empresaService.getEmpresaExamen();

    if (!this.empresa) {
      console.error(' No existe empresa verificada');
      this.mostrarSnackbar('Debe verificar su empresa primero', 'error');
      this.router.navigate(['/prelogin']);
      return;
    }

    console.log('✅ Empresa en examen:', {
      razonSocial: this.empresa.razonSocial,
      nit: this.empresa.nit,
      NIT: this.empresa.NIT,
      nroPatronal: this.empresa.nroPatronal,
      numeroPatronal: this.empresa.numeroPatronal
    });

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

    setTimeout(() => {
      this.isLoading = true;
      this.fechaRegistro = new Date();
      this.cdRef.markForCheck();

      try {
        const datosExamen = this.prepararDatosParaExamen();

        console.log('📤 Enviando datos al backend...');
        console.log('Número patronal a enviar:', datosExamen.numeroPatronal);

        this.examenService.createExamen(datosExamen).subscribe({
          next: (response: ExamenPreocupacionalResponse) => {
            setTimeout(() => {
              this.isLoading = false;
              console.log('Examen creado exitosamente:', response);
              this.mostrarModalExito(response);
              this.cdRef.markForCheck();
            }, 0);
          },
          error: (error: any) => {
            setTimeout(() => {
              this.isLoading = false;

              let mensajeError = 'Error al guardar el examen';

              if (error.status === 400) {
                if (error.error?.detail) {
                  mensajeError = error.error.detail;

                  // Verificar si es error de usuario duplicado
                  if (error.error.detail.toLowerCase().includes('usuario') &&
                    (error.error.detail.toLowerCase().includes('ya existe') ||
                      error.error.detail.toLowerCase().includes('registrado'))) {
                    mensajeError = 'El usuario ya está registrado en el sistema.';
                  }
                  // Verificar si es error de examen duplicado
                  else if (error.error.detail.includes('ya existe un examen pendiente')) {
                    const match = error.error.detail.match(/número patronal:\s*([^\s]+)/);
                    const numeroPatronal = match ? match[1] : datosExamen.numeroPatronal;
                    mensajeError = `Ya existe un examen pendiente para el número patronal: ${numeroPatronal}.`;
                  }
                } else if (error.error?.errors) {
                  // Errores de validación
                  const errores = error.error.errors;
                  const detalles = Object.keys(errores)
                    .map(key => `${key}: ${errores[key].join(', ')}`)
                    .join('; ');
                  mensajeError = `Errores de validación: ${detalles}`;
                } else if (error.error?.message) {
                  mensajeError = `Error: ${error.error.message}`;
                }
              } else if (error.status === 409) { // 409 Conflict - común para duplicados
                mensajeError = 'El usuario/asegurado ya está registrado en el sistema.';
              } else if (error.status === 0) {
                mensajeError = 'Error de conexión. Verifique su conexión a internet.';
              } else if (error.status === 500) {
                mensajeError = 'Error interno del servidor. Intente nuevamente.';
              }

              console.error('❌ Error completo:', error);

              // Mostrar mensaje de error en modal o snackbar
              this.mostrarErrorModal(mensajeError);

              this.cdRef.markForCheck();
            }, 0);
          }
        });
      } catch (error: any) {
        setTimeout(() => {
          this.isLoading = false;
          console.error('❌ Error preparando datos:', error);
          this.mostrarSnackbar(`Error: ${error.message}`, 'error');
          this.cdRef.markForCheck();
        }, 0);
      }
    }, 0);
  }
  /**
   * Mostrar modal de error personalizado
   */
  private mostrarErrorModal(mensaje: string): void {
    const dialogRef = this.dialog.open(ErrorModal, {
      width: '500px',
      data: { mensaje }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'reintentar') {
        this.finalizarRegistro();
      }
    });
  }

  /**
     * Guardar documentos de asegurados
     */

  private prepararDatosParaExamen(): ExamenPreocupacionalCreateDTO {

    // Verificar que tenemos datos de empresa
    if (!this.empresa) {
      throw new Error('No se encontraron datos de la empresa. Verifique que haya seleccionado una empresa.');
    }

    // EXTRAER DATOS CORRECTAMENTE
    // 1. Número patronal - usar la propiedad correcta de la interfaz Empresa
    const numeroPatronal = this.empresa.numeroPatronal || '';

    // 2. Razón social - usar la propiedad correcta de la interfaz Empresa
    const razonSocial = this.empresa.razonSocial || '';

    // 3. NIT - ¡PROBLEMA PRINCIPAL! 
    // La interfaz Empresa tiene 'ruc', pero el backend espera 'nit'
    // Y los datos pueden venir con diferentes nombres
    const nit = this.extraerNitDeEmpresa(this.empresa);

    console.log(' Datos extraídos:', {
      numeroPatronal,
      razonSocial,
      nit,
      tieneNumeroPatronal: !!numeroPatronal,
      tieneRazonSocial: !!razonSocial,
      tieneNit: !!nit
    });

    // VALIDACIONES
    if (!numeroPatronal || numeroPatronal.trim() === '') {
      console.error(' Número patronal vacío:', this.empresa);
      throw new Error('El número patronal de la empresa es requerido');
    }

    if (!razonSocial || razonSocial.trim() === '') {
      console.error(' Razón social vacía:', this.empresa);
      throw new Error('La razón social de la empresa es requerida');
    }

    if (!nit || nit.trim() === '') {
      console.warn(' NIT/RUC vacío, usando valor por defecto para pruebas');
      // Podemos usar un valor temporal para pruebas, pero en producción debe estar
      const nitTemporal = '1234567890'; // Temporal para pruebas
      console.log('Usando NIT temporal para pruebas:', nitTemporal);
    }

    // PREPARAR ASEGURADOS
    const aseguradosParaEnviar: any[] = this.asegurados.map((asegurado, index) => {
      // Fecha segura
      let fechaISO: string;
      try {
        const fechaStr = String(asegurado.fechaNacimiento || '1990-01-01');
        const fechaDate = new Date(fechaStr);

        if (isNaN(fechaDate.getTime())) {
          fechaISO = new Date('1990-01-01').toISOString();
        } else {
          fechaISO = fechaDate.toISOString();
        }
      } catch {
        fechaISO = new Date('1990-01-01').toISOString();
      }

      // Para los asegurados, usar el NIT real de la empresa
      const empresaAsegurado = asegurado.empresa || razonSocial;
      const nitEmpresaAsegurado = asegurado.nitEmpresa || nit;

      console.log(`Asegurado ${index + 1}:`, {
        nombre: asegurado.nombreCompleto,
        empresa: empresaAsegurado,
        nitEmpresa: nitEmpresaAsegurado
      });

      return {
        aseguradoId: asegurado.aseguradoId || 1,
        ci: (asegurado.ci || '').substring(0, 15),
        nombreCompleto: (asegurado.nombreCompleto || '').substring(0, 200),
        fechaNacimiento: fechaISO,
        genero: (asegurado.genero || '').substring(0, 10),
        correoElectronico: (asegurado.correoElectronico || '').substring(0, 100),
        celular: (asegurado.celular || '').substring(0, 10),
        empresa: empresaAsegurado.substring(0, 200),
        nitEmpresa: nitEmpresaAsegurado ? nitEmpresaAsegurado.substring(0, 20) : undefined
      };
    });

    // CREAR OBSERVACIONES
    const observaciones = `Recibo: ${this.paso1Form.get('numeroRecibo')?.value}. ` +
      `Total: ${this.asegurados.length} asegurados. ` +
      `Importe: Bs. ${this.paso1Form.get('totalImporte')?.value}`;

    // DATOS FINALES PARA EL BACKEND
    const datos: ExamenPreocupacionalCreateDTO = {
      numeroPatronal: numeroPatronal.substring(0, 20),
      razonSocial: razonSocial.substring(0, 200),
      nit: nit.substring(0, 20) || '1234567890', // Si está vacío, usar temporal
      observaciones: observaciones.substring(0, 500),
      Asegurados: aseguradosParaEnviar
    };


    return datos;
  }

  // MÉTODO PARA EXTRAER EL NIT DE LA EMPRESA
  private extraerNitDeEmpresa(empresa: any): string {
    if (!empresa) return '';

    // 1. Primero buscar en las propiedades de la interfaz Empresa
    if (empresa.ruc && empresa.ruc.trim() !== '') {
      console.log('NIT encontrado en propiedad "ruc":', empresa.ruc);
      return empresa.ruc;
    }

    // 2. Buscar en otras propiedades posibles
    const propiedadesPosibles = ['nit', 'NIT', 'numeroNit', 'nroNit', 'identificacionTributaria'];

    for (const prop of propiedadesPosibles) {
      if (empresa[prop] && empresa[prop].trim() !== '') {
        console.log(` NIT encontrado en propiedad "${prop}":`, empresa[prop]);
        return empresa[prop];
      }
    }

    // 3. Buscar en propiedades anidadas (si la empresa viene con estructura compleja)
    if (empresa.empresa && typeof empresa.empresa === 'object') {
      for (const prop of propiedadesPosibles) {
        if (empresa.empresa[prop] && empresa.empresa[prop].trim() !== '') {
          console.log(` NIT encontrado en empresa.${prop}:`, empresa.empresa[prop]);
          return empresa.empresa[prop];
        }
      }
    }

    // 4. Si no se encuentra, mostrar todas las propiedades para debug
    console.warn('No se encontró NIT. Todas las propiedades:');
    for (const key in empresa) {
      if (empresa.hasOwnProperty(key)) {
        console.log(`  ${key}:`, empresa[key]);
      }
    }

    return '';
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
      disableClose: true, // Evitar que el usuario cierre haciendo clic fuera
      autoFocus: false,   // Evitar problemas de focus
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      // Solo manejar acciones si el resultado no es undefined
      if (result) {
        if (result.action === 'descargar') {
          this.descargarComprobantePDF(examenRespuesta);
        } else if (result.action === 'salir') {
          // Ya se maneja dentro de la modal
          console.log('Usuario salió del sistema');
        }
      }

      // Limpiar formulario después de cerrar
      this.limpiarFormulario();
    });
  }
  /**
   * Limpiar formulario después de éxito
   */
  private limpiarFormulario(): void {
    // Resetear formularios
    this.paso1Form.reset();
    this.paso2Form.reset();

    // Limpiar arrays
    this.asegurados = [];
    this.archivosAsegurados = {};

    // Limpiar preview
    this.imagenReciboPreview = null;

    // Regresar al primer paso
    if (this.stepper) {
      this.stepper.selectedIndex = 0;
    }

    this.cdRef.detectChanges();
  }
  /**
   * Descargar comprobante PDF
   */
  private descargarComprobantePDF(examen: any): void {
    this.mostrarSnackbar('Generando PDF...', 'info');

    // Crear contenido HTML para el PDF
    const contenidoHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comprobante Examen Preocupacional</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; }
        .empresa-info { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #3498db; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>COMPROBANTE DE REGISTRO - EXAMEN PREOCUPACIONAL</h1>
      
      <div class="section">
        <p><span class="label">ID de Registro:</span> <span class="value">${examen.id || this.idIngresoGenerado}</span></p>
        <p><span class="label">Fecha de Registro:</span> <span class="value">${this.formatearFecha(new Date())}</span></p>
      </div>
      
      <div class="section empresa-info">
        <h2>DATOS DE LA EMPRESA</h2>
        <p><span class="label">Razón Social:</span> <span class="value">${this.empresa?.razonSocial || 'N/A'}</span></p>
        <p><span class="label">NIT:</span> <span class="value">${this.empresa?.nit || this.empresa?.NIT || 'N/A'}</span></p>
        <p><span class="label">Número Patronal:</span> <span class="value">${this.empresa?.nroPatronal || this.empresa?.numeroPatronal || 'N/A'}</span></p>
      </div>
      
      <div class="section">
        <h2>DATOS DEL RECIBO</h2>
        <p><span class="label">Número de Recibo:</span> <span class="value">${this.paso1Form.get('numeroRecibo')?.value}</span></p>
        <p><span class="label">Total Importe:</span> <span class="value">Bs. ${this.formatNumber(this.paso1Form.get('totalImporte')?.value)}</span></p>
        <p><span class="label">Cantidad de Asegurados:</span> <span class="value">${this.asegurados.length}</span></p>
        
        ${this.paso1Form.get('cantidadAsegurados')?.value > 1
        ? `<p><span class="label">Correo Empleador:</span> <span class="value">${this.paso1Form.get('correoEmpleador')?.value}</span></p>
             <p><span class="label">Celular Empleador:</span> <span class="value">${this.paso1Form.get('celularEmpleador')?.value}</span></p>`
        : ''
      }
      </div>
      
      <div class="section">
        <h2>ASEGURADOS REGISTRADOS (${this.asegurados.length})</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre Completo</th>
              <th>CI/NIT</th>
              <th>Correo</th>
              <th>Celular</th>
            </tr>
          </thead>
          <tbody>
            ${this.asegurados.map((asegurado, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${asegurado.nombreCompleto || 'N/A'}</td>
                <td>${asegurado.ci || 'N/A'}</td>
                <td>${asegurado.correoElectronico || 'N/A'}</td>
                <td>${asegurado.celular || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Sistema CNS - Caja Nacional de Salud</p>
        <p>${new Date().toLocaleDateString('es-ES')} - Documento generado electrónicamente</p>
      </div>
    </body>
    </html>
  `;

    // Crear Blob con tipo correcto
    const blob = new Blob([contenidoHTML], { type: 'text/html' });

    // Opción 1: Abrir en nueva ventana para imprimir como PDF
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
      newWindow.onload = () => {
        newWindow.print(); // Esto permite al usuario guardar como PDF
      };
    } else {
      // Opción 2: Descargar como HTML si no se puede abrir ventana
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-examen-${examen.id || this.idIngresoGenerado}.html`;
      a.click();
    }

    // Limpiar URL después de un tiempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

    this.mostrarSnackbar('Comprobante generado. Se abrirá para imprimir/guardar como PDF.', 'success');
  }


  /**
   * Volver al inicio
   */
  volverAlInicio(): void {
    this.router.navigate(['/login']);
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

  get estaProcesando(): boolean {
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

    //this.actualizarFormArrayAsegurados();
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
    // this.actualizarFormArrayAsegurados();
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
    * Mostrar snackbar con mensaje
    */

  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    });
  }
}