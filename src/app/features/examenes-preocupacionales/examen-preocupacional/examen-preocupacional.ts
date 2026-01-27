// features/examen-preocupacional/examen-preocupacional.component.ts
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { finalize, take } from 'rxjs/operators';

import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { Paso1DatosRecibo } from '../components/paso1-datos-recibo/paso1-datos-recibo';
import { Paso2Asegurados } from '../components/paso2-asegurados/paso2-asegurados';
import { Paso3Finalizar } from '../components/paso3-finalizar/paso3-finalizar'

import { EmpresaService } from '../../../core/service/empresa.service';
import { NotificationService } from '../../../core/service/notification.service';
import { AseguradoExamen } from '../../../interface/examen.interface';
import { ExamenExitoModal } from '../components/examen-exito-modal/examen-exito-modal';

import { ExamenRequest } from '../../../interface/examen.interface';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExamenPreocupacionalService } from '../../../core/service/examen-preocupacional.service';
import { Header } from "../../../shared/components/header/header";



@Component({
  selector: 'app-examen-preocupacional',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    Paso1DatosRecibo,
    Paso2Asegurados,
    Paso3Finalizar,
    Header
],
  templateUrl: './examen-preocupacional.html',
  styleUrls: ['./examen-preocupacional.css']
})
export class ExamenPreocupacional implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly examenService = inject(ExamenPreocupacionalService);
  private readonly empresaService = inject(EmpresaService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  // Formularios
  paso1Form: FormGroup;
  paso2Form: FormGroup;

  // Data
  empresa: any = null;
  asegurados: AseguradoExamen[] = [];
  archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  
  // State
  isLoading = false;
  idIngresoGenerado = '';

  constructor() {
    this.paso1Form = this.createPaso1Form();
    this.paso2Form = this.fb.group({});
  }

  ngOnInit(): void {
    // CORRECCIÓN: Usar getEmpresaExamen() en lugar de getEmpresa()
    this.empresa = this.empresaService.getEmpresaExamen();
    
    if (!this.empresa) {
      this.notification.error('Debe verificar su empresa primero');
      this.router.navigate(['/prelogin']);
      return;
    }

    this.idIngresoGenerado = this.generateIdIngreso();
    this.setupFormListeners();
  }

  private createPaso1Form(): FormGroup {
    return this.fb.group({
      numeroRecibo: ['', [Validators.required, Validators.pattern('^[0-9\\-]+$')]],
      totalImporte: ['', [Validators.required, Validators.min(0)]],
      cantidadAsegurados: ['', [Validators.required, Validators.min(1)]],
      imagenRecibo: [null, Validators.required],
      correoEmpleador: ['', [Validators.email]],
      celularEmpleador: ['', [Validators.pattern('^[0-9]{8}$')]]
    });
  }

  private setupFormListeners(): void {
    this.paso1Form.get('cantidadAsegurados')?.valueChanges.subscribe(cantidad => {
      this.updateContactoValidations(cantidad);
    });
  }

  private updateContactoValidations(cantidad: number): void {
    const correoControl = this.paso1Form.get('correoEmpleador');
    const celularControl = this.paso1Form.get('celularEmpleador');

    if (cantidad > 1) {
      correoControl?.setValidators([Validators.required, Validators.email]);
      celularControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
    } else {
      correoControl?.clearValidators();
      celularControl?.clearValidators();
    }

    correoControl?.updateValueAndValidity();
    celularControl?.updateValueAndValidity();
  }

  private generateIdIngreso(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const empresaId = this.empresa?.id?.toString().substr(0, 4) || '0000';
    return `ING-${empresaId}-${timestamp}-${random}`;
  }

  // Métodos para manejar eventos de componentes hijos
  onFileReciboSelected(file: File): void {
    this.paso1Form.patchValue({ imagenRecibo: file });
  }

  onAseguradoAdded(aseguradoData: any): void {
    const asegurado: AseguradoExamen = {
      ...aseguradoData,
      idTemporal: Date.now() + Math.random()
    };

    this.asegurados = [...this.asegurados, asegurado];
    
    // CORRECCIÓN: Manejar idTemporal undefined
    const idParaArchivos = asegurado.idTemporal || asegurado.aseguradoId || Date.now();
    
    this.archivosAsegurados[idParaArchivos] = { 
      anverso: null, 
      reverso: null 
    };
    
    this.notification.success(`Asegurado "${asegurado.nombreCompleto}" agregado`);
  }

  onAseguradoDeleted(aseguradoId: number): void {
    this.asegurados = this.asegurados.filter(a => 
      a.aseguradoId !== aseguradoId && a.idTemporal !== aseguradoId
    );
    
    // CORRECCIÓN: Solo eliminar si existe
    if (aseguradoId in this.archivosAsegurados) {
      delete this.archivosAsegurados[aseguradoId];
    }
    
    this.notification.info('Asegurado eliminado');
  }

  onFileAseguradoSelected(data: { aseguradoId: number, tipo: 'anverso' | 'reverso', file: File }): void {
    const { aseguradoId, tipo, file } = data;
    
    // CORRECCIÓN: Inicializar si no existe
    if (!this.archivosAsegurados[aseguradoId]) {
      this.archivosAsegurados[aseguradoId] = { anverso: null, reverso: null };
    }
    
    this.archivosAsegurados[aseguradoId][tipo] = file;
    
    this.notification.success(`Archivo ${tipo} cargado`);
  }

  // Métodos helper para UI
  contarAseguradosCompletos(): number {
    return this.asegurados.filter(a => 
      a.correoElectronico?.trim() && a.celular?.trim()
    ).length;
  }

  contarAseguradosConArchivos(): number {
    return this.asegurados.filter(asegurado => {
      const id = asegurado.idTemporal || asegurado.aseguradoId;
      const archivos = this.archivosAsegurados[id];
      return archivos?.anverso && archivos?.reverso;
    }).length;
  }

  tieneArchivosCompletos(aseguradoId: number): boolean {
    const asegurado = this.asegurados.find(a => 
      a.aseguradoId === aseguradoId || a.idTemporal === aseguradoId
    );

    if (!asegurado) return false;

    const idParaArchivos = asegurado.idTemporal || asegurado.aseguradoId;
    const archivos = this.archivosAsegurados[idParaArchivos];
    return !!archivos?.anverso && !!archivos?.reverso;
  }

  // Validaciones
  canProceedToStep2(): boolean {
    const cantidadPermitida = this.paso1Form.get('cantidadAsegurados')?.value || 0;
    
    if (this.asegurados.length !== cantidadPermitida) return false;
    
    return this.asegurados.every(asegurado => {
      const id = asegurado.idTemporal || asegurado.aseguradoId;
      const archivos = this.archivosAsegurados[id];
      return asegurado.correoElectronico?.trim() && 
             asegurado.celular?.trim() && 
             archivos?.anverso && 
             archivos?.reverso;
    });
  }

  // Finalización
  finalizarRegistro(): void {
    if (!this.canProceedToStep2()) {
      this.notification.warning('Complete todos los requisitos antes de continuar');
      return;
    }

    this.isLoading = true;
    
    const examenData = this.prepareExamenData();
    
    // CORRECCIÓN: Usar createExamen() en lugar de create()
    this.examenService.createExamen(examenData)
      .pipe(
        take(1),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => this.handleSuccess(response),
        error: (error) => this.handleError(error)
      });
  }

  private prepareExamenData(): ExamenRequest {
    return {
      numeroPatronal: this.empresa.numeroPatronal,
      razonSocial: this.empresa.razonSocial,
      nit: this.empresa.nit || this.empresa.ruc || '',
      observaciones: `Recibo: ${this.paso1Form.get('numeroRecibo')?.value}`,
      Asegurados: this.asegurados.map(asegurado => ({
        aseguradoId: asegurado.aseguradoId || 0,
        ci: asegurado.ci,
        nombreCompleto: asegurado.nombreCompleto,
        fechaNacimiento: this.formatDate(asegurado.fechaNacimiento),
        genero: asegurado.genero,
        correoElectronico: asegurado.correoElectronico,
        celular: asegurado.celular,
        empresa: asegurado.empresa || this.empresa.razonSocial,
        nitEmpresa: asegurado.nitEmpresa || this.empresa.nit
      }))
    };
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

   private handleSuccess(response: any): void {
    this.notification.success('Examen registrado exitosamente');
    
    // Obtener el componente Paso3Finalizar para mostrar el modal
    const paso3Component = this.getPaso3Component();
    if (paso3Component) {
      paso3Component.mostrarModalExito(response);
    } else {
      // Fallback: mostrar el modal directamente
      this.mostrarModalExito(response);
    }
  }

  private getPaso3Component(): Paso3Finalizar | null {
    // Este método depende de cómo estés obteniendo la referencia al componente
    // En una implementación real, podrías usar @ViewChild
    return null; // Implementa según tu estructura
  }

  mostrarModalExito(response: any): void {
  const modalData = {
    idIngreso: this.idIngresoGenerado,
    fechaRegistro: new Date(),
    numeroRecibo: this.paso1Form.get('numeroRecibo')?.value,
    totalAsegurados: this.asegurados.length,
    importeTotal: this.paso1Form.get('totalImporte')?.value,
    empresa: {
      razonSocial: this.empresa?.razonSocial || '',
      nit: this.empresa?.nit || this.empresa?.NIT || '',
      numeroPatronal: this.empresa?.numeroPatronal || this.empresa?.nroPatronal || ''
    }
  };

  const dialogRef = this.dialog.open(ExamenExitoModal, {
    width: '700px',
    maxWidth: '95vw',
    maxHeight: '90vh', // Altura máxima
    height: 'auto', // Altura automática
    data: modalData,
    disableClose: false, // PERMITIR cerrar con ESC y clic fuera
    panelClass: 'exito-modal-dialog',
    autoFocus: false,
    hasBackdrop: true, // Fondo oscuro
    backdropClass: 'modal-backdrop'
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    if (result?.action === 'salir') {
      // El modal ya maneja la redirección
    } else if (result?.action === 'nuevo') {
      // Reiniciar formulario
      this.resetForm();
      if (this.stepper) {
        this.stepper.selectedIndex = 0;
      }
    } else if (result?.action === 'close') {
      // Solo cerrar el modal, sin acción adicional
      console.log('Modal cerrado por el usuario');
    }
  });
}

  // Método para manejar el evento de reinicio desde el modal
  onReiniciarRegistro(): void {
    this.resetForm();
    if (this.stepper) {
      this.stepper.selectedIndex = 0;
    }
  }

  private handleError(error: any): void {
    console.error('Error al guardar examen:', error);
    this.notification.error(this.getErrorMessage(error));
  }

  private getErrorMessage(error: any): string {
    if (error.status === 400) {
      return error.error?.detail || 'Error en los datos enviados';
    }
    if (error.status === 409) {
      return 'Ya existe un examen pendiente para esta empresa';
    }
    return 'Error al procesar la solicitud';
  }

  private showSuccessModal(): void {
    // Aquí podrías implementar un modal de éxito
    setTimeout(() => {
      this.resetForm();
      this.stepper.selectedIndex = 0;
    }, 2000);
  }

  private resetForm(): void {
    this.paso1Form.reset();
    this.asegurados = [];
    this.archivosAsegurados = {};
  }
}