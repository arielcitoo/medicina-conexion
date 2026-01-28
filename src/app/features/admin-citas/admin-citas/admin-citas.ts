import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { AdminCitasService } from '../services/admin-citas.service';
import { Asegurado, SolicitudExamen } from '../models/admin-citas.interface';
//import { VerDocumentosDialog } from '../components/ver-documentos-dialog/ver-documentos-dialog';
import { ObservarSolicitudDialogComponent } from '../components/observar-citas-dialog/observar-citas-dialog';
import { ProgramarCitasDialogComponent } from '../components/programar-citas-dialog/programar-citas-dialog';
import { SesionService } from '../../../core/service/sesion.service';

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatCardModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule
  ],
  templateUrl: './admin-citas.html',
  styleUrls: ['./admin-citas.css']
})
export class AdminCitasComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly adminCitasService = inject(AdminCitasService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly sesionService = inject(SesionService);

  // Datos
  dataSource = new MatTableDataSource<SolicitudExamen>([]);
  displayedColumns: string[] = [
    'select',
    'id',
    'asegurado',
    'ci',
    'empresa',
    'estado',
    'fechaRegistro',
    'documentos',
    'acciones'
  ];
  selection = new Set<SolicitudExamen>();

  // Estados
  isLoading = false;
  filterValue = '';

  // Filtros
  estados = [
    { value: 'todos', label: 'Todos los estados', icon: 'all_inbox' },
    { value: 'pendiente', label: 'Pendiente', icon: 'pending_actions' },
    { value: 'observado', label: 'Observado', icon: 'visibility' },
    { value: 'aprobado', label: 'Aprobado', icon: 'check_circle' },
    { value: 'programado', label: 'Programado', icon: 'schedule' },
    { value: 'completado', label: 'Completado', icon: 'done_all' }
  ];
  estadoFiltro = 'todos';

  // Formularios
  filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.fb.group({
      buscar: [''],
      estado: ['todos'],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    this.verificarAcceso();
    this.cargarSolicitudes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.createFilter();
  }

  private verificarAcceso(): void {
    const tieneAcceso = this.sesionService.tienePermiso('admin_citas');
    if (!tieneAcceso) {
      this.mostrarError('No tiene permisos para acceder a esta sección');
      // Redirigir a home o login
    }
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    
    // En producción, usar servicio real
    // this.adminCitasService.getSolicitudes().subscribe({
    //   next: (solicitudes) => {
    //     this.dataSource.data = solicitudes;
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar solicitudes:', error);
    //     this.isLoading = false;
    //     this.mostrarError('Error al cargar las solicitudes');
    //   }
    // });

    // Datos mock para desarrollo
    setTimeout(() => {
      this.dataSource.data = this.adminCitasService.getSolicitudesMock();
      this.isLoading = false;
    }, 1000);
  }

  createFilter(): (data: SolicitudExamen, filter: string) => boolean {
    return (data, filter) => {
      const searchTerms = JSON.parse(filter);
      
      // Buscar en texto
      const searchText = searchTerms.text?.toLowerCase() || '';
      const matchesSearch = !searchText || 
        data.asegurado.nombres.toLowerCase().includes(searchText) ||
        data.asegurado.nombreCompleto.toLowerCase().includes(searchText) ||
        data.asegurado.documentoIdentidad.includes(searchText) ||
        data.asegurado.razonSocial.toLowerCase().includes(searchText) ||
        data.asegurado.nroPatronal.toLowerCase().includes(searchText);

      // Filtrar por estado
      const matchesEstado = searchTerms.estado === 'todos' || data.estado === searchTerms.estado;

      // Filtrar por fecha
      const fechaRegistro = new Date(data.fechaRegistro);
      const matchesFechaDesde = !searchTerms.fechaDesde || fechaRegistro >= new Date(searchTerms.fechaDesde);
      const matchesFechaHasta = !searchTerms.fechaHasta || fechaRegistro <= new Date(searchTerms.fechaHasta);

      return matchesSearch && matchesEstado && matchesFechaDesde && matchesFechaHasta;
    };
  }

  aplicarFiltro(): void {
    const filtro = {
      text: this.filtroForm.get('buscar')?.value || '',
      estado: this.filtroForm.get('estado')?.value,
      fechaDesde: this.filtroForm.get('fechaDesde')?.value,
      fechaHasta: this.filtroForm.get('fechaHasta')?.value
    };
    
    this.dataSource.filter = JSON.stringify(filtro);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      buscar: '',
      estado: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
    this.aplicarFiltro();
  }

  // Ver documentos
  verDocumentos(solicitud: SolicitudExamen): void {
    this.dialog.open(VerDocumentosDialog, {
      width: '900px',
      maxHeight: '90vh',
      data: { 
        documentos: solicitud.documentos,
        asegurado: solicitud.asegurado 
      }
    });
  }

  // Aprobar solicitud
  aprobarSolicitud(solicitud: SolicitudExamen): void {
    if (confirm(`¿Está seguro de aprobar la solicitud de ${solicitud.asegurado.nombres} ${solicitud.asegurado.apellidos}?`)) {
      this.isLoading = true;
      
      // En producción, usar servicio real
      // this.adminCitasService.aprobarSolicitud(solicitud.id).subscribe({
      //   next: () => {
      //     this.actualizarSolicitudAprobada(solicitud);
      //     this.isLoading = false;
      //   },
      //   error: (error) => {
      //     console.error('Error al aprobar solicitud:', error);
      //     this.mostrarError('Error al aprobar la solicitud');
      //     this.isLoading = false;
      //   }
      // });

      // Mock
      setTimeout(() => {
        this.actualizarSolicitudAprobada(solicitud);
        this.isLoading = false;
      }, 1000);
    }
  }

  private actualizarSolicitudAprobada(solicitud: SolicitudExamen): void {
    solicitud.estado = 'aprobado';
    solicitud.fechaAprobacion = new Date();
    solicitud.observaciones = undefined;
    
    // Enviar email de aprobación
    this.enviarEmailAprobacion(solicitud);
    this.mostrarMensaje('Solicitud aprobada exitosamente');
  }

  // Observar solicitud
  observarSolicitud(solicitud: SolicitudExamen): void {
    const dialogRef = this.dialog.open(ObservarSolicitudDialogComponent, {
      width: '500px',
      data: { solicitud }
    });

    dialogRef.afterClosed().subscribe(observaciones => {
      if (observaciones) {
        this.isLoading = true;
        
        // En producción, usar servicio real
        // this.adminCitasService.observarSolicitud(solicitud.id, observaciones).subscribe({
        //   next: () => {
        //     solicitud.estado = 'observado';
        //     solicitud.observaciones = observaciones;
        //     this.mostrarMensaje('Observaciones registradas');
        //     this.isLoading = false;
        //   },
        //   error: (error) => {
        //     console.error('Error al observar solicitud:', error);
        //     this.mostrarError('Error al registrar observaciones');
        //     this.isLoading = false;
        //   }
        // });

        // Mock
        setTimeout(() => {
          solicitud.estado = 'observado';
          solicitud.observaciones = observaciones;
          this.mostrarMensaje('Observaciones registradas');
          this.isLoading = false;
        }, 1000);
      }
    });
  }

  // Rechazar solicitud
  rechazarSolicitud(solicitud: SolicitudExamen): void {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      this.isLoading = true;
      
      // En producción, usar servicio real
      // this.adminCitasService.rechazarSolicitud(solicitud.id, motivo).subscribe({
      //   next: () => {
      //     solicitud.estado = 'observado';
      //     solicitud.observaciones = `Rechazado: ${motivo}`;
      //     this.mostrarMensaje('Solicitud rechazada');
      //     this.isLoading = false;
      //   },
      //   error: (error) => {
      //     console.error('Error al rechazar solicitud:', error);
      //     this.mostrarError('Error al rechazar la solicitud');
      //     this.isLoading = false;
      //   }
      // });

      // Mock
      setTimeout(() => {
        solicitud.estado = 'observado';
        solicitud.observaciones = `Rechazado: ${motivo}`;
        this.mostrarMensaje('Solicitud rechazada');
        this.isLoading = false;
      }, 1000);
    }
  }

  // Enviar email de aprobación
  enviarEmailAprobacion(solicitud: SolicitudExamen): void {
    // this.adminCitasService.enviarEmailAprobacion(solicitud.id).subscribe({
    //   next: () => {
    //     this.mostrarMensaje('Email de aprobación enviado');
    //   },
    //   error: (error) => {
    //     console.error('Error al enviar email:', error);
    //     this.mostrarError('Error al enviar email');
    //   }
    // });
    console.log('Email de aprobación enviado a:', solicitud.asegurado.email);
  }

  // Programar citas
  programarCitas(solicitud: SolicitudExamen): void {
    const dialogRef = this.dialog.open(ProgramarCitasDialogComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { solicitud }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        solicitud.estado = 'programado';
        solicitud.fechaProgramacion = new Date();
        solicitud.citasProgramadas = result;
        this.mostrarMensaje('Citas programadas exitosamente');
      }
    });
  }

  // Ver detalles de citas programadas
  verCitasProgramadas(solicitud: SolicitudExamen): void {
    const citasInfo = solicitud.citasProgramadas?.map(cita => 
      `${cita.servicio}: ${new Date(cita.fecha).toLocaleDateString()} ${cita.hora}`
    ).join('\n') || 'No hay citas programadas';
    
    alert(`Citas programadas para ${solicitud.asegurado.nombres}:\n\n${citasInfo}`);
  }

  // Selección múltiple
  toggleSeleccion(solicitud: SolicitudExamen): void {
    if (this.selection.has(solicitud)) {
      this.selection.delete(solicitud);
    } else {
      this.selection.add(solicitud);
    }
  }

  seleccionarTodos(event: any): void {
    if (event.checked) {
      this.dataSource.filteredData.forEach(row => this.selection.add(row));
    } else {
      this.selection.clear();
    }
  }

  // Acciones en lote
  aprobarSeleccionados(): void {
    const seleccionados = Array.from(this.selection);
    if (seleccionados.length === 0) {
      this.mostrarError('Seleccione al menos una solicitud');
      return;
    }

    if (confirm(`¿Aprobar ${seleccionados.length} solicitud(es)?`)) {
      seleccionados.forEach(solicitud => {
        solicitud.estado = 'aprobado';
        solicitud.fechaAprobacion = new Date();
        this.enviarEmailAprobacion(solicitud);
      });
      this.mostrarMensaje(`${seleccionados.length} solicitud(es) aprobada(s)`);
      this.selection.clear();
    }
  }

  // Helper methods
  getEstadoIcon(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'pending_actions';
      case 'observado': return 'visibility';
      case 'aprobado': return 'check_circle';
      case 'programado': return 'schedule';
      case 'completado': return 'done_all';
      default: return 'help';
    }
  }

  getEstadoColor(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'observado': return 'estado-observado';
      case 'aprobado': return 'estado-aprobado';
      case 'programado': return 'estado-programado';
      case 'completado': return 'estado-completado';
      default: return '';
    }
  }

  getDocumentosPendientes(solicitud: SolicitudExamen): number {
    return solicitud.documentos.filter(doc => doc.estado === 'pendiente').length;
  }

  mostrarMensaje(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Getters para template
  get totalSolicitudes(): number {
    return this.dataSource.data.length;
  }

  get solicitudesPendientes(): number {
    return this.dataSource.data.filter(s => s.estado === 'pendiente').length;
  }

  get solicitudesAprobadas(): number {
    return this.dataSource.data.filter(s => s.estado === 'aprobado').length;
  }

  get todasSeleccionadas(): boolean {
    return this.selection.size > 0 && 
           this.selection.size === this.dataSource.filteredData.length;
  }

  get seleccionadosParcialmente(): boolean {
    return this.selection.size > 0 && 
           this.selection.size < this.dataSource.filteredData.length;
  }

  // Exportar datos
  exportarExcel(): void {
    this.mostrarMensaje('Exportando datos a Excel...');
    // Implementar lógica de exportación
  }

  exportarPDF(): void {
    this.mostrarMensaje('Generando reporte PDF...');
    // Implementar lógica de exportación PDF
  }

getSolicitudesPendientesCount(): number {
  return this.dataSource.data.filter(s => s.estado === 'pendiente').length;
}

getSolicitudesAprobadasCount(): number {
  return this.dataSource.data.filter(s => s.estado === 'aprobado').length;
}

getSolicitudesProgramadasCount(): number {
  return this.dataSource.data.filter(s => s.estado === 'programado').length;
}

getNombreAsegurado(asegurado: Asegurado): string {
  if (asegurado.nombreCompleto) {
    return asegurado.nombreCompleto;
  }
  
  const nombreCompleto = [
    asegurado.paterno,
    asegurado.materno,
    asegurado.nombres
  ].filter(part => part && part.trim()).join(' ');
  
  return nombreCompleto || 'Asegurado';
}

getCIAsegurado(asegurado: Asegurado): string {
  const ci = asegurado.documentoIdentidad || '';
  const extension = asegurado.extencion || '';
  
  if (extension) {
    return `${ci} ${extension}`.trim();
  }
  return ci;
}

getEmpresaAsegurado(asegurado: Asegurado): string {
  return asegurado.razonSocial || '';
}

getDocumentosPendientesCount(solicitud: SolicitudExamen): number {
  return solicitud.documentos.filter(doc => doc.estado === 'pendiente').length;
}
}