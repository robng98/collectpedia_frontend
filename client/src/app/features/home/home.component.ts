import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { LastAddedIssuesService } from '../../core/services/last-added-issues.service';
import { Edicao } from '../../shared/models/edicao';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchParams } from '../../shared/models/searchParams';
import { SerieService } from '../../core/services/serie.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  private lastAddedIssuesService = inject(LastAddedIssuesService);
  private serieService = inject(SerieService);
  private router = inject(Router);
  title = 'home';
  lastAddedIssues: Edicao[] = [];
  searchParams = new SearchParams();
  isLoading = false; // Add the isLoading property

  ngOnInit(): void {
    this.isLoading = true; // Set loading to true before fetching data
    
    this.lastAddedIssuesService.getLastAddedIssues().subscribe({
      next: (response) => {
        this.lastAddedIssues = response.data;
        // Add a 1500ms delay before hiding the loading indicator
        setTimeout(() => {
          this.isLoading = false;
        }, 1500);
      },
      error: (error) => {
        console.log(error);
        // Also add a 1500ms delay on error
        setTimeout(() => {
          this.isLoading = false;
        }, 1500);
      }
    });
  }

  onSearchChange() {
    // Only search if the search string has actual content
    if (this.isValidSearch(this.searchParams.search)) {
      this.router.navigate(['/search'], { 
        queryParams: { 
          search: this.searchParams.search,
          type: this.searchParams.type
        } 
      });
    }
  }

  // Add method to check if search string is valid (not empty or just spaces)
  isValidSearch(searchString: string | undefined): boolean {
    return !!searchString && searchString.trim().length > 0;
  }

  goToSerieByIssue(serieId: number, ) {
    this.serieService.getSerieById(serieId).subscribe({
      next: (response) => {
        this.router.navigate(['/serie', serieId], {
          state: {
            id: serieId,
            serie: response,
            editoraId: response.editoraId
          }
        });
      },
      error: (error) => {
        console.error('Error fetching serie:', error);
      }
    });
    
  }

}
