import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ContaService } from '../../core/services/conta.service';
import { CollectionService } from '../../core/services/collection.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { curveLinear } from 'd3-shape';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { ColecaoStatistics } from '../../shared/models/colecao-statistics.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { ChangeEmailDialogComponent } from './change-email-dialog/change-email-dialog.component';
import { CreateCollectionDialogComponent } from './create-collection-dialog/create-collection-dialog.component';
import { DeleteCollectionDialogComponent } from './delete-collection-dialog/delete-collection-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { timer, Subject, Observable, of } from 'rxjs';
import { switchMap, takeUntil, finalize } from 'rxjs/operators';
import { Collection } from '../../shared/models/colecao';
import {CollectionIssuesDialogComponent} from './collection-issues-dialog/collection-issues-dialog.component';

interface UserStats {
  collections: number;
  issues: number;
  uniqueIssues: number;
  publishers: number;
  genres: number;
  series: number;
  mostPopularRoteirista?: string;
  mostPopularDesenhista?: string;
  mostPopularMangaka?: string;
  mostPopularGenero?: string;
  mostPopularEditora?: string;
  mostPopularDemografia?: string;
}

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    NgxChartsModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSortModule
  ],
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss']
})
export class UserPageComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  userStats: UserStats = {
    collections: 0,
    issues: 0,
    uniqueIssues: 0,
    publishers: 0,
    genres: 0,
    series: 0
  };

  showingDetailedStats: boolean = false;

  displayedColumns: string[] = ['name', 'issueCount'];
  collections: Collection[] = [];
  dataSource = new MatTableDataSource<Collection>([]);
  pageSize = 5;
  pageIndex = 0;
  totalCollections = 0;
  selectedCollectionId: number | null = null;

  displayMode: 'total' | 'byCollection' = 'total';
  private collectionsData: Collection[] = [];
  issuesOverTime: any[] = [];
  view: [number, number] = [520, 180];
  
  legend: boolean = false;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Mês de Aquisição';
  yAxisLabel: string = 'Total Possuído';
  timeline: boolean = true;
  curve = curveLinear;
  
  colorScheme: Color = {
    name: 'darkTheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF9F44', '#31E7B6', '#FF5C93', '#45B6FE', '#8F78F7', '#5EFCE8', '#F2C041', '#5EC9FF', '#B3FF40']
  };

  isLoading = true;
  private loadingTimer$ = new Subject<void>();

  private tempUserStats: UserStats | null = null;
  private tempIssuesOverTime: any[] = [];
  private pendingCollectionId: number | null = null;

  xAxisTickFormatting: (val: any) => string;

  constructor(
    public contaService: ContaService,
    private collectionService: CollectionService,
    private dialog: MatDialog
  ) { 
    this.xAxisTickFormatting = this.formatDateToPortuguese.bind(this);
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  
  isLoggedIn(): boolean {
    return !!this.contaService.currentUser();
  }
  
  private loadUserData(): void {
    if (this.isLoggedIn()) {
      this.isLoading = true;
      this.loadingStartTime = Date.now();
      
      this.loadCollectionsData();
      this.loadAggregateStats();
    }
  }
  
  private loadAggregateStats(): void {
    this.showingDetailedStats = false;
    this.collectionService.getUserCollections().subscribe({
      next: (response) => {
        const collections = response.data;
        const totalExemplares = collections.reduce((sum, col) => 
          sum + (col.exemplares?.length || 0), 0);
        
        this.userStats = {
          collections: collections.length,
          issues: totalExemplares,
          uniqueIssues: 0,
          publishers: 0,
          genres: 0,
          series: 0
        };
      },
      error: (error) => {
        console.error('Error calculating aggregate statistics:', error);
      }
    });
  }

  private loadCollectionDetailedStats(collectionId: number): void {
    this.isLoading = true;
    this.pendingCollectionId = collectionId;
    
    const startTime = Date.now();
    
    this.collectionService.getCollectionStatistics(collectionId).subscribe({
      next: (statistics) => {
        this.tempUserStats = {
          collections: 1,
          issues: statistics.totalExemplares,
          uniqueIssues: statistics.totalEdicoes,
          publishers: statistics.totalEditoras,
          genres: statistics.totalGeneros,
          series: statistics.totalSeries,
          mostPopularRoteirista: statistics.mostPopularRoteirista,
          mostPopularDesenhista: statistics.mostPopularDesenhista,
          mostPopularMangaka: statistics.mostPopularMangaka,
          mostPopularGenero: statistics.mostPopularGenero,
          mostPopularEditora: statistics.mostPopularEditora,
          mostPopularDemografia: statistics.mostPopularDemografia
        };
        
        if (this.pendingCollectionId) {
          const selectedCollection = this.collectionsData.find(c => c.id === this.pendingCollectionId);
          if (selectedCollection) {
            this.prepareCollectionData([selectedCollection]);
          }
        }
        
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.userStats = this.tempUserStats!;
          this.showingDetailedStats = true;
          this.selectedCollectionId = this.pendingCollectionId;
          this.issuesOverTime = this.tempIssuesOverTime;
          
          this.tempUserStats = null;
          this.tempIssuesOverTime = [];
          this.pendingCollectionId = null;
          
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error fetching collection statistics:', error);
        
        this.tempUserStats = null;
        this.tempIssuesOverTime = [];
        this.pendingCollectionId = null;
        
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.isLoading = false;
        });
      }
    });
  }

  private loadCollectionsData(): void {
    this.isLoading = true;
    
    this.collectionService.getUserCollections({
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.collectionsData = response.data;
        this.collections = response.data;
        this.totalCollections = response.totalCount;
        this.dataSource.data = response.data;
        
        this.processCollectionsData(response.data);
        
        const elapsed = Date.now() - this.loadingStartTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error fetching collections:', error);
        const elapsed = Date.now() - this.loadingStartTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.isLoading = false;
        });
      }
    });
  }

  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'total' ? 'byCollection' : 'total';
    this.legend = this.displayMode === 'byCollection';
    
    if (this.collectionsData.length > 0) {
      this.processCollectionsData(this.collectionsData);
    }
  }

  private processCollectionsData(collections: Collection[]): void {
    const filteredCollections = this.selectedCollectionId ? 
      collections.filter(c => c.id === this.selectedCollectionId) : 
      collections;
      
    const allExemplars: any[] = [];
    
    filteredCollections.forEach(collection => {
      if (collection.exemplares) {
        const exemplarsWithCollection = collection.exemplares.map((exemplar: any) => ({
          ...exemplar,
          collectionId: collection.id,
          collectionName: collection.nomeColecao || `Coleção ${collection.id}`
        }));
        
        allExemplars.push(...exemplarsWithCollection);
      }
    });
    
    this.processExemplarData(allExemplars);
  }

  private processExemplarData(exemplars: any[]): void {
    if (this.displayMode === 'total') {
      const groupedByMonth = this.groupExemplarsByMonth(exemplars);
      
      this.issuesOverTime = [{
        name: 'Todas as Coleções',
        series: groupedByMonth
      }];
    } else {
      this.issuesOverTime = this.groupExemplarsByCollection(exemplars);
    }
  }

  private groupExemplarsByCollection(exemplars: any[]): any[] {
    const collectionMap: { [key: string]: any[] } = {};
    
    exemplars.forEach(exemplar => {
      const collectionId = exemplar.collectionId;
      
      if (!collectionMap[collectionId]) {
        collectionMap[collectionId] = [];
      }
      
      collectionMap[collectionId].push(exemplar);
    });
    
    return Object.keys(collectionMap).map(collectionId => {
      const collectionExemplars = collectionMap[collectionId];
      const collectionName = collectionExemplars[0]?.collectionName || `Coleção ${collectionId}`;
      
      return {
        name: collectionName,
        series: this.groupExemplarsByMonth(collectionExemplars)
      };
    });
  }

  private groupExemplarsByMonth(exemplars: any[]): any[] {
    exemplars.sort((a, b) => {
      return new Date(a.dataAquisicao).getTime() - new Date(b.dataAquisicao).getTime();
    });

    const monthCounts: { [key: string]: number } = {};
    let cumulativeCount = 0;

    exemplars.forEach(exemplar => {
      const date = new Date(exemplar.dataAquisicao);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthCounts[monthYear]) {
        monthCounts[monthYear] = 0;
      }
      
      monthCounts[monthYear]++;
      cumulativeCount++;
    });

    const series: any[] = [];
    let runningTotal = 0;
    
    Object.keys(monthCounts).sort().forEach(monthYear => {
      const [year, month] = monthYear.split('-');
      runningTotal += monthCounts[monthYear];
      
      series.push({
        name: new Date(`${year}-${month}-01`),
        value: runningTotal
      });
    });

    return series;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCollectionsData();
  }

  selectCollection(collection: Collection): void {
    if (this.isLoading) {
      return;
    }
    
    if (this.selectedCollectionId === collection.id) {
      this.clearSelection();
    } else {
      this.loadCollectionDetailedStats(collection.id);
    }
  }

  getCollectionIssueCount(collection: Collection): number {
    return collection.exemplares?.length || 0;
  }

  formatDate(date: string): string {
    return  new Date(date).toLocaleDateString();
  }

  formatDateToPortuguese(date: Date): string {
    const monthsInPortuguese = [
       new Date(date).getFullYear().toString(), 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${monthsInPortuguese[date.getMonth()]}`;
  }

  clearSelection(): void {
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    const startTime = Date.now();
    
    this.selectedCollectionId = null;
    this.showingDetailedStats = false;
    
    this.collectionService.getUserCollections().subscribe({
      next: (response) => {
        const collections = response.data;
        const totalExemplares = collections.reduce((sum, col) => 
          sum + (col.exemplares?.length || 0), 0);
        
        this.tempUserStats = {
          collections: collections.length,
          issues: totalExemplares,
          uniqueIssues: 0,
          publishers: 0,
          genres: 0,
          series: 0
        };
        
        this.prepareCollectionData(this.collectionsData);
        
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.userStats = this.tempUserStats!;
          this.issuesOverTime = this.tempIssuesOverTime;
          
          this.tempUserStats = null;
          this.tempIssuesOverTime = [];
          
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error calculating aggregate statistics:', error);
        
        this.tempUserStats = null;
        this.tempIssuesOverTime = [];
        
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(1500 - elapsed, 0);
        
        timer(remainingTime).subscribe(() => {
          this.isLoading = false;
        });
      }
    });
  }

  private prepareCollectionData(collections: Collection[]): void {
    const allExemplars: any[] = [];
    
    collections.forEach(collection => {
      if (collection.exemplares) {
        const exemplarsWithCollection = collection.exemplares.map((exemplar: any) => ({
          ...exemplar,
          collectionId: collection.id,
          collectionName: collection.nomeColecao || `Coleção ${collection.id}`
        }));
        
        allExemplars.push(...exemplarsWithCollection);
      }
    });
    
    if (this.displayMode === 'total') {
      const groupedByMonth = this.groupExemplarsByMonth(allExemplars);
      
      this.tempIssuesOverTime = [{
        name: 'Todas as Coleções',
        series: groupedByMonth
      }];
    } else {
      this.tempIssuesOverTime = this.groupExemplarsByCollection(allExemplars);
    }
  }

  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
      }
    });
  }

  openChangeEmailDialog(): void {
    const dialogRef = this.dialog.open(ChangeEmailDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
      }
    });
  }

  openCreateCollectionDialog(): void {
    const dialogRef = this.dialog.open(CreateCollectionDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.pageIndex = 0;
        this.loadUserData();
      }
    });
  }

  openDeleteCollectionDialog(): void {
    const dialogRef = this.dialog.open(DeleteCollectionDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.pageIndex = 0;
        this.loadUserData();
      }
    });
  }

  private loadingStartTime = 0;

  openCollectionIssuesDialog(collectionId: number): void {
    if (this.isLoading) {
      return;
    }
    
    const dialogWidth = window.innerWidth > 1400 ? '70vw' : '85vw';
    const dialogHeight = window.innerHeight > 900 ? '80vh' : '85vh';
    
    const dialogRef = this.dialog.open(CollectionIssuesDialogComponent, {
      data: { collectionId: collectionId },
      panelClass: 'custom-dialog',
      width: dialogWidth,
      maxWidth: '1000px',
      height: dialogHeight,
      maxHeight: '88vh',
      autoFocus: false,
      restoreFocus: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(hasChanges => {
      if (hasChanges) {
        this.isLoading = true;
        
        this.pageIndex = 0;
        
        this.loadUserData();
        
        if (this.selectedCollectionId) {
          this.loadCollectionDetailedStats(this.selectedCollectionId);
        }
      }
    });
  }
}
