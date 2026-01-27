// features/examenes-preocupacionales/components/examen-exito-modal/examen-exito-modal.ts
import { Component, Inject, ChangeDetectionStrategy, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

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
  action: 'descargar' | 'salir' | 'nuevo' | 'close';
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
  styleUrls: ['./examen-exito-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamenExitoModal {
  private dialogRef = inject(MatDialogRef<ExamenExitoModal, ExitoModalResult>);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private readonly DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ExitoModalData) {
    // Configurar comportamiento del modal
    this.dialogRef.disableClose = false; // Permitir cerrar con ESC
    this.dialogRef.updateSize('700px', 'auto'); // Altura automática
  }

  // Permitir cerrar con ESC
  @HostListener('keydown.esc')
  onEsc(): void {
    this.cerrar();
  }

  cerrar(): void {
    this.dialogRef.close({ action: 'close' });
  }

  formatDate(fecha: Date): string {
    if (!fecha || !(fecha instanceof Date)) {
      return 'Fecha no disponible';
    }

    return fecha.toLocaleDateString('es-ES', this.DATE_FORMAT_OPTIONS)
      .replace(',', '')
      .replace(/\//g, '/');
  }

  formatNumber(numero: number): string {
    if (isNaN(numero)) {
      return '0.00';
    }

    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  }

  descargarPDF(): void {
    console.log('Generando comprobante para:', this.data.idIngreso);

    const contenidoHTML = this.crearContenidoComprobante();
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante - ${this.data.idIngreso}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none !important; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${contenidoHTML}
        <div class="footer no-print">
          <p>Este documento fue generado el ${new Date().toLocaleDateString('es-ES')}</p>
          <button onclick="window.print()" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Imprimir o Guardar como PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            Cerrar
          </button>
        </div>
      </body>
      </html>
    `);

      ventanaImpresion.document.close();
    } else {
      alert('Por favor, permite ventanas emergentes para ver el comprobante');
    }
  }

  private crearContenidoComprobante(): string {
    return `
    <div class="header">
      <h1>COMPROBANTE DE REGISTRO</h1>
      <h2>Examen Preocupacional</h2>
    </div>
    
    <div class="section">
      <p><span class="label">ID de Registro:</span> ${this.data.idIngreso}</p>
      <p><span class="label">Fecha de Registro:</span> ${this.formatDate(this.data.fechaRegistro)}</p>
      <p><span class="label">Número de Recibo:</span> ${this.data.numeroRecibo}</p>
    </div>
    
    <div class="section">
      <h3>Datos de la Empresa</h3>
      <p><span class="label">Razón Social:</span> ${this.data.empresa.razonSocial}</p>
      <p><span class="label">NIT:</span> ${this.data.empresa.nit}</p>
      <p><span class="label">Número Patronal:</span> ${this.data.empresa.numeroPatronal}</p>
    </div>
    
    <div class="section">
      <h3>Resumen del Registro</h3>
      <p><span class="label">Total Asegurados:</span> ${this.data.totalAsegurados}</p>
      <p><span class="label">Importe Total:</span> Bs. ${this.formatNumber(this.data.importeTotal)}</p>
    </div>
    
    <div class="footer">
      <hr>
      <p>Sistema CNS - Caja Nacional de Salud</p>
      <p>Documento generado electrónicamente</p>
    </div>
  `;
  }

  salir(): void {
    this.dialogRef.close({ action: 'salir' });

    setTimeout(() => {
      this.ngZone.run(() => {
        this.cerrarSesionYRedirigir();
      });
    }, 100);
  }

  private cerrarSesionYRedirigir(): void {
    try {
      this.limpiarDatosSesion();
      this.router.navigate(['/login'], {
        replaceUrl: true,
        queryParams: { logout: 'true' }
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      try {
        this.router.navigate(['/login']);
      } catch (e) {
        window.location.href = '/login';
      }
    }
  }

  private limpiarDatosSesion(): void {
    try {
      const itemsParaMantener = ['configuracion', 'preferencias'];
      const localStorageKeys = Object.keys(localStorage);

      localStorageKeys.forEach(key => {
        if (!itemsParaMantener.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();
      this.limpiarCookies();
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.warn('Error parcial al limpiar sesión:', error);
    }
  }

  private limpiarCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('token') || name.includes('session') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    } catch (error) {
      console.warn('Error al limpiar cookies:', error);
    }
  }

  // nuevoExamen(): void {
  //   this.dialogRef.close({ action: 'nuevo' });
  // }

  get tituloModal(): string {
    return `Registro Exitoso - ${this.data.idIngreso}`;
  }

  get subtituloModal(): string {
    return `${this.data.empresa.razonSocial} (NIT: ${this.data.empresa.nit})`;
  }
}