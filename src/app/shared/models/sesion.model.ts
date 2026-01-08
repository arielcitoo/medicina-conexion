import { ApiResponse } from "./api-response.model";

export interface SesionAcceso {
  id: string;
  empresaId: string;
  razonSocial: string;
  estado: 'ACTIVO' | 'EN_PROCESO' | 'COMPLETADO' | 'EXPIRADO';
  fechaCreacion: Date;
  fechaExpiracion: Date;
  ultimoAcceso: Date;
  pasoActual: number;
  datosParciales: any;
  ipOrigen?: string;
  userAgent?: string;
}

export interface CredencialesAcceso {
  idAcceso: string;
  empresaId?: string;
}

// Tipo específico para respuestas de sesión
export type SesionApiResponse = ApiResponse<SesionAcceso>;