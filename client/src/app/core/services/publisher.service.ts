import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Publisher } from '../../shared/models/publisher';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublisherService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient); 

  getPublisherById(publisherId: number) {
    return this.http.get<Publisher>(this.baseUrl + 'editora/' + publisherId);
  }
  
}
