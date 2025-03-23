import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';

import { SerieService } from '../../../core/services/serie.service';
import { EdicaoService } from '../../../core/services/edicao.service';
import { Serie } from '../../../shared/models/serie';
import { PrimeiraCapaSerie } from '../../../shared/models/primeiraCapaSerie';
import { SearchParams } from '../../../shared/models/searchParams';

import { forkJoin, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-comics-page',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './comics-manga-page.component.html',
  styleUrl: './comics-manga-page.component.scss'
})
export class ComicsMangaPageComponent implements OnInit {
  private serieService = inject(SerieService);
  private edicaoService = inject(EdicaoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private Math = Math;

  // Content type
  contentType: string = 'comics';
  pageTitle: string = 'Acervo de Comics';

  // Series data
  comicSeries: Serie[] = [];
  firstCovers: PrimeiraCapaSerie[] = [];

  // Search parameters
  searchParams = new SearchParams();

  // Pagination properties
  totalItems = 0;
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20, 50];
  isLoading = false;

  // Temporary storage for newly loaded results
  private tempSeries: Serie[] = [];
  private tempTotalItems = 0;
  private tempCovers: PrimeiraCapaSerie[] = [];

  // View mode state
  viewMode: 'card' | 'list' = 'card';

  ngOnInit(): void {
    // Subscribe to route parameters to get the content type
    this.route.params.subscribe(params => {
      this.contentType = params['type'];

      // Set page title based on content type
      if (this.contentType === 'mangas') {
        this.pageTitle = 'Acervo de Mangás';
      } else {
        // Default to comics
        this.contentType = 'comics';
        this.pageTitle = 'Acervo de Comics';
      }

      // Initialize searchParams for the selected type
      this.searchParams.type = this.contentType;
      this.searchParams.pageNumber = 1;
      this.searchParams.pageSize = this.pageSize;
      this.searchParams.sortBy = 'nomeInter';
      this.searchParams.isDescending = false;
      this.currentPage = 1;

      // Load content for the selected type
      this.loadComicSeries();
    });
  }

  calculateUpperBound(): number {
    return Math.min((this.currentPage - 1) * this.pageSize + this.comicSeries.length, this.totalItems);
  }

  loadComicSeries() {
    this.isLoading = true;

    // Fetch all comic series from the API
    this.serieService.searchByType(this.searchParams).pipe(
      // Store results in temporary variables
      tap(response => {
        this.tempSeries = response.data;
        this.tempTotalItems = response.totalCount;
      }),
      // Only proceed if we have results to process
      switchMap(response => {
        if (response.data.length > 0) {
          // Process cover requests
          const coverRequests = response.data.map(serie =>
            this.edicaoService.getFirstCoverBySerieId(serie.id).pipe(
              map(response => ({
                serieId: serie.id,
                edicaoId: response.data[0]?.id,
                fotoCapa: response.data[0]?.fotoCapa
              })),
              catchError(error => {
                console.error('Error fetching cover:', error);
                return of({ serieId: serie.id, edicaoId: 0, fotoCapa: '' });
              })
            )
          );
          return forkJoin(coverRequests);
        } else {
          return of([]);
        }
      }),
      // Store the covers in a temporary variable
      tap(covers => {
        this.tempCovers = covers;
      }),
      // Add a small delay before displaying results for better UX
      switchMap(() => timer(300)),
    ).subscribe({
      next: () => {
        // After the delay, update the actual displayed data
        this.comicSeries = this.tempSeries;
        this.totalItems = this.tempTotalItems;
        this.firstCovers = this.tempCovers;
      },
      error: (error) => {
        console.error('Error loading comics:', error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Add method to check if search string is valid (not empty or just spaces)
  isValidSearch(searchString: string | undefined): boolean {
    return !!searchString && searchString.trim().length > 0;
  }

  onSearchChange() {
    if (this.isValidSearch(this.searchParams.search)) {
      this.isLoading = true;
      this.loadComicSeries();
    }
  }

  // Add method to clear search and reset series display
  clearSearch(): void {
    if (this.searchParams.search) {
      this.searchParams.search = '';
      this.searchParams.pageNumber = 1;
      this.currentPage = 1;
      this.isLoading = true;
      this.loadComicSeries();
    }
  }

  /**
   * Handles page change events from the paginator
   */
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;

    this.loadComicSeries();
  }

  /**
   * Handles sorting change
   */
  updateSorting(sortBy: string, isDescending: boolean) {
    this.searchParams.sortBy = sortBy;
    this.searchParams.isDescending = isDescending;
    this.currentPage = 1;
    this.searchParams.pageNumber = 1;

    this.loadComicSeries();
  }

  /**
   * Navigate to serie detail page
   */
  navigateToDetail(id: number, editoraId: number, serie: Serie): void {
    this.router.navigate(['/serie', id], {
      state: {
        id: id,
        editoraId: editoraId,
        serie: serie
      }
    });
  }

  /**
   * Toggle between card and list view
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  /**
   * Handle the Material Button Toggle change event
   */
  onViewModeChange(event: MatButtonToggleChange): void {
    this.viewMode = event.value;
  }

  /**
   * Handle content type toggle change
   */
  onContentTypeChange(event: MatButtonToggleChange): void {
    if (this.contentType !== event.value) {
      this.navigateToType(event.value);
    }
  }

  /**
   * Navigate to different content type
   */
  navigateToType(type: string): void {
    this.router.navigate(['/summary/series', type]);
  }
}
