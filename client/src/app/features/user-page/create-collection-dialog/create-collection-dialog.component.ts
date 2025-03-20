import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CollectionService } from '../../../core/services/collection.service';

@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-collection-dialog.component.html',
  styleUrls: ['./create-collection-dialog.component.scss']
})
export class CreateCollectionDialogComponent implements OnInit {
  collectionForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateCollectionDialogComponent>,
    private collectionService: CollectionService
  ) {}

  ngOnInit(): void {
    this.collectionForm = this.fb.group({
      collectionName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.collectionForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const collectionName = this.collectionForm.get('collectionName')?.value;
    
    this.collectionService.createCollection(collectionName)
      .subscribe({
        next: (collection) => {
          this.isLoading = false;
          this.dialogRef.close(collection);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 400) {
            this.errorMessage = 'Já existe uma coleção com este nome.';
          } else {
            this.errorMessage = 'Erro ao criar a coleção. Por favor, tente novamente.';
          }
          console.error('Error creating collection:', error);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
