import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SerieService } from '../../core/services/serie.service';
import { SearchParams } from '../../shared/models/searchParams';
import { Serie } from '../../shared/models/serie';
import { EdicaoService } from '../../core/services/edicao.service';
import { PrimeiraCapaSerie } from '../../shared/models/primeiraCapaSerie';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { forkJoin, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule, 
    MatPaginatorModule,
    MatProgressSpinnerModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private serieService = inject(SerieService);
  private edicaoService = inject(EdicaoService);
  private router = inject(Router);
  
  // Add Math for pagination calculations
  private Math = Math;
  
  searchParams = new SearchParams();
  searchResults: Serie[] = [];
  firstCovers: PrimeiraCapaSerie[] = [];
  
  // Pagination properties
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  isLoading = false;

  // View mode state (same as comics-manga-page)
  viewMode: 'card' | 'list' = 'list';

  // Temporary storage for newly loaded results
  private tempResults: Serie[] = [];
  private tempTotalItems = 0;
  private tempCovers: PrimeiraCapaSerie[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        this.searchParams.search = params['search'];
        this.searchParams.type = params['type'];
        this.searchParams.pageNumber = params['pageNumber'] ? Number(params['pageNumber']) : 1;
        this.searchParams.pageSize = params['pageSize'] ? Number(params['pageSize']) : 10;
        this.searchParams.sortBy = params['sortBy'] ? params['sortBy'] : 'NomeInter';
        this.searchParams.isDescending = params['isDescending'] ? params['isDescending'] === true : false;
        this.currentPage = this.searchParams.pageNumber;
        this.pageSize = this.searchParams.pageSize;
        
        this.loadResults();
    });
  }
  
  loadResults() {
    this.isLoading = true;
    
    // First, fetch the data from the API
    this.serieService.searchByType(this.searchParams).pipe(
      // Store results in temporary variables
      tap(response => {
        this.tempResults = response.data;
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
                console.log(error);
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
      // Add a fixed delay of 500ms before displaying results
      switchMap(() => timer(500)),
    ).subscribe({
      next: () => {
        // After the delay, update the actual displayed data
        this.searchResults = this.tempResults;
        this.totalItems = this.tempTotalItems;
        this.firstCovers = this.tempCovers;
        console.log("All covers loaded in correct order:", this.firstCovers);
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculates the upper bound for pagination display
   */
  calculateUpperBound(): number {
    return Math.min((this.currentPage - 1) * this.pageSize + this.searchResults.length, this.totalItems);
  }

  /**
   * Handles page change events from the paginator
   */
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;
    
    // Update URL with new pagination parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchParams.search,
        type: this.searchParams.type,
        pageNumber: this.currentPage,
        pageSize: this.pageSize
      },
      queryParamsHandling: 'merge'
    });
    
    this.loadResults();
  }

  /**
   * Handles sorting change
   */
  updateSorting(sortBy: string, isDescending: boolean) {
    this.searchParams.sortBy = sortBy;
    this.searchParams.isDescending = isDescending;
    this.currentPage = 1;
    this.searchParams.pageNumber = 1;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sortBy: sortBy,
        isDescending: isDescending,
        pageNumber: 1
      },
      queryParamsHandling: 'merge'
    });
    
    this.loadResults();
  }
  
  /**
   * Toggle between card and list view
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  navigateToDetail(id:number, editoraId: number, serie: Serie): void {
    this.router.navigate(['/serie', id], { 
      state: { 
        id: id,
        editoraId: editoraId,
        serie: serie
      } 
    });
  }
}
