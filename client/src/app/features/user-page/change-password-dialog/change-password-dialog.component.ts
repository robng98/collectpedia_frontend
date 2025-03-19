import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContaService } from '../../../core/services/conta.service';
import { matchPasswordValidator } from '../../../shared/validators/match-password.validator';

@Component({
  selector: 'app-change-password-dialog',
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
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  changePasswordForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private contaService: ContaService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: matchPasswordValidator('newPassword', 'confirmPassword')
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const passwordData = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.contaService.updateUser(passwordData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Senha atualizada com sucesso!';
        // Reset the form after successful submission
        this.changePasswordForm.reset();
        // Close dialog after a short delay
        setTimeout(() => this.dialogRef.close(true), 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Ocorreu um erro ao alterar a senha. Tente novamente.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
