import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SolicitudExamen, HorarioDisponible, Cita } from '../models/admin-citas.interface';
import { BaseApiService } from '../../../core/service/base-api.service';


@Injectable({
  providedIn: 'root'
})
export class AdminCitasService extends BaseApiService {
  
  constructor() {
    super(); // Esto es CRÍTICO - llama al constructor de BaseApiService
  }

  // Obtener todas las solicitudes
  getSolicitudes(): Observable<SolicitudExamen[]> {
    return this.getRequest<SolicitudExamen[]>('/admin-citas/solicitudes');
  }

  // Obtener solicitud por ID
  getSolicitudById(id: number): Observable<SolicitudExamen> {
    return this.getRequest<SolicitudExamen>(`/admin-citas/solicitudes/${id}`);
  }

  // Aprobar solicitud
  aprobarSolicitud(id: number): Observable<any> {
    return this.postRequest(`/admin-citas/solicitudes/${id}/aprobar`, {});
  }

  // Observar solicitud
  observarSolicitud(id: number, observaciones: string): Observable<any> {
    return this.postRequest(`/admin-citas/solicitudes/${id}/observar`, { observaciones });
  }

  // Rechazar solicitud
  rechazarSolicitud(id: number, motivo: string): Observable<any> {
    return this.postRequest(`/admin-citas/solicitudes/${id}/rechazar`, { motivo });
  }

  // Enviar email de aprobación
  enviarEmailAprobacion(id: number): Observable<any> {
    return this.postRequest(`/admin-citas/solicitudes/${id}/enviar-email`, {});
  }

  // Obtener horarios disponibles
  getHorariosDisponibles(): Observable<HorarioDisponible[]> {
    return this.getRequest<HorarioDisponible[]>('/admin-citas/horarios');
  }

  // Programar citas
  programarCitas(solicitudId: number, citas: Cita[]): Observable<any> {
    return this.postRequest(`/admin-citas/solicitudes/${solicitudId}/programar`, { citas });
  }

  // Buscar solicitudes
  buscarSolicitudes(filtro: string): Observable<SolicitudExamen[]> {
    return this.getRequest<SolicitudExamen[]>('/admin-citas/solicitudes/buscar', { q: filtro });
  }

  // Datos mock para desarrollo
  getSolicitudesMock(): SolicitudExamen[] {
    return [
      {
        id: 1,
        asegurado: {
          aseguradoId: 1,
          matricula: 'MAT001',
          estadoAsegurado: 'ACTIVO',
          documentoIdentidad: '1234567',
          extencion: 'LP',
          complemento: '',
          fechaNacimiento: '1985-05-15',
          paterno: 'Pérez',
          materno: 'Gómez',
          nombres: 'Juan',
          genero: 'MASCULINO',
          tipoAsegurado: 'TITULAR',
          razonSocial: 'Empresa ABC S.A.',
          nroPatronal: 'PAT123',
          estadoMora: 'AL DÍA',
          grupoFamiliarId: 1,
          correoElectronico: 'juan.perez@email.com',
          celular: '77712345',
          nombreCompleto: 'Juan Pérez Gómez'
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
          aseguradoId: 2,
          matricula: 'MAT002',
          estadoAsegurado: 'ACTIVO',
          documentoIdentidad: '7654321',
          extencion: 'LP',
          complemento: '',
          fechaNacimiento: '1990-08-22',
          paterno: 'Gómez',
          materno: 'López',
          nombres: 'María',
          genero: 'FEMENINO',
          tipoAsegurado: 'TITULAR',
          razonSocial: 'Empresa XYZ Ltda.',
          nroPatronal: 'PAT456',
          estadoMora: 'AL DÍA',
          grupoFamiliarId: 2,
          correoElectronico: 'maria.gomez@email.com',
          celular: '77754321',
          nombreCompleto: 'María Gómez López'
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
      }
    ];
  }
}