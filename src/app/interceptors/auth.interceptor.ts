import { HttpInterceptorFn } from '@angular/common/http';

// Token que funciona - AJUSTA ESTO
const BEARER_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjFCOEVCNTk4NTc5RjQwOTA1MDJEMDAyOUMxNjExMzU1MUIzOUZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6IkVTRzQ2MW1GZWZRSkJRTFFBcHdXRVRWUnM1OCJ9.eyJuYmYiOjE3NjU5MDg3MDksImV4cCI6MTc2NTk0NDcwOSwiaXNzIjoiaHR0cHM6Ly9hdXRoLWRlc2Fycm9sbG8uY25zLmdvYi5ibyIsImF1ZCI6WyJhZG1pbkNsaWVudF9hcGkiLCJBUElfRXhhbXBsZSIsImVycFNlcnZpY2VzIiwidGVzdC1ycmhoIiwiQVBJX1JFUE9SVCJdLCJjbGllbnRfaWQiOiJleGFtcGxlX3N3YWdnZXJ1aSIsInN1YiI6Ijg2NDIxMzU2LWM4NjQtNDA4NS1hNGJhLTdkODQ4ZWRiZjU0MCIsImF1dGhfdGltZSI6MTc2NTkwODcwOSwiaWRwIjoibG9jYWwiLCJpZGVudGl0eSI6IjBjYTExZDY1LWM0MjAtNGIzYi04NjZkLTJlMTU5MGI4YTkzMyIsInNpZCI6IjE2MkU0MDY1RjE1QzE3MzNBNDIyNDk4RDA2QjlBMjMwIiwiaWF0IjoxNzY1OTA4NzA5LCJzY29wZSI6WyJlcnBTZXJ2aWNlcyJdLCJhbXIiOlsicHdkIl19.cPJjq0j9OEta1wE7iOcXobkMtrm29OYc2Z43TanRgI-O2ToIjYOihBcfsjrIgoIJphDQX5BcgJtq4RAwRncDRcl6rXTfks-8PNG9DSboWAUGUlsmaJAIRKwJA9wr3a3zo5XmBbVNRVTb5s0LOjiZ557Qm_8N6TWIIl83sWju6kj151uSOWyRI0ST1m1bHtypO4f7q2zKzM_O6DWqLIf64wH0dxuufoUf7rUPOG9l3SOmDZA9mVFCEBQdYnPrB-1wBExvOP9hkrXdfuKdpFNC_Gk8WF_GMnv1UQgW21Qzv_8NJwcizsB5iS2tihA8uOKJwe4V-Nxwk8aX-rz4JkTFUA'; // Pega tu token aquí

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar auth a peticiones a nuestra API
  if (req.url.includes('api-desarrollo.cns.gob.bo')) {
    console.log('🔐 Aplicando autenticación a:', req.url);
    
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return next(authReq);
  }
  
  return next(req);
};