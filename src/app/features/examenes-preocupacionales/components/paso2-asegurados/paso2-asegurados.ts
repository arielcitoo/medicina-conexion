// features/examen-preocupacional/components/paso2-asegurados/paso2-asegurados.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AseguradoExamen } from '../../../../interface/examen.interface';
import { ModalAsegurado } from '../modal-asegurado/modal-asegurado';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';

@Component({
  selector: 'app-paso2-asegurados',
  standalone: true,
  imports: [SharedMaterialModule],
  templateUrl: './paso2-asegurados.html',
  styleUrls: ['./paso2-asegurados.css']
})
export class Paso2Asegurados {
  @Input() asegurados: AseguradoExamen[] = [];
  @Input() archivosAsegurados: { [key: number]: { anverso: File | null, reverso: File | null } } = {};
  @Input() cantidadPermitida: number = 0;
  
  @Output() agregarAsegurado = new EventEmitter<any>();
  @Output() eliminarAsegurado = new EventEmitter<number>();
  @Output() fileSelected = new EventEmitter<{ aseguradoId: number, tipo: 'anverso' | 'reverso', file: File }>();

  private readonly dialog = inject(MatDialog);
  
  readonly displayedColumns = ['nombre', 'ci', 'correo', 'celular', 'archivos', 'acciones'];

  openAddAseguradoModal(): void {
    if (this.asegurados.length >= this.cantidadPermitida) {
      alert(`No puede agregar más de ${this.cantidadPermitida} asegurados`);
      return;
    }

    const dialogRef = this.dialog.open(ModalAsegurado, {
      width: '700px',
      data: {
        maxAsegurados: this.cantidadPermitida - this.asegurados.length
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agregarAsegurado.emit(result);
      }
    });
  }

  onFileSelected(event: any, aseguradoId: number, tipo: 'anverso' | 'reverso'): void {
    const file = event.target.files[0];
    if (file && this.validateFile(file)) {
      this.fileSelected.emit({ aseguradoId, tipo, file });
    }
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  getFileName(aseguradoId: number, tipo: 'anverso' | 'reverso'): string {
  // Manejar el caso donde aseguradoId podría ser undefined
  if (!aseguradoId) return 'Sin archivo';
  
  const archivos = this.archivosAsegurados[aseguradoId];
  if (!archivos) return 'Sin archivo';
  
  const file = tipo === 'anverso' ? archivos.anverso : archivos.reverso;
  return file?.name || 'Sin archivo';
}

  contarCompletos(): number {
    return this.asegurados.filter(a => 
      a.correoElectronico?.trim() && a.celular?.trim()
    ).length;
  }

  contarConArchivos(): number {
    return this.asegurados.filter(asegurado => {
      const archivos = this.archivosAsegurados[asegurado.idTemporal || asegurado.aseguradoId];
      return archivos?.anverso && archivos?.reverso;
    }).length;
  }
}