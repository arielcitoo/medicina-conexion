import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

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
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
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

