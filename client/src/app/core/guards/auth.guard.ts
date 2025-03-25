import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ContaService } from '../services/conta.service';

export const authGuard: CanActivateFn = () => {
  const contaService = inject(ContaService);
  const router = inject(Router);

  if (contaService.currentUser()) {
    return true;
  }

  router.navigate(['/account/login'], {
    queryParams: { returnUrl: router.url }
  });

  return false;
};
