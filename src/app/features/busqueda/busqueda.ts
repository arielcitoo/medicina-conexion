import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AseguradosService } from '../../service/asegurados.service';
import { Asegurado } from '../../shared/models/asegurado.model';

@Component({
  selector: 'app-busqueda',
  imports: [CommonModule, FormsModule],
  templateUrl: './busqueda.html',
  styleUrl: './busqueda.css',
})
export class Busqueda {
documento = '';
  fechaNacimiento = '';
  hoy = new Date().toISOString().split('T')[0];

  cargando = false;
  error = '';
  asegurado: Asegurado | null = null;

  constructor(private apiAseguradosService: AseguradosService) {}

  buscarAsegurado() {
    if (!this.documento || !this.fechaNacimiento) {
      this.error = 'Por favor complete todos los campos';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.asegurado = null;

    console.log('🔍 Buscando asegurado:', this.documento, this.fechaNacimiento);

    this.apiAseguradosService.buscarAsegurado(this.documento, this.fechaNacimiento).subscribe({
      next: (response) => {
        console.log('Asegurado encontrado:', response);
       // this.asegurado = response;
        this.cargando = false;
      },
      error: (err) => {
        console.error(' Error:', err);

        if (err.status === 401) {
          this.error = 'Error de autenticación. El token puede haber expirado.';
        } else if (err.status === 404) {
          this.error = 'No se encontró asegurado con los datos proporcionados.';
        } else {
          this.error = `Error ${err.status}: ${err.message}`;
        }

        this.cargando = false;
      }
    });
  }

  getNombreCompleto(): string {
    if (!this.asegurado) return '';
    return `${this.asegurado.nombres} ${this.asegurado.paterno} ${this.asegurado.materno}`.trim();
  }

  getEstadoClass(): string {
    if (!this.asegurado) return '';

    const estado = this.asegurado.estadoAsegurado.toLowerCase();
    if (estado.includes('activo')) return 'activo';
    if (estado.includes('inactivo')) return 'inactivo';
    return '';
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  verDetalles() {
    console.log('Ver detalles del asegurado:', this.asegurado);
    alert('Aquí irían los detalles completos del asegurado');
  }

  programarCita() {
    console.log('Programar cita para:', this.asegurado);
    alert('Aquí se abriría el formulario para programar cita');
  }

  limpiarBusqueda() {
    this.documento = '';
    this.fechaNacimiento = '';
    this.asegurado = null;
    this.error = '';
  }
}
