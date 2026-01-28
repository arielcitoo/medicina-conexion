import { Asegurado as AseguradoBase } from '../../../interface/asegurado.interface';

export interface Documento {
  id: number;
  tipo: 'recibo' | 'gestora_anverso' | 'gestora_reverso' | 'otros';
  nombreArchivo: string;
  url: string;
  fechaCarga: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

// Extender la interfaz existente para el módulo de citas
export interface Asegurado extends AseguradoBase {
  // Ya incluye todas las propiedades de AseguradoBase
  // Podemos agregar propiedades específicas para citas si son necesarias
}

export interface SolicitudExamen {
  id: number;
  asegurado: Asegurado;
  documentos: Documento[];
  estado: 'pendiente' | 'observado' | 'aprobado' | 'programado' | 'completado';
  fechaRegistro: Date;
  fechaAprobacion?: Date;
  fechaProgramacion?: Date;
  observaciones?: string;
  citasProgramadas?: Cita[];
}

export interface HorarioDisponible {
  id: number;
  servicio: 'laboratorio' | 'rayos_x' | 'evaluacion_medica';
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  cuposTotales: number;
}

export interface Cita {
  id?: number;
  solicitudId: number;
  servicio: 'laboratorio' | 'rayos_x' | 'evaluacion_medica';
  fecha: Date;
  hora: string;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
}