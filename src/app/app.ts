import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header} from './shared/components/header/header';
import { filter } from 'rxjs';
import { SesionService } from './service/sesion.service';
import { AuthService } from './service/empresa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  currentYear = new Date().getFullYear();
  debugMode = true;
  tieneSesion = false;
  tieneEmpresa = false;

  

   protected readonly title = signal('medicina-del-trabajo');
   constructor(private router: Router,
     private sesionService: SesionService,
    private authService: AuthService) {}

ngOnInit(): void {
    console.log(' App inicializado');
    
    // Verificar estado inicial
    this.tieneSesion = !!this.sesionService.getIdAcceso();
    this.tieneEmpresa = !!this.authService.getEmpresaExamen();
    
    console.log(' Estado inicial AppComponent:', {
      tieneSesion: this.tieneSesion,
      tieneEmpresa: this.tieneEmpresa
    });
  }
}