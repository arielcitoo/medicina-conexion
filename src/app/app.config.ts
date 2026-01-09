import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { AseguradosService } from './service/asegurados.service';
import { BrowserModule } from '@angular/platform-browser';
import { SharedMaterialModule } from './shared/modules/material.module';//angular Material módulos compartidos

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideNativeDateAdapter(),
     AseguradosService,
      importProvidersFrom(
      SharedMaterialModule,
      BrowserModule   
      ),
  ]
};
