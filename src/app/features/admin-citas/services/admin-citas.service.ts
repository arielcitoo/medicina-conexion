import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SolicitudExamen, HorarioDisponible, Cita } from '../models/admin-citas.interface';
import { BaseApiService } from '../../../core/service/base-api.service';
import { AdminCitas } from '../admin-citas/admin-citas';

@Injectable({
  providedIn: 'root'
})
export class AdminCitasService extends BaseApiService {
  
  constructor(http: HttpClient) {
    super(http);
  }

  // Obtener todas las solicitudes
  getSolicitudes(): Observable<SolicitudExamen[]> {
    return this.get<SolicitudExamen[]>('admin-citas/solicitudes');
  }

  // Obtener solicitud por ID
  getSolicitudById(id: number): Observable<SolicitudExamen> {
    return this.get<SolicitudExamen>(`admin-citas/solicitudes/${id}`);
  }

  // Aprobar solicitud
  aprobarSolicitud(id: number): Observable<any> {
    return this.post(`admin-citas/solicitudes/${id}/aprobar`, {});
  }

  // Observar solicitud
  observarSolicitud(id: number, observaciones: string): Observable<any> {
    return this.post(`admin-citas/solicitudes/${id}/observar`, { observaciones });
  }

  // Rechazar solicitud
  rechazarSolicitud(id: number, motivo: string): Observable<any> {
    return this.post(`admin-citas/solicitudes/${id}/rechazar`, { motivo });
  }

  // Enviar email de aprobación
  enviarEmailAprobacion(id: number): Observable<any> {
    return this.post(`admin-citas/solicitudes/${id}/enviar-email`, {});
  }

  // Obtener horarios disponibles
  getHorariosDisponibles(): Observable<HorarioDisponible[]> {
    return this.get<HorarioDisponible[]>('admin-citas/horarios');
  }

  // Programar citas
  programarCitas(solicitudId: number, citas: Cita[]): Observable<any> {
    return this.post(`admin-citas/solicitudes/${solicitudId}/programar`, { citas });
  }

  // Buscar solicitudes
  buscarSolicitudes(filtro: string): Observable<SolicitudExamen[]> {
    return this.get<SolicitudExamen[]>(`admin-citas/solicitudes/buscar?q=${filtro}`);
  }

  // Datos mock para desarrollo
  getSolicitudesMock(): SolicitudExamen[] {
    return [
      {
        id: 1,
        asegurado: {
          id: 1,
          ci: '1234567',
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: 'juan.perez@email.com',
          telefono: '77712345',
          empresa: 'Empresa ABC',
          numeroPatronal: 'PAT123'
        },
        documentos: [
          {
            id: 1,
            tipo: 'recibo',
            nombreArchivo: 'recibo_pago.pdf',
            url: '/assets/docs/recibo1.pdf',
            fechaCarga: new Date('2024-01-15'),
            estado: 'aprobado'
          },
          {
            id: 2,
            tipo: 'gestora_anverso',
            nombreArchivo: 'gestora_anverso.jpg',
            url: '/assets/docs/gestora1.jpg',
            fechaCarga: new Date('2024-01-15'),
            estado: 'pendiente'
          }
        ],
        estado: 'pendiente',
        fechaRegistro: new Date('2024-01-15'),
        observaciones: 'Falta documento de identidad'
      },
      {
        id: 2,
        asegurado: {
          id: 2,
          ci: '7654321',
          nombres: 'María',
          apellidos: 'Gómez',
          email: 'maria.gomez@email.com',
          telefono: '77754321',
          empresa: 'Empresa XYZ',
          numeroPatronal: 'PAT456'
        },
        documentos: [
          {
            id: 3,
            tipo: 'recibo',
            nombreArchivo: 'recibo_pago2.pdf',
            url: '/assets/docs/recibo2.pdf',
            fechaCarga: new Date('2024-01-16'),
            estado: 'aprobado'
          }
        ],
        estado: 'aprobado',
        fechaRegistro: new Date('2024-01-16'),
        fechaAprobacion: new Date('2024-01-17')
      },
      {
        id: 3,
        asegurado: {
          id: 3,
          ci: '9876543',
          nombres: 'Carlos',
          apellidos: 'Rodríguez',
          email: 'carlos.rodriguez@email.com',
          telefono: '77798765',
          empresa: 'Industrias Bolivianas',
          numeroPatronal: 'PAT789'
        },
        documentos: [
          {
            id: 4,
            tipo: 'recibo',
            nombreArchivo: 'recibo_pago3.pdf',
            url: '/assets/docs/recibo3.pdf',
            fechaCarga: new Date('2024-01-18'),
            estado: 'aprobado'
          },
          {
            id: 5,
            tipo: 'gestora_anverso',
            nombreArchivo: 'gestora_anverso2.jpg',
            url: '/assets/docs/gestora2.jpg',
            fechaCarga: new Date('2024-01-18'),
            estado: 'aprobado'
          },
          {
            id: 6,
            tipo: 'gestora_reverso',
            nombreArchivo: 'gestora_reverso2.jpg',
            url: '/assets/docs/gestora_rev2.jpg',
            fechaCarga: new Date('2024-01-18'),
            estado: 'aprobado'
          }
        ],
        estado: 'programado',
        fechaRegistro: new Date('2024-01-18'),
        fechaAprobacion: new Date('2024-01-19'),
        fechaProgramacion: new Date('2024-01-20'),
        citasProgramadas: [
          {
            solicitudId: 3,
            servicio: 'laboratorio',
            fecha: new Date('2024-01-25'),
            hora: '08:00',
            duracion: 30,
            estado: 'confirmada'
          }
        ]
      }
    ];
  }
}