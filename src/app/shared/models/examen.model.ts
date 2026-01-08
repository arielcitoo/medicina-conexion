import { ApiResponse } from "./api-response.model";
import { Asegurado } from "./asegurado.model";

export interface ExamenPreocupacional {
  id?: string;
  idIngreso: string;
  fechaRegistro: Date;
  empresa: any;
  
  recibo: {
    numeroRecibo: string;
    totalImporte: number;
    cantidadAsegurados: number;
    imagenRecibo?: File;
    correoEmpleador?: string;
    celularEmpleador?: string;
  };
  
  asegurados: Asegurado[];
  
  estado: 'REGISTRADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  metadata?: {
    usuario: string;
    ip: string;
    userAgent: string;
    version: string;
    timestamp: string;
  };
}

// Tipo específico para respuestas de examen
export type ExamenApiResponse = ApiResponse<ExamenPreocupacional>;