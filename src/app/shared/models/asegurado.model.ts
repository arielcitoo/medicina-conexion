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