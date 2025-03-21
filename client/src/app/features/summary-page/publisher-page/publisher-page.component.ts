import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publisher } from '../../../shared/models/publisher';
import { PublisherService } from '../../../core/services/publisher.service';
import { FormsModule } from '@angular/forms';
import { Serie } from '../../../shared/models/serie';
import { Pagination } from '../../../shared/models/pagination';

@Component({
  selector: 'app-publisher-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './publisher-page.component.html',
  styleUrl: './publisher-page.component.scss'
})
export class PublisherPageComponent implements OnInit {
  publishers: Publisher[] = [];
  selectedPublisher: Publisher | null = null;
  series: Serie[] = [];
  loading = false;
  error = '';
  
  // Pagination info
  totalPublishers = 0;
  totalPages = 0;
  pageSize = 20;
  currentPage = 1;

  constructor(private publisherService: PublisherService) {}

  ngOnInit(): void {
    this.loadPublishers();
  }

  loadPublishers(): void {
    this.loading = true;
    this.publisherService.getPublishers().subscribe({
      next: (response: Pagination<Publisher>) => {
        this.publishers = response.data;
        this.totalPublishers = response.totalCount;
        this.totalPages = response.totalPages;
        this.loading = false;
        console.log('Publishers loaded:', response);
      },
      error: (error) => {
        this.error = 'Failed to load publishers';
        this.loading = false;
        console.error('Error loading publishers:', error);
      }
    });
  }

  selectPublisher(id: number): void {
    this.loading = true;
    this.publisherService.getPublisherById(id).subscribe({
      next: (publisher) => {
        this.selectedPublisher = publisher;
        this.loadPublisherSeries(id);
      },
      error: (error) => {
        this.error = 'Failed to load publisher details';
        this.loading = false;
        console.error('Error loading publisher details:', error);
      }
    });
  }

  loadPublisherSeries(publisherId: number): void {
    this.publisherService.getPublisherSeries(publisherId).subscribe({
      next: (response: Pagination<Serie>) => {
        this.series = response.data;
        this.loading = false;
        console.log('Series loaded:', response);
      },
      error: (error) => {
        this.error = 'Failed to load publisher series';
        this.loading = false;
        console.error('Error loading publisher series:', error);
      }
    });
  }

  clearSelection(): void {
    this.selectedPublisher = null;
    this.series = [];
  }
}
