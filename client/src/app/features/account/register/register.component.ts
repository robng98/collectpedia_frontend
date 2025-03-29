import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ContaService } from '../../../core/services/conta.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private contaService: ContaService,
    private router: Router
  ) {
    this.isLoading = true;

    this.registerForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.hasLowerCase(),
        this.hasUpperCase(),
        this.hasDigit(),
        this.hasSpecialChar()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // Add these functions inside your RegisterComponent class

  private hasLowerCase(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /[a-z]/.test(control.value) ? null : { lowercase: true };
    };
  }

  private hasUpperCase(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /[A-Z]/.test(control.value) ? null : { uppercase: true };
    };
  }

  private hasDigit(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /\d/.test(control.value) ? null : { digit: true };
    };
  }

  private hasSpecialChar(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /[\W_]/.test(control.value) ? null : { specialChar: true };
    };
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    // if (password && confirmPassword && password.value !== confirmPassword.value) {
    //   confirmPassword.setErrors({ passwordMismatch: true });
    //   return { passwordMismatch: true };
    // }

    // return null;

    if (!password || !confirmPassword) return null;

    if (password.value !== confirmPassword.value) {
      // Adiciona o erro quando as senhas não coincidem
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove apenas o erro passwordMismatch se as senhas coincidirem
      // mas mantém outros erros (como required) se existirem
      const errors = confirmPassword.errors ? { ...confirmPassword.errors } : null;

      if (errors) {
        delete errors['passwordMismatch'];
        // Se ainda houver outros erros, defina-os, senão, defina null
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.contaService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigateByUrl('/user');
      },
      error: (error) => {
        console.log(error);
        this.errorMessage = error.error?.message || 'Ocorreu um erro ao registrar. Tente novamente.';
        this.isSubmitting = false;
      }
    });
  }
}
