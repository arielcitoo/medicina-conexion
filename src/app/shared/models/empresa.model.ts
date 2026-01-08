import { ApiResponse } from "./api-response.model";

export interface Empresa {
  id: number;
  numeroPatronal: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  estado: string;
  email: string;
  fechaAfiliacion: Date;
  tipoEmpresa: string;
  nroPatronal: string;
  nroTrabajadores: number;
  
  // Campos adicionales para compatibilidad
  empresaId?: number;
  nit?: string;

  fechaVerificacion?: string;
  verificada?: boolean;
  puedeAcceder?: boolean;
  
  // Campos de la API original
  RazonSocial?: string;
  NIT?: string;
  NumeroPatronal?: string;
  Estado?: string;
  Direccion?: string;
  Telefono?: string;
  FechaAfiliacion?: string;
}

// Tipo específico para respuestas de empresa
export type EmpresaApiResponse = ApiResponse<Empresa>;