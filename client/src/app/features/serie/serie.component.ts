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
import { ContaService } from '../../core/services/conta.service';
import { linspace_int } from '../../shared/helpers/linspace';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';

registerLocaleData(localePt);

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
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
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
  contaService = inject(ContaService); // Changed from private to public for template access
  private dialog = inject(MatDialog);
  params = new HttpParams();
  
  isLoading = false;
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
  dataInicioSerie: string = '';
  private initialPageLoading = true;

  totalItems = -1;
  pageSize = 10;
  pageNumber = 1;
  pageSizeOptions = [10, 25, 50, 100];
  displayedColumns: string[] = ['titulo', 'numero', 'preco', 'selecao'];
  dataSource = new MatTableDataSource<Edicao>(this.edicoesResults);

  private fb = inject(FormBuilder);
  selectionForm!: FormGroup;

  contribuicoesPage = 1;
  contribuicoesPageSize = 50;
  contribuicoesTotalItems = 0;
  contribuicoesSorting = 'funcao';
  contribuicoesIsDescending = false;

  showDelay = 250;
  hideDelay = 500;

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
    console.log(navigation?.extras?.state);

  }

  ngOnInit(): void {
    this.initForm();
    this.pageNumber = 1;
    this.loadData();

    this.isLoading = true;
    const loadingTimer = timer(1500);
    
    this.publisherService.getPublisherById(this.editoraIdParam).subscribe({
      next: (response) => {
        this.currentEditora = response;
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        loadingTimer.subscribe(() => {
          this.isLoading = false;
          this.initialPageLoading = false;
        });
      }
    });
  };

  initForm(): void {
    this.selectionForm = this.fb.group({});
  }

  initFormControls(): void {
    this.selectionForm = this.fb.group({});

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
    const loadingTimer = timer(1500);
    
    this.params = this.params.set('PageSize', this.pageSize.toString());
    this.params = this.params.set('PageNumber', this.pageNumber.toString());
    this.params = this.params.set('SortBy', 'dataLancamento');
    this.params = this.params.set('IsDescending', 'false');
    this.edicoesService.getEdicoesBySerieId(this.serieIdParam, this.params).subscribe({
      next: (response) => {
        this.edicoesResults = response.data;
        this.setCurrentContribuicoes(response.data[0].id);
        this.currentEdicao = response.data[0];
        this.dataSource = new MatTableDataSource<Edicao>(this.edicoesResults);
        this.totalItems = response.totalCount;
        this.pageSizeOptions = this.totalItems >= 100 ? linspace_int(this.pageSizeOptions[0], this.totalItems, 4) : this.pageSizeOptions;

        if (this.currentSerie.mangaStats) {
          this.onTankobonChange(this.currentEdicao.id);
        }

        if(this.initialPageLoading === true) {
          this.dataInicioSerie = response.data[0].dataLancamento;
          console.log(this.dataInicioSerie);
        }

        this.initFormControls();
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
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
    this.isLoadingDetails = true;
    
    const loadingTimer = timer(2000);
    
    this.edicoesService.getEdicaoById(edicaoId).subscribe({
      next: (response) => {
        this.currentEdicao = response;
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
    
    loadingTimer.subscribe(() => {
      this.isLoadingDetails = false;
    });
  }

  onTankobonChange(edicaoId: number) {
    this.tankobonService.getTankobonByEdicaoId(edicaoId).subscribe({
      next: (response) => {
        this.currentTankobon = response;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  setCurrentContribuicoes(edicaoId: number) {
    this.contribuicoesService.getContribuicoesByEdicaoId(edicaoId, {
      pageNumber: this.contribuicoesPage,
      pageSize: this.contribuicoesPageSize,
      sortBy: this.contribuicoesSorting,
      isDescending: this.contribuicoesIsDescending
    }).subscribe({
      next: (response) => {
        this.currentContribuicoes = response.data;
        this.contribuicoesTotalItems = response.totalCount;
        console.log(response.data);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  updateContribuicoesSorting(sortBy: string) {
    if (this.contribuicoesSorting === sortBy) {
      this.contribuicoesIsDescending = !this.contribuicoesIsDescending;
    } else {
      this.contribuicoesSorting = sortBy;
      this.contribuicoesIsDescending = false;
    }

    this.contribuicoesPage = 1;
    
    if (this.currentEdicao) {
      this.setCurrentContribuicoes(this.currentEdicao.id);
    }
  }

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

  getContribuidoresByFuncao(funcao: string): string[] {
    return this.currentContribuicoes
      .filter(contribuicao => contribuicao.funcao === funcao)
      .map(contribuicao => contribuicao.contribuidorNome);
  }

  hasMultipleContributors(funcao: string): boolean {
    return this.getContribuidoresByFuncao(funcao).length > 1;
  }

  isAllSelected(): boolean {
    if (!this.edicoesResults?.length) return false;

    const numSelected = Object.keys(this.selectionForm.controls)
      .filter(key => this.selectionForm.get(key)?.value === true)
      .length;
    const numRows = this.edicoesResults.length;
    return numSelected === numRows;
  }

  isSomeSelected(): boolean {
    if (!this.edicoesResults?.length) return false;

    const numSelected = Object.keys(this.selectionForm.controls)
      .filter(key => this.selectionForm.get(key)?.value === true)
      .length;
    return numSelected > 0 && numSelected < this.edicoesResults.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      Object.keys(this.selectionForm.controls).forEach(key => {
        this.selectionForm.get(key)?.setValue(false);
      });
    } else {
      this.edicoesResults.forEach(edicao => {
        const control = this.selectionForm.get(`edicao_${edicao.id}`);
        if (control) {
          control.setValue(true);
        }
      });
    }
  }

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
    if (!this.contaService.currentUser()) {
      this.router.navigate(['/account/login'], {
        queryParams: {
          returnUrl: this.router.url
        }
      });
      return;
    }

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

  addCompleteSeries(): void {
    if (!this.contaService.currentUser()) {
      this.router.navigate(['/account/login'], {
        queryParams: {
          returnUrl: this.router.url
        }
      });
      return;
    }

    // Show loading indicator
    this.isLoading = true;

    // Get all issues for the current series
    const params = new HttpParams()
      .set('PageSize', this.totalItems.toString())
      .set('PageNumber', '1')
      .set('SortBy', 'dataLancamento')
      .set('IsDescending', 'false');

    this.edicoesService.getEdicoesBySerieId(this.serieIdParam, params).subscribe({
      next: (response) => {
        const allEdicoes = response.data.map(edicao => edicao.id);
        
        if (allEdicoes.length > 0) {
          this.router.navigate(['/register-issues'], {
            queryParams: {
              issueIds: allEdicoes.join(',')
            }
          });
        } else {
          console.error('No issues found in this series');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching all issues:', error);
        this.isLoading = false;
      }
    });
  }

  openCoverImageDialog(imageUrl: string): void {
    if (!imageUrl) return;
    
    this.dialog.open(ImageDialogComponent, {
      data: { 
        imageUrl: imageUrl,
        title: `${this.currentSerie.nomeInter} #${this.currentEdicao.numero}`
      },
      maxWidth: '90vw',
      maxHeight: '90vh',
      width: 'auto',
      height: 'auto',
      panelClass: 'fullscreen-dialog',
      autoFocus: false
    });
  }
}
