// features/examen-preocupacional/components/paso1-datos-recibo/paso1-datos-recibo.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';

@Component({
  selector: 'app-paso1-datos-recibo',
  standalone: true,
  imports: [CommonModule,SharedMaterialModule,ReactiveFormsModule],
  templateUrl: './paso1-datos-recibo.html',
  styleUrls: ['./paso1-datos-recibo.css']
})
export class Paso1DatosRecibo{
  @Input() form!: FormGroup;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();
  
  imagenPreview: string | null = null;

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (this.validateFile(file)) {
      this.fileSelected.emit(file);
      this.generatePreview(file);
    }
  }

  removeFile(): void {
    this.imagenPreview = null;
    this.fileRemoved.emit();
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten imágenes (JPG, PNG) o PDF');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('El archivo no debe superar los 5MB');
      return false;
    }
    
    return true;
  }

  private generatePreview(file: File): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un correo válido';
    }
    
    return '';
  }
}