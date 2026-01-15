export interface Asegurado {
  aseguradoId: number;
  matricula: string;
  estadoAsegurado: string;
  documentoIdentidad: string;
  extencion: string;
  complemento: string;
  fechaNacimiento: string;
  paterno: string;
  materno: string;
  nombres: string;
  genero: string;
  tipoAsegurado: string;
  razonSocial: string;
  nroPatronal: string;
  estadoMora: string;
  grupoFamiliarId: number;
  
  // Hacer estos campos opcionales si no siempre vienen de la API
  correoElectronico?: string;
  celular?: string;
  area?: string;
  cargo?: string;
  fechaIngreso?: Date | string;
  empresaId?: number;
  
  // Campo calculado
  nombreCompleto?: string;
}

export interface BusquedaAseguradoRequest {
  documentoIdentidad: string;
  fechaNacimiento: string;
}

export interface BusquedaAseguradoResponse {
  success: boolean;
  data?: Asegurado;
  message?: string;
}