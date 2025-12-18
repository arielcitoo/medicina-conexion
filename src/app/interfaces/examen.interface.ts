export interface Asegurado {
  id: number;  // Cambiado: removemos el ? para hacerlo requerido
  ci: string;
  genero: string;
  fechaNacimiento: Date;
  nombreCompleto: string;
  documentoIdentidad: string;
  correoElectronico: string;
  celular: string;
  formularioGestoraAnverso?: File;
  formularioGestoraReverso?: File;
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
