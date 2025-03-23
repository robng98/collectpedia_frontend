import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';

import { PublisherService } from '../../../core/services/publisher.service';
import { Publisher } from '../../../shared/models/publisher';
import { SearchParams } from '../../../shared/models/searchParams';

@Component({
  selector: 'app-publisher-page',
  standalone: true,
  imports: [
    CommonModule, 
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule
  ],
  templateUrl: './publisher-page.component.html',
  styleUrl: './publisher-page.component.scss'
})
export class PublisherPageComponent implements OnInit {
  private publisherService = inject(PublisherService);
  private router = inject(Router);
  
  // Add Math for pagination calculations
  private Math = Math;
  
  // Publishers data
  publishers: Publisher[] = [];
  
  // Search params (for sorting)
  searchParams = new SearchParams();
  
  // Pagination properties
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  isLoading = false;

  // View mode state
  viewMode: 'card' | 'list' = 'card';

  ngOnInit(): void {
    // Initialize search parameters
    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;
    this.searchParams.sortBy = 'nome'; // Default sort by publisher name
    this.searchParams.isDescending = false;
    
    // Load all publishers
    this.loadPublishers();
  }
  
  loadPublishers() {
    this.isLoading = true;
    
    this.publisherService.getPublishers(this.currentPage, this.pageSize, this.searchParams.sortBy, this.searchParams.isDescending).subscribe({
      next: (response) => {
        this.publishers = response.data;
        this.totalItems = response.totalCount;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading publishers:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculates the upper bound for pagination display
   */
  calculateUpperBound(): number {
    return Math.min((this.currentPage - 1) * this.pageSize + this.publishers.length, this.totalItems);
  }

  /**
   * Handles page change events from the paginator
   */
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;
    
    this.loadPublishers();
  }

  /**
   * Handles sorting change
   */
  updateSorting(sortBy: string, isDescending: boolean) {
    this.searchParams.sortBy = sortBy;
    this.searchParams.isDescending = isDescending;
    this.currentPage = 1;
    this.searchParams.pageNumber = 1;
    
    this.loadPublishers();
  }
  
  /**
   * Handle the Material Button Toggle change event
   */
  onViewModeChange(event: MatButtonToggleChange): void {
    this.viewMode = event.value;
  }

  /**
   * Toggle between card and list view (kept for backward compatibility)
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  /**
   * Navigate to publisher detail page to show their series
   */
  navigateToPublisher(id: number): void {
    this.router.navigate(['/summary/publishers', id]);
  }
}
