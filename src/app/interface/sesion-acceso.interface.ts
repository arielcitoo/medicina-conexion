// interfaces/sesion.interface.ts
export interface SesionAcceso {
  id: string; // ID único generado
  empresaId: string;
  razonSocial: string;
  estado: 'ACTIVO' | 'EN_PROCESO' | 'COMPLETADO' | 'EXPIRADO';
  fechaCreacion: Date;
  fechaExpiracion: Date;
  ultimoAcceso: Date;
  pasoActual: number; // 0: prelogin, 1: datos empresa, 2: formulario, etc.
  datosParciales: any; // Datos guardados hasta el momento
  ipOrigen?: string;
  userAgent?: string;
}

export interface CredencialesAcceso {
  idAcceso: string;
  empresaId?: string;
}