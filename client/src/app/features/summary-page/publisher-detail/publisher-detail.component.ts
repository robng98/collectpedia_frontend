import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

import { PublisherService } from '../../../core/services/publisher.service';
import { EdicaoService } from '../../../core/services/edicao.service';
import { Publisher } from '../../../shared/models/publisher';
import { Serie } from '../../../shared/models/serie';
import { PrimeiraCapaSerie } from '../../../shared/models/primeiraCapaSerie';
import { SearchParams } from '../../../shared/models/searchParams';

import { forkJoin, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-publisher-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatIconModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatIconModule
    ],
    templateUrl: './publisher-detail.component.html',
    styleUrl: './publisher-detail.component.scss'
})
export class PublisherDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private publisherService = inject(PublisherService);
    private edicaoService = inject(EdicaoService);
    private router = inject(Router);

    private Math = Math;

    publisherId: number = 0;
    currentPublisher: Publisher | null = null;

    publisherSeries: Serie[] = [];
    firstCovers: PrimeiraCapaSerie[] = [];

    searchParams = new SearchParams();

    totalItems = 0;
    currentPage = 1;
    pageSize = 10;
    pageSizeOptions = [10, 25, 50];
    isLoading = false;

    viewMode: 'card' | 'list' = 'card';

    private tempSeries: Serie[] = [];
    private tempTotalItems = 0;
    private tempCovers: PrimeiraCapaSerie[] = [];

    ngOnInit(): void {
        this.isLoading = true;

        this.route.params.subscribe(params => {
            this.publisherId = +params['id'];

            if (this.publisherId) {
                this.searchParams.pageNumber = 1;
                this.searchParams.pageSize = this.pageSize;
                this.searchParams.sortBy = 'nomeInter';
                this.searchParams.isDescending = false;
                this.searchParams.search = '';

                this.loadPublisherDetails();
                this.loadPublisherSeries();
            } else {
                this.isLoading = false;
            }
        });
    }

    loadPublisherDetails() {
        this.publisherService.getPublisherById(this.publisherId).subscribe({
            next: (publisher) => {
                this.currentPublisher = publisher;
            },
            error: (error) => {
                console.error('Error loading publisher details:', error);
            }
        });
    }

    isValidSearch(searchString: string | undefined): boolean {
        return !!searchString && searchString.trim().length > 0;
    }

    onSearchChange() {
        if (this.isValidSearch(this.searchParams.search)) {
            this.isLoading = true;
            this.loadPublisherSeries();
        }
    }

    clearSearch(): void {
        if (this.searchParams.search) {
            this.searchParams.search = '';
            this.searchParams.pageNumber = 1;
            this.currentPage = 1;
            this.isLoading = true;
            this.loadPublisherSeries();
        }
    }

    loadPublisherSeries() {
        this.isLoading = true;

        this.publisherService.getPublisherSeries
            (
                this.publisherId,
                this.searchParams.search,
                this.currentPage,
                this.pageSize,
                this.searchParams.sortBy,
                this.searchParams.isDescending
            ).pipe(
                tap(response => {
                    this.tempSeries = response.data;
                    this.tempTotalItems = response.totalCount;
                }),
                switchMap(response => {
                    if (response.data.length > 0) {
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
                tap(covers => {
                    this.tempCovers = covers;
                }),
                switchMap(() => timer(300)),
            ).subscribe({
                next: () => {
                    this.publisherSeries = this.tempSeries;
                    console.log(this.tempSeries);
                    this.totalItems = this.tempTotalItems;
                    this.firstCovers = this.tempCovers;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading publisher series:', error);
                    this.isLoading = false;
                }
            });
    }

    calculateUpperBound(): number {
        return Math.min((this.currentPage - 1) * this.pageSize + this.publisherSeries.length, this.totalItems);
    }

    onPageChange(event: PageEvent) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;

        this.searchParams.pageNumber = this.currentPage;
        this.searchParams.pageSize = this.pageSize;

        this.loadPublisherSeries();
    }

    updateSorting(sortBy: string, isDescending: boolean) {
        this.searchParams.sortBy = sortBy;
        this.searchParams.isDescending = isDescending;
        this.currentPage = 1;
        this.searchParams.pageNumber = 1;

        this.isLoading = true;

        this.loadPublisherSeries();
    }

    onViewModeChange(event: MatButtonToggleChange): void {
        this.viewMode = event.value;
    }

    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
    }

    navigateToDetail(id: number, editoraId: number, serie: Serie): void {
        this.router.navigate(['/serie', id], {
            state: {
                id: id,
                editoraId: editoraId,
                serie: serie
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/summary/publishers']);
    }
}
