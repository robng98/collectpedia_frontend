import { Component, inject, OnInit, ChangeDetectionStrategy, signal, AfterViewInit, ViewChild } from '@angular/core';
import { Edicao } from '../../shared/models/edicao';
import { SerieService } from '../../core/services/serie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EdicaoService } from '../../core/services/edicao.service';
import { MatIconModule } from '@angular/material/icon';
import { PublisherService } from '../../core/services/publisher.service';
import { Publisher } from '../../shared/models/publisher';
import { Serie } from '../../shared/models/serie';
import { MangaStats } from '../../shared/models/mangaStats';
// import { SearchParams } from '../../shared/models/searchParams';
import { MatExpansionModule } from '@angular/material/expansion';
import { TankobonService } from '../../core/services/tankobon.service';
import { Tankobon } from '../../shared/models/tankobon';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpParams } from '@angular/common/http';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormGroup, FormBuilder, FormControl, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ContribuidorService } from '../../core/services/contribuidor.service';
import { Contribuicao } from '../../shared/models/contribuicao';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-serie',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './serie.component.html',
  styleUrl: './serie.component.scss'
})
export class SerieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seriesService = inject(SerieService);
  private edicoesService = inject(EdicaoService);
  private publisherService = inject(PublisherService);
  private tankobonService = inject(TankobonService);
  private contribuicoesService = inject(ContribuidorService);
  params = new HttpParams();
  
  // Add isLoading property
  isLoading = false;
  // Add separate loading state for issue details
  isLoadingDetails = false;

  serieIdParam = 0;
  editoraIdParam = 0;
  edicoesResults: Edicao[] = [];
  currentEdicao: Edicao = {
    id: 0,
    fotoCapa: '',
    numero: '',
    unMonetaria: '',
    preco: 0,
    dataLancamento: '',
    serieId: 0,
    serieNome: ''
  };
  currentSerie: Serie = {
    id: 0,
    estadoPubAtual: '',
    nomeInter: '',
    cicloNum: 0,
    editoraId: 0,
    generos: [],
    mangaStats: Array<MangaStats>()[0],
    numEdicoes: 0
  }
  currentEditora: Publisher = {
    id: 0,
    nome: '',
    anoCriacao: '',
    logo: null,
    totalSeries: 0
  };
  currentTankobon: Tankobon = {
    id: -1,
    numeroCapitulos: 0,
    edicaoId: 0
  };
  currentContribuicoes: Contribuicao[] = [];
  //   contribuidorId: 0,
  //   edicaoId: 0,
  //   funcao: '',
  //   contribuidorNome: ''
  // }

  totalItems = -1;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [10, 25];
  displayedColumns: string[] = ['titulo', 'numero', 'preco', 'selecao'];
  dataSource = new MatTableDataSource<Edicao>(this.edicoesResults);

  private fb = inject(FormBuilder);
  selectionForm!: FormGroup;

  // Add these properties to handle contributor pagination
  contribuicoesPage = 1;
  contribuicoesPageSize = 50;
  contribuicoesTotalItems = 0;
  contribuicoesSorting = 'funcao';
  contribuicoesIsDescending = false;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as {
      id: number,
      editoraId: number,
      serie: Serie
    };

    if (state) {
      this.serieIdParam = state.id;
      this.editoraIdParam = state.editoraId;
      this.currentSerie = state.serie;
    }
    // console.log(navigation?.extras?.state);

  }

  ngOnInit(): void {
    this.initForm();
    this.pageNumber = 1;
    this.loadData();

    this.isLoading = true;
    // Create a 1500ms timer for consistent spinner display
    const loadingTimer = timer(1500);
    
    this.publisherService.getPublisherById(this.editoraIdParam).subscribe({
      next: (response) => {
        this.currentEditora = response;
        // Don't set isLoading=false yet, wait for timer
      },
      error: (error) => {
        console.log(error);
        // Don't set isLoading=false yet, wait for timer
      },
      complete: () => {
        // Wait for both the API call and timer before hiding spinner
        loadingTimer.subscribe(() => {
          this.isLoading = false;
        });
      }
    });
  };

  initForm(): void {
    this.selectionForm = this.fb.group({});
  }

  initFormControls(): void {
    // Clear existing form controls
    this.selectionForm = this.fb.group({});

    // Create a form control for each edicao
    this.edicoesResults.forEach(edicao => {
      this.selectionForm.addControl(
        `edicao_${edicao.id}`,
        new FormControl(false)
      );
    });
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    // Create a 1500ms timer for consistent spinner display
    const loadingTimer = timer(1500);
    
    this.params = this.params.set('PageSize', this.pageSize.toString());
    this.params = this.params.set('PageNumber', this.pageNumber.toString());
    this.params = this.params.set('SortBy', 'id');
    this.params = this.params.set('IsDescending', 'false');
    this.edicoesService.getEdicoesBySerieId(this.serieIdParam, this.params).subscribe({
      next: (response) => {
        this.edicoesResults = response.data;
        this.setCurrentContribuicoes(response.data[0].id);
        this.currentEdicao = response.data[0];
        this.dataSource = new MatTableDataSource<Edicao>(this.edicoesResults);
        this.totalItems = response.totalCount;
        this.pageSizeOptions = this.totalItems >= 25 ? [10, this.totalItems] : [10, 25];

        if (this.currentSerie.mangaStats) {
          this.onTankobonChange(this.currentEdicao.id);
        }

        this.initFormControls();
        // Don't set isLoading=false yet, wait for timer
      },
      error: (error) => {
        console.log(error);
        // Don't set isLoading=false yet, wait for timer
      },
      complete: () => {
        // Wait for both the API call and timer before hiding spinner
        loadingTimer.subscribe(() => {
          this.isLoading = false;
        });
      }
    });

  }

  trackByEdicao(index: number, item: Edicao): number {
    return index;
  }

  onEdicaoChange(edicaoId: number) {
    // Use isLoadingDetails instead of isLoading for issue-specific data
    this.isLoadingDetails = true;
    
    // Add delay to make spinner visible for at least 1500ms
    const loadingTimer = timer(1250);
    
    this.edicoesService.getEdicaoById(edicaoId).subscribe({
      next: (response) => {
        this.currentEdicao = response;
        // Don't set isLoadingDetails to false yet, wait for timer
      },
      error: (error) => {
        console.log(error);
        this.isLoadingDetails = false;
      }
    });

    this.setCurrentContribuicoes(edicaoId);

    if (this.currentSerie.mangaStats) {
      this.onTankobonChange(edicaoId);
    }
    
    // Make sure spinner shows for at least 1500ms
    loadingTimer.subscribe(() => {
      this.isLoadingDetails = false;
    });
  }

  onTankobonChange(edicaoId: number) {
    // Don't set loading state here since onEdicaoChange already did
    this.tankobonService.getTankobonByEdicaoId(edicaoId).subscribe({
      next: (response) => {
        this.currentTankobon = response;
        // Don't affect isLoadingDetails here
      },
      error: (error) => {
        console.log(error);
        // Don't affect isLoadingDetails here
      }
    });
  }

  setCurrentContribuicoes(edicaoId: number) {
    // Don't set loading state here since onEdicaoChange already did
    this.contribuicoesService.getContribuicoesByEdicaoId(edicaoId, {
      pageNumber: this.contribuicoesPage,
      pageSize: this.contribuicoesPageSize,
      sortBy: this.contribuicoesSorting,
      isDescending: this.contribuicoesIsDescending
    }).subscribe({
      next: (response) => {
        this.currentContribuicoes = response.data;
        this.contribuicoesTotalItems = response.totalCount;
        // Don't affect isLoadingDetails here
      },
      error: (error) => {
        console.log(error);
        // Don't affect isLoadingDetails here
      }
    });
  }

  // Optional: Add this method if you need to change contributor sorting
  updateContribuicoesSorting(sortBy: string) {
    // Toggle descending if clicking the same field again
    if (this.contribuicoesSorting === sortBy) {
      this.contribuicoesIsDescending = !this.contribuicoesIsDescending;
    } else {
      this.contribuicoesSorting = sortBy;
      this.contribuicoesIsDescending = false;
    }

    // Reset to page 1 when changing sort
    this.contribuicoesPage = 1;
    
    // Reload contributors with new sorting
    if (this.currentEdicao) {
      this.setCurrentContribuicoes(this.currentEdicao.id);
    }
  }

  // Optional: Add this method if you implement pagination UI for contributors
  onContribuicoesPageChange(event: any) {
    this.contribuicoesPage = event.pageIndex + 1;
    this.contribuicoesPageSize = event.pageSize;
    
    if (this.currentEdicao) {
      this.setCurrentContribuicoes(this.currentEdicao.id);
    }
  }

  getCurrentContribuicao(funcao: string) {
    return this.currentContribuicoes.find(contribuicao => contribuicao.funcao === funcao)?.contribuidorNome;
  }

  /** Whether the master checkbox is checked */
  isAllSelected(): boolean {
    if (!this.edicoesResults?.length) return false;

    const numSelected = Object.keys(this.selectionForm.controls)
      .filter(key => this.selectionForm.get(key)?.value === true)
      .length;
    const numRows = this.edicoesResults.length;
    return numSelected === numRows;
  }

  /** Whether some checkboxes are selected but not all */
  isSomeSelected(): boolean {
    if (!this.edicoesResults?.length) return false;

    const numSelected = Object.keys(this.selectionForm.controls)
      .filter(key => this.selectionForm.get(key)?.value === true)
      .length;
    return numSelected > 0 && numSelected < this.edicoesResults.length;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      // Deselect all
      Object.keys(this.selectionForm.controls).forEach(key => {
        this.selectionForm.get(key)?.setValue(false);
      });
    } else {
      // Select all
      this.edicoesResults.forEach(edicao => {
        const control = this.selectionForm.get(`edicao_${edicao.id}`);
        if (control) {
          control.setValue(true);
        }
      });
    }
  }

  /** The label for the checkbox on the header */
  checkboxLabel(): string {
    if (!this.edicoesResults?.length) {
      return 'Select all';
    }
    return this.isAllSelected() ? 'Deselect all' : 'Select all';
  }

  isSelected(edicaoId: number): FormControl {
    return this.selectionForm.get(`edicao_${edicaoId}`) as FormControl;
  }

  onSubmit(): void {
    const selectedEdicoes = this.edicoesResults
      .filter(edicao => this.selectionForm.get(`edicao_${edicao.id}`)?.value)
      .map(edicao => edicao.id);

    if (selectedEdicoes.length > 0) {
      this.router.navigate(['/register-issues'], {
        queryParams: {
          issueIds: selectedEdicoes.join(',')
        }
      });
    }
  }

}
