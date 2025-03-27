import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';

import { PublisherService } from '../../../core/services/publisher.service';
import { Publisher } from '../../../shared/models/publisher';
import { SearchParams } from '../../../shared/models/searchParams';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-publisher-page',
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
  templateUrl: './publisher-page.component.html',
  styleUrl: './publisher-page.component.scss'
})
export class PublisherPageComponent implements OnInit {
  private publisherService = inject(PublisherService);
  private router = inject(Router);

  private Math = Math;

  publishers: Publisher[] = [];

  searchParams = new SearchParams();

  totalItems = 0;
  currentPage = 1;
  pageSize = 8;
  pageSizeOptions = [8, 16, 40];
  isLoading = false;

  viewMode: 'card' | 'list' = 'card';

  ngOnInit(): void {
    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;
    this.searchParams.sortBy = 'nome';
    this.searchParams.isDescending = false;

    this.loadPublishers();
  }

  loadPublishers() {
    this.isLoading = true;

    this.publisherService.getPublishers(this.searchParams).subscribe({
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

  calculateUpperBound(): number {
    return Math.min((this.currentPage - 1) * this.pageSize + this.publishers.length, this.totalItems);
  }

  clearSearch(): void {
    if (this.searchParams.search) {
      this.searchParams.search = '';
      this.searchParams.pageNumber = 1;
      this.currentPage = 1;
      this.isLoading = true;
      this.loadPublishers();
    }
  }

  isValidSearch(searchString: string | undefined): boolean {
    return !!searchString && searchString.trim().length > 0;
  }

  onSearchChange() {
    if (this.isValidSearch(this.searchParams.search)) {
      this.isLoading = true;
      this.loadPublishers();
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.searchParams.pageNumber = this.currentPage;
    this.searchParams.pageSize = this.pageSize;

    this.loadPublishers();
  }

  updateSorting(sortBy: string, isDescending: boolean) {
    this.searchParams.sortBy = sortBy;
    this.searchParams.isDescending = isDescending;
    this.currentPage = 1;
    this.searchParams.pageNumber = 1;

    this.loadPublishers();
  }

  onViewModeChange(event: MatButtonToggleChange): void {
    this.viewMode = event.value;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  navigateToPublisher(id: number): void {
    this.router.navigate(['/summary/publishers', id]);
  }
}
