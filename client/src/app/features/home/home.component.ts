import { AfterViewInit, ElementRef,  ViewChild, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
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
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperContainer') swiperContainer: ElementRef | undefined;

  private lastAddedIssuesService = inject(LastAddedIssuesService);
  private serieService = inject(SerieService);
  private router = inject(Router);
  title = 'home';
  lastAddedIssues: Edicao[] = [];
  searchParams = new SearchParams();
  isLoading = false; // Add the isLoading property

  ngOnInit(): void {
    this.isLoading = true;
    
    this.lastAddedIssuesService.getLastAddedIssues().subscribe({
      next: (response) => {
        this.lastAddedIssues = response.data;
        setTimeout(() => {
          this.isLoading = false;
          // Initialize swiper after data is loaded and DOM is rendered
          setTimeout(() => this.initSwiper(), 100);
        }, 1500);
      },
      error: (error) => {
        console.log(error);
        setTimeout(() => {
          this.isLoading = false;
        }, 1500);
      }
    });
  }

  
  // Separate method to initialize swiper
  initSwiper(): void {
    if (this.swiperContainer?.nativeElement) {
      // Apply custom styles to shadow DOM
      if (this.swiperContainer.nativeElement.shadowRoot) {
        const style = document.createElement('style');
        style.textContent = `
          :host {
            --swiper-theme-color: #4263c3 !important;
          }
          .swiper-pagination-bullet-active {
            background-color: rgb(224, 226, 236) !important;
          }
          .swiper-pagination-vertical.swiper-pagination-bullets,
          .swiper-vertical > .swiper-pagination-bullets {
            right: var(--swiper-pagination-right, 25px);
            background-color: #1340af;
            padding: 5px;
            border-radius: 15px;
          }
        `;
        this.swiperContainer.nativeElement.shadowRoot.appendChild(style);
      }

      this.swiperContainer.nativeElement.swiper?.update();
    }
  }

  ngAfterViewInit(): void {
    // Only initialize if data is already loaded
    if (!this.isLoading && this.lastAddedIssues.length > 0) {
      this.initSwiper();
    }
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
