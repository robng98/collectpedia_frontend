import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContaService } from '../../../core/services/conta.service';

@Component({
  selector: 'app-change-email-dialog',
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
  templateUrl: './change-email-dialog.component.html',
  styleUrls: ['./change-email-dialog.component.scss']
})
export class ChangeEmailDialogComponent implements OnInit {
  changeEmailForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  currentEmail = '';

  constructor(
    private fb: FormBuilder,
    private contaService: ContaService,
    public dialogRef: MatDialogRef<ChangeEmailDialogComponent>
  ) {
    // Get current user's email
    const user = this.contaService.currentUser();
    if (user) {
      this.currentEmail = user.email;
    }
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.changeEmailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]]
    }, { validators: this.emailMatchValidator });
  }

  // Custom validator to check if emails match
  emailMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newEmail = group.get('newEmail')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;

    if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      group.get('confirmEmail')?.setErrors({ emailMismatch: true });
      return { emailMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.changeEmailForm.invalid) {
      this.changeEmailForm.markAllAsTouched();
      return;
    }

    // Check if the new email is the same as the current one
    if (this.changeEmailForm.value.newEmail === this.currentEmail) {
      this.errorMessage = 'O novo email é igual ao email atual.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData = {
      email: this.changeEmailForm.value.newEmail
    };

    this.contaService.updateUser(updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Email atualizado com sucesso!';
        // Reset the form after successful submission
        this.changeEmailForm.reset();
        // Close dialog after a short delay
        setTimeout(() => this.dialogRef.close(true), 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Ocorreu um erro ao alterar o email. Tente novamente.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
