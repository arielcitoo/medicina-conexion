import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-citas',
  imports: [CommonModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas {
 constructor(public dialog: MatDialog) {}

 
}