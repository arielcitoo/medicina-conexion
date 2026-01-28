import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';

import { SolicitudExamen, HorarioDisponible, Cita } from '../../models/admin-citas.interface';
import { AdminCitasService } from '../../services/admin-citas.service';

@Component({
  selector: 'app-programar-citas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatRadioModule,
    MatListModule
  ],
  templateUrl: './programar-citas-dialog.html',
  styleUrls: ['./programar-citas-dialog.css']
})
export class ProgramarCitasDialogComponent implements OnInit {
  solicitud: SolicitudExamen;
  horarios: HorarioDisponible[] = [];
  citasSeleccionadas: Cita[] = [];
  
  servicios = [
    { id: 'laboratorio', nombre: 'Laboratorio', icono: 'science' },
    { id: 'rayos_x', nombre: 'Rayos X', icono: 'scatter_plot' },
    { id: 'evaluacion_medica', nombre: 'Evaluación Médica', icono: 'medical_services' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ProgramarCitasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private adminCitasService: AdminCitasService
  ) {
    this.solicitud = data.solicitud;
  }

  ngOnInit(): void {
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    // En producción, usar servicio real
    // this.adminCitasService.getHorariosDisponibles().subscribe({
    //   next: (horarios) => {
    //     this.horarios = horarios;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar horarios:', error);
    //   }
    // });

    // Datos mock
    this.horarios = [
      {
        id: 1,
        servicio: 'laboratorio',
        fecha: new Date('2024-01-25'),
        horaInicio: '08:00',
        horaFin: '08:30',
        cuposDisponibles: 5,
        cuposTotales: 10
      },
      {
        id: 2,
        servicio: 'laboratorio',
        fecha: new Date('2024-01-25'),
        horaInicio: '08:30',
        horaFin: '09:00',
        cuposDisponibles: 3,
        cuposTotales: 10
      },
      {
        id: 3,
        servicio: 'rayos_x',
        fecha: new Date('2024-01-25'),
        horaInicio: '09:00',
        horaFin: '09:30',
        cuposDisponibles: 8,
        cuposTotales: 10
      },
      {
        id: 4,
        servicio: 'evaluacion_medica',
        fecha: new Date('2024-01-25'),
        horaInicio: '10:00',
        horaFin: '10:30',
        cuposDisponibles: 4,
        cuposTotales: 10
      }
    ];
  }

  getHorariosPorServicio(servicio: string): HorarioDisponible[] {
    return this.horarios.filter(h => h.servicio === servicio && h.cuposDisponibles > 0);
  }

  seleccionarCita(servicio: string, horario: HorarioDisponible): void {
    // Remover cita existente para el mismo servicio
    this.citasSeleccionadas = this.citasSeleccionadas.filter(c => c.servicio !== servicio);
    
    // Agregar nueva cita
    const nuevaCita: Cita = {
      solicitudId: this.solicitud.id,
      servicio: servicio as any,
      fecha: horario.fecha,
      hora: horario.horaInicio,
      duracion: 30,
      estado: 'confirmada'
    };
    
    this.citasSeleccionadas.push(nuevaCita);
  }

  getCitaSeleccionada(servicio: string): Cita | undefined {
    return this.citasSeleccionadas.find(c => c.servicio === servicio);
  }

  getHorariosLaboratorio(): HorarioDisponible[] {
  return this.horarios.filter(h => h.servicio === 'laboratorio' && h.cuposDisponibles > 0);
}

getHorariosRayosX(): HorarioDisponible[] {
  return this.horarios.filter(h => h.servicio === 'rayos_x' && h.cuposDisponibles > 0);
}

getHorariosEvaluacion(): HorarioDisponible[] {
  return this.horarios.filter(h => h.servicio === 'evaluacion_medica' && h.cuposDisponibles > 0);
}

getNombreServicio(servicio: string): string {
  const servicioObj = this.servicios.find(s => s.id === servicio);
  return servicioObj ? servicioObj.nombre : servicio;
}

getIconoServicio(servicio: string): string {
  const servicioObj = this.servicios.find(s => s.id === servicio);
  return servicioObj ? servicioObj.icono : 'help';
}


  todasCitasSeleccionadas(): boolean {
    return this.citasSeleccionadas.length === this.servicios.length;
  }

  programar(): void {
    if (this.todasCitasSeleccionadas()) {
      this.dialogRef.close(this.citasSeleccionadas);
    } else {
      alert('Debe seleccionar horarios para todos los servicios');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  filtrarPorFecha(servicio: string, fecha: Date): void {
  console.log(`Filtrando ${servicio} por fecha:`, fecha);
  // Implementar lógica de filtrado
}

mostrarMasFechas(servicio: string): void {
  console.log(`Mostrando más fechas para: ${servicio}`);
  // Implementar lógica para cargar más fechas
}

deseleccionarCita(servicio: string): void {
  this.citasSeleccionadas = this.citasSeleccionadas.filter(c => c.servicio !== servicio);
}

getEstadoServicio(servicio: string): string {
  return servicio; // Retorna el nombre del servicio para usar como clase CSS
}

getDuracionServicio(servicio: string): number {
  switch(servicio) {
    case 'laboratorio': return 30;
    case 'rayos_x': return 20;
    case 'evaluacion_medica': return 45;
    default: return 30;
  }
}
}