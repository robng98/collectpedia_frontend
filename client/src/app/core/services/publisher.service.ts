import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Publisher } from '../../shared/models/publisher';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Pagination } from '../../shared/models/pagination';
import { Serie } from '../../shared/models/serie';

@Injectable({
  providedIn: 'root'
})
export class PublisherService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient); 

  getPublisherById(publisherId: number) {
    return this.http.get<Publisher>(this.baseUrl + 'editora/' + publisherId);
  }
  
  getPublishers(): Observable<Pagination<Publisher>> {
    return this.http.get<Pagination<Publisher>>(this.baseUrl + 'editora');
  }

  getPublishersByName(name: string): Observable<Pagination<Publisher>> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Pagination<Publisher>>(this.baseUrl + 'editora/search', { params });
  }

  getPublisherSeries(publisherId: number): Observable<Pagination<Serie>> {
    const params = new HttpParams().set('editoraId', publisherId)
    return this.http.get<Pagination<Serie>>(this.baseUrl + 'serie', {params});
  }
}
