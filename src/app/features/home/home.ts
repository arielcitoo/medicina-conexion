import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, MatIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
