import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';

import { Documento, Asegurado } from '../../models/admin-citas.interface';
@Component({
  selector: 'app-ver-documentos-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule
  ],
  providers: [DatePipe],
  templateUrl: './ver-documentos-dialog.html',
  styleUrls: ['./ver-documentos-dialog.css']
})
export class VerDocumentosDialogComponent implements OnInit {
  documentos: Documento[];
  documentosPendientes: Documento[] = [];
  documentosAprobados: Documento[] = [];
  documentosRechazados: Documento[] = [];
  asegurado: Asegurado;

  constructor(
    public dialogRef: MatDialogRef<VerDocumentosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    this.documentos = data.documentos;
    this.asegurado = data.asegurado;
  }

  ngOnInit(): void {
    this.filtrarDocumentos();
  }

  private filtrarDocumentos(): void {
    this.documentosPendientes = this.documentos.filter(d => d.estado === 'pendiente');
    this.documentosAprobados = this.documentos.filter(d => d.estado === 'aprobado');
    this.documentosRechazados = this.documentos.filter(d => d.estado === 'rechazado');
  }

  // Métodos para obtener datos del asegurado según tu interfaz
  getNombreCompleto(): string {
    // Si existe nombreCompleto calculado, usarlo
    if (this.asegurado.nombreCompleto) {
      return this.asegurado.nombreCompleto;
    }
    
    // Construir nombre completo a partir de paterno, materno y nombres
    const nombreCompleto = [
      this.asegurado.paterno,
      this.asegurado.materno,
      this.asegurado.nombres
    ].filter(part => part && part.trim()).join(' ');
    
    return nombreCompleto || 'Asegurado';
  }

  getCI(): string {
    // Usar documentoIdentidad con extensión si existe
    const ci = this.asegurado.documentoIdentidad || '';
    const extension = this.asegurado.extencion || '';
    const complemento = this.asegurado.complemento || '';
    
    if (extension) {
      return `${ci} ${extension} ${complemento}`.trim();
    }
    return ci || 'No disponible';
  }

  getEmpresa(): string {
    return this.asegurado.razonSocial || 'No disponible';
  }

  getEmail(): string {
    return this.asegurado.correoElectronico || 'No disponible';
  }

  getTelefono(): string {
    return this.asegurado.celular || 'No disponible';
  }

  getMatricula(): string {
    return this.asegurado.matricula || 'No disponible';
  }

  getEstadoAsegurado(): string {
    return this.asegurado.estadoAsegurado || 'No disponible';
  }

  getFechaNacimiento(): string {
    return this.asegurado.fechaNacimiento || 'No disponible';
  }

  getFechaNacimientoFormateada(): string {
    if (!this.asegurado.fechaNacimiento) return 'No disponible';
    
    try {
      // Intentar formatear la fecha
      const fecha = new Date(this.asegurado.fechaNacimiento);
      return this.datePipe.transform(fecha, 'dd/MM/yyyy') || this.asegurado.fechaNacimiento;
    } catch {
      return this.asegurado.fechaNacimiento;
    }
  }

  getTipoDocumento(tipo: string): string {
    switch(tipo) {
      case 'recibo': return 'Recibo de Pago';
      case 'gestora_anverso': return 'Gestora (Anverso)';
      case 'gestora_reverso': return 'Gestora (Reverso)';
      default: return 'Otro Documento';
    }
  }

  getIconoTipo(tipo: string): string {
    switch(tipo) {
      case 'recibo': return 'receipt';
      case 'gestora_anverso': return 'description';
      case 'gestora_reverso': return 'description';
      default: return 'attach_file';
    }
  }

  getEstadoColor(estado: string): string {
    switch(estado) {
      case 'aprobado': return 'aprobado';
      case 'pendiente': return 'pendiente';
      case 'rechazado': return 'rechazado';
      default: return '';
    }
  }

  getTextoEstado(estado: string): string {
    switch(estado) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  }

  verDocumento(url: string): void {
    window.open(url, '_blank');
  }

  aprobarDocumento(documento: Documento): void {
    documento.estado = 'aprobado';
    this.filtrarDocumentos();
  }

  rechazarDocumento(documento: Documento): void {
    documento.estado = 'rechazado';
    this.filtrarDocumentos();
  }

  marcarComoPendiente(documento: Documento): void {
    documento.estado = 'pendiente';
    this.filtrarDocumentos();
  }

  getTotalDocumentos(): number {
    return this.documentos.length;
  }

  getDocumentosPendientesCount(): number {
    return this.documentosPendientes.length;
  }

  tieneDocumentosPendientes(): boolean {
    return this.documentosPendientes.length > 0;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  guardarCambios(): void {
    this.dialogRef.close(this.documentos);
  }
}