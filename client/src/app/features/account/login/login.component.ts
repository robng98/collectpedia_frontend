import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContaService } from '../../../core/services/conta.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isSubmitting = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private contaService: ContaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    setTimeout(() => this.isLoading = false, 1000);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.isSubmitting = true;
    this.contaService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigateByUrl('/user');
      },
      error: error => {
        this.errorMessage = error.error || 'Login falhou. Tente novamente.';
        this.isSubmitting = false;
      }
    });
  }
}
