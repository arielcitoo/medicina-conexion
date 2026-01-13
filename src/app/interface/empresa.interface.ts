
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
}

export interface VerificacionEmpresaResponse {
  success: boolean;
  mensaje: string;
  codigo: string;
  empresa: Empresa;
  token?: string;//tr
  expiracion?: string;//rt
}

export interface EmpresaAfiliada {
  ID: number;
  NIT: string;
  NumeroPatronal: string;
  RazonSocial: string;
  Estado: string;
  Direccion: string;
  Telefono: string;
  Email: string;
  FechaAfiliacion: string;
  TipoEmpresa: string;
}

export interface EmpresaSearchResponse {
  success: boolean;
  message: string;
  data: EmpresaAfiliada[];
  total: number;
}

export interface EmpresaStorage extends Empresa {
  fechaVerificacion: string;
  verificada: boolean;
  puedeAcceder: boolean;
}



