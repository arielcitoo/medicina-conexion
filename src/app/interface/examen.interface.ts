import { AseguradoCreateDTO } from "../core/service/examen-preocupacional.service";


export interface ExamenRequest {
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  observaciones?: string;
  Asegurados: AseguradoCreateDTO[];
}

/**
 * Respuesta del API al crear un examen
 */
export interface ExamenResponse {
  id: number;
  numeroPatronal: string;
  razonSocial: string;
  nit: string;
  fechaSolicitud: string;
  estado: string;
  observaciones?: string;
}

// Interfaz para asegurados que vienen del backend
export interface AseguradoBackend {
  id: number; // ID en la tabla asegurados
  ci: string;
  nombreCompleto: string;
  documentoIdentidad: string;
  fechaNacimiento: Date | string;
  
  // Campos laborales
  cargo: string;
  area: string;
  fechaIngreso: Date | string;
  nitEmpresa: string;
  empresa: string;
   empresaId?: number;
  
  // Campos de contacto
  correoElectronico: string;
  celular: string;
  
  // Campos adicionales
  genero?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  estado?: string;
  codigoAsegurado?: string;
  edad?: number;
  fechaAfiliacion?: Date;
  
  // Campos para el formulario gestora
  formularioAnversoUrl?: string;
  formularioReversoUrl?: string;
}

// Interfaz para usar en el examen preocupacional
export interface AseguradoExamen extends AseguradoCreateDTO {
  // Campos adicionales para el UI
  formularioAnversoUrl?: string;
  formularioReversoUrl?: string;
  idTemporal?: number; // Para manejo temporal en UI
  fechaRegistro?: string;
  estado?: string;
}

// Nueva interfaz para el modal (sin id)
export interface AseguradoModal {
  ci: string;
  fechaNacimiento: Date;
  nombreCompleto: string;
  documentoIdentidad: string;
  correoElectronico: string;
  celular: string;
}