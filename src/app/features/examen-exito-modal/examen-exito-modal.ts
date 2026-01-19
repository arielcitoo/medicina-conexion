import { Component, Inject, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

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

export interface ExitoModalResult {
  action: 'descargar' | 'salir' | 'nuevo';
}

@Component({
  selector: 'app-examen-exito-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './examen-exito-modal.html',
  styleUrl: './examen-exito-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Mejor rendimiento
})
export class ExamenExitoModal {
  private dialogRef = inject(MatDialogRef<ExamenExitoModal, ExitoModalResult>);

  // Constantes para formateo
  private readonly DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ExitoModalData) {}

  /**
   * Formatea una fecha de manera consistente
   */
  formatDate(fecha: Date): string {
    if (!fecha || !(fecha instanceof Date)) {
      return 'Fecha no disponible';
    }

    return fecha.toLocaleDateString('es-ES', this.DATE_FORMAT_OPTIONS)
      .replace(',', '') // Remover coma del formato
      .replace(/\//g, '/'); // Asegurar separadores consistentes
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(monto: number): string {
    if (isNaN(monto)) {
      return '0.00';
    }

    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  /**
   * Formatea un número entero
   */
  formatNumber(numero: number): string {
    if (isNaN(numero)) {
      return '0';
    }

    return numero.toString();
  }

  /**
   * Descarga el PDF del comprobante
   */
  descargarPDF(): void {
    // Se podría implementar generación o descarga del PDF aquí
    console.log('Iniciando descarga de PDF para:', this.data.idIngreso);
    this.dialogRef.close({ action: 'descargar' });
  }

  /**
   * Sale del modal y probablemente redirige al dashboard
   */
  salir(): void {
    this.dialogRef.close({ action: 'salir' });
  }

  /**
   * Permite registrar un nuevo examen
   */
  nuevoExamen(): void {
    this.dialogRef.close({ action: 'nuevo' });
  }

  /**
   * Obtiene el título del modal basado en el éxito
   */
  get tituloModal(): string {
    return `Registro Exitoso - ${this.data.idIngreso}`;
  }

  /**
   * Obtiene el subtítulo con información de la empresa
   */
  get subtituloModal(): string {
    return `${this.data.empresa.razonSocial} (NIT: ${this.data.empresa.nit})`;
  }
}