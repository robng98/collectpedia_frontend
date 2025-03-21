import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Publisher } from '../../../shared/models/publisher';
import { PublisherService } from '../../../core/services/publisher.service';
import { FormsModule } from '@angular/forms';
import { Serie } from '../../../shared/models/serie';
import { Pagination } from '../../../shared/models/pagination';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-publisher-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './publisher-page.component.html',
  styleUrl: './publisher-page.component.scss'
})
export class PublisherPageComponent implements OnInit {
  // Add Math utility for templates
  Math = Math;
  
  publishers: Publisher[] = [];
  selectedPublisher: Publisher | null = null;
  series: Serie[] = [];
  loading = false;
  loadingSeries = false;
  error = '';
  
  // View mode state similar to comics-manga-page
  viewMode: 'card' | 'list' = 'card';
  
  // Publishers pagination
  totalPublishers = 0;
  totalPages = 0;
  pageSize = 12; // Reasonable number for cards display
  currentPage = 1;
  pageSizeOptions = [12, 24, 48, 96];
  
  // Series pagination
  seriesPageSize = 20;
  seriesCurrentPage = 1;
  seriesTotalItems = 0;
  seriesPageSizeOptions = [20, 40, 60, 100];

  constructor(
    private publisherService: PublisherService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read query params for pagination state
    this.route.queryParams.subscribe(params => {
      // Get pagination parameters from URL if available
      this.currentPage = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 12;
      
      // Check if we have a publisher ID in the route params
      this.route.paramMap.subscribe(params => {
        const publisherId = params.get('id');
        if (publisherId) {
          // If we're on the detail route, load the publisher details
          this.selectPublisher(Number(publisherId), false);
        } else {
          // Otherwise load the publishers list with pagination
          this.loadPublishers(this.currentPage);
        }
      });
    });
  }

  loadPublishers(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;
    
    // Update URL with current pagination state
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        pageSize: this.pageSize
      },
      queryParamsHandling: 'merge'
    });
    
    this.publisherService.getPublishers(page, this.pageSize).subscribe({
      next: (response: Pagination<Publisher>) => {
        this.publishers = response.data;
        this.totalPublishers = response.totalCount;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load publishers';
        this.loading = false;
        console.error('Error loading publishers:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPublishers(page);
  }

  onSeriesPageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    this.seriesPageSize = event.pageSize;
    if (this.selectedPublisher) {
      this.loadPublisherSeries(this.selectedPublisher.id, page);
    }
  }

  selectPublisher(id: number, navigate: boolean = true): void {
    this.loading = true;
    
    // Update URL to reflect selected publisher if needed
    if (navigate) {
      this.router.navigate(['/publishers', id]);
    }
    
    this.publisherService.getPublisherById(id).subscribe({
      next: (publisher) => {
        this.selectedPublisher = publisher;
        this.loadPublisherSeries(id);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load publisher details';
        this.loading = false;
        console.error('Error loading publisher details:', error);
      }
    });
  }

  loadPublisherSeries(publisherId: number, page: number = 1): void {
    this.loadingSeries = true;
    this.seriesCurrentPage = page;
    
    // Update URL with current series pagination state
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        seriesPage: page,
        seriesPageSize: this.seriesPageSize
      },
      queryParamsHandling: 'merge'
    });
    
    this.publisherService.getPublisherSeries(publisherId, page, this.seriesPageSize).subscribe({
      next: (response: Pagination<Serie>) => {
        this.series = response.data;
        this.seriesTotalItems = response.totalCount;
        this.loadingSeries = false;
      },
      error: (error) => {
        this.error = 'Failed to load publisher series';
        this.loadingSeries = false;
        console.error('Error loading publisher series:', error);
      }
    });
  }

  /**
   * Toggle between card and list view
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  clearSelection(): void {
    this.selectedPublisher = null;
    this.series = [];
    // Navigate back to the publishers list, preserving pagination
    this.router.navigate(['/publishers'], {
      queryParams: {
        page: this.currentPage,
        pageSize: this.pageSize
      }
    });
  }
}
