// features/examenes-preocupacionales/components/paso3-finalizar/paso3-finalizar.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { AseguradoExamen } from '../../../../interface/examen.interface';
import { ExamenExitoModal } from '../examen-exito-modal/examen-exito-modal';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-paso3-finalizar',
  standalone: true,
  imports: [CommonModule, SharedMaterialModule],
  templateUrl: './paso3-finalizar.html',
  styleUrls: ['./paso3-finalizar.css']
})
export class Paso3Finalizar {
  @Input() empresa: any = null;
  @Input() paso1Form!: FormGroup;
  @Input() asegurados: AseguradoExamen[] = [];
  @Input() archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  @Input() idIngresoGenerado: string = '';
  @Input() isLoading: boolean = false;
  @Input() canProceedToStep2: boolean = false;
  @Output() finalizarRegistro = new EventEmitter<void>();
  @Output() abrirModalExito = new EventEmitter<any>(); 

    private readonly dialog = inject(MatDialog);

  
   // Métodos para estadísticas
  contarAseguradosCompletos(): number {
    return this.asegurados.filter(a => 
      a.correoElectronico?.trim() && a.celular?.trim()
    ).length;
  }

  contarAseguradosConArchivos(): number {
    return this.asegurados.filter(asegurado => {
      const archivos = this.archivosAsegurados[asegurado.idTemporal || asegurado.aseguradoId];
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

  onFinalizar(): void {
    this.finalizarRegistro.emit();
  }

  // Método para abrir el modal de éxito (llamado desde el padre)
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
      data: modalData,
      disableClose: true,
      panelClass: 'exito-modal-dialog'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'salir') {
        // El modal ya maneja la redirección
      } else if (result?.action === 'nuevo') {
        // Reiniciar formulario para nuevo registro
        this.abrirModalExito.emit({ action: 'reiniciar' });
      }
    });
  }
}