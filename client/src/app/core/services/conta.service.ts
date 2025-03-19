import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { LoginDto, RegisterDto, User } from '../../shared/models/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);
  currentUser = signal<User | null>(null);

  constructor() {
    this.loadUser();
  }

  login(model: LoginDto) {
    return this.http.post<User>(this.baseUrl + 'conta/login', model).pipe(
      tap(user => {
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  register(model: RegisterDto) {
    return this.http.post<User>(this.baseUrl + 'conta/register', model).pipe(
      tap(user => {
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  updateUser(userData: any) {
    return this.http.patch<User>(this.baseUrl + 'conta/update', userData).pipe(
      tap(user => {
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigateByUrl('/');
  }

  private setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUser() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUser.set(user);
    }
  }
}
