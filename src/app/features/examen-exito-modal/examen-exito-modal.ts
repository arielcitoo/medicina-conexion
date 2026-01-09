import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef,  } from '@angular/material/dialog';
import { SharedMaterialModule } from '../../shared/modules/material.module'; //angular Material módulos compartidos

export interface ExitoModalData {
  idIngreso: string;
  fechaRegistro: Date;
  numeroRecibo: string;
  totalAsegurados: number;
  importeTotal: number;
  empresa: {
  razonSocial: string;
  nit: string;
  numeroPatronal: string;
  };
}

@Component({
  selector: 'app-examen-exito-modal',
  imports: [SharedMaterialModule],
  templateUrl: './examen-exito-modal.html',
  styleUrl: './examen-exito-modal.css',
})
export class ExamenExitoModal {

  private dialogRef = inject(MatDialogRef<ExamenExitoModal>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ExitoModalData) {}

  /**
   * Formatear fecha
   */
  formatDate(fecha: Date): string {
    if (!fecha) return '';
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  }

  /**
   * Formatear número
   */
  formatNumber(numero: number): string {
    if (isNaN(numero)) return '0.00';
    return numero.toFixed(2);
  }

  /**
   * Descargar PDF
   */
  descargarPDF(): void {
    this.dialogRef.close({ action: 'descargar' });
  }

  /**
   * Salir
   */
  salir(): void {
    this.dialogRef.close({ action: 'salir' });
  }
}

