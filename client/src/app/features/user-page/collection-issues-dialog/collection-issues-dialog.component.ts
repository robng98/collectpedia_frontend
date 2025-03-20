import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CollectionService } from '../../../core/services/collection.service';
import { Collection } from '../../../shared/models/colecao';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HttpParams } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { EdicaoService } from '../../../core/services/edicao.service';
import { Edicao } from '../../../shared/models/edicao';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

interface GroupedExemplar {
  serieId: number;
  serieName: string;
  exemplares: any[];
  expanded?: boolean;
}

@Component({
  selector: 'app-collection-issues-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    MatPaginatorModule
  ],
  templateUrl: './collection-issues-dialog.component.html',
  styleUrls: ['./collection-issues-dialog.component.scss']
})
export class CollectionIssuesDialogComponent implements OnInit {
  // Collection data
  collection: Collection | null = null;
  collectionIssues: any[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Grouped exemplares by serie
  groupedExemplares: GroupedExemplar[] = [];
  
  // Selected issue details
  selectedIssue: any | null = null;
  selectedEdicao: Edicao | null = null;
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [5, 10, 25];

  constructor(
    private collectionService: CollectionService,
    private edicaoService: EdicaoService,
    private dialogRef: MatDialogRef<CollectionIssuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { collectionId: number },
  ) {}

  ngOnInit(): void {
    this.loadCollection();
    this.loadCollectionIssues();
  }

  loadCollection(): void {
    if (!this.data.collectionId) {
      this.error = "ID da coleção não fornecido";
      this.isLoading = false;
      return;
    }

    this.collectionService.getUserCollections({
      pageNumber: 1,
      pageSize: 1,
      sortBy: 'id',
      isDescending: false,
      // Filter to get only the selected collection
      nomeColecao: this.data.collectionId.toString()
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.collection = response.data[0];
        }
      },
      error: (error) => {
        console.error('Erro ao carregar coleção:', error);
        this.error = "Erro ao carregar detalhes da coleção";
        this.isLoading = false;
      }
    });
  }

  loadCollectionIssues(): void {
    if (!this.data.collectionId) return;
    
    this.isLoading = true;
    
    this.collectionService.getCollectionIssuesById(this.data.collectionId).subscribe({
      next: (response) => {
        this.collectionIssues = response.data;
        this.totalItems = response.totalCount;
        
        // Process exemplars to fetch edicao details and group by series
        this.processExemplares(this.collectionIssues);
      },
      error: (error) => {
        console.error('Erro ao carregar exemplares:', error);
        this.error = "Erro ao carregar exemplares da coleção";
        this.isLoading = false;
      }
    });
  }

  processExemplares(exemplares: any[]): void {
    if (exemplares.length === 0) {
      this.isLoading = false;
      return;
    }
    
    // Create a request for each exemplar to get its edicao details
    const edicaoRequests = exemplares.map(exemplar => 
      this.edicaoService.getEdicaoById(exemplar.edicaoId).pipe(
        map(edicao => ({ exemplar, edicao })),
        catchError(error => {
          console.error(`Error fetching edicao ${exemplar.edicaoId}:`, error);
          return of({ exemplar, edicao: null });
        })
      )
    );
    
    forkJoin(edicaoRequests).subscribe({
      next: (results) => {
        // Group by series
        const seriesMap = new Map<number, GroupedExemplar>();
        
        results.forEach(result => {
          if (result.edicao) {
            // Combine exemplar with its edicao data
            const enrichedExemplar = {
              ...result.exemplar,
              ...result.edicao
            };
            
            const serieId = result.edicao.serieId;
            
            if (!seriesMap.has(serieId)) {
              seriesMap.set(serieId, {
                serieId: serieId,
                serieName: result.edicao.serieNome,
                exemplares: [],
                expanded: false
              });
            }
            
            seriesMap.get(serieId)!.exemplares.push(enrichedExemplar);
          }
        });
        
        // Convert map to array and sort by serie name
        this.groupedExemplares = Array.from(seriesMap.values())
          .sort((a, b) => a.serieName.localeCompare(b.serieName));
        
        // If we have groups, expand the first one by default
        if (this.groupedExemplares.length > 0) {
          this.groupedExemplares[0].expanded = true;
          
          // And select the first exemplar in that group
          if (this.groupedExemplares[0].exemplares.length > 0) {
            this.selectIssue(this.groupedExemplares[0].exemplares[0]);
          }
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error processing exemplares:', error);
        this.error = "Erro ao processar exemplares da coleção";
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCollectionIssues();
  }

  selectIssue(issue: any): void {
    this.selectedIssue = issue;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  // Format date for display
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  // Return condition label
  getConditionLabel(condition: string): string {
    switch (condition) {
      case 'MINT': return 'Perfeito';
      case 'NEAR_MINT': return 'Quase Perfeito';
      case 'VERY_GOOD': return 'Muito Bom';
      case 'GOOD': return 'Bom';
      case 'FAIR': return 'Regular';
      case 'POOR': return 'Ruim';
      default: return condition || 'N/A';
    }
  }
}
