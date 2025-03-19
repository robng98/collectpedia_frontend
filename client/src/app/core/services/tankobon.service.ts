import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Tankobon } from '../../shared/models/tankobon';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TankobonService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient); 

  getTankobonByEdicaoId(edicaoId: number) {
    return this.http.get<Tankobon>(this.baseUrl + 'tankobon/edicaoId/' + edicaoId);
  }
}
