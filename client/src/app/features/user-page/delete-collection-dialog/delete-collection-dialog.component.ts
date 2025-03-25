import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CollectionService } from '../../../core/services/collection.service';
import { Collection } from '../../../shared/models/colecao';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-delete-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-collection-dialog.component.html',
  styleUrls: ['./delete-collection-dialog.component.scss']
})
export class DeleteCollectionDialogComponent implements OnInit {
  deleteForm!: FormGroup;
  isLoading = false;
  isLoadingCollections = true;
  errorMessage = '';
  collections: Collection[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DeleteCollectionDialogComponent>,
    private collectionService: CollectionService
  ) {}

  ngOnInit(): void {
    this.deleteForm = this.fb.group({
      collectionId: ['', [Validators.required]]
    });
    
    this.loadCollections();
  }

  loadCollections(): void {
    this.isLoadingCollections = true;
    
    this.collectionService.getUserCollections({
      pageSize: 100
    }).subscribe({
      next: (response) => {
        this.collections = response.data;
        this.isLoadingCollections = false;
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.errorMessage = 'Não foi possível carregar suas coleções. Por favor, tente novamente.';
        this.isLoadingCollections = false;
      }
    });
  }

  onSubmit(): void {
    if (this.deleteForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const collectionId = this.deleteForm.get('collectionId')?.value;
    
    this.collectionService.deleteCollection(collectionId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error deleting collection:', error);
          if (error.status === 404) {
            this.errorMessage = 'Coleção não encontrada.';
          } else if (error.status === 403) {
            this.errorMessage = 'Você não tem permissão para excluir esta coleção.';
          } else {
            this.errorMessage = 'Erro ao excluir a coleção. Por favor, tente novamente.';
          }
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
