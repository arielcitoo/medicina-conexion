export const environment = {
  
  production: false,
   auth: {
    authority: 'https://auth-desarrollo.cns.gob.bo',
    client_id: 'erp_web_client',
    client_secret: '', // Esto debe ser configurado por el equipo de seguridad
    redirect_uri: `${window.location.origin}/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile email roles erp_api offline_access',
    silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
    automaticSilentRenew: true,
    accessTokenExpiringNotificationTime: 60
  },
  environment: "local",
  apiUrl: 'https://localhost:7052/api', 
  apiBaseUrl: 'https://api-desarrollo.cns.gob.bo/erpcns/v1',
  appName: 'Sistema de Citas Preocupacionales',
  version: '1.0.0',
  timeout: 30000
};