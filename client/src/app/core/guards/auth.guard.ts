import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ContaService } from '../services/conta.service';

export const authGuard: CanActivateFn = () => {
  const contaService = inject(ContaService);
  const router = inject(Router);

  // Check if user is authenticated
  if (contaService.currentUser()) {
    return true;
  }

  // Redirect to login page with returnUrl for automatic redirect after login
  router.navigate(['/account/login'], {
    queryParams: { returnUrl: router.url }
  });
  
  return false;
};
