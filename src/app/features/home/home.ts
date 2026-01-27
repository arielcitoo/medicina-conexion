// src/app/features/home/home.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { SesionService } from '../../core/service/sesion.service';
import { EmpresaService } from '../../core/service/empresa.service';
import { SharedMaterialModule } from '../../shared/modules/material.module';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatGridListModule,
    MatListModule,
    MatExpansionModule  
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  private readonly router = inject(Router);
  private readonly sesionService = inject(SesionService);
  private readonly empresaService = inject(EmpresaService);

  tieneSesionActiva = false;
  empresaNombre = '';
  idAcceso = '';

  ngOnInit(): void {
    this.verificarSesion();
  }

  private verificarSesion(): void {
    const idAcceso = this.sesionService.getIdAcceso();
    const empresa = this.empresaService.getEmpresaExamen();
    
    this.tieneSesionActiva = !!idAcceso && !!empresa;
    
    if (this.tieneSesionActiva) {
      this.idAcceso = idAcceso || '';
      this.empresaNombre = empresa?.razonSocial || 'Empresa afiliada';
    }
  }

  irAPrelogin(): void {
    this.router.navigate(['/prelogin']);
  }

  irAExamen(): void {
    if (this.tieneSesionActiva) {
      this.router.navigate(['/examen-preocupacional']);
    } else {
      this.irAPrelogin();
    }
  }

  cerrarSesion(): void {
    if (confirm('¿Está seguro de cerrar la sesión?')) {
      this.sesionService.limpiarSesion();
      this.empresaService.limpiarDatosExamen();
      this.verificarSesion();
      this.router.navigate(['/home']);
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}