import { ApiResponse } from "./api-response.model";

export interface Asegurado {
  id?: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  ci: string;
  fechaNacimiento: Date | string;
  
  // Campos laborales
  cargo?: string;
  area?: string;
  fechaIngreso?: Date | string;
  nitEmpresa?: string;
  empresa?: string;
  
  // Campos de contacto
  correoElectronico: string;
  celular: string;
  
  // Campos adicionales de API
  genero?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  estado?: string;
  aseguradoId?: number;
  codigoAsegurado?: string;
  edad?: number;
  fechaAfiliacion?: Date;
  
  // Formularios
  formularioAnversoUrl?: string;
  formularioReversoUrl?: string;
}

// Tipo específico para respuestas de asegurado
export type AseguradoApiResponse = ApiResponse<Asegurado>;