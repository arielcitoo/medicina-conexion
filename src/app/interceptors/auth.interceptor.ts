import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔐 Interceptor ejecutado para:', req.url);
  
  // Clonar la request para agregar headers COMO SWAGGER
  const authReq = req.clone({
    setHeaders: getSwaggerHeaders()
  });
  
  console.log('📤 Headers enviados:', authReq.headers.keys());
  
  return next(authReq);
};

function getSwaggerHeaders(): { [key: string]: string } {
  // ESTOS SON LOS HEADERS QUE SWAGGER ENVÍA
  // Revisa en Network qué headers exactos usa Swagger
  
  return {
    // Opción 1: Si Swagger usa Bearer token
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Token JWT
    
    // Opción 2: Si Swagger usa API Key
    // 'X-API-Key': 'tu-api-key-aqui',
    // 'ApiKey': 'tu-api-key-aqui',
    
    // Opción 3: Si Swagger usa Basic Auth
    // 'Authorization': 'Basic ' + btoa('usuario:contraseña'),
    
    // Headers que SIEMPRE van
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://api-desarrollo.cns.gob.bo',
    'Referer': 'https://api-desarrollo.cns.gob.bo/erpcns/swagger/index.html'
  };
}