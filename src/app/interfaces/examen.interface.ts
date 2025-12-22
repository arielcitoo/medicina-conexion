export interface Asegurado {
  id: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  ci: string;
  fechaNacimiento: Date | string;

 // Campos laborales adicionales
  cargo: string;
  area: string;
  fechaIngreso: Date | string;
  nitEmpresa:string;
  empresa: string;
    
 // Campos de contacto
  correoElectronico: string;
  celular: string;

  // Campos adicionales de la API
  genero?: string;
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
