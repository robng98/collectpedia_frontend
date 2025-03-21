import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SerieService } from '../../../core/services/serie.service';
import { EdicaoService } from '../../../core/services/edicao.service';
import { Serie } from '../../../shared/models/serie';
import { PrimeiraCapaSerie } from '../../../shared/models/primeiraCapaSerie';
import { SearchParams } from '../../../shared/models/searchParams';

import { forkJoin, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-comics-page',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './comics-page.component.html',
  styleUrl: './comics-page.component.scss'
})
export class ComicsPageComponent implements OnInit {
  private serieService = inject(SerieService);
  private edicaoService = inject(EdicaoService);
  private router = inject(Router);
  
  private Math = Math;

  // Series data
  comicSeries: Serie[] = [];
  firstCovers: PrimeiraCapaSerie[] = [];
  
  // Search parameters
  searchParams = new SearchParams();
  
  // Pagination properties
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 24, 48, 96];
  isLoading = false;

  // Temporary storage for newly loaded results
  private tempSeries: Serie[] = [];
  private tempTotalItems = 0;
  private tempCovers: PrimeiraCapaSerie[] = [];

  // View mode state
  viewMode: 'card' | 'list' = 'card';

  ngOnInit(): void {
    // Initialize searchParams for comics type
    this.searchParams.type = 'comics';
    this.searchParams.pageNumber = 1;
    this.searchParams.pageSize = this.pageSize;
    this.searchParams.sortBy = 'nomeInter';
    this.searchParams.isDescending = false;
    
    this.loadComicSeries();
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
}
