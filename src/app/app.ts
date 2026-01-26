import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header} from './shared/components/header/header';
import { filter } from 'rxjs';
import { SesionService } from './core/service/sesion.service';
import { EmpresaService } from './core/service/empresa.service';





@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

   private readonly router = inject(Router);
  private readonly sesionService = inject(SesionService);
  private readonly empresaService = inject(EmpresaService);

  ngOnInit(): void {
    // Track navigation for analytics
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Analytics tracking would go here
    });

    console.log('App inicializado');
  }
}