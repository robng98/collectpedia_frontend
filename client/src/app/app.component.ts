import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { HttpClient } from '@angular/common/http';
import { LastAddedIssuesService } from './core/services/last-added-issues.service';
import { Edicao } from './shared/models/edicao';
import { HomeComponent } from "./features/home/home.component";
import { FooterComponent } from './layout/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'flex flex-col min-h-screen'
  }
})
export class AppComponent {
  title = 'Collectpedia';
}
