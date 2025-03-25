import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CollectionService } from '../../../core/services/collection.service';
import { Collection } from '../../../shared/models/colecao';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { EdicaoService } from '../../../core/services/edicao.service';
import { Edicao } from '../../../shared/models/edicao';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

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
    MatPaginatorModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './collection-issues-dialog.component.html',
  styleUrls: ['./collection-issues-dialog.component.scss']
})
export class CollectionIssuesDialogComponent implements OnInit {
  private router = inject(Router);
  collection: Collection | null = null;
  collectionIssues: any[] = [];
  isLoading = true;
  error: string | null = null;
  
  groupedExemplares: GroupedExemplar[] = [];
  
  selectedIssue: any | null = null;
  selectedEdicao: Edicao | null = null;
  
  totalItems = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [25, 50, 100, 500];

  selection = new SelectionModel<number>(true, []);
  isDeleting = false;

  hasChanges = false;

  constructor(
    private collectionService: CollectionService,
    private edicaoService: EdicaoService,
    private dialogRef: MatDialogRef<CollectionIssuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { collectionId: number },
    private snackBar: MatSnackBar
  ) {
    this.dialogRef.backdropClick().subscribe(() => {
      this.dialogRef.close(this.hasChanges);
    });
  }

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
      pageSize: 1,
      sortBy: 'id',
      isDescending: false,
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

    const params = {
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
        sortBy: 'id',
        isDescending: false,
        colecaoId: this.data.collectionId
    };
    
    this.collectionService.getCollectionIssuesById(params).subscribe({
      next: (response) => {
        this.collectionIssues = response.data;
        this.totalItems = response.totalCount;
        
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
        const seriesMap = new Map<number, GroupedExemplar>();
        
        results.forEach(result => {
          if (result.edicao) {
            const enrichedExemplar = {
              ...result.exemplar,
              serieId: result.edicao.serieId,
              serieNome: result.edicao.serieNome,
              numero: result.edicao.numero,
              dataLancamento: result.edicao.dataLancamento,
              preco: result.edicao.preco,
              unMonetaria: result.edicao.unMonetaria,
              fotoCapa: result.edicao.fotoCapa || result.exemplar.fotoCapa
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
        
        this.groupedExemplares = Array.from(seriesMap.values())
          .sort((a, b) => a.serieName.localeCompare(b.serieName));
        
        if (this.groupedExemplares.length > 0) {
          this.groupedExemplares[0].expanded = true;
          
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
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCollectionIssues();
  }

  selectIssue(issue: any): void {
    this.selectedIssue = issue;
  }

  closeDialog(): void {
    this.dialogRef.close(this.hasChanges);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getConditionLabel(condition: string): string {
    return condition === 'string' ? 'N/A' : condition;
  }

  isSelected(exemplarId: number): boolean {
    return this.selection.isSelected(exemplarId);
  }

  toggleSelection(exemplar: any, event: any): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    this.selection.toggle(exemplar.id);
  }

  masterToggle(serieId: number, event: any): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    
    const group = this.groupedExemplares.find(g => g.serieId === serieId);
    if (!group) return;
    
    if (this.isAllSelectedInGroup(serieId)) {
      group.exemplares.forEach(exemplar => this.selection.deselect(exemplar.id));
    } else {
      group.exemplares.forEach(exemplar => this.selection.select(exemplar.id));
    }
  }

  isAllSelectedInGroup(serieId: number): boolean {
    const group = this.groupedExemplares.find(g => g.serieId === serieId);
    if (!group || group.exemplares.length === 0) return false;
    
    return group.exemplares.every(exemplar => this.selection.isSelected(exemplar.id));
  }

  isSomeSelectedInGroup(serieId: number): boolean {
    const group = this.groupedExemplares.find(g => g.serieId === serieId);
    if (!group || group.exemplares.length === 0) return false;
    
    return group.exemplares.some(exemplar => this.selection.isSelected(exemplar.id))
      && !this.isAllSelectedInGroup(serieId);
  }

  deleteSelectedExemplars(): void {
    if (this.selection.isEmpty()) return;
    
    const selectedIds = this.selection.selected;
    const confirmDelete = confirm(`Tem certeza que deseja remover ${selectedIds.length} exemplar(es) da sua coleção?`);
    
    if (!confirmDelete) return;
    
    this.isDeleting = true;
    
    this.collectionService.deleteMultipleExemplars(selectedIds)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.hasChanges = true;
          
          this.snackBar.open(`${selectedIds.length} exemplar(es) removido(s) com sucesso!`, 'Fechar', {
            duration: 3000
          });
          this.selection.clear();
          this.loadCollectionIssues();
        },
        error: (error) => {
          console.error('Erro ao remover exemplares:', error);
          this.snackBar.open('Ocorreu um erro ao remover os exemplares.', 'Fechar', {
            duration: 5000
          });
        }
      });
  }
}
