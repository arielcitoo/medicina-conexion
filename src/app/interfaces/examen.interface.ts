export interface Asegurado {
  id: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  ci: string;
  fechaNacimiento: Date | string;
  correoElectronico: string;
  celular: string;
  genero?: string;
  // Campos adicionales de la API
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  estado?: string;
  aseguradoId?: number;
  codigoAsegurado?: string;
  edad?: number;
  fechaAfiliacion?: Date;
  // Campos para el formulario gestora
  formularioAnversoUrl?: string;
  formularioReversoUrl?: string;
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
