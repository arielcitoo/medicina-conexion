export const API_CONFIG = {
  baseUrl: 'https://api-desarrollo.cns.gob.bo/erpcns',
  version: 'v1',
  endpoints: {
    aseguradoTitular: '/Afiliaciones/Asegurados/AseguradoTitular',
    empresasAfiliadas: '/Afiliaciones/EmpresasAfiliadas/Search'
  }
};

export const STORAGE_KEYS = {
  jwtToken: 'jwt_token',
  empresaExamen: 'empresa_examen_preocupacional'
};

export const ERROR_MESSAGES = {
  connection: 'Error de conexión. Verifique su conexión a internet.',
  unauthorized: 'No autorizado. Token JWT inválido o expirado.',
  forbidden: 'Acceso prohibido. No tiene permisos para acceder a este recurso.',
  notFound: 'Recurso no encontrado.',
  serverError: 'Error interno del servidor.',
  serviceUnavailable: 'Servicio temporalmente no disponible. Intente más tarde.',
  empresaNotFound: 'Empresa no encontrada. Verifique el número patronal.',
  empresaInactiva: 'La empresa no está activa para realizar exámenes.'
};
