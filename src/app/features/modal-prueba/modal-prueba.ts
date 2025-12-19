import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-modal-prueba',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-prueba.html',
  styleUrl: './modal-prueba.css',
})
export class ModalPrueba {

cerrar() {}
}